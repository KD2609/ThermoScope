"""NASA FIRMS Real Data Integration and Ingestion Service.
Fetches near real-time thermal anomalies from official NASA FIRMS CSV API,
normalizes attributes, deduplicates records via cryptographic hash,
stores into database, and triggers ML inference and alert evaluation.
"""

import csv
from datetime import datetime, timezone
import hashlib
import io
import json
import os
import time
from typing import Dict, Any, List, Optional
import requests
from sqlalchemy.orm import Session

from backend.app.config import settings
from backend.app.models.models import FireDetection, FirePrediction, SyncLog
from backend.app.services.geospatial_service import (
    find_closest_industrial_site, find_closest_residential_area
)
from backend.app.services.risk_service import calculate_risk_and_response
from backend.app.services.alert_engine import process_alerts_for_detection
from ml.predict import predict_thermal_event


def compute_dedup_hash(source: str, sensor: str, lat: float, lon: float, date_str: str, time_str: str) -> str:
    """Create a deterministic SHA-256 hash to eliminate duplicate satellite detections."""
    raw = f"{source}_{sensor}_{lat:.4f}_{lon:.4f}_{date_str}_{time_str}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class FIRMSService:
    def __init__(self):
        self.api_key = settings.NASA_FIRMS_MAP_KEY
        self.source = settings.FIRMS_SOURCE
        self.bbox = settings.FIRMS_BBOX
        self.days = settings.FIRMS_DAYS
        self.last_sync_time: Optional[datetime] = None
        self.last_sync_status = "NOT_SYNCED"
        self.total_processed_records = 0

    def fetch_live_firms_csv(self) -> str:
        """Call official NASA FIRMS Area CSV API."""
        if not self.api_key:
            raise ValueError("NASA_FIRMS_MAP_KEY environment variable is not configured.")

        url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{self.api_key}/{self.source}/{self.bbox}/{self.days}"
        headers = {"User-Agent": "ThermoScope-SIH-26162/1.0"}

        # Retry logic with exponential backoff
        max_retries = 3
        backoff = 2.0
        last_err = None

        for attempt in range(max_retries):
            try:
                response = requests.get(url, headers=headers, timeout=25)
                if response.status_code == 200:
                    text_data = response.text
                    if "Invalid MAP_KEY" in text_data or "Error" in text_data:
                        raise ValueError(f"NASA FIRMS API returned error message: {text_data.strip()}")
                    return text_data
                elif response.status_code == 403:
                    raise PermissionError("NASA FIRMS returned 403 Forbidden. Check MAP_KEY.")
                elif response.status_code == 429:
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                else:
                    response.raise_for_status()
            except (requests.RequestException, ValueError) as e:
                last_err = e
                time.sleep(backoff)
                backoff *= 2

        raise RuntimeError(f"Failed to fetch data from NASA FIRMS after retries: {last_err}")

    def load_offline_fallback_records(self) -> List[Dict[str, Any]]:
        """Load curated sample records when FIRMS API is not configured or offline."""
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        fallback_file = os.path.join(base_dir, "data", "demo_fallback.json")
        if os.path.exists(fallback_file):
            with open(fallback_file, "r") as f:
                return json.load(f)
        return []

    def sync_firms_data(self, db: Session, force_live: bool = False) -> Dict[str, Any]:
        """Execute full end-to-end ingestion and processing pipeline."""
        start_time = time.time()
        records_fetched = 0
        records_inserted = 0
        sync_status = "SUCCESS"
        error_msg = None
        is_live = False

        try:
            # 1. Attempt live FIRMS ingestion if API key provided
            if self.api_key:
                try:
                    csv_text = self.fetch_live_firms_csv()
                    records = self._parse_firms_csv(csv_text)
                    records_fetched = len(records)
                    is_live = True
                except Exception as e:
                    if force_live:
                        raise e
                    print(f"[FIRMS Ingestion] Live API call failed ({e}). Falling back to seed data.")
                    records = self.load_offline_fallback_records()
                    records_fetched = len(records)
                    sync_status = "OFFLINE_FALLBACK"
                    error_msg = f"Live FIRMS unreachable ({e}). Using offline dataset."
            else:
                # API Key not configured
                records = self.load_offline_fallback_records()
                records_fetched = len(records)
                sync_status = "OFFLINE_FALLBACK"
                error_msg = "NASA_FIRMS_MAP_KEY is not set in environment. Using explicitly marked fallback data."

            # 2. Process records, deduplicate, and persist
            for raw in records:
                inserted = self._process_single_record(raw, db, is_live=is_live)
                if inserted:
                    records_inserted += 1

            db.commit()

        except Exception as ex:
            db.rollback()
            sync_status = "FAILED"
            error_msg = str(ex)
            print(f"[FIRMS Ingestion] Critical sync error: {ex}")

        duration = time.time() - start_time
        self.last_sync_time = datetime.now(timezone.utc)
        self.last_sync_status = sync_status
        self.total_processed_records += records_inserted

        # Record audit log
        audit = SyncLog(
            source="NASA_FIRMS",
            sync_time=self.last_sync_time,
            status=sync_status,
            records_fetched=records_fetched,
            records_inserted=records_inserted,
            duration_seconds=duration,
            error_message=error_msg
        )
        db.add(audit)
        db.commit()

        return {
            "status": sync_status,
            "is_live": is_live,
            "records_fetched": records_fetched,
            "records_inserted": records_inserted,
            "duration_seconds": round(duration, 2),
            "timestamp": self.last_sync_time.isoformat(),
            "error_message": error_msg
        }

    def _parse_firms_csv(self, csv_content: str) -> List[Dict[str, Any]]:
        """Parse raw NASA FIRMS CSV text into normalized dictionaries."""
        records = []
        reader = csv.DictReader(io.StringIO(csv_content))
        for row in reader:
            try:
                lat = float(row.get("latitude", 0.0))
                lon = float(row.get("longitude", 0.0))
                acq_date = row.get("acq_date", datetime.utcnow().strftime("%Y-%m-%d"))
                acq_time = row.get("acq_time", "0000").zfill(4)

                # Brightness temperature: bright_ti4 (VIIRS) or brightness (MODIS)
                bt_str = row.get("bright_ti4") or row.get("brightness") or "330.0"
                brightness = float(bt_str)

                # FRP
                frp_str = row.get("frp") or "0.0"
                frp = float(frp_str) if frp_str else 0.0

                # Confidence (MODIS is 0-100, VIIRS is 'l', 'n', 'h' or 0-100)
                conf_val = row.get("confidence", "70")
                if conf_val == "l":
                    confidence = 35.0
                elif conf_val == "n":
                    confidence = 70.0
                elif conf_val == "h":
                    confidence = 95.0
                else:
                    try:
                        confidence = float(conf_val)
                    except ValueError:
                        confidence = 70.0

                day_night = row.get("daynight", "D").upper()
                satellite = row.get("satellite", "VIIRS/MODIS")
                instrument = row.get("instrument", self.source.split("_")[0])

                # Parse timestamp
                time_iso = f"{acq_date}T{acq_time[:2]}:{acq_time[2:4]}:00Z"

                records.append({
                    "latitude": lat,
                    "longitude": lon,
                    "acq_date": acq_date,
                    "acq_time": acq_time,
                    "detection_time": time_iso,
                    "brightness_temperature": brightness,
                    "frp": frp,
                    "confidence": confidence,
                    "day_night": day_night,
                    "satellite": satellite,
                    "instrument": instrument,
                    "source": "NASA_FIRMS",
                    "sensor": self.source,
                    "raw_payload": json.dumps(row),
                    "is_demo_fallback": False
                })
            except Exception as e:
                continue

        return records

    def _process_single_record(self, record: Dict[str, Any], db: Session, is_live: bool = False) -> bool:
        """Deduplicate, insert detection, run prediction, risk assessment, and alerts."""
        lat = record["latitude"]
        lon = record["longitude"]
        date_str = record.get("acq_date", "2026-09-17")
        time_str = record.get("acq_time", "0000")
        source = record.get("source", "NASA_FIRMS")
        sensor = record.get("sensor", "VIIRS_SNPP")

        dedup_hash = compute_dedup_hash(source, sensor, lat, lon, date_str, time_str)

        # Check existing detection
        existing = db.query(FireDetection).filter(FireDetection.dedup_hash == dedup_hash).first()
        if existing:
            return False

        # Parse datetime
        det_time_raw = record.get("detection_time", "2026-09-17T12:00:00Z")
        try:
            det_dt = datetime.fromisoformat(det_time_raw.replace("Z", "+00:00"))
        except Exception:
            det_dt = datetime.now(timezone.utc)

        det_id = record.get("id") or f"DET-{dedup_hash[:10].upper()}"

        detection = FireDetection(
            id=det_id,
            source=source,
            sensor=sensor,
            latitude=lat,
            longitude=lon,
            detection_time=det_dt,
            brightness_temperature=record["brightness_temperature"],
            frp=record.get("frp", 0.0),
            confidence=record.get("confidence", 70.0),
            day_night=record.get("day_night", "D"),
            satellite=record.get("satellite", "Suomi-NPP"),
            instrument=record.get("instrument", "VIIRS"),
            raw_payload=record.get("raw_payload", "{}"),
            dedup_hash=dedup_hash,
            is_demo_fallback=record.get("is_demo_fallback", not is_live)
        )
        db.add(detection)
        db.flush()

        # 3. Geospatial Proximity Matching
        closest_ind_name, closest_ind_type, dist_ind_km = find_closest_industrial_site(lat, lon, db)
        closest_res_name, dist_res_km = find_closest_residential_area(lat, lon, db)

        # 4. Feature Extraction & Machine Learning Classification
        feature_data = {
            "brightness_temperature": detection.brightness_temperature,
            "frp": detection.frp,
            "confidence": detection.confidence,
            "day_night": detection.day_night,
            "detection_time": det_dt.isoformat(),
            "distance_to_industrial_site": dist_ind_km if dist_ind_km is not None else 30.0,
            "industrial_site_type": closest_ind_type if closest_ind_type else "none",
            "distance_to_residential_area": dist_res_km if dist_res_km is not None else 10.0,
            "persistence_score": 0.85 if dist_ind_km and dist_ind_km < 1.0 else 0.15,
            "historical_fire_count": 15 if dist_ind_km and dist_ind_km < 1.5 else 1,
            "fire_cluster_density": 0.7 if dist_ind_km and dist_ind_km < 2.0 else 0.2,
            "land_cover": "industrial" if dist_ind_km and dist_ind_km < 3.0 else "other"
        }

        pred_res = predict_thermal_event(feature_data)

        # 5. Risk Assessment & Actionable Response
        risk_res = calculate_risk_and_response(
            brightness_temp=detection.brightness_temperature,
            frp=detection.frp,
            confidence=detection.confidence,
            predicted_class=pred_res["predicted_class"],
            distance_to_industrial_km=dist_ind_km,
            industrial_site_type=closest_ind_type,
            distance_to_residential_km=dist_res_km
        )

        prediction = FirePrediction(
            fire_detection_id=detection.id,
            predicted_class=pred_res["predicted_class"],
            confidence=pred_res["confidence"],
            risk_score=risk_res["risk_score"],
            severity=risk_res["severity"],
            model_version=pred_res.get("model_version", "v1.0.0"),
            class_probabilities=json.dumps(pred_res.get("probabilities", {})),
            nearby_industrial_name=closest_ind_name,
            nearby_industrial_type=closest_ind_type,
            distance_to_industrial_km=dist_ind_km,
            nearby_residential_name=closest_res_name,
            distance_to_residential_km=dist_res_km,
            recommended_response=risk_res["recommended_response"],
            predicted_at=datetime.now(timezone.utc)
        )
        db.add(prediction)
        db.flush()

        # 6. Evaluate and Trigger Deduplicated Alerts
        process_alerts_for_detection(detection, prediction, db)

        return True


# Singleton instance
firms_service = FIRMSService()

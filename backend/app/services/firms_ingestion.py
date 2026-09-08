import csv
import io
from datetime import datetime
from typing import Optional, Any
import requests
from app.config import settings

def fetch_and_parse_firms_data() -> dict[str, Any]:
    """
    Ingest NASA FIRMS thermal anomaly observations.
    Gracefully handles live API errors and falls back to cached/demo dataset without breaking.
    """
    map_key = settings.NASA_FIRMS_MAP_KEY
    if not map_key or settings.SYSTEM_MODE == "DEMO":
        return {
            "status": "FALLBACK_DEMO",
            "message": "NASA FIRMS live MAP_KEY unset or DEMO mode active. Using local high-resolution demo records.",
            "records": []
        }

    # Format: https://firms.modaps.eosdis.nasa.gov/api/country/csv/{MAP_KEY}/{SENSOR}/{COUNTRY}/1
    url = f"{settings.NASA_FIRMS_BASE_URL}/{map_key}/{settings.NASA_FIRMS_SENSOR}/{settings.NASA_FIRMS_COUNTRY_CODE}/1"
    try:
        resp = requests.get(url, timeout=10)
        if resp.status_code != 200:
            return {
                "status": "UNAVAILABLE",
                "message": f"NASA FIRMS API returned HTTP {resp.status_code}. Fallback engaged.",
                "records": []
            }
        
        # Parse CSV
        reader = csv.DictReader(io.StringIO(resp.text))
        parsed = []
        for idx, row in enumerate(reader):
            try:
                lat = float(row.get("latitude", 0))
                lon = float(row.get("longitude", 0))
                if not (6.0 <= lat <= 38.0 and 68.0 <= lon <= 98.0):
                    continue  # Filter outside India bounding box
                
                frp = float(row.get("frp", 0))
                brightness = float(row.get("bright_ti4", row.get("brightness", 320.0)))
                acq_date = row.get("acq_date", datetime.utcnow().strftime("%Y-%m-%d"))
                acq_time = row.get("acq_time", "1200").zfill(4)
                ts = datetime.strptime(f"{acq_date} {acq_time}", "%Y-%m-%d %H%M")
                
                parsed.append({
                    "event_id": f"FIRMS-LIVE-{idx+1:04d}",
                    "latitude": lat,
                    "longitude": lon,
                    "timestamp": ts,
                    "satellite": row.get("satellite", "VIIRS-NOAA21"),
                    "frp": frp,
                    "brightness": brightness,
                    "source_confidence": row.get("confidence", "nominal"),
                    "daynight": row.get("daynight", "N"),
                    "source": "NASA_FIRMS_LIVE",
                    "processing_status": "RAW"
                })
            except Exception:
                continue

        return {
            "status": "CONNECTED",
            "message": f"Successfully ingested {len(parsed)} live records from NASA FIRMS.",
            "records": parsed
        }
    except Exception as exc:
        return {
            "status": "DEGRADED",
            "message": f"Network error contacting NASA FIRMS: {str(exc)}. Running on fallback.",
            "records": []
        }

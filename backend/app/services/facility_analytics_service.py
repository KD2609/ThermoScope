"""Facility Risk Profiling, Longitudinal Baselines, and Anomaly Detection Service.
Maintains facility-level operational risk profiles, detects anomalous flare spikes vs historical baselines,
and discovers recurring temporal patterns.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
import statistics
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.models import IndustrialSite, FireDetection, FirePrediction
from backend.app.services.geospatial_service import haversine_distance_km


def get_facility_risk_profile(facility_id: str, db: Session) -> Dict[str, Any]:
    """Generate a dynamic 90-day risk profile and anomaly status for an industrial facility."""
    facility = db.query(IndustrialSite).filter(IndustrialSite.id == facility_id).first()
    if not facility:
        return {}

    now = datetime.now(timezone.utc)
    cutoff_24h = now - timedelta(hours=24)
    cutoff_7d = now - timedelta(days=7)
    cutoff_30d = now - timedelta(days=30)
    cutoff_90d = now - timedelta(days=90)

    # Bounding box around facility (within 10 km)
    delta_lat = 10.0 / 111.0
    delta_lon = 10.0 / (111.0 * max(0.1, abs(3.14159 / 180.0 * facility.latitude)))

    detections = (
        db.query(FireDetection)
        .filter(
            FireDetection.detection_time >= cutoff_90d,
            FireDetection.latitude.between(facility.latitude - delta_lat, facility.latitude + delta_lat),
            FireDetection.longitude.between(facility.longitude - delta_lon, facility.longitude + delta_lon)
        )
        .order_by(desc(FireDetection.detection_time))
        .all()
    )

    # Filter strictly within 5.0 km radius
    nearby_dets = [
        d for d in detections
        if haversine_distance_km(facility.latitude, facility.longitude, d.latitude, d.longitude) <= 5.0
    ]

    count_24h = 0
    count_7d = 0
    count_30d = 0
    count_90d = len(nearby_dets)

    frp_30d = []
    nearest_dist = None
    nearest_fire_id = None
    night_count = 0
    day_count = 0

    for d in nearby_dets:
        t = d.detection_time
        if t.tzinfo is None:
            t = t.replace(tzinfo=timezone.utc)

        dist = haversine_distance_km(facility.latitude, facility.longitude, d.latitude, d.longitude)

        if t >= cutoff_24h:
            count_24h += 1
            if nearest_dist is None or dist < nearest_dist:
                nearest_dist = dist
                nearest_fire_id = d.id

        if t >= cutoff_7d:
            count_7d += 1

        if t >= cutoff_30d:
            count_30d += 1
            if d.frp is not None:
                frp_30d.append(d.frp)
            if d.day_night == "N":
                night_count += 1
            else:
                day_count += 1

    max_frp_30d = max(frp_30d) if frp_30d else 0.0
    avg_frp_30d = round(sum(frp_30d) / len(frp_30d), 1) if frp_30d else 0.0

    # Active days in 30 days
    active_dates_30d = {
        d.detection_time.date()
        for d in nearby_dets
        if d.detection_time and d.detection_time.replace(tzinfo=timezone.utc if d.detection_time.tzinfo is None else d.detection_time.tzinfo) >= cutoff_30d
    }
    persistence_score = round(min(1.0, len(active_dates_30d) / 15.0), 3)

    # Facility Anomaly Detection:
    # Expected daily rate from 30d baseline = count_30d / 30.0
    daily_baseline_rate = count_30d / 30.0
    is_anomaly = False
    anomaly_magnitude = None

    if count_24h >= 2 and count_24h > (daily_baseline_rate * 2.5 + 1.0):
        is_anomaly = True
        anomaly_magnitude = round(count_24h / max(0.5, daily_baseline_rate), 1)

    # Recurring pattern analysis
    recurring_pattern = None
    if count_30d >= 5:
        if night_count > day_count * 2:
            recurring_pattern = f"Night-dominant thermal operations ({night_count} night vs {day_count} day detections in 30d; typical flaring pattern)."
        elif day_count > night_count * 2:
            recurring_pattern = f"Daytime operational schedule ({day_count} day vs {night_count} night detections in 30d)."
        else:
            recurring_pattern = f"Continuous 24/7 thermal process ({night_count} night, {day_count} day detections in 30d)."

    # Current risk score and status
    if count_24h > 0 and nearest_dist is not None and nearest_dist <= 1.0:
        current_status = "CRITICAL_ALERT" if max_frp_30d > 100.0 else "ACTIVE_INCIDENT_NEARBY"
        current_risk = min(98.0, 70.0 + (count_24h * 4.0) + min(20.0, max_frp_30d / 15.0))
    elif count_24h > 0:
        current_status = "ELEVATED_OBSERVATION"
        current_risk = min(80.0, 50.0 + (count_24h * 3.0))
    elif count_7d > 0:
        current_status = "ELEVATED_OBSERVATION"
        current_risk = 45.0
    else:
        current_status = "NORMAL"
        current_risk = 20.0

    # Risk trend
    if count_24h > 0 and count_7d <= count_24h:
        risk_trend = "INCREASING"
    elif count_24h == 0 and count_7d > 0:
        risk_trend = "DECREASING"
    else:
        risk_trend = "STABLE"

    return {
        "facility_id": facility.id,
        "facility_name": facility.name,
        "facility_type": facility.type,
        "latitude": facility.latitude,
        "longitude": facility.longitude,
        "risk_category": facility.risk_category,
        "current_risk_score": round(current_risk, 1),
        "current_status": current_status,
        "risk_trend": risk_trend,
        "detections_24h": count_24h,
        "detections_7d": count_7d,
        "detections_30d": count_30d,
        "detections_90d": count_90d,
        "max_nearby_frp_30d": max_frp_30d,
        "avg_nearby_frp_30d": avg_frp_30d,
        "nearest_active_fire_km": round(nearest_dist, 2) if nearest_dist is not None else None,
        "nearest_active_fire_id": nearest_fire_id,
        "persistence_score": persistence_score,
        "is_anomaly_detected": is_anomaly,
        "anomaly_magnitude": anomaly_magnitude,
        "recurring_pattern": recurring_pattern
    }


_ANOMALIES_CACHE: Dict[str, Any] = {}
_ANOMALIES_CACHE_TTL_SEC = 60.0


def list_facility_anomalies(db: Session, max_facilities: int = 20) -> List[Dict[str, Any]]:
    """Scan all industrial facilities and return active anomalies."""
    now_ts = datetime.now(timezone.utc).timestamp()
    cache_key = f"anomalies_{max_facilities}"
    if cache_key in _ANOMALIES_CACHE:
        entry = _ANOMALIES_CACHE[cache_key]
        if now_ts - entry["ts"] < _ANOMALIES_CACHE_TTL_SEC:
            return [dict(a) for a in entry["data"]]

    facilities = db.query(IndustrialSite).limit(max_facilities).all()
    anomalies = []
    for f in facilities:
        prof = get_facility_risk_profile(f.id, db)
        if prof and (prof["is_anomaly_detected"] or prof["current_status"] in ("CRITICAL_ALERT", "ACTIVE_INCIDENT_NEARBY")):
            anomalies.append(prof)
    res = sorted(anomalies, key=lambda x: x["current_risk_score"], reverse=True)
    _ANOMALIES_CACHE[cache_key] = {"data": res, "ts": now_ts}
    return res

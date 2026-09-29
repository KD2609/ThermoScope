"""API endpoints for Longitudinal Analytics, Trends, Regional Breakdowns, and Risk Heatmap.
"""

from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional
from collections import defaultdict
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc

from backend.app.database import get_db
from backend.app.models.models import FireDetection, FirePrediction, Incident, IndustrialSite
from backend.app.services.facility_analytics_service import list_facility_anomalies

router = APIRouter(prefix="/api/analytics", tags=["Analytics & Intelligence"])


# Regional bounding coordinates for key Indian industrial corridors
REGIONS_CONFIG = {
    "Gujarat Industrial Corridor": {"lat_min": 20.0, "lat_max": 24.5, "lon_min": 68.5, "lon_max": 74.5},
    "Maharashtra Industrial Belt": {"lat_min": 15.5, "lat_max": 21.5, "lon_min": 72.5, "lon_max": 80.5},
    "Odisha Steel & Mining Zone": {"lat_min": 17.5, "lat_max": 22.5, "lon_min": 81.5, "lon_max": 87.5},
    "Chhattisgarh Industrial Hub": {"lat_min": 18.0, "lat_max": 24.0, "lon_min": 80.0, "lon_max": 84.5},
    "Tamil Nadu Manufacturing Belt": {"lat_min": 8.0, "lat_max": 13.5, "lon_min": 76.5, "lon_max": 80.5},
    "Jharkhand Mining Complex": {"lat_min": 22.0, "lat_max": 25.5, "lon_min": 83.5, "lon_max": 87.5},
    "Rajasthan Petrochemical Corridor": {"lat_min": 23.5, "lat_max": 30.0, "lon_min": 69.5, "lon_max": 77.0},
}


@router.get("/trends")
def get_historical_trends(
    horizon: str = Query("30d", description="24h, 7d, 30d, 90d"),
    db: Session = Depends(get_db)
):
    """Retrieve historical time-series aggregation for fire counts, thermal power, and active days."""
    days_map = {"24h": 1, "7d": 7, "30d": 30, "90d": 90}
    days = days_map.get(horizon.lower(), 30)

    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days)

    detections = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .filter(FireDetection.detection_time >= cutoff)
        .order_by(FireDetection.detection_time.asc())
        .all()
    )

    if not detections:
        # Fallback to recent records if cutoff is empty to preserve analytics visualization
        detections = (
            db.query(FireDetection)
            .options(joinedload(FireDetection.prediction))
            .order_by(FireDetection.detection_time.asc())
            .limit(100)
            .all()
        )

    # Daily aggregation
    daily_buckets = defaultdict(lambda: {"count": 0, "frp_sum": 0.0, "frp_max": 0.0, "critical_count": 0})

    for d in detections:
        day_key = d.detection_time.strftime("%Y-%m-%d") if d.detection_time else "2026-09-20"
        daily_buckets[day_key]["count"] += 1
        frp = d.frp or 0.0
        daily_buckets[day_key]["frp_sum"] += frp
        if frp > daily_buckets[day_key]["frp_max"]:
            daily_buckets[day_key]["frp_max"] = frp
        if d.prediction and d.prediction.severity in ("HIGH", "CRITICAL"):
            daily_buckets[day_key]["critical_count"] += 1

    time_series = []
    for day_str in sorted(daily_buckets.keys()):
        b = daily_buckets[day_str]
        cnt = b["count"]
        avg_frp = round(b["frp_sum"] / max(1, cnt), 1)
        max_frp = round(b["frp_max"], 1)
        crit_cnt = b["critical_count"]
        time_series.append({
            "bucket": day_str,
            "date": day_str,
            "count": cnt,
            "fire_count": cnt,
            "avg_frp": avg_frp,
            "max_frp": max_frp,
            "critical_count": crit_cnt
        })

    # Summary totals
    total_count = len(detections)
    total_frp_vals = [d.frp for d in detections if d.frp is not None]
    overall_avg_frp = round(sum(total_frp_vals) / len(total_frp_vals), 1) if total_frp_vals else 0.0

    return {
        "horizon": horizon,
        "days": days,
        "total_detections": total_count,
        "active_days": len(daily_buckets),
        "overall_avg_frp": overall_avg_frp,
        "time_series": time_series,
        "data": time_series
    }


@router.get("/regions")
def get_regional_analytics(
    days: int = Query(30, ge=1, le=180, description="Rolling window in days"),
    db: Session = Depends(get_db)
):
    """Aggregate fire detections and active incidents across major geographic and industrial zones."""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=days)

    detections = (
        db.query(FireDetection)
        .filter(FireDetection.detection_time >= cutoff)
        .all()
    )
    if not detections:
        detections = db.query(FireDetection).all()

    incidents = (
        db.query(Incident)
        .filter(Incident.first_detected_at >= cutoff)
        .all()
    )
    if not incidents:
        incidents = db.query(Incident).all()

    all_anomalies = list_facility_anomalies(db)

    regional_data = []

    for region_name, bounds in REGIONS_CONFIG.items():
        matched_fires = [
            d for d in detections
            if bounds["lat_min"] <= d.latitude <= bounds["lat_max"]
            and bounds["lon_min"] <= d.longitude <= bounds["lon_max"]
        ]
        matched_incidents = [
            inc for inc in incidents
            if bounds["lat_min"] <= inc.latitude <= bounds["lat_max"]
            and bounds["lon_min"] <= inc.longitude <= bounds["lon_max"]
        ]

        critical_count = sum(1 for inc in matched_incidents if inc.severity in ("CRITICAL", "HIGH"))
        frp_vals = [d.frp for d in matched_fires if d.frp is not None]
        avg_frp = round(sum(frp_vals) / len(frp_vals), 1) if frp_vals else 0.0

        region_anomalies = sum(
            1 for a in all_anomalies
            if bounds["lat_min"] <= a.get("latitude", 0.0) <= bounds["lat_max"]
            and bounds["lon_min"] <= a.get("longitude", 0.0) <= bounds["lon_max"]
        )

        exposure_tier = "CRITICAL" if critical_count >= 3 or avg_frp > 80.0 else (
            "ELEVATED" if critical_count >= 1 or avg_frp > 40.0 else "STANDARD"
        )

        regional_data.append({
            "region": region_name,
            "region_name": region_name,
            "corridor": region_name,
            "total_detections": len(matched_fires),
            "detection_count": len(matched_fires),
            "active_incidents": len(matched_incidents),
            "critical_incidents": critical_count,
            "critical_events": critical_count,
            "average_frp": avg_frp,
            "avg_frp": avg_frp,
            "anomaly_count": region_anomalies,
            "exposure_tier": exposure_tier,
            "risk_index": round(min(99.0, (critical_count * 15.0) + (avg_frp / 10.0) + (len(matched_fires) * 1.5)), 1)
        })

    regional_data.sort(key=lambda r: (r["critical_incidents"], r["detection_count"]), reverse=True)
    return {
        "regions": regional_data,
        "total_monitored_regions": len(regional_data),
        "days": days
    }


@router.get("/anomalies")
def get_active_anomalies(
    days: int = Query(7, ge=1, le=90, description="Rolling window in days"),
    db: Session = Depends(get_db)
):
    """Retrieve facility-level flare surges and thermal frequency anomalies."""
    raw_anomalies = list_facility_anomalies(db)
    formatted = []
    for a in raw_anomalies:
        item = dict(a)
        if not item.get("description"):
            item["description"] = item.get("recurring_pattern") or f"Thermal surge exceeding baseline by {item.get('anomaly_magnitude', 2.5):.1f}x"
        if not item.get("anomaly_type"):
            item["anomaly_type"] = item.get("current_status", "FACILITY_SURGE")
        if not item.get("detected_at"):
            item["detected_at"] = datetime.now(timezone.utc).isoformat()
        formatted.append(item)
    return {
        "count": len(formatted),
        "anomalies": formatted
    }


@router.get("/risk-heatmap")
def get_risk_heatmap_points(db: Session = Depends(get_db)):
    """Return weighted spatial risk intensity points [lat, lon, weight] for the dynamic map risk layer."""
    fires = (
        db.query(FireDetection)
        .options(joinedload(FireDetection.prediction))
        .order_by(desc(FireDetection.detection_time))
        .limit(300)
        .all()
    )

    points = []
    for f in fires:
        score = f.prediction.risk_score if f.prediction else 50.0
        normalized_weight = round(max(0.1, min(1.0, score / 100.0)), 2)
        points.append({
            "lat": f.latitude,
            "lon": f.longitude,
            "weight": normalized_weight,
            "frp": f.frp or 0.0,
            "severity": f.prediction.severity if f.prediction else "LOW",
            "fire_id": f.id
        })

    return {
        "count": len(points),
        "points": points
    }

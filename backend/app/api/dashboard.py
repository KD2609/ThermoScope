import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, Tuple
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from backend.app.database import get_db
from backend.app.models.models import FireDetection, FirePrediction, Alert, SyncLog
from backend.app.schemas.schemas import DashboardStatsResponse
from backend.app.services.firms_service import firms_service

from backend.app.services.cache_service import memory_cache

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """Calculate real-time operational metrics for dashboard summary cards with aggregated queries."""
    cached = memory_cache.get("dashboard:stats")
    if cached is not None:
        return cached

    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)
    last_48h = now - timedelta(hours=48)

    # 1. Total & Active counts (combined in 1 round trip)
    time_stats = db.query(
        func.count(FireDetection.id).label("total"),
        func.count(case((FireDetection.detection_time >= last_24h, FireDetection.id))).label("active_24h"),
        func.count(case(((FireDetection.detection_time >= last_48h) & (FireDetection.detection_time < last_24h), FireDetection.id))).label("prev_24h")
    ).one()

    total_detections = time_stats.total or 0
    active_fires_count = time_stats.active_24h or 0
    prev_24h_count = time_stats.prev_24h or 0

    if prev_24h_count > 0:
        trend = round(((active_fires_count - prev_24h_count) / prev_24h_count) * 100.0, 1)
    elif active_fires_count > 0:
        trend = 100.0
    else:
        trend = 0.0

    # 2. Class Distribution (also derives industrial count without extra table scan)
    class_rows = (
        db.query(FirePrediction.predicted_class, func.count(FirePrediction.id))
        .group_by(FirePrediction.predicted_class)
        .all()
    )
    class_distribution = {c: count for c, count in class_rows}
    industrial_fires_count = sum(
        class_distribution.get(c, 0)
        for c in [
            "Industrial Fire",
            "Gas Flare / Persistent Thermal Source",
            "Mining / Industrial Thermal Activity"
        ]
    )

    # 3. Severity Distribution (also derives high/critical count without extra table scan)
    severity_rows = (
        db.query(FirePrediction.severity, func.count(FirePrediction.id))
        .group_by(FirePrediction.severity)
        .all()
    )
    severity_distribution = {s: count for s, count in severity_rows}
    high_risk_count = severity_distribution.get("HIGH", 0) + severity_distribution.get("CRITICAL", 0)

    # 4. Critical & Active Alerts Count (combined in 1 round trip)
    alert_rows = (
        db.query(Alert.severity, func.count(Alert.id))
        .filter(Alert.status == "NEW")
        .group_by(Alert.severity)
        .all()
    )
    active_alerts_count = sum(cnt for _, cnt in alert_rows)
    critical_alerts_count = sum(cnt for sev, cnt in alert_rows if sev == "CRITICAL")

    # 5. Last Sync Log
    last_log = db.query(SyncLog).order_by(SyncLog.sync_time.desc()).first()
    last_sync_time = last_log.sync_time.isoformat() if last_log and last_log.sync_time else None
    is_live = last_log.status == "SUCCESS" if last_log else False

    result = {
        "active_fires_count": active_fires_count,
        "industrial_fires_count": industrial_fires_count,
        "high_risk_count": high_risk_count,
        "critical_alerts_count": critical_alerts_count,
        "active_alerts_count": active_alerts_count,
        "total_detections": total_detections,
        "trend_percentage_24h": trend,
        "class_distribution": class_distribution,
        "severity_distribution": severity_distribution,
        "last_sync_time": last_sync_time,
        "is_live_firms_connected": is_live
    }
    memory_cache.set("dashboard:stats", result, ttl=15.0)
    return result


@router.get("/intelligence-brief")
def get_intelligence_brief(db: Session = Depends(get_db)):
    """Generate dynamic operational intelligence brief derived from live database records."""
    cached = memory_cache.get("dashboard:brief")
    if cached is not None:
        return cached

    from backend.app.models.models import Incident, IndustrialSite
    from backend.app.services.hotspot_service import get_persistent_hotspots
    from backend.app.services.facility_analytics_service import list_facility_anomalies

    now = datetime.now(timezone.utc)
    last_24h = now - timedelta(hours=24)

    active_incidents = db.query(Incident).filter(Incident.status != "CLOSED").all()
    critical_incidents = [i for i in active_incidents if i.severity == "CRITICAL"]
    escalated_alerts = db.query(Alert).filter(Alert.escalation_level > 1).all()

    hotspots = get_persistent_hotspots(db, window_days=30)
    anomalies = list_facility_anomalies(db)

    # Facilities under elevated observation
    facilities_elevated = [a["facility_name"] for a in anomalies if a.get("current_status") in ("CRITICAL_ALERT", "ACTIVE_INCIDENT_NEARBY")]

    # Headline text
    if critical_incidents:
        headline = f"OPERATIONAL ALERT: {len(critical_incidents)} critical incident(s) currently requiring immediate tactical response."
    elif active_incidents:
        headline = f"MONITORING ACTIVE: Tracking {len(active_incidents)} active industrial thermal incidents across monitored corridors."
    else:
        headline = "SURVEILLANCE NORMAL: No uncontained critical thermal events currently detected."

    brief = {
        "timestamp": now.isoformat(),
        "headline": headline,
        "active_incidents_count": len(active_incidents),
        "critical_incidents_count": len(critical_incidents),
        "active_anomalies_count": len(anomalies),
        "persistent_hotspots_count": len(hotspots),
        "escalated_alerts_count": len(escalated_alerts),
        "facilities_under_elevated_exposure": facilities_elevated[:5],
        "top_active_incidents": [i.to_dict() for i in sorted(active_incidents, key=lambda x: x.max_frp, reverse=True)[:3]],
        "key_takeaways": [
            f"{len(active_incidents)} active fire incident(s) currently being tracked.",
            f"{len(hotspots)} persistent thermal hotspots identified across 30-day baseline.",
            f"{len(anomalies)} facility-level flare anomaly signal(s) flagged for review.",
            f"{len(escalated_alerts)} alert(s) escalated due to increased thermal output."
        ]
    }
    memory_cache.set("dashboard:brief", brief, ttl=30.0)
    return brief

"""Dedicated Alert Processing and Notification Matching Engine.
Evaluates severity thresholds, applies deterministic deduplication, enforces responsible phrasing,
and matches qualified incidents against registered public geographic subscriptions.
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.models import (
    FireDetection, FirePrediction, Alert, NotificationSubscription
)
from backend.app.services.geospatial_service import haversine_distance_km
from backend.app.config import settings


def process_alerts_for_detection(
    detection: FireDetection,
    prediction: FirePrediction,
    db: Session
) -> List[Alert]:
    """Evaluate detection telemetry and prediction to generate deduplicated alerts."""
    created_alerts: List[Alert] = []
    det_date_str = detection.detection_time.strftime("%Y%m%d")

    # 1. Authority Alert: Critical Industrial Fire Event
    if prediction.severity in ("CRITICAL", "HIGH") and "Industrial" in prediction.predicted_class:
        dedup_key = f"{detection.id}_CRITICAL_INDUSTRIAL_{det_date_str}"
        existing = db.query(Alert).filter(Alert.dedup_key == dedup_key).first()

        if not existing:
            facility_str = f" near {prediction.nearby_industrial_name}" if prediction.nearby_industrial_name else ""
            dist_str = f" ({prediction.distance_to_industrial_km:.1f} km)" if prediction.distance_to_industrial_km else ""

            alert = Alert(
                id=f"ALT-IND-{detection.id[:12]}",
                fire_detection_id=detection.id,
                alert_type="CRITICAL_INDUSTRIAL_FIRE",
                severity=prediction.severity,
                title=f"Industrial Fire Detected{facility_str}",
                message=(
                    f"Thermal intensity anomaly (FRP: {detection.frp:.1f} MW, Brightness: {detection.brightness_temperature:.1f} K) "
                    f"classified as {prediction.predicted_class} with {prediction.confidence * 100:.0f}% confidence"
                    f"{facility_str}{dist_str}. Industrial safety protocol triggered."
                ),
                facility_name=prediction.nearby_industrial_name,
                residential_area_name=prediction.nearby_residential_name,
                distance_to_residence_km=prediction.distance_to_residential_km,
                status="NEW",
                dedup_key=dedup_key,
                created_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            created_alerts.append(alert)

    # 2. Public Awareness & Residential Buffer Alert (Responsible Non-Alarmist Wording)
    # Only triggered when severity is HIGH/CRITICAL and distance to residential area is within high threshold
    if (
        prediction.distance_to_residential_km is not None and
        prediction.distance_to_residential_km <= settings.DANGER_ZONE_HIGH_KM and
        prediction.severity in ("CRITICAL", "HIGH")
    ):
        dedup_key = f"{detection.id}_RESIDENTIAL_AWARENESS_{det_date_str}"
        existing = db.query(Alert).filter(Alert.dedup_key == dedup_key).first()

        if not existing:
            res_name = prediction.nearby_residential_name or "adjacent residential sector"
            alert = Alert(
                id=f"ALT-RES-{detection.id[:12]}",
                fire_detection_id=detection.id,
                alert_type="RESIDENTIAL_PROXIMITY_AWARENESS",
                severity=prediction.severity,
                title=f"Potential Elevated Thermal Source Near {res_name}",
                message=(
                    f"Potential high-risk thermal event detected approximately "
                    f"{prediction.distance_to_residential_km:.1f} km from {res_name}. "
                    f"Authorities should verify current conditions and issue appropriate guidance."
                ),
                facility_name=prediction.nearby_industrial_name,
                residential_area_name=res_name,
                distance_to_residence_km=prediction.distance_to_residential_km,
                status="NEW",
                dedup_key=dedup_key,
                created_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            created_alerts.append(alert)

    # 3. Persistent Gas Flare Anomaly Alert
    if "Gas Flare" in prediction.predicted_class and detection.frp > 350.0:
        dedup_key = f"{detection.id}_FLARE_SURGE_{det_date_str}"
        existing = db.query(Alert).filter(Alert.dedup_key == dedup_key).first()

        if not existing:
            alert = Alert(
                id=f"ALT-FLR-{detection.id[:12]}",
                fire_detection_id=detection.id,
                alert_type="PERSISTENT_THERMAL_SURGE",
                severity="MEDIUM",
                title=f"Elevated Flare Output at {prediction.nearby_industrial_name or 'Facility'}",
                message=(
                    f"FRP emission ({detection.frp:.1f} MW) exceeds standard baseline for persistent flaring. "
                    f"Recommended SCADA telemetry cross-check for process relief status."
                ),
                facility_name=prediction.nearby_industrial_name,
                residential_area_name=prediction.nearby_residential_name,
                distance_to_residence_km=prediction.distance_to_residential_km,
                status="NEW",
                dedup_key=dedup_key,
                created_at=datetime.now(timezone.utc)
            )
            db.add(alert)
            created_alerts.append(alert)

    if created_alerts:
        db.commit()
        for a in created_alerts:
            db.refresh(a)

    return created_alerts


def match_public_subscriptions(detection: FireDetection, db: Session) -> List[Dict[str, Any]]:
    """Match incident coordinates with user watch areas."""
    subscriptions = db.query(NotificationSubscription).all()
    matched_notifications = []

    for sub in subscriptions:
        dist = haversine_distance_km(
            detection.latitude, detection.longitude, sub.latitude, sub.longitude
        )
        if dist <= sub.radius_km:
            matched_notifications.append({
                "subscription_id": sub.id,
                "user_email": sub.user_email,
                "area_name": sub.area_name,
                "distance_km": dist,
                "channels": {
                    "email": sub.email_enabled,
                    "browser": sub.browser_enabled,
                    "sms": sub.sms_enabled
                },
                "detection_id": detection.id,
                "lat": detection.latitude,
                "lon": detection.longitude
            })

    return matched_notifications

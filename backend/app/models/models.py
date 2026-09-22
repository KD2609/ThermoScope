"""SQLAlchemy Database Models for ThermoScope Geospatial Platform.
Tables for Fire Detections, Predictions, Industrial Sites, Residential Areas,
Alerts, Subscriptions, and Sync Audits.
"""

from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Index
)
from sqlalchemy.orm import relationship
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)


class FireDetection(Base):
    __tablename__ = "fire_detections"

    id = Column(String(64), primary_key=True, index=True)
    source = Column(String(64), default="NASA_FIRMS", index=True)
    sensor = Column(String(64), default="VIIRS_SNPP", index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    detection_time = Column(DateTime, nullable=False, index=True)
    brightness_temperature = Column(Float, nullable=False)
    frp = Column(Float, nullable=True, default=0.0)
    confidence = Column(Float, nullable=False, default=70.0)
    day_night = Column(String(8), default="D")
    satellite = Column(String(32), default="Suomi-NPP")
    instrument = Column(String(32), default="VIIRS")
    raw_payload = Column(Text, nullable=True)
    dedup_hash = Column(String(64), unique=True, index=True, nullable=False)
    is_demo_fallback = Column(Boolean, default=False, index=True)
    created_at = Column(DateTime, default=utc_now)

    # Spatial indexes
    __table_args__ = (
        Index("idx_fire_lat_lon", "latitude", "longitude"),
        Index("idx_fire_detection_time", "detection_time"),
    )

    # Relationships
    prediction = relationship("FirePrediction", back_populates="detection", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="detection", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "sensor": self.sensor,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "detection_time": self.detection_time.isoformat() if self.detection_time else None,
            "brightness_temperature": self.brightness_temperature,
            "frp": self.frp,
            "confidence": self.confidence,
            "day_night": self.day_night,
            "satellite": self.satellite,
            "instrument": self.instrument,
            "is_demo_fallback": self.is_demo_fallback,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "prediction": self.prediction.to_dict() if self.prediction else None
        }


class FirePrediction(Base):
    __tablename__ = "fire_predictions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fire_detection_id = Column(String(64), ForeignKey("fire_detections.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_class = Column(String(64), nullable=False, index=True)
    confidence = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False, index=True)
    severity = Column(String(16), nullable=False, index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    model_version = Column(String(32), default="v1.0.0")
    class_probabilities = Column(Text, nullable=True)  # JSON string
    nearby_industrial_name = Column(String(128), nullable=True)
    nearby_industrial_type = Column(String(64), nullable=True)
    distance_to_industrial_km = Column(Float, nullable=True)
    nearby_residential_name = Column(String(128), nullable=True)
    distance_to_residential_km = Column(Float, nullable=True)
    recommended_response = Column(Text, nullable=True)
    predicted_at = Column(DateTime, default=utc_now)

    detection = relationship("FireDetection", back_populates="prediction")

    def to_dict(self):
        probs = {}
        if self.class_probabilities:
            try:
                probs = json.loads(self.class_probabilities)
            except Exception:
                probs = {}
        return {
            "id": self.id,
            "fire_detection_id": self.fire_detection_id,
            "predicted_class": self.predicted_class,
            "confidence": self.confidence,
            "risk_score": self.risk_score,
            "severity": self.severity,
            "model_version": self.model_version,
            "class_probabilities": probs,
            "nearby_industrial_name": self.nearby_industrial_name,
            "nearby_industrial_type": self.nearby_industrial_type,
            "distance_to_industrial_km": self.distance_to_industrial_km,
            "nearby_residential_name": self.nearby_residential_name,
            "distance_to_residential_km": self.distance_to_residential_km,
            "recommended_response": self.recommended_response,
            "predicted_at": self.predicted_at.isoformat() if self.predicted_at else None
        }


class IndustrialSite(Base):
    __tablename__ = "industrial_sites"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    type = Column(String(64), nullable=False, index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    source = Column(String(64), default="OpenStreetMap/Overpass")
    risk_category = Column(String(16), default="HIGH")  # CRITICAL, HIGH, MEDIUM
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index("idx_ind_lat_lon", "latitude", "longitude"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "source": self.source,
            "risk_category": self.risk_category,
            "description": self.description
        }


class ResidentialArea(Base):
    __tablename__ = "residential_areas"

    id = Column(String(64), primary_key=True, index=True)
    name = Column(String(128), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    building_count = Column(Integer, default=100)
    population_estimate = Column(Integer, default=1000)
    source = Column(String(64), default="OpenStreetMap/Census")
    danger_radius_km = Column(Float, default=3.0)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index("idx_res_lat_lon", "latitude", "longitude"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "building_count": self.building_count,
            "population_estimate": self.population_estimate,
            "danger_radius_km": self.danger_radius_km
        }


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(String(64), primary_key=True, index=True)
    fire_detection_id = Column(String(64), ForeignKey("fire_detections.id", ondelete="CASCADE"), nullable=False, index=True)
    alert_type = Column(String(64), nullable=False, index=True)
    severity = Column(String(16), nullable=False, index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(128), nullable=False)
    message = Column(Text, nullable=False)
    facility_name = Column(String(128), nullable=True)
    residential_area_name = Column(String(128), nullable=True)
    distance_to_residence_km = Column(Float, nullable=True)
    status = Column(String(16), default="NEW", index=True)  # NEW, ACKNOWLEDGED, RESOLVED
    dedup_key = Column(String(128), unique=True, index=True, nullable=False)
    acknowledged_by = Column(String(64), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    detection = relationship("FireDetection", back_populates="alerts")

    def to_dict(self):
        return {
            "id": self.id,
            "fire_detection_id": self.fire_detection_id,
            "alert_type": self.alert_type,
            "severity": self.severity,
            "title": self.title,
            "message": self.message,
            "facility_name": self.facility_name,
            "residential_area_name": self.residential_area_name,
            "distance_to_residence_km": self.distance_to_residence_km,
            "status": self.status,
            "acknowledged_by": self.acknowledged_by,
            "acknowledged_at": self.acknowledged_at.isoformat() if self.acknowledged_at else None,
            "resolved_at": self.resolved_at.isoformat() if self.resolved_at else None,
            "resolution_notes": self.resolution_notes,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(64), nullable=False)
    email = Column(String(128), unique=True, index=True, nullable=False)
    role = Column(String(32), default="AUTHORITY", index=True)  # ADMIN, AUTHORITY, ANALYST, PUBLIC
    hashed_password = Column(String(128), nullable=True)
    notification_preferences = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class NotificationSubscription(Base):
    __tablename__ = "notification_subscriptions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_email = Column(String(128), index=True, nullable=False)
    area_name = Column(String(128), default="Custom Watch Area")
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    radius_km = Column(Float, default=5.0)
    email_enabled = Column(Boolean, default=True)
    browser_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

    def to_dict(self):
        return {
            "id": self.id,
            "user_email": self.user_email,
            "area_name": self.area_name,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius_km": self.radius_km,
            "email_enabled": self.email_enabled,
            "browser_enabled": self.browser_enabled,
            "sms_enabled": self.sms_enabled,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class SyncLog(Base):
    __tablename__ = "sync_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(64), default="NASA_FIRMS")
    sync_time = Column(DateTime, default=utc_now, index=True)
    status = Column(String(32), default="SUCCESS")  # SUCCESS, FAILED, OFFLINE_FALLBACK
    records_fetched = Column(Integer, default=0)
    records_inserted = Column(Integer, default=0)
    duration_seconds = Column(Float, default=0.0)
    error_message = Column(Text, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "sync_time": self.sync_time.isoformat() if self.sync_time else None,
            "status": self.status,
            "records_fetched": self.records_fetched,
            "records_inserted": self.records_inserted,
            "duration_seconds": round(self.duration_seconds, 2),
            "error_message": self.error_message
        }

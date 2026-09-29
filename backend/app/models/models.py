"""SQLAlchemy Database Models for ThermoScope Geospatial Platform.
Tables for Fire Detections, Predictions, Industrial Sites, Residential Areas,
Alerts, Subscriptions, and Sync Audits.
"""

from datetime import datetime, timezone
import json
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, Index
)
from sqlalchemy.types import TypeDecorator
from sqlalchemy.orm import relationship
from geoalchemy2 import Geometry
from backend.app.database import Base


def utc_now():
    return datetime.now(timezone.utc)



class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(128), nullable=False)
    status = Column(String(32), default="NEW", index=True)  # NEW, INVESTIGATING, CONFIRMED, CONTAINED, CLOSED
    severity = Column(String(16), default="MEDIUM", index=True)  # LOW, MEDIUM, HIGH, CRITICAL
    first_detected_at = Column(DateTime(timezone=True), nullable=False, index=True)
    last_detected_at = Column(DateTime(timezone=True), nullable=False, index=True)
    detection_count = Column(Integer, default=1)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    geom = Column(Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True)
    radius_km = Column(Float, default=1.0)
    max_frp = Column(Float, default=0.0)
    avg_frp = Column(Float, default=0.0)
    primary_class = Column(String(64), default="Industrial Fire", index=True)
    nearby_facility_name = Column(String(128), nullable=True)
    nearby_facility_id = Column(String(64), nullable=True)
    distance_to_facility_km = Column(Float, nullable=True)
    assigned_to = Column(String(64), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    closed_at = Column(DateTime(timezone=True), nullable=True)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)
    updated_at = Column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    __table_args__ = (
        Index("idx_incident_lat_lon", "latitude", "longitude"),
        Index("idx_incident_last_time", "last_detected_at"),
        Index("idx_incident_geom", "geom", postgresql_using="gist"),
    )

    detections = relationship("FireDetection", back_populates="incident", order_by="FireDetection.detection_time")
    alerts = relationship("Alert", back_populates="incident")
    reviews = relationship("AnalystReview", back_populates="incident")

    def to_dict(self, include_detections: bool = False):
        res = {
            "id": self.id,
            "title": self.title,
            "status": self.status,
            "severity": self.severity,
            "first_detected_at": self.first_detected_at.isoformat() if self.first_detected_at else None,
            "last_detected_at": self.last_detected_at.isoformat() if self.last_detected_at else None,
            "detection_count": self.detection_count,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "radius_km": round(self.radius_km, 2) if self.radius_km is not None else 1.0,
            "max_frp": round(self.max_frp, 1) if self.max_frp is not None else 0.0,
            "avg_frp": round(self.avg_frp, 1) if self.avg_frp is not None else 0.0,
            "primary_class": self.primary_class,
            "nearby_facility_name": self.nearby_facility_name,
            "nearby_facility_id": self.nearby_facility_id,
            "distance_to_facility_km": round(self.distance_to_facility_km, 2) if self.distance_to_facility_km is not None else None,
            "assigned_to": self.assigned_to,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
            "closed_at": self.closed_at.isoformat() if self.closed_at else None,
            "summary": self.summary,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_detections:
            res["detections"] = [d.to_dict() for d in self.detections]
        return res


class FireDetection(Base):
    __tablename__ = "fire_detections"

    id = Column(String(64), primary_key=True, index=True)
    source = Column(String(64), default="NASA_FIRMS", index=True)
    sensor = Column(String(64), default="VIIRS_SNPP", index=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    geom = Column(Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True)
    detection_time = Column(DateTime(timezone=True), nullable=False, index=True)
    brightness_temperature = Column(Float, nullable=False)
    frp = Column(Float, nullable=True, default=0.0)
    confidence = Column(Float, nullable=False, default=70.0)
    day_night = Column(String(8), default="D")
    satellite = Column(String(32), default="Suomi-NPP")
    instrument = Column(String(32), default="VIIRS")
    raw_payload = Column(Text, nullable=True)
    dedup_hash = Column(String(64), unique=True, index=True, nullable=False)
    is_demo_fallback = Column(Boolean, default=False, index=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    # Spatial and temporal indexes
    __table_args__ = (
        Index("idx_fire_lat_lon", "latitude", "longitude"),
        Index("idx_fire_detection_time", "detection_time"),
        Index("idx_fire_geom", "geom", postgresql_using="gist"),
    )

    # Relationships
    prediction = relationship("FirePrediction", back_populates="detection", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="detection", cascade="all, delete-orphan")
    incident = relationship("Incident", back_populates="detections")
    reviews = relationship("AnalystReview", back_populates="detection", cascade="all, delete-orphan")

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
            "incident_id": self.incident_id,
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
    geom = Column(Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True)
    source = Column(String(64), default="OpenStreetMap/Overpass")
    risk_category = Column(String(16), default="HIGH")  # CRITICAL, HIGH, MEDIUM
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index("idx_ind_lat_lon", "latitude", "longitude"),
        Index("idx_ind_geom", "geom", postgresql_using="gist"),
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
    geom = Column(Geometry(geometry_type="POINT", srid=4326, spatial_index=False), nullable=True)
    building_count = Column(Integer, default=100)
    population_estimate = Column(Integer, default=1000)
    source = Column(String(64), default="OpenStreetMap/Census")
    danger_radius_km = Column(Float, default=3.0)
    created_at = Column(DateTime, default=utc_now)

    __table_args__ = (
        Index("idx_res_lat_lon", "latitude", "longitude"),
        Index("idx_res_geom", "geom", postgresql_using="gist"),
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
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
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
    assigned_to = Column(String(64), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    escalation_level = Column(Integer, default=1)
    escalated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime, default=utc_now, index=True)

    detection = relationship("FireDetection", back_populates="alerts")
    incident = relationship("Incident", back_populates="alerts")

    def to_dict(self):
        return {
            "id": self.id,
            "fire_detection_id": self.fire_detection_id,
            "incident_id": self.incident_id,
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
            "assigned_to": self.assigned_to,
            "assigned_at": self.assigned_at.isoformat() if self.assigned_at else None,
            "escalation_level": self.escalation_level,
            "escalated_at": self.escalated_at.isoformat() if self.escalated_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class AnalystReview(Base):
    __tablename__ = "analyst_reviews"

    id = Column(Integer, primary_key=True, autoincrement=True)
    fire_detection_id = Column(String(64), ForeignKey("fire_detections.id", ondelete="CASCADE"), nullable=False, index=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="SET NULL"), nullable=True, index=True)
    decision = Column(String(32), nullable=False, index=True)  # CONFIRMED, FALSE_POSITIVE, INCORRECT_CLASSIFICATION, UNKNOWN
    corrected_class = Column(String(64), nullable=True)
    analyst_id = Column(String(64), default="analyst_1")
    analyst_name = Column(String(64), default="Authorized Analyst")
    notes = Column(Text, nullable=True)
    reviewed_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    detection = relationship("FireDetection", back_populates="reviews")
    incident = relationship("Incident", back_populates="reviews")

    def to_dict(self):
        return {
            "id": self.id,
            "fire_detection_id": self.fire_detection_id,
            "incident_id": self.incident_id,
            "decision": self.decision,
            "corrected_class": self.corrected_class,
            "analyst_id": self.analyst_id,
            "analyst_name": self.analyst_name,
            "notes": self.notes,
            "reviewed_at": self.reviewed_at.isoformat() if self.reviewed_at else None
        }


class FacilityWatchlist(Base):
    __tablename__ = "facility_watchlists"

    id = Column(Integer, primary_key=True, autoincrement=True)
    facility_id = Column(String(64), ForeignKey("industrial_sites.id", ondelete="CASCADE"), nullable=False, index=True)
    user_email = Column(String(128), index=True, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=utc_now)

    facility = relationship("IndustrialSite")

    def to_dict(self):
        return {
            "id": self.id,
            "facility_id": self.facility_id,
            "user_email": self.user_email,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "facility": self.facility.to_dict() if self.facility else None
        }


class WeatherCache(Base):
    __tablename__ = "weather_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    temperature = Column(Float, nullable=True)
    relative_humidity = Column(Float, nullable=True)
    wind_speed = Column(Float, nullable=True)
    wind_direction = Column(Float, nullable=True)
    precipitation = Column(Float, nullable=True)
    weather_source = Column(String(64), default="Open-Meteo")
    fetched_at = Column(DateTime(timezone=True), default=utc_now, index=True)

    __table_args__ = (
        Index("idx_weather_lat_lon", "latitude", "longitude"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "temperature": self.temperature,
            "relative_humidity": self.relative_humidity,
            "wind_speed": self.wind_speed,
            "wind_direction": self.wind_direction,
            "precipitation": self.precipitation,
            "weather_source": self.weather_source,
            "fetched_at": self.fetched_at.isoformat() if self.fetched_at else None
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

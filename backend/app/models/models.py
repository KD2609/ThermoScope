from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from app.database import Base

class ThermalAnomaly(Base):
    __tablename__ = "thermal_anomalies"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(64), unique=True, index=True, nullable=False)
    latitude = Column(Float, nullable=False, index=True)
    longitude = Column(Float, nullable=False, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    satellite = Column(String(32), default="VIIRS-NOAA21")
    frp = Column(Float, nullable=False)  # Fire Radiative Power (MW)
    brightness = Column(Float, default=320.0)  # Kelvin
    source_confidence = Column(String(32), default="nominal")
    daynight = Column(String(4), default="N")  # 'D' or 'N'
    source = Column(String(64), default="DEMO_DATASET")  # 'NASA_FIRMS_LIVE', 'DEMO_DATASET', 'SYNTHETIC_SCENARIO'
    processing_status = Column(String(32), default="PROCESSED")  # 'RAW', 'PROCESSED', 'CLASSIFIED'
    is_simulated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    classification = relationship("ClassificationResult", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")
    risk_assessment = relationship("RiskAssessment", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")
    alert = relationship("Alert", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")
    investigation = relationship("Investigation", back_populates="anomaly", uselist=False, cascade="all, delete-orphan")
    temporal_observations = relationship("TemporalObservation", back_populates="anomaly", cascade="all, delete-orphan")


class IndustrialAsset(Base):
    __tablename__ = "industrial_assets"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(String(64), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(64), nullable=False)  # Refinery, Petrochemical, Power Plant, Steel / Metal, Mining Site, LNG / Gas, etc.
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    boundary_geojson = Column(Text, nullable=True)  # GeoJSON Polygon / MultiPolygon
    radius_meters = Column(Float, default=1500.0)  # Context radius
    operational_status = Column(String(32), default="OPERATIONAL")
    criticality_level = Column(String(32), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    source = Column(String(64), default="OSM-derived")  # 'OSM-derived', 'Prototype registry', 'Demonstration data'
    source_confidence = Column(String(32), default="HIGH")
    
    # Baseline FRP indicators
    baseline_frp_min = Column(Float, default=20.0)
    baseline_frp_max = Column(Float, default=80.0)
    baseline_frp_median = Column(Float, default=45.0)
    baseline_count = Column(Integer, default=12)

    last_updated = Column(DateTime, default=datetime.utcnow)
    temporal_observations = relationship("TemporalObservation", back_populates="asset")


class ClassificationResult(Base):
    __tablename__ = "classification_results"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("thermal_anomalies.id"), nullable=False, unique=True)
    predicted_class = Column(String(64), nullable=False)
    confidence_score = Column(Float, nullable=False)  # 0.0 to 1.0
    class_probabilities = Column(Text, nullable=False)  # JSON dict string
    supporting_evidence = Column(Text, nullable=False)  # JSON list string
    uncertainty_factors = Column(Text, nullable=False)  # JSON list string
    feature_contributions = Column(Text, nullable=True)  # JSON dict string
    model_name = Column(String(64), default="Hybrid AI + Geospatial Evidence Model")
    created_at = Column(DateTime, default=datetime.utcnow)

    anomaly = relationship("ThermalAnomaly", back_populates="classification")


class TemporalObservation(Base):
    __tablename__ = "temporal_observations"

    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey("industrial_assets.id"), nullable=True)
    anomaly_id = Column(Integer, ForeignKey("thermal_anomalies.id"), nullable=True)
    cluster_key = Column(String(64), index=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    frp = Column(Float, nullable=False)
    daynight = Column(String(4), default="N")
    satellite = Column(String(32), default="VIIRS-NOAA21")
    is_baseline_eligible = Column(Boolean, default=True)

    asset = relationship("IndustrialAsset", back_populates="temporal_observations")
    anomaly = relationship("ThermalAnomaly", back_populates="temporal_observations")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("thermal_anomalies.id"), nullable=False, unique=True)
    risk_score = Column(Float, nullable=False)  # 0.0 to 100.0
    risk_level = Column(String(32), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    investigation_priority = Column(String(32), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    
    intensity_component = Column(Float, default=0.0)
    proximity_component = Column(Float, default=0.0)
    abnormality_component = Column(Float, default=0.0)
    persistence_component = Column(Float, default=0.0)
    criticality_component = Column(Float, default=0.0)
    confidence_component = Column(Float, default=0.0)
    formula_weights = Column(Text, nullable=True)  # JSON dict string
    created_at = Column(DateTime, default=datetime.utcnow)

    anomaly = relationship("ThermalAnomaly", back_populates="risk_assessment")


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(String(64), unique=True, index=True, nullable=False)
    anomaly_id = Column(Integer, ForeignKey("thermal_anomalies.id"), nullable=False)
    severity = Column(String(32), nullable=False)  # CRITICAL, HIGH, MEDIUM, LOW
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    facility_name = Column(String(255), default="Unknown Industrial Zone")
    status = Column(String(32), default="NEW")  # NEW, ACKNOWLEDGED, UNDER_REVIEW, RESOLVED
    assigned_to = Column(String(128), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    anomaly = relationship("ThermalAnomaly", back_populates="alert")


class Investigation(Base):
    __tablename__ = "investigations"

    id = Column(Integer, primary_key=True, index=True)
    anomaly_id = Column(Integer, ForeignKey("thermal_anomalies.id"), nullable=False, unique=True)
    status = Column(String(32), default="NEW")  # NEW, UNDER REVIEW, VERIFIED, FALSE POSITIVE, RESOLVED
    assigned_analyst = Column(String(128), default="Unassigned")
    notes = Column(Text, default="[]")  # JSON list of {id, timestamp, author, text}
    recommendation = Column(Text, default="Review multi-source evidence and request high-res verification if necessary.")
    verified_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    anomaly = relationship("ThermalAnomaly", back_populates="investigation")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String(64), nullable=False)  # EVENT_OPENED, CLASSIFICATION_VIEWED, STATUS_CHANGED, NOTE_ADDED, REPORT_GENERATED
    entity_type = Column(String(32), nullable=False)  # ANOMALY, ALERT, INVESTIGATION, SYSTEM
    entity_id = Column(String(64), nullable=False)
    user_name = Column(String(128), default="Analyst Demo")
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)


class DataSourceStatus(Base):
    __tablename__ = "data_source_statuses"

    id = Column(Integer, primary_key=True, index=True)
    source_name = Column(String(64), unique=True, nullable=False)
    status = Column(String(32), default="CONNECTED")  # CONNECTED, AVAILABLE, OPTIONAL, ACTIVE, DEGRADED, UNAVAILABLE
    record_count = Column(Integer, default=0)
    last_sync = Column(DateTime, default=datetime.utcnow)
    latency_ms = Column(Integer, default=120)
    message = Column(String(255), default="Operational")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(64), unique=True, index=True, nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), default="ANALYST")  # ADMIN, ANALYST, RESPONDER, VIEWER
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

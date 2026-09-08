from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field

# Base Models
class AnomalyBase(BaseModel):
    event_id: str
    latitude: float
    longitude: float
    timestamp: datetime
    satellite: str = "VIIRS-NOAA21"
    frp: float
    brightness: float = 320.0
    source_confidence: str = "nominal"
    daynight: str = "N"
    source: str = "DEMO_DATASET"
    processing_status: str = "PROCESSED"

class AnomalyResponse(AnomalyBase):
    id: int
    is_simulated: bool = False
    created_at: datetime
    classification_class: Optional[str] = None
    classification_confidence: Optional[float] = None
    risk_score: Optional[float] = None
    risk_level: Optional[str] = None
    facility_name: Optional[str] = None

    class Config:
        from_attributes = True

# GeoJSON Models
class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    geometry: dict[str, Any]
    properties: dict[str, Any]

class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: list[GeoJSONFeature]

# Asset Models
class AssetBase(BaseModel):
    asset_id: str
    name: str
    category: str
    latitude: float
    longitude: float
    boundary_geojson: Optional[str] = None
    radius_meters: float = 1500.0
    operational_status: str = "OPERATIONAL"
    criticality_level: str = "HIGH"
    source: str = "OSM-derived"
    source_confidence: str = "HIGH"
    baseline_frp_min: float = 20.0
    baseline_frp_max: float = 80.0
    baseline_frp_median: float = 45.0
    baseline_count: int = 12

class AssetResponse(AssetBase):
    id: int
    last_updated: datetime
    active_anomalies_count: int = 0
    historical_observations_count: int = 0
    current_risk_level: str = "LOW"
    persistence_detected: bool = False

    class Config:
        from_attributes = True

# Classification & Explainability
class ClassificationResponse(BaseModel):
    predicted_class: str
    confidence_score: float
    class_probabilities: dict[str, float]
    supporting_evidence: list[str]
    uncertainty_factors: list[str]
    feature_contributions: dict[str, float]
    model_name: str = "Hybrid AI + Geospatial Evidence Model"

# Risk Models
class RiskResponse(BaseModel):
    risk_score: float
    risk_level: str
    investigation_priority: str
    components: dict[str, float]
    formula_weights: dict[str, float]

# Alert Models
class AlertResponse(BaseModel):
    id: int
    alert_id: str
    anomaly_id: int
    severity: str
    title: str
    message: str
    facility_name: str
    status: str
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AlertActionRequest(BaseModel):
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    notes: Optional[str] = None
    user_name: str = "Analyst Demo"

# Investigation Models
class InvestigationNote(BaseModel):
    id: str
    timestamp: str
    author: str
    text: str

class InvestigationResponse(BaseModel):
    id: int
    anomaly_id: int
    status: str
    assigned_analyst: str
    notes: list[InvestigationNote]
    recommendation: str
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

class AddNoteRequest(BaseModel):
    text: str
    author: str = "Analyst Demo"

class UpdateInvestigationRequest(BaseModel):
    status: Optional[str] = None
    assigned_analyst: Optional[str] = None
    recommendation: Optional[str] = None
    author: str = "Analyst Demo"

# Temporal & Baseline Models
class BaselineAnalysis(BaseModel):
    has_sufficient_history: bool
    observation_count: int
    current_frp: float
    historical_median_frp: Optional[float] = None
    frp_min: Optional[float] = None
    frp_max: Optional[float] = None
    deviation_percent: Optional[float] = None
    persistence_detected: bool
    persistence_duration_days: int
    recurrence_frequency_per_week: float
    interpretation: str

# Consolidated Intelligence Object (GET /api/anomalies/{id}/intelligence)
class AnomalyIntelligenceResponse(BaseModel):
    event: AnomalyResponse
    spatial: dict[str, Any]
    thermal: dict[str, Any]
    temporal: BaselineAnalysis
    classification: ClassificationResponse
    risk: RiskResponse
    investigation: InvestigationResponse
    audit_logs: list[dict[str, Any]]
    source_metadata: dict[str, Any]

# System & Data Health
class DataSourceResponse(BaseModel):
    source_name: str
    status: str
    record_count: int
    last_sync: datetime
    latency_ms: int
    message: str

class SystemHealthResponse(BaseModel):
    system_mode: str
    status: str
    timestamp: datetime
    sources: list[DataSourceResponse]
    active_anomalies: int
    industrial_assets: int
    critical_alerts: int

# Analytics Models
class AnalyticsSummaryResponse(BaseModel):
    total_anomalies: int
    industrial_events_count: int
    high_risk_count: int
    persistent_sources_count: int
    new_events_24h: int
    avg_confidence: float
    by_classification: dict[str, int]
    by_severity: dict[str, int]
    by_region: dict[str, int]
    top_assets_by_risk: list[dict[str, Any]]
    daily_thermal_trends: list[dict[str, Any]]
    industrial_vs_natural_ratio: dict[str, int]

# Scenario Controls
class ScenarioTriggerRequest(BaseModel):
    scenario: str  # "SCENARIO_A", "SCENARIO_B", "SCENARIO_C"

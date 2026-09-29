"""Pydantic schemas for ThermoScope API requests and responses.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class FirePredictionSchema(BaseModel):
    id: Optional[int] = None
    fire_detection_id: str
    predicted_class: str
    confidence: float
    risk_score: float
    severity: str
    model_version: str
    class_probabilities: Dict[str, float] = {}
    nearby_industrial_name: Optional[str] = None
    nearby_industrial_type: Optional[str] = None
    distance_to_industrial_km: Optional[float] = None
    nearby_residential_name: Optional[str] = None
    distance_to_residential_km: Optional[float] = None
    recommended_response: Optional[str] = None
    predicted_at: Optional[str] = None


class FireDetectionSchema(BaseModel):
    id: str
    source: str
    sensor: str
    latitude: float
    longitude: float
    detection_time: str
    brightness_temperature: float
    frp: Optional[float] = 0.0
    confidence: float
    day_night: str
    satellite: str
    instrument: str
    is_demo_fallback: bool = False
    created_at: Optional[str] = None
    prediction: Optional[FirePredictionSchema] = None


class FireListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[FireDetectionSchema]


class IndustrialSiteSchema(BaseModel):
    id: str
    name: str
    type: str
    latitude: float
    longitude: float
    source: str
    risk_category: str
    description: Optional[str] = None
    distance_km: Optional[float] = None


class ResidentialAreaSchema(BaseModel):
    id: str
    name: str
    latitude: float
    longitude: float
    building_count: int
    population_estimate: int
    danger_radius_km: float
    distance_km: Optional[float] = None


class AlertSchema(BaseModel):
    id: str
    fire_detection_id: str
    alert_type: str
    severity: str
    title: str
    message: str
    facility_name: Optional[str] = None
    residential_area_name: Optional[str] = None
    distance_to_residence_km: Optional[float] = None
    status: str
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[str] = None
    resolved_at: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: Optional[str] = None


class AlertAcknowledgeRequest(BaseModel):
    user_name: str = "Authorized Analyst"


class AlertResolveRequest(BaseModel):
    user_name: str = "Incident Commander"
    notes: str = "Verified on-site conditions. Flare returned to normal operational limits."


class SubscriptionCreateRequest(BaseModel):
    user_email: str
    area_name: str = "Monitored Industrial Corridor"
    latitude: float
    longitude: float
    radius_km: float = 5.0
    email_enabled: bool = True
    browser_enabled: bool = True
    sms_enabled: bool = False


class SubscriptionSchema(BaseModel):
    id: int
    user_email: str
    area_name: str
    latitude: float
    longitude: float
    radius_km: float
    email_enabled: bool
    browser_enabled: bool
    sms_enabled: bool
    created_at: Optional[str] = None


class DashboardStatsResponse(BaseModel):
    active_fires_count: int
    industrial_fires_count: int
    high_risk_count: int
    critical_alerts_count: int
    active_alerts_count: int = 0
    total_detections: int
    trend_percentage_24h: float
    class_distribution: Dict[str, int]
    severity_distribution: Dict[str, int]
    last_sync_time: Optional[str] = None
    is_live_firms_connected: bool


class AlertCountResponse(BaseModel):
    count: int
    status: Optional[str] = None


class SystemHealthResponse(BaseModel):
    database: Dict[str, Any]
    nasa_firms: Dict[str, Any]
    ml_engine: Dict[str, Any]
    active_alerts_count: int
    total_records_processed: int
    last_ingestion_time: Optional[str] = None
    uptime_status: str = "OPERATIONAL"


class SatelliteContextResponse(BaseModel):
    available: bool
    image_url: Optional[str] = None
    provider: str
    capture_date: Optional[str] = None
    resolution: Optional[str] = None
    disclaimer: str


# ==============================================================================
# Extended Schemas for Feature Expansion
# ==============================================================================

class IncidentSchema(BaseModel):
    id: str
    title: str
    status: str
    severity: str
    first_detected_at: Optional[str] = None
    last_detected_at: Optional[str] = None
    detection_count: int
    latitude: float
    longitude: float
    radius_km: float = 1.0
    max_frp: float = 0.0
    avg_frp: float = 0.0
    primary_class: str
    nearby_facility_name: Optional[str] = None
    nearby_facility_id: Optional[str] = None
    distance_to_facility_km: Optional[float] = None
    assigned_to: Optional[str] = None
    assigned_at: Optional[str] = None
    closed_at: Optional[str] = None
    summary: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    detections: Optional[List[FireDetectionSchema]] = None


class IncidentListResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[IncidentSchema]


class IncidentStatusUpdateRequest(BaseModel):
    status: str  # NEW, INVESTIGATING, CONFIRMED, CONTAINED, CLOSED
    notes: Optional[str] = None


class IncidentAssignRequest(BaseModel):
    assigned_to: str
    user_name: Optional[str] = None


class AnalystReviewCreateRequest(BaseModel):
    decision: str  # CONFIRMED, FALSE_POSITIVE, INCORRECT_CLASSIFICATION, UNKNOWN
    corrected_class: Optional[str] = None
    analyst_id: str = "analyst_1"
    analyst_name: str = "Authorized Analyst"
    notes: Optional[str] = None


class AnalystReviewSchema(BaseModel):
    id: int
    fire_detection_id: str
    incident_id: Optional[str] = None
    decision: str
    corrected_class: Optional[str] = None
    analyst_id: str
    analyst_name: str
    notes: Optional[str] = None
    reviewed_at: Optional[str] = None


class WeatherContextResponse(BaseModel):
    latitude: float
    longitude: float
    temperature: Optional[float] = None          # Celsius
    relative_humidity: Optional[float] = None    # %
    wind_speed: Optional[float] = None           # km/h
    wind_direction: Optional[float] = None       # degrees (0-360)
    wind_direction_cardinal: Optional[str] = None # N, NE, E, SE, S, SW, W, NW
    precipitation: Optional[float] = None        # mm
    weather_source: str
    fetched_at: Optional[str] = None
    cached: bool = False


class TrajectoryPoint(BaseModel):
    fire_id: str
    detection_time: str
    latitude: float
    longitude: float
    frp: float
    distance_from_prev_km: float = 0.0
    bearing_degrees: Optional[float] = None
    bearing_cardinal: Optional[str] = None
    speed_kmh: Optional[float] = None


class IncidentTrajectoryResponse(BaseModel):
    incident_id: str
    observation_count: int
    total_displacement_km: float
    net_distance_km: float
    net_bearing_degrees: Optional[float] = None
    net_bearing_cardinal: Optional[str] = None
    average_speed_kmh: float
    movement_trend: str  # STATIONARY, LINEAR_EXPANSION, CLUSTERED, SCATTERED
    observed_movement_summary: str
    points: List[TrajectoryPoint]
    wind_correlation: Optional[Dict[str, Any]] = None


class HotspotSchema(BaseModel):
    hotspot_id: str
    center_latitude: float
    center_longitude: float
    detection_count: int
    active_days: int
    average_frp: float
    median_frp: float
    max_frp: float
    persistence_score: float
    window_days: int
    nearby_facility: Optional[str] = None
    dominant_class: str


class RiskExplanationItem(BaseModel):
    factor: str
    score: float
    weight: float
    evidence: str
    level: str  # NORMAL, ELEVATED, CRITICAL


class RiskExplanationResponse(BaseModel):
    fire_id: str
    risk_score: float
    severity: str
    summary_headline: str
    explanations: List[RiskExplanationItem]
    recommendation: str


class ImpactExposureItem(BaseModel):
    name: str
    category: str  # INDUSTRIAL, RESIDENTIAL, INFRASTRUCTURE
    type: str
    distance_km: float
    danger_tier: str  # CRITICAL, HIGH, MEDIUM, LOW, SAFE
    details: Dict[str, Any] = {}


class ImpactAnalysisResponse(BaseModel):
    fire_id: str
    latitude: float
    longitude: float
    danger_zone: str
    population_exposure_estimate: Optional[int] = None
    population_source: str
    facilities_at_risk_count: int
    residential_settlements_at_risk_count: int
    critical_infrastructure_count: int
    impact_items: List[ImpactExposureItem]
    exposure_summary: str


class FacilityRiskProfileResponse(BaseModel):
    facility_id: str
    facility_name: str
    facility_type: str
    latitude: float
    longitude: float
    risk_category: str
    current_risk_score: float
    current_status: str  # NORMAL, ELEVATED_OBSERVATION, ACTIVE_INCIDENT_NEARBY, CRITICAL_ALERT
    risk_trend: str       # STABLE, INCREASING, DECREASING
    detections_24h: int
    detections_7d: int
    detections_30d: int
    detections_90d: int
    max_nearby_frp_30d: float
    avg_nearby_frp_30d: float
    nearest_active_fire_km: Optional[float] = None
    nearest_active_fire_id: Optional[str] = None
    persistence_score: float
    is_anomaly_detected: bool
    anomaly_magnitude: Optional[float] = None
    recurring_pattern: Optional[str] = None


class WhatIfSimulationRequest(BaseModel):
    base_fire_id: Optional[str] = None
    brightness_temp: Optional[float] = None
    frp: Optional[float] = None
    confidence: Optional[float] = None
    distance_to_industrial_km: Optional[float] = None
    distance_to_residential_km: Optional[float] = None
    persistence_score: Optional[float] = None
    predicted_class: Optional[str] = None
    frp_multiplier: Optional[float] = 1.0
    additional_detections_count: Optional[int] = 0
    wind_speed_kmh: Optional[float] = 0.0
    persistence_multiplier: Optional[float] = 1.0


class WhatIfSimulationResponse(BaseModel):
    is_simulation: bool = True
    disclaimer: str = "SIMULATION ONLY — THIS IS NOT A REAL SATELLITE OBSERVATION"
    simulated_risk_score: float
    simulated_severity: str
    recommended_response: str
    risk_delta_vs_baseline: Optional[float] = None
    input_parameters: Dict[str, Any]


class WatchlistCreateRequest(BaseModel):
    facility_id: str
    user_email: str = "analyst@thermoscope.gov.in"
    notes: Optional[str] = None


class WatchlistSchema(BaseModel):
    id: int
    facility_id: str
    user_email: str
    notes: Optional[str] = None
    created_at: Optional[str] = None
    facility: Optional[IndustrialSiteSchema] = None
    latest_activity: Optional[Dict[str, Any]] = None


class InvestigationQueryRequest(BaseModel):
    query: str


class InvestigationQueryResponse(BaseModel):
    query: str
    intent: str
    structured_findings: Dict[str, Any]
    direct_answer: str
    supporting_entities: List[Dict[str, Any]]
    evidence_sources: List[str]


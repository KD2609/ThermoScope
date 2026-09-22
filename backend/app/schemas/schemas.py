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
    total_detections: int
    trend_percentage_24h: float
    class_distribution: Dict[str, int]
    severity_distribution: Dict[str, int]
    last_sync_time: Optional[str] = None
    is_live_firms_connected: bool


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

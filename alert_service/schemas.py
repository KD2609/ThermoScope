from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from enum import Enum

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatus(str, Enum):
    NEW = "NEW"
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"

class EvidenceItem(BaseModel):
    factor: str
    value: Any
    message: str

class RiskResult(BaseModel):
    risk_score: float = Field(ge=0.0, le=100.0)
    risk_level: RiskLevel
    reasons: List[str]
    evidence: List[EvidenceItem]

class AlertPayload(BaseModel):
    alert_id: str
    detection_id: str
    timestamp: str
    
    latitude: float
    longitude: float
    
    classification: str
    confidence: float
    
    risk_score: float
    risk_level: RiskLevel
    
    reasons: List[str]
    evidence: List[EvidenceItem]
    
    model_version: str
    status: AlertStatus = AlertStatus.NEW

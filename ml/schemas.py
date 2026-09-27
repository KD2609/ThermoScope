from pydantic import BaseModel
from typing import Dict, Optional, Any

class PredictionResult(BaseModel):
    detection_id: Optional[str] = None
    predicted_class: str
    confidence: float
    probabilities: Optional[Dict[str, float]] = None
    model_version: str
    prediction_timestamp: str

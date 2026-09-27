import uuid
import logging
from abc import ABC, abstractmethod
from typing import Dict, Any, List

from ml.inference import ThermalClassifier
from .schemas import AlertPayload, AlertStatus
from .risk_engine import RiskEngine
from .alert_rules import AlertRulesEngine
from .deduplication import DeduplicationEngine

logger = logging.getLogger(__name__)

class AlertDispatcher(ABC):
    """Abstract interface for dispatching alerts."""
    @abstractmethod
    def dispatch(self, alert: AlertPayload) -> None:
        pass

class LogDispatcher(AlertDispatcher):
    """Local dispatcher that logs alerts."""
    def dispatch(self, alert: AlertPayload) -> None:
        logger.info(f"[DISPATCH] Alert {alert.alert_id} dispatched: {alert.classification} (Risk: {alert.risk_level.value})")

class PipelineOrchestrator:
    """End-to-End Orchestrator for ML inference, risk, deduplication, and dispatch."""
    
    def __init__(self, classifier: ThermalClassifier, dispatchers: List[AlertDispatcher] = None):
        self.classifier = classifier
        self.dedup_engine = DeduplicationEngine()
        self.dispatchers = dispatchers or [LogDispatcher()]
        
    def process_detection(self, raw_detection: Dict[str, Any]) -> AlertPayload:
        """Process a raw detection through the full pipeline."""
        det_id = raw_detection.get("observation_id", raw_detection.get("detection_id", "unknown"))
        lat = raw_detection.get("latitude")
        lon = raw_detection.get("longitude")
        
        if lat is None or lon is None:
            logger.error(f"Missing coordinates for detection {det_id}")
            raise ValueError("Latitude and longitude are required.")
            
        # 1. Prediction
        try:
            prediction = self.classifier.predict(raw_detection)
            logger.info(f"[INFO] Detection {det_id} classified as {prediction.predicted_class} ({prediction.confidence:.2f})")
        except Exception as e:
            logger.error(f"Prediction failed for detection {det_id}: {e}")
            raise
            
        # 2. Risk Calculation
        try:
            risk = RiskEngine.evaluate(raw_detection, prediction.confidence, prediction.predicted_class)
            logger.info(f"[INFO] Risk score: {risk.risk_score} ({risk.risk_level.value})")
        except Exception as e:
            logger.error(f"Risk calculation failed for detection {det_id}: {e}")
            raise
            
        # 3. Alert Rules
        if not AlertRulesEngine.should_alert(risk):
            logger.info(f"[INFO] Alert suppressed by rules for {det_id} (Level: {risk.risk_level.value})")
            return None
            
        # 4. Deduplication
        timestamp = raw_detection.get("acq_date_time", prediction.prediction_timestamp)
        existing_alert_id = self.dedup_engine.check_duplicate(lat, lon, timestamp, prediction.predicted_class)
        
        if existing_alert_id:
            logger.info(f"[INFO] Duplicate alert suppressed for event {existing_alert_id}")
            return None
            
        # 5. Alert Creation
        alert_id = f"ALT_{uuid.uuid4().hex[:8].upper()}"
        
        alert = AlertPayload(
            alert_id=alert_id,
            detection_id=det_id,
            timestamp=timestamp,
            latitude=lat,
            longitude=lon,
            classification=prediction.predicted_class,
            confidence=prediction.confidence,
            risk_score=risk.risk_score,
            risk_level=risk.risk_level,
            reasons=risk.reasons,
            evidence=risk.evidence,
            model_version=prediction.model_version,
            status=AlertStatus.NEW
        )
        
        # Register for future dedup
        self.dedup_engine.register_event(alert_id, lat, lon, timestamp, prediction.predicted_class)
        
        # 6. Dispatch
        logger.info(f"[INFO] Alert {alert_id} created")
        for dispatcher in self.dispatchers:
            try:
                dispatcher.dispatch(alert)
            except Exception as e:
                logger.error(f"Dispatcher {dispatcher.__class__.__name__} failed: {e}")
                
        return alert

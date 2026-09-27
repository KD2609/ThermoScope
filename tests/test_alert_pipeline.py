import unittest
from datetime import datetime, timezone
import pandas as pd
from typing import Dict, Any

from ml.inference import ThermalClassifier
from alert_service.schemas import RiskResult, RiskLevel, AlertPayload, AlertStatus
from alert_service.risk_engine import RiskEngine
from alert_service.evidence_engine import EvidenceEngine
from alert_service.alert_rules import AlertRulesEngine
from alert_service.deduplication import DeduplicationEngine
from alert_service.dispatcher import PipelineOrchestrator, LogDispatcher

class TestAlertPipeline(unittest.TestCase):

    def setUp(self):
        # We use model_version="v2" for tests since it's the latest available model
        self.classifier = ThermalClassifier(model_version="v2")
        self.det = {
            "observation_id": "TEST_1",
            "latitude": 20.0,
            "longitude": 70.0,
            "acq_date_time": "2026-09-23T12:00:00Z",
            "frp": 150.0,
            "distance_to_residential_area": 1.0,
            "distance_to_industrial_site": 10.0,
            "persistence_score": 0.0,
            "fire_cluster_density": 0.0
        }

    # 1, 2, 3: Feature preparation, model loading, prediction output
    def test_inference_and_prediction(self):
        result = self.classifier.predict(self.det)
        self.assertEqual(result.detection_id, "TEST_1")
        self.assertIsNotNone(result.predicted_class)
        self.assertTrue(0.0 <= result.confidence <= 1.0)
        self.assertIsInstance(result.probabilities, dict)

    # 4, 5: Risk score boundaries and risk levels
    def test_risk_score_boundaries(self):
        risk = RiskEngine.evaluate(self.det, 1.0, "Wildfire / Natural Fire")
        self.assertTrue(0.0 <= risk.risk_score <= 100.0)
        self.assertIsInstance(risk.risk_level, RiskLevel)
        
        # Test extreme boundaries (clamping)
        extreme_det = self.det.copy()
        extreme_det["frp"] = 1000.0
        extreme_det["distance_to_residential_area"] = 0.1
        extreme_det["distance_to_industrial_site"] = 0.1
        extreme_det["persistence_score"] = 1.0
        risk_extreme = RiskEngine.evaluate(extreme_det, 1.0, "Wildfire / Natural Fire")
        self.assertEqual(risk_extreme.risk_score, 100.0) # Should be capped at 100
        self.assertEqual(risk_extreme.risk_level, RiskLevel.CRITICAL)

        low_det = self.det.copy()
        low_det["frp"] = 0.0
        low_det["distance_to_residential_area"] = 100.0
        risk_low = RiskEngine.evaluate(low_det, 0.1, "Other / Uncertain")
        self.assertTrue(risk_low.risk_score < 25.0)
        self.assertEqual(risk_low.risk_level, RiskLevel.LOW)

    # 6. Evidence generation
    def test_evidence_generation(self):
        evidence = EvidenceEngine.generate_evidence(self.det, 0.95, "Wildfire / Natural Fire")
        factors = [e.factor for e in evidence]
        self.assertIn("ml_confidence", factors)
        self.assertIn("frp", factors)
        self.assertIn("residential_distance", factors)
        
    # 7. Alert rules
    def test_alert_rules(self):
        # High and Critical should alert
        self.assertTrue(AlertRulesEngine.should_alert(RiskResult(risk_score=90, risk_level=RiskLevel.CRITICAL, reasons=[], evidence=[])))
        self.assertTrue(AlertRulesEngine.should_alert(RiskResult(risk_score=60, risk_level=RiskLevel.HIGH, reasons=[], evidence=[])))
        # Low and Medium should not
        self.assertFalse(AlertRulesEngine.should_alert(RiskResult(risk_score=40, risk_level=RiskLevel.MEDIUM, reasons=[], evidence=[])))
        self.assertFalse(AlertRulesEngine.should_alert(RiskResult(risk_score=10, risk_level=RiskLevel.LOW, reasons=[], evidence=[])))

    # 8. Duplicate detection
    def test_deduplication(self):
        dedup = DeduplicationEngine(spatial_threshold_km=3.0, temporal_threshold_hours=12.0)
        
        # First event
        dup_id = dedup.check_duplicate(20.0, 70.0, "2026-09-23T12:00:00Z", "Wildfire")
        self.assertIsNone(dup_id)
        dedup.register_event("ALT_1", 20.0, 70.0, "2026-09-23T12:00:00Z", "Wildfire")
        
        # Duplicate event (close in space and time)
        dup_id = dedup.check_duplicate(20.001, 70.001, "2026-09-23T12:15:00Z", "Wildfire")
        self.assertEqual(dup_id, "ALT_1")
        
        # Different class (not a duplicate)
        dup_id = dedup.check_duplicate(20.001, 70.001, "2026-09-23T12:15:00Z", "Gas Flare")
        self.assertIsNone(dup_id)
        
        # Far in space (not a duplicate)
        dup_id = dedup.check_duplicate(21.0, 70.0, "2026-09-23T12:15:00Z", "Wildfire")
        self.assertIsNone(dup_id)

    # 9, 10: Complete pipeline and Alert lifecycle
    def test_complete_pipeline(self):
        orchestrator = PipelineOrchestrator(classifier=self.classifier, dispatchers=[])
        
        # Ensure the test detection produces a high enough score to trigger an alert
        det = self.det.copy()
        det["frp"] = 200.0 # High FRP to boost score
        det["distance_to_residential_area"] = 0.5
        
        alert = orchestrator.process_detection(det)
        self.assertIsNotNone(alert)
        self.assertEqual(alert.status, AlertStatus.NEW)
        
        # Duplicate should be suppressed
        det2 = det.copy()
        det2["observation_id"] = "TEST_2"
        alert2 = orchestrator.process_detection(det2)
        self.assertIsNone(alert2)

if __name__ == "__main__":
    unittest.main()

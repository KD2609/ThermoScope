"""
Unit tests for ThermoScope AI Risk Engine & Anti-Double-Counting Architecture:
1. Base weights sum to 1.0 (+/- 1e-6) for every class.
2. Second-stage contextual adjustments are explicit and configurable.
3. Final risk score is strictly bounded within [5.0, 100.0].
4. Deduplication engine properly consolidates nearby/recent events.
5. Calibrated classifier pipeline loads without data leakage.
"""

import pytest
from app.config import settings
from app.services.risk import calculate_risk
from app.services.classification import CLASSES, HybridClassifier
from app.services.alerts_engine import evaluate_alert_decision
from datetime import datetime, timedelta

def test_class_aware_risk_weights_sum_to_one():
    """Verify that every single class in CLASS_AWARE_RISK_WEIGHTS sums to 1.0."""
    for class_name, weights in settings.CLASS_AWARE_RISK_WEIGHTS.items():
        weight_sum = sum(weights.values())
        assert abs(weight_sum - 1.0) < 1e-6, (
            f"Weights for '{class_name}' sum to {weight_sum}, expected exactly 1.0"
        )
        assert len(weights) == 6, f"Expected 6 components for '{class_name}', got {len(weights)}"
        for comp, val in weights.items():
            assert val >= 0.0, f"Negative weight {comp}={val} in '{class_name}'"


def test_two_stage_risk_scoring_bounds():
    """Verify that final risk scores are bounded strictly within [5.0, 100.0]."""
    test_features_low = {
        "frp": 1.0,
        "distance_to_nearest_asset_m": 50000.0,
        "is_inside_boundary": 0,
        "baseline_deviation_percent": -80.0,
        "count_7d": 1,
        "asset_criticality": "LOW",
        "has_sufficient_history": True
    }
    res_low = calculate_risk(test_features_low, {"predicted_class": "Agricultural / Biomass Burn", "confidence_score": 0.50})
    assert res_low["risk_score"] >= 5.0
    assert res_low["risk_level"] == "LOW"

    test_features_high = {
        "frp": 350.0,
        "distance_to_nearest_asset_m": 10.0,
        "is_inside_boundary": 1,
        "baseline_deviation_percent": 250.0,
        "count_7d": 7,
        "asset_criticality": "CRITICAL",
        "has_sufficient_history": True
    }
    res_high = calculate_risk(test_features_high, {"predicted_class": "Potential Industrial Fire", "confidence_score": 0.99})
    assert res_high["risk_score"] <= 100.0
    assert res_high["risk_level"] == "CRITICAL"


def test_explicit_context_adjustments():
    """Verify that Stage 2 context multipliers are explicit and non-hidden."""
    features = {
        "frp": 50.0,
        "distance_to_nearest_asset_m": 200.0,
        "is_inside_boundary": 1,
        "baseline_deviation_percent": 10.0,
        "count_7d": 3,
        "asset_criticality": "HIGH",
        "has_sufficient_history": True
    }
    res = calculate_risk(features, {"predicted_class": "Potential Industrial Fire", "confidence_score": 0.85})
    assert "base_risk" in res
    assert "context_multiplier" in res
    assert res["context_multiplier"] == settings.RISK_CONTEXT_ADJUSTMENTS["Potential Industrial Fire"]


def test_alert_deduplication():
    """Verify context-aware alert consolidation within 3,000m and 6h."""
    class MockAnomaly:
        latitude = 22.3685
        longitude = 69.8392
        frp = 120.0
        satellite = "VIIRS-NOAA21"
        timestamp = datetime.utcnow()

    class MockAlert:
        id = 1
        alert_id = "ALT-TEST-0001"
        severity = "HIGH"
        title = "Existing Alert"
        message = "Initial anomaly"
        facility_name = "Jamnagar Mega Refinery Complex"
        status = "NEW"
        created_at = datetime.utcnow() - timedelta(hours=1)
        anomaly = MockAnomaly()

    new_anomaly = MockAnomaly()
    new_anomaly.frp = 150.0
    features = {
        "nearest_asset_name": "Jamnagar Mega Refinery Complex",
        "nearest_asset_id": "ASSET-JAMNAGAR-01",
        "is_inside_boundary": 1,
        "distance_to_nearest_asset_m": 150.0,
        "baseline_deviation_percent": 80.0
    }
    clf = {"predicted_class": "Potential Industrial Fire", "confidence_score": 0.92}
    risk = {"risk_score": 85.0, "risk_level": "CRITICAL"}

    decision = evaluate_alert_decision(new_anomaly, features, clf, risk, [MockAlert()])
    assert decision["action"] == "CONSOLIDATE"
    assert decision["consolidated_with_alert_id"] == "ALT-TEST-0001"
    assert decision["severity"] == "CRITICAL"


def test_calibrated_classifier_output():
    """Verify that HybridClassifier returns calibrated probabilities and honest factors."""
    clf = HybridClassifier()
    features = {
        "frp": 145.0,
        "distance_to_nearest_asset_m": 120.0,
        "is_inside_boundary": 1,
        "baseline_deviation_percent": 85.0,
        "land_context": "Industrial / Heavy Infrastructure",
        "asset_category": "Refinery",
        "count_7d": 2,
        "daynight": "N",
        "has_sufficient_history": True
    }
    out = clf.classify(features)
    assert out["predicted_class"] == "Potential Industrial Fire"
    assert "calibrated_model_probability" in out
    assert "confidence_score" in out
    assert len(out["supporting_evidence"]) > 0
    assert len(out["uncertainty_factors"]) > 0
    assert "feature_contributions" in out

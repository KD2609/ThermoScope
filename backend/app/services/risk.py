"""
ThermoScope AI - Two-Stage Class-Aware Risk Scoring Engine
==========================================================
Scientifically defensible, transparent two-stage hazard and consequence risk scoring.

Stage 1: Six-Component Base Risk (0 - 100)
    BaseRisk = sum_{i=1}^{6} (w_{c, i} * Component_i)
    Strict Guarantee: sum(w_{c, i}) == 1.0 for every class c.
    Components:
      - intensity_component: Radiometric heat / FRP (0-100)
      - proximity_component: Facility boundary containment / spatial proximity (0-100)
      - abnormality_component: Deviation from verified historical baseline (0-100)
      - persistence_component: Multi-temporal 7-day recurrence (0-100)
      - criticality_component: Asset consequence tier (0-100)
      - confidence_component: Operational classification confidence (0-100)

Stage 2: Explicit, Configurable Contextual Adjustment & Bounding
    FinalRisk = min(100.0, max(5.0, BaseRisk * M_context * M_uncertainty))
    Strict Guarantee: No hidden multipliers. Both BaseRisk and M_context are exposed.
"""

from typing import Any, Dict, Optional
from app.config import settings


def calculate_risk(
    features: dict[str, Any],
    classification: dict[str, Any],
    custom_weights: Optional[dict[str, float]] = None
) -> dict[str, Any]:
    """
    Calculate transparent, class-aware two-stage risk score and investigation priority.
    """
    predicted_class = classification.get("predicted_class", "Unknown Thermal Anomaly")
    
    # Select class-aware weights or normalize custom weights
    if custom_weights:
        total_w = sum(custom_weights.values())
        if total_w > 0 and abs(total_w - 1.0) > 1e-6:
            weights = {k: v / total_w for k, v in custom_weights.items()}
        else:
            weights = custom_weights
    else:
        weights = settings.CLASS_AWARE_RISK_WEIGHTS.get(
            predicted_class,
            settings.RISK_WEIGHTS
        )

    # Enforce strict sum-to-1.0 mathematical invariant
    assert abs(sum(weights.values()) - 1.0) < 1e-6, (
        f"Risk weights for class '{predicted_class}' must sum to 1.0, got {sum(weights.values())}"
    )

    frp = float(features.get("frp", 20.0))
    dist_m = float(features.get("distance_to_nearest_asset_m", 5000.0))
    is_inside = bool(features.get("is_inside_boundary", False))
    dev = features.get("baseline_deviation_percent")
    if dev is None:
        dev = features.get("baseline_deviation_val", 0.0)
    dev = float(dev or 0.0)
    count_7d = int(features.get("count_7d", 1))
    criticality_str = str(features.get("asset_criticality", "LOW")).upper()
    conf = float(classification.get("confidence_score", 0.70))

    # =========================================================================
    # STAGE 1: Six Base Components (Each normalized to 0 - 100)
    # =========================================================================
    
    # 1. Thermal Intensity Component (0 - 100)
    # 15 MW -> ~10, 80 MW -> ~50, 180+ MW -> 100
    intensity_comp = min(100.0, max(5.0, (frp / 180.0) * 100.0))

    # 2. Industrial Proximity Component (0 - 100)
    if is_inside:
        proximity_comp = 100.0
    else:
        proximity_comp = max(0.0, (1.0 - (dist_m / 4000.0)) * 100.0)

    # 3. Abnormality Component (0 - 100)
    if features.get("has_sufficient_history"):
        if dev > 0:
            abnormality_comp = min(100.0, (dev / 120.0) * 100.0)
        else:
            abnormality_comp = 10.0  # Routine or below historical median
    else:
        abnormality_comp = 35.0  # Neutral prior when historical baseline unverified

    # 4. Persistence Component (0 - 100)
    persistence_comp = min(100.0, (count_7d / 4.0) * 100.0)

    # 5. Asset Criticality Component (0 - 100)
    crit_map = {"CRITICAL": 100.0, "HIGH": 75.0, "MEDIUM": 50.0, "LOW": 25.0}
    criticality_comp = crit_map.get(criticality_str, 25.0)

    # 6. Confidence Component (0 - 100)
    confidence_comp = min(100.0, max(0.0, conf * 100.0))

    # Compute Stage 1 Base Risk
    base_risk = (
        weights["intensity"] * intensity_comp +
        weights["proximity"] * proximity_comp +
        weights["abnormality"] * abnormality_comp +
        weights["persistence"] * persistence_comp +
        weights["criticality"] * criticality_comp +
        weights["confidence"] * confidence_comp
    )

    # =========================================================================
    # STAGE 2: Explicit Contextual Adjustments & Bounding
    # =========================================================================
    context_multiplier = float(settings.RISK_CONTEXT_ADJUSTMENTS.get(predicted_class, 1.0))
    
    # Specific physical condition adjustments
    if predicted_class == "Gas Flare / Combustion Source" and abnormality_comp < 30.0:
        context_multiplier = min(context_multiplier, 0.55)

    uncertainty_multiplier = 1.0
    if not features.get("has_sufficient_history") and dist_m > 3000.0:
        uncertainty_multiplier = 0.95

    raw_score = base_risk * context_multiplier * uncertainty_multiplier
    final_risk = round(min(100.0, max(5.0, raw_score)), 1)

    # Risk Levels and Investigation Priority Tiers
    if final_risk >= 75.0:
        risk_level = "CRITICAL"
        priority = "CRITICAL"
    elif final_risk >= 50.0:
        risk_level = "HIGH"
        priority = "HIGH"
    elif final_risk >= 30.0:
        risk_level = "MEDIUM"
        priority = "MEDIUM"
    else:
        risk_level = "LOW"
        priority = "LOW"

    return {
        "risk_score": final_risk,
        "risk_level": risk_level,
        "investigation_priority": priority,
        "base_risk": round(base_risk, 1),
        "context_multiplier": round(context_multiplier, 2),
        "uncertainty_multiplier": round(uncertainty_multiplier, 2),
        "components": {
            "intensity": round(intensity_comp, 1),
            "proximity": round(proximity_comp, 1),
            "abnormality": round(abnormality_comp, 1),
            "persistence": round(persistence_comp, 1),
            "criticality": round(criticality_comp, 1),
            "confidence": round(confidence_comp, 1)
        },
        "formula_weights": weights,
        "stage": "Two-Stage Class-Aware Scoring"
    }

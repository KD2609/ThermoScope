from typing import Any
from app.config import settings

def calculate_risk(
    features: dict[str, Any],
    classification: dict[str, Any],
    custom_weights: dict[str, float] = None
) -> dict[str, Any]:
    """
    Transparent Multi-Factor Risk & Investigation Priority Engine.
    Risk Score normalized to 0 - 100.
    """
    weights = custom_weights or settings.RISK_WEIGHTS

    frp = features.get("frp", 20.0)
    dist_m = features.get("distance_to_nearest_asset_m", 5000.0)
    is_inside = features.get("is_inside_boundary", 0)
    dev = features.get("baseline_deviation_percent") or 0.0
    count_7d = features.get("count_7d", 1)
    criticality_str = features.get("asset_criticality", "LOW")
    conf = classification.get("confidence_score", 0.70)
    predicted_class = classification.get("predicted_class", "")

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
            abnormality_comp = 10.0  # Routine or below median
    else:
        abnormality_comp = 35.0  # Moderate default when baseline unverified

    # 4. Persistence Component (0 - 100)
    persistence_comp = min(100.0, (count_7d / 4.0) * 100.0)

    # 5. Asset Criticality Component (0 - 100)
    crit_map = {"CRITICAL": 100.0, "HIGH": 75.0, "MEDIUM": 50.0, "LOW": 25.0}
    criticality_comp = crit_map.get(criticality_str, 30.0)

    # 6. Confidence Component (0 - 100)
    confidence_comp = conf * 100.0

    # Agricultural / Biomass burns that are far from industry get downward risk adjustment
    risk_suppression = 1.0
    if predicted_class == "Agricultural / Biomass Burn":
        risk_suppression = 0.45
    elif predicted_class == "Routine / Persistent Industrial Thermal Source":
        risk_suppression = 0.60
    elif predicted_class == "Gas Flare / Combustion Source" and abnormality_comp < 30.0:
        risk_suppression = 0.55

    raw_score = (
        weights["intensity"] * intensity_comp +
        weights["proximity"] * proximity_comp +
        weights["abnormality"] * abnormality_comp +
        weights["persistence"] * persistence_comp +
        weights["criticality"] * criticality_comp +
        weights["confidence"] * confidence_comp
    ) * risk_suppression

    risk_score = round(min(100.0, max(5.0, raw_score)), 1)

    # Tiers
    if risk_score >= 75.0:
        risk_level = "CRITICAL"
        priority = "CRITICAL"
    elif risk_score >= 50.0:
        risk_level = "HIGH"
        priority = "HIGH"
    elif risk_score >= 30.0:
        risk_level = "MEDIUM"
        priority = "MEDIUM"
    else:
        risk_level = "LOW"
        priority = "LOW"

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "investigation_priority": priority,
        "components": {
            "intensity": round(intensity_comp, 1),
            "proximity": round(proximity_comp, 1),
            "abnormality": round(abnormality_comp, 1),
            "persistence": round(persistence_comp, 1),
            "criticality": round(criticality_comp, 1),
            "confidence": round(confidence_comp, 1)
        },
        "formula_weights": weights
    }

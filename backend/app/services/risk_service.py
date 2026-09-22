"""Risk calculation and response recommendation service.
Combines thermal intensity, industrial asset criticality, residential proximity,
and AI classification into a normalized 0-100 risk score and categorical severity.
"""

from typing import Dict, Any, Optional
from backend.app.config import settings


def calculate_risk_and_response(
    brightness_temp: float,
    frp: float,
    confidence: float,
    predicted_class: str,
    distance_to_industrial_km: Optional[float],
    industrial_site_type: Optional[str],
    distance_to_residential_km: Optional[float]
) -> Dict[str, Any]:
    """Compute multi-factor risk assessment and response recommendation."""
    # 1. Thermal Intensity Component (0 - 100)
    # Brightness temp normal range 300K - 500K
    bt_norm = max(0.0, min(100.0, (brightness_temp - 300.0) / 1.5))
    # FRP normal range 0 - 500 MW
    frp_norm = max(0.0, min(100.0, (frp / 5.0)))
    intensity_score = 0.5 * bt_norm + 0.5 * frp_norm

    # 2. Industrial Proximity Component (0 - 100)
    if distance_to_industrial_km is not None:
        if distance_to_industrial_km <= 1.0:
            ind_prox_score = 100.0
        elif distance_to_industrial_km <= 3.0:
            ind_prox_score = 80.0
        elif distance_to_industrial_km <= 5.0:
            ind_prox_score = 50.0
        elif distance_to_industrial_km <= 10.0:
            ind_prox_score = 25.0
        else:
            ind_prox_score = 5.0
    else:
        ind_prox_score = 0.0

    # Multiplier based on industrial asset type
    type_multipliers = {
        "refinery": 1.2,
        "petrochemical": 1.25,
        "chemical_facility": 1.2,
        "power_plant": 1.0,
        "steel_plant": 1.0,
        "mining": 0.8
    }
    ind_mult = type_multipliers.get(str(industrial_site_type).lower(), 1.0)
    ind_score = min(100.0, ind_prox_score * ind_mult)

    # 3. Residential Proximity Component (0 - 100)
    if distance_to_residential_km is not None:
        if distance_to_residential_km <= 1.0:
            res_score = 100.0
        elif distance_to_residential_km <= 2.0:
            res_score = 80.0
        elif distance_to_residential_km <= 3.0:
            res_score = 55.0
        elif distance_to_residential_km <= 5.0:
            res_score = 30.0
        else:
            res_score = 10.0
    else:
        res_score = 10.0

    # 4. Class-specific weight adjustments
    class_weights = {
        "Industrial Fire": 1.3,
        "Gas Flare / Persistent Thermal Source": 0.65,
        "Mining / Industrial Thermal Activity": 0.75,
        "Wildfire / Natural Fire": 0.9,
        "Agricultural Burn": 0.5,
        "Other / Uncertain": 0.6
    }
    cls_weight = class_weights.get(predicted_class, 1.0)

    # Weighted sum
    w_int = settings.RISK_WEIGHT_INTENSITY
    w_ind = settings.RISK_WEIGHT_INDUSTRIAL_PROXIMITY
    w_res = settings.RISK_WEIGHT_RESIDENTIAL_PROXIMITY
    w_conf = settings.RISK_WEIGHT_CONFIDENCE

    raw_risk = (
        (intensity_score * w_int) +
        (ind_score * w_ind) +
        (res_score * w_res) +
        ((confidence / 100.0 * 100.0) * w_conf)
    ) * cls_weight

    risk_score = round(max(5.0, min(99.0, raw_risk)), 1)

    # Severity categorization
    if risk_score >= 80.0:
        severity = "CRITICAL"
    elif risk_score >= 60.0:
        severity = "HIGH"
    elif risk_score >= 40.0:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    # Actionable Recommended Response Protocol
    if severity == "CRITICAL":
        if "Industrial" in predicted_class:
            recommended_response = (
                "IMMEDIATE DISPATCH: High-priority industrial emergency. Notify plant safety cell, "
                "local district disaster authority, and activate perimeter cooling protocols. "
                "Monitor atmospheric plume direction for adjacent settlements."
            )
        else:
            recommended_response = (
                "URGENT RESPONSE: Critical thermal intensity observed near settlements. "
                "Deploy local fire tenders and establish 1.5 km safety observation perimeter."
            )
    elif severity == "HIGH":
        if "Flare" in predicted_class:
            recommended_response = (
                "OPERATIONAL MONITORING: Elevated flare intensity detected. Verify automated SCADA "
                "telemetry for sudden pressure release or off-gas flaring compliance."
            )
        else:
            recommended_response = (
                "ALERT DISPATCH: High risk thermal anomaly. Field verification recommended. "
                "Verify facility perimeter barriers and confirm no smoke migration toward populated zones."
            )
    elif severity == "MEDIUM":
        recommended_response = (
            "ROUTINE SURVEILLANCE: Moderate thermal anomaly consistent with scheduled industrial "
            "or agricultural activity. Maintain automated satellite tracking on subsequent orbital passes."
        )
    else:
        recommended_response = (
            "PASSIVE LOGGING: Low risk thermal signature. Normal background thermal emissions. "
            "No immediate field intervention required."
        )

    return {
        "risk_score": risk_score,
        "severity": severity,
        "intensity_score": round(intensity_score, 1),
        "industrial_risk_component": round(ind_score, 1),
        "residential_risk_component": round(res_score, 1),
        "recommended_response": recommended_response
    }

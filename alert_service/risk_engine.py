from typing import Dict, Any
from .schemas import RiskResult, RiskLevel
from .evidence_engine import EvidenceEngine

class RiskEngine:
    """Calculates risk score and evaluates evidence based on feature data and ML predictions."""
    
    # Configurable initial operational thresholds (not scientifically validated)
    RISK_CONFIG = {
        "class_base_scores": {
            "Wildfire / Natural Fire": 40.0,
            "Industrial Fire": 50.0,
            "Gas Flare / Persistent Thermal Source": 10.0,
            "Agricultural Burn": 20.0
        },
        "default_class_score": 5.0,
        "frp_high": 100.0,
        "frp_med": 50.0,
        "res_dist_critical": 2.0,
        "res_dist_high": 5.0,
        "persistence_high": 0.5,
        "thresholds": {
            "CRITICAL": 75.0,
            "HIGH": 50.0,
            "MEDIUM": 25.0
        }
    }

    @classmethod
    def evaluate(cls, feature_data: Dict[str, Any], confidence: float, predicted_class: str) -> RiskResult:
        score = 0.0
        
        # 1. Classification type base score
        score += cls.RISK_CONFIG["class_base_scores"].get(predicted_class, cls.RISK_CONFIG["default_class_score"])
        
        # 2. Confidence scaling (scales the base class risk)
        score *= confidence
        
        # 3. FRP (Thermal intensity)
        frp = float(feature_data.get("frp", 0.0))
        if frp > cls.RISK_CONFIG["frp_high"]:
            score += 20.0
        elif frp > cls.RISK_CONFIG["frp_med"]:
            score += 10.0
            
        # 4. Proximity to residential
        res_dist = float(feature_data.get("distance_to_residential_area", 100.0))
        if res_dist < cls.RISK_CONFIG["res_dist_critical"]:
            score += 30.0
        elif res_dist < cls.RISK_CONFIG["res_dist_high"]:
            score += 15.0
            
        # 5. Persistence context (high persistence makes wildfire less likely acute, but industrial more expected)
        persistence = float(feature_data.get("persistence_score", 0.0))
        if predicted_class == "Wildfire / Natural Fire" and persistence > cls.RISK_CONFIG["persistence_high"]:
            # If it's a wildfire but highly persistent, it might be an ongoing event or a false positive
            # Add moderate risk for ongoing event
            score += 15.0
            
        # 6. Industrial context
        ind_dist = float(feature_data.get("distance_to_industrial_site", 100.0))
        if predicted_class == "Wildfire / Natural Fire" and ind_dist < 3.0:
            score += 20.0 # Wildfire threatening industrial site
            
        # Clamp score
        score = min(max(score, 0.0), 100.0)
        
        # Determine level
        if score >= cls.RISK_CONFIG["thresholds"]["CRITICAL"]:
            level = RiskLevel.CRITICAL
        elif score >= cls.RISK_CONFIG["thresholds"]["HIGH"]:
            level = RiskLevel.HIGH
        elif score >= cls.RISK_CONFIG["thresholds"]["MEDIUM"]:
            level = RiskLevel.MEDIUM
        else:
            level = RiskLevel.LOW
            
        # Generate evidence based strictly on features
        evidence = EvidenceEngine.generate_evidence(feature_data, confidence, predicted_class)
        reasons = [ev.message for ev in evidence]
        
        return RiskResult(
            risk_score=round(score, 2),
            risk_level=level,
            reasons=reasons,
            evidence=evidence
        )

"""Risk engine for scoring thermal anomalies based on classification and physical properties."""

from typing import Dict, Any

def calculate_risk(feature_data: Dict[str, Any], prediction: Dict[str, Any]) -> Dict[str, Any]:
    """Calculate a risk score (0-100) and risk level."""
    
    score = 0.0
    
    predicted_class = prediction.get("predicted_class", "Other / Uncertain")
    confidence = prediction.get("confidence", 0.0)
    
    frp = float(feature_data.get("frp", 0.0))
    distance_residential = float(feature_data.get("distance_to_residential_area", 100.0))
    distance_industrial = float(feature_data.get("distance_to_industrial_site", 100.0))
    persistence = float(feature_data.get("persistence_score", 0.0))
    
    # Base score by class
    if predicted_class == "Wildfire / Natural Fire":
        score += 40
    elif predicted_class == "Industrial Fire":
        score += 50
    elif predicted_class == "Gas Flare / Persistent Thermal Source":
        score += 10 # Expected activity, lower acute risk
    elif predicted_class == "Agricultural Burn":
        score += 20
    else:
        score += 5
        
    # Confidence weight
    score *= confidence
    
    # FRP contribution
    if frp > 100:
        score += 20
    elif frp > 50:
        score += 10
        
    # Proximity to residential
    if distance_residential < 2.0:
        score += 30
    elif distance_residential < 5.0:
        score += 15
        
    # Proximity to industrial
    if predicted_class == "Wildfire / Natural Fire" and distance_industrial < 3.0:
        score += 20 # Wildfire threatening industrial site
        
    # Persistence
    # High persistence means it's less likely to be a new acute event, unless it's a wildfire
    if predicted_class == "Wildfire / Natural Fire" and persistence > 0.5:
        score += 15
        
    # Cap at 100
    score = min(max(score, 0.0), 100.0)
    
    # Assign levels
    if score >= 75:
        level = "CRITICAL"
    elif score >= 50:
        level = "HIGH"
    elif score >= 25:
        level = "MEDIUM"
    else:
        level = "LOW"
        
    return {
        "risk_score": round(score, 2),
        "risk_level": level
    }

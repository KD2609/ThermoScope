from typing import Dict, Any, List
from .schemas import EvidenceItem

class EvidenceEngine:
    """Generates human-readable evidence based strictly on actual feature values."""
    
    @staticmethod
    def generate_evidence(feature_data: Dict[str, Any], confidence: float, predicted_class: str) -> List[EvidenceItem]:
        evidence = []
        
        # Classification confidence
        if confidence > 0.90:
            evidence.append(EvidenceItem(
                factor="ml_confidence",
                value=confidence,
                message=f"Very high classification confidence ({confidence*100:.1f}%)"
            ))
        elif confidence > 0.70:
            evidence.append(EvidenceItem(
                factor="ml_confidence",
                value=confidence,
                message=f"High classification confidence ({confidence*100:.1f}%)"
            ))

        # FRP (Thermal Intensity)
        frp = float(feature_data.get("frp", 0.0))
        if frp > 100:
            evidence.append(EvidenceItem(
                factor="frp",
                value=frp,
                message=f"Thermal intensity is extreme (FRP={frp:.1f})"
            ))
        elif frp > 50:
            evidence.append(EvidenceItem(
                factor="frp",
                value=frp,
                message=f"Thermal intensity is high (FRP={frp:.1f})"
            ))

        # Proximity to residential
        res_dist = float(feature_data.get("distance_to_residential_area", 100.0))
        if res_dist < 2.0:
            evidence.append(EvidenceItem(
                factor="residential_distance",
                value=res_dist,
                message=f"Detection is extremely close ({res_dist:.1f} km) to a residential area"
            ))
        elif res_dist < 5.0:
            evidence.append(EvidenceItem(
                factor="residential_distance",
                value=res_dist,
                message=f"Detection is near ({res_dist:.1f} km) a residential area"
            ))

        # Proximity to industrial
        ind_dist = float(feature_data.get("distance_to_industrial_site", 100.0))
        if ind_dist < 2.0:
            evidence.append(EvidenceItem(
                factor="industrial_distance",
                value=ind_dist,
                message=f"Detection is within ({ind_dist:.1f} km) of an industrial site"
            ))
            
        # Persistence
        pers = float(feature_data.get("persistence_score", 0.0))
        if pers > 0.7:
            evidence.append(EvidenceItem(
                factor="persistence",
                value=pers,
                message=f"Strong historical persistence ({pers:.2f}) indicates an ongoing or recurring event"
            ))
        elif pers > 0.3:
            evidence.append(EvidenceItem(
                factor="persistence",
                value=pers,
                message=f"Moderate historical persistence ({pers:.2f}) observed at this location"
            ))
            
        # Cluster Density
        density = float(feature_data.get("fire_cluster_density", 0.0))
        if density > 5.0:
            evidence.append(EvidenceItem(
                factor="cluster_density",
                value=density,
                message="Multiple nearby detections form a dense cluster of thermal activity"
            ))

        return evidence

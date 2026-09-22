"""Inference engine for Thermal Anomaly ML Classification.
Loads model bundle from ml/models/fire_classifier_v1.pkl and predicts
class probabilities, primary class, and confidence score.
"""

import os
import sys
from typing import Any, Dict
import joblib
import numpy as np
import pandas as pd

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from ml.feature_extractor import extract_feature_vector, TARGET_CLASSES

MODEL_PATH = os.path.join(current_dir, "models", "fire_classifier_v1.pkl")


class ThermalClassifier:
    _instance = None

    def __init__(self, model_path: str = MODEL_PATH):
        self.model_path = model_path
        self.bundle = None
        self.model = None
        self.classes = TARGET_CLASSES
        self.model_version = "v1.0.0-fallback"
        self._load_model()

    def _load_model(self):
        if os.path.exists(self.model_path):
            try:
                self.bundle = joblib.load(self.model_path)
                self.model = self.bundle["model"]
                self.classes = self.bundle["classes"]
                self.model_version = self.bundle.get("model_version", "v1.0.0")
                print(f"[ML Engine] Loaded {self.model_version} from {self.model_path}")
            except Exception as e:
                print(f"[ML Engine] Warning: Failed loading model artifact: {e}")
                self.model = None
        else:
            print(f"[ML Engine] Warning: Model artifact not found at {self.model_path}")
            self.model = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = ThermalClassifier()
        return cls._instance

    def predict(self, feature_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate prediction for a single thermal anomaly observation."""
        if self.model is None:
            return self._heuristic_fallback(feature_data)

        try:
            vec = extract_feature_vector(feature_data)
            df_input = pd.DataFrame([vec], columns=self.bundle.get("feature_columns", []))

            probas = self.model.predict_proba(df_input)[0]
            pred_idx = np.argmax(probas)
            pred_class = self.classes[pred_idx]
            confidence = float(probas[pred_idx])

            prob_dict = {
                cls_name: round(float(prob), 4)
                for cls_name, prob in zip(self.classes, probas)
            }

            return {
                "predicted_class": pred_class,
                "confidence": round(confidence, 4),
                "probabilities": prob_dict,
                "model_version": self.model_version,
                "is_fallback": False
            }
        except Exception as err:
            print(f"[ML Engine] Prediction exception: {err}. Using heuristic fallback.")
            return self._heuristic_fallback(feature_data)

    def _heuristic_fallback(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Transparent, rule-based fallback if ML model is unavailable."""
        dist_ind = float(row.get("distance_to_industrial_site", 25.0))
        persist = float(row.get("persistence_score", 0.1))
        frp = float(row.get("frp", 50.0))
        bt = float(row.get("brightness_temperature", 330.0))

        if dist_ind <= 2.0:
            if persist >= 0.7:
                predicted_class = "Gas Flare / Persistent Thermal Source"
                confidence = 0.88
            elif frp > 250.0 or bt > 400.0:
                predicted_class = "Industrial Fire"
                confidence = 0.91
            else:
                predicted_class = "Mining / Industrial Thermal Activity"
                confidence = 0.82
        elif dist_ind > 15.0:
            land_cover = str(row.get("land_cover", "")).lower()
            if "crop" in land_cover or frp < 60.0:
                predicted_class = "Agricultural Burn"
                confidence = 0.80
            else:
                predicted_class = "Wildfire / Natural Fire"
                confidence = 0.78
        else:
            predicted_class = "Other / Uncertain"
            confidence = 0.65

        # Build fallback probabilities
        probas = {cls_name: 0.05 for cls_name in self.classes}
        probas[predicted_class] = confidence
        rem = (1.0 - confidence) / max(1, len(self.classes) - 1)
        for c in probas:
            if c != predicted_class:
                probas[c] = round(rem, 4)

        return {
            "predicted_class": predicted_class,
            "confidence": round(confidence, 4),
            "probabilities": probas,
            "model_version": "v1.0.0-rule-fallback",
            "is_fallback": True
        }


# Global helper function
def predict_thermal_event(feature_data: Dict[str, Any]) -> Dict[str, Any]:
    return ThermalClassifier.get_instance().predict(feature_data)

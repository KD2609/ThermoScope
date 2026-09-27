import os
import joblib
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List

from ml.schemas import PredictionResult
from ml.feature_extractor import FEATURE_COLUMNS, extract_features_df

class ThermalClassifier:
    def __init__(self, model_path: str = None, model_version: str = "v2"):
        if model_path is None:
            model_path = os.environ.get("MODEL_PATH", f"ml/models/fire_classifier_{model_version}.pkl")
        
        self.model_version = os.environ.get("MODEL_VERSION", model_version)
        
        print(f"[INFO] Loading model {self.model_version} from {model_path}")
        try:
            self.bundle = joblib.load(model_path)
        except Exception as e:
            raise RuntimeError(f"Failed to load model from {model_path}: {e}")
            
        self.model = self.bundle["model"]
        self.classes = self.bundle["classes"]
        # Allow models to override feature columns if they bundle it, otherwise fallback
        self.expected_features = self.bundle.get("feature_columns", FEATURE_COLUMNS)

    def predict(self, raw_detection: Dict[str, Any]) -> PredictionResult:
        """Run prediction on a single raw FIRMS detection."""
        # Wrap single detection into a dataframe
        df_raw = pd.DataFrame([raw_detection])
        
        # We assume extract_features_df is robust enough to process the raw detection
        df_features = extract_features_df(df_raw)
        
        # Ensure all required features exist, fill missing with 0 or sensible defaults
        for col in self.expected_features:
            if col not in df_features.columns:
                df_features[col] = 0.0
                
        # Reorder to match model expectations
        X = df_features[self.expected_features]
        
        try:
            probs = self.model.predict_proba(X)[0]
            pred_idx = probs.argmax()
            confidence = float(probs[pred_idx])
            pred_class = self.classes[pred_idx]
            
            prob_dict = {str(self.classes[i]): float(probs[i]) for i in range(len(self.classes))}
        except AttributeError:
            # Fallback if model doesn't support predict_proba
            pred_class_arr = self.model.predict(X)
            pred_class = pred_class_arr[0]
            confidence = 1.0
            prob_dict = {pred_class: 1.0}

        return PredictionResult(
            detection_id=raw_detection.get("observation_id", raw_detection.get("detection_id", "unknown")),
            predicted_class=pred_class,
            confidence=confidence,
            probabilities=prob_dict,
            model_version=self.model_version,
            prediction_timestamp=datetime.now(timezone.utc).isoformat()
        )

    def predict_batch(self, raw_detections: List[Dict[str, Any]]) -> List[PredictionResult]:
        """Run prediction on a batch of raw FIRMS detections."""
        return [self.predict(det) for det in raw_detections]

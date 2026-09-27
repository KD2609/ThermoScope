"""Machine Learning Training Pipeline for Industrial Thermal Anomaly Classification.
Reads data/training_data.csv, engineers features, trains ensemble classifier,
evaluates metrics, and exports model artifacts to ml/models/.
"""

import json
import os
import sys
from datetime import datetime, timezone
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score, f1_score
from sklearn.model_selection import train_test_split

# Add parent directory to path so ml package is importable
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from ml.feature_extractor import extract_features_df, FEATURE_COLUMNS, TARGET_CLASSES


def train():
    data_path = os.path.join(parent_dir, "data", "processed", "training_dataset.csv")
    models_dir = os.path.join(current_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    print(f"Loading training dataset from {data_path}...")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Training dataset missing at {data_path}")

    df = pd.read_csv(data_path)
    print(f"Loaded {len(df)} records. Columns: {list(df.columns)}")

    # Basic data validation
    required_cols = [
        "brightness_temperature", "frp", "confidence",
        "distance_to_industrial_site", "label"
    ]
    for col in required_cols:
        if col not in df.columns:
            raise ValueError(f"Required training column missing: {col}")

    # Clean missing values
    df["confidence"] = df["confidence"].fillna(70.0)
    df["frp"] = df["frp"].fillna(df["frp"].median())
    df["brightness_temperature"] = df["brightness_temperature"].fillna(330.0)
    df["persistence_score"] = df["persistence_score"].fillna(0.1)
    df["distance_to_industrial_site"] = df["distance_to_industrial_site"].fillna(25.0)
    df["distance_to_residential_area"] = df["distance_to_residential_area"].fillna(5.0)

    # Filter known classes
    df = df[df["label"].isin(TARGET_CLASSES)].reset_index(drop=True)
    print(f"Valid labeled samples: {len(df)}")
    print("Class breakdown:\n", df["label"].value_counts())

    if len(df) == 0:
        print("No valid training samples available. Exiting.")
        return

    # Extract features using the standardized pipeline
    # Note: df comes from training_dataset.csv which already has these columns,
    # but running extract_features_df ensures correct ordering and encoding.
    X_all = extract_features_df(df)
    
    # We must restrict X to only the defined numeric FEATURE_COLUMNS
    X = X_all[FEATURE_COLUMNS].values
    y = df["label"].values

    # Event-aware Train/Test Split
    # Create an event identifier based on day and rounded coordinates (e.g. 0.1 degree ~ 11km)
    df["lat_rounded"] = df["latitude"].round(1)
    df["lon_rounded"] = df["longitude"].round(1)
    # Use 'acq_date' if available, otherwise just group spatially
    if "acq_date" in df.columns:
        df["event_id"] = df["lat_rounded"].astype(str) + "_" + df["lon_rounded"].astype(str) + "_" + df["acq_date"].astype(str)
    else:
        df["event_id"] = df["lat_rounded"].astype(str) + "_" + df["lon_rounded"].astype(str)
        
    events = df["event_id"].unique()
    
    from sklearn.model_selection import GroupShuffleSplit
    
    if len(events) > 1:
        gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
        train_idx, test_idx = next(gss.split(X, y, groups=df["event_id"]))
        X_train, X_test = X[train_idx], X[test_idx]
        y_train, y_test = y[train_idx], y[test_idx]
    else:
        print("Warning: Only 1 unique event found. Using standard train_test_split.")
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.25, random_state=42, stratify=y
            )
        except ValueError:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.25, random_state=42
            )

    print(f"Training set: {len(X_train)} samples. Test set: {len(X_test)} samples.")

    # Model training with RandomForest
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        min_samples_split=2,
        class_weight="balanced",
        random_state=42
    )
    clf.fit(X_train, y_train)

    # Evaluation
    y_pred = clf.predict(X_test)
    acc = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro", zero_division=0))
    weighted_f1 = float(f1_score(y_test, y_pred, average="weighted", zero_division=0))

    report = classification_report(y_test, y_pred, output_dict=True, zero_division=0)
    conf_mat = confusion_matrix(y_test, y_pred, labels=clf.classes_).tolist()

    # Feature importances
    feature_importances = {
        feat: float(imp)
        for feat, imp in zip(FEATURE_COLUMNS, clf.feature_importances_)
    }
    sorted_importances = dict(sorted(feature_importances.items(), key=lambda item: item[1], reverse=True))

    model_version = "v1.0.0"
    metrics_payload = {
        "model_version": model_version,
        "algorithm": "RandomForestClassifier",
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "total_samples": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(acc, 4),
        "macro_f1": round(macro_f1, 4),
        "weighted_f1": round(weighted_f1, 4),
        "classes": clf.classes_.tolist(),
        "classification_report": report,
        "confusion_matrix": conf_mat,
        "top_features": sorted_importances,
        "note": "Production pipeline baseline trained on curated historical and industrial observations. Expand data/training_data.csv with verified incidents to retrain."
    }

    # Save metrics
    metrics_file = os.path.join(models_dir, "metrics.json")
    with open(metrics_file, "w") as f:
        json.dump(metrics_payload, f, indent=2)
    print(f"Metrics saved to {metrics_file}")

    # Save model artifact bundle
    model_bundle = {
        "model": clf,
        "classes": clf.classes_.tolist(),
        "feature_columns": FEATURE_COLUMNS,
        "model_version": model_version,
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "accuracy": acc,
            "weighted_f1": weighted_f1
        }
    }
    model_file = os.path.join(models_dir, "fire_classifier_v1.pkl")
    joblib.dump(model_bundle, model_file)
    print(f"Model artifact successfully saved to {model_file}")

    print("\n=== Training Summary ===")
    print(f"Accuracy: {acc:.2%}")
    print(f"Weighted F1: {weighted_f1:.2%}")
    print("Top 5 decisive features:")
    for i, (k, v) in enumerate(list(sorted_importances.items())[:5]):
        print(f"  {i+1}. {k}: {v:.4f}")

    return model_file, metrics_file


if __name__ == "__main__":
    train()

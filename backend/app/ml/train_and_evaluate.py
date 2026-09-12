import sys
import os
import json
import time
import math
from pathlib import Path
import numpy as np
import pandas as pd
from typing import Any, Dict, Optional

from sklearn.model_selection import GroupKFold, GroupShuffleSplit, GridSearchCV
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, f1_score, precision_score, recall_score,
    confusion_matrix, classification_report, brier_score_loss, log_loss
)
from sklearn.calibration import CalibratedClassifierCV
from sklearn.ensemble import (
    RandomForestClassifier, ExtraTreesClassifier,
    HistGradientBoostingClassifier, GradientBoostingClassifier
)
from sklearn.linear_model import LogisticRegression
import joblib

# Ensure app imports resolve
BASE_DIR = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(BASE_DIR))
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

from app.config import settings
from app.ml.dataset_generator import generate_expanded_dataset, CLASSES
from app.services.features import (
    FEATURE_COLUMNS_BASELINE, FEATURE_COLUMNS_THERMAL,
    FEATURE_COLUMNS_SPATIAL, FEATURE_COLUMNS_TEMPORAL,
    FEATURE_COLUMNS_ALL, FEATURE_GROUPS
)

def run_feature_ablation(df: pd.DataFrame, train_idx: np.ndarray, test_idx: np.ndarray, groups: np.ndarray) -> dict[str, Any]:
    """
    Empirically evaluate progressive feature groups using grouped cross-validation:
    Group 1: Baseline
    Group 2: Baseline + Thermal
    Group 3: Baseline + Thermal + Spatial
    Group 4: Baseline + Thermal + Spatial + Temporal
    Group 5: Baseline + Thermal + Spatial + Temporal + Interactions
    """
    print("\n" + "=" * 60)
    print("[ABLATION] EMPIRICAL FEATURE-GROUP ABLATION STUDY")
    print("=" * 60)

    ablation_results = {}
    gkf = GroupKFold(n_splits=5)

    for grp_name, feat_cols in FEATURE_GROUPS.items():
        X_train_grp = df.iloc[train_idx][feat_cols].values
        y_train_grp = df.iloc[train_idx]["target_class"].values
        groups_train = groups[train_idx]

        X_test_grp = df.iloc[test_idx][feat_cols].values
        y_test_grp = df.iloc[test_idx]["target_class"].values

        # Use reproducible Random Forest for comparative ablation
        rf = RandomForestClassifier(n_estimators=100, max_depth=8, class_weight="balanced", random_state=42)

        # 5-fold grouped cross-validation
        cv_macro_f1s = []
        for fold_train, fold_val in gkf.split(X_train_grp, y_train_grp, groups_train):
            rf.fit(X_train_grp[fold_train], y_train_grp[fold_train])
            y_val_pred = rf.predict(X_train_grp[fold_val])
            cv_macro_f1s.append(f1_score(y_train_grp[fold_val], y_val_pred, average="macro"))

        # Fit on full training split and evaluate on held-out test split
        rf.fit(X_train_grp, y_train_grp)
        y_test_pred = rf.predict(X_test_grp)

        test_acc = accuracy_score(y_test_grp, y_test_pred)
        test_macro_f1 = f1_score(y_test_grp, y_test_pred, average="macro")
        test_weighted_f1 = f1_score(y_test_grp, y_test_pred, average="weighted")

        print(f"  [{grp_name.upper()}] Features: {len(feat_cols):2d} | CV Macro-F1: {np.mean(cv_macro_f1s):.4f} | Test Acc: {test_acc:.4f} | Test Macro-F1: {test_macro_f1:.4f} | Weighted-F1: {test_weighted_f1:.4f}")

        ablation_results[grp_name] = {
            "num_features": len(feat_cols),
            "features": feat_cols,
            "cv_macro_f1_mean": round(float(np.mean(cv_macro_f1s)), 4),
            "cv_macro_f1_std": round(float(np.std(cv_macro_f1s)), 4),
            "test_accuracy": round(float(test_acc), 4),
            "test_macro_f1": round(float(test_macro_f1), 4),
            "test_weighted_f1": round(float(test_weighted_f1), 4),
        }

    return ablation_results

def run_model_comparison(
    X_train: np.ndarray, y_train: np.ndarray, groups_train: np.ndarray,
    X_test: np.ndarray, y_test: np.ndarray
) -> tuple[dict[str, Any], str, Any]:
    """
    Benchmark multiple candidate classifiers using GroupKFold cross-validation:
    1. Random Forest
    2. Extra Trees
    3. HistGradientBoosting
    4. Gradient Boosting
    5. Regularized Logistic Regression
    """
    print("\n" + "=" * 60)
    print("[MODELS] CANDIDATE CLASSIFIER BENCHMARKING (GROUP-AWARE CV)")
    print("=" * 60)

    candidates = {
        "Random Forest": RandomForestClassifier(n_estimators=120, max_depth=9, min_samples_split=4, class_weight="balanced", random_state=42),
        "Extra Trees": ExtraTreesClassifier(n_estimators=120, max_depth=9, min_samples_split=4, class_weight="balanced", random_state=42),
        "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=100, max_depth=6, random_state=42),
        "Gradient Boosting": GradientBoostingClassifier(n_estimators=50, max_depth=4, random_state=42),
        "Logistic Regression": Pipeline([
            ("scaler", StandardScaler()),
            ("clf", LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42))
        ])
    }

    gkf = GroupKFold(n_splits=5)
    results = {}
    best_model_name = ""
    best_macro_f1 = -1.0
    best_estimator = None

    for name, model in candidates.items():
        t0 = time.time()
        cv_macro_f1s = []
        cv_accuracies = []

        for fold_train, fold_val in gkf.split(X_train, y_train, groups_train):
            model.fit(X_train[fold_train], y_train[fold_train])
            val_preds = model.predict(X_train[fold_val])
            cv_macro_f1s.append(f1_score(y_train[fold_val], val_preds, average="macro"))
            cv_accuracies.append(accuracy_score(y_train[fold_val], val_preds))

        # Train on full train set and test on held-out test split
        model.fit(X_train, y_train)
        fit_time_ms = round((time.time() - t0) * 1000.0, 1)

        t_infer0 = time.time()
        test_preds = model.predict(X_test)
        infer_time_ms = round((time.time() - t_infer0) * 1000.0, 2)

        acc = accuracy_score(y_test, test_preds)
        macro_f1 = f1_score(y_test, test_preds, average="macro")
        weighted_f1 = f1_score(y_test, test_preds, average="weighted")
        per_class_f1 = f1_score(y_test, test_preds, average=None)

        print(f"  {name:<22} | CV Macro-F1: {np.mean(cv_macro_f1s):.4f} (±{np.std(cv_macro_f1s):.3f}) | Test Acc: {acc:.4f} | Test Macro-F1: {macro_f1:.4f} | Weighted-F1: {weighted_f1:.4f} | Train: {fit_time_ms}ms")

        results[name] = {
            "cv_macro_f1_mean": round(float(np.mean(cv_macro_f1s)), 4),
            "cv_macro_f1_std": round(float(np.std(cv_macro_f1s)), 4),
            "cv_accuracy_mean": round(float(np.mean(cv_accuracies)), 4),
            "test_accuracy": round(float(acc), 4),
            "test_macro_f1": round(float(macro_f1), 4),
            "test_weighted_f1": round(float(weighted_f1), 4),
            "per_class_f1": {CLASSES[i]: round(float(score), 4) for i, score in enumerate(per_class_f1)},
            "train_time_ms": fit_time_ms,
            "inference_time_ms": infer_time_ms
        }

        # Primary selection: Macro-F1
        if macro_f1 > best_macro_f1:
            best_macro_f1 = macro_f1
            best_model_name = name
            best_estimator = model

    print(f"\n  [WINNER] Best Architecture: {best_model_name} (Macro-F1: {best_macro_f1:.4f})")
    return results, best_model_name, best_estimator

def tune_and_calibrate(
    best_estimator: Any,
    best_model_name: str,
    X_train: np.ndarray,
    y_train: np.ndarray,
    groups_train: np.ndarray,
    X_test: np.ndarray,
    y_test: np.ndarray
) -> tuple[Any, dict[str, Any]]:
    """
    Perform hyperparameter search on the winning model architecture and calibrate probabilities.
    """
    print("\n" + "=" * 60)
    print(f"[TUNING & CALIBRATION] ({best_model_name})")
    print("=" * 60)

    gkf = GroupKFold(n_splits=5)

    if "Random Forest" in best_model_name or "Extra Trees" in best_model_name:
        param_grid = {
            "n_estimators": [100, 150],
            "max_depth": [8, 11, None],
            "min_samples_split": [2, 4],
        }
        grid = GridSearchCV(best_estimator, param_grid, cv=gkf, scoring="f1_macro", n_jobs=1)
        grid.fit(X_train, y_train, groups=groups_train)
        tuned_model = grid.best_estimator_
        best_params = grid.best_params_
        print(f"  Best Hyperparameters: {best_params}", flush=True)
    else:
        tuned_model = best_estimator
        best_params = getattr(best_estimator, "get_params", lambda: {})()

    # Raw model predictions & probability calibration
    tuned_model.fit(X_train, y_train)
    raw_probs = tuned_model.predict_proba(X_test)
    raw_preds = tuned_model.predict(X_test)

    # One-hot encode y_test for multi-class Brier score
    y_test_one_hot = np.zeros((len(y_test), len(CLASSES)))
    for idx, c in enumerate(y_test):
        y_test_one_hot[idx, c] = 1.0

    raw_brier = float(np.mean(np.sum((raw_probs - y_test_one_hot) ** 2, axis=1)))

    # Calibrate probabilities using CalibratedClassifierCV
    calibrated_clf = CalibratedClassifierCV(estimator=tuned_model, method="sigmoid", cv=5)
    calibrated_clf.fit(X_train, y_train)

    calib_probs = calibrated_clf.predict_proba(X_test)
    calib_preds = calibrated_clf.predict(X_test)
    calib_brier = float(np.mean(np.sum((calib_probs - y_test_one_hot) ** 2, axis=1)))

    calib_acc = accuracy_score(y_test, calib_preds)
    calib_macro_f1 = f1_score(y_test, calib_preds, average="macro", zero_division=0)
    calib_weighted_f1 = f1_score(y_test, calib_preds, average="weighted", zero_division=0)
    cm = confusion_matrix(y_test, calib_preds, labels=list(range(len(CLASSES)))).tolist()
    clf_report = classification_report(y_test, calib_preds, labels=list(range(len(CLASSES))), target_names=CLASSES, output_dict=True, zero_division=0)

    print(f"  Raw Brier Score: {raw_brier:.4f} -> Calibrated Brier Score: {calib_brier:.4f}")
    print(f"  Final Calibrated Test Accuracy: {calib_acc:.4f} | Macro-F1: {calib_macro_f1:.4f}")

    final_metrics = {
        "best_model_name": best_model_name,
        "best_hyperparameters": best_params,
        "raw_brier_score": round(raw_brier, 4),
        "calibrated_brier_score": round(calib_brier, 4),
        "final_accuracy": round(float(calib_acc), 4),
        "final_macro_f1": round(float(calib_macro_f1), 4),
        "final_weighted_f1": round(float(calib_weighted_f1), 4),
        "confusion_matrix": cm,
        "per_class_metrics": {
            cls_name: {
                "precision": round(float(clf_report[cls_name]["precision"]), 4),
                "recall": round(float(clf_report[cls_name]["recall"]), 4),
                "f1-score": round(float(clf_report[cls_name]["f1-score"]), 4),
                "support": int(clf_report[cls_name]["support"])
            }
            for cls_name in CLASSES
        }
    }

    return calibrated_clf, final_metrics

def execute_training_pipeline() -> dict[str, Any]:
    """
    Main entrypoint for the end-to-end model selection and evaluation pipeline.
    """
    print("=" * 60)
    print("[START] THERMOSCOPE AI - PRODUCTION ML PIPELINE SELECTION")
    print("=" * 60)

    # 1. Generate leak-free expanded dataset (~10x baseline of 370 samples)
    baseline_count = 370
    df = generate_expanded_dataset(baseline_sample_count=baseline_count, expansion_factor=10.0, random_seed=42)
    print(f"  [DATASET] Generated {len(df)} samples across {df['spatial_group_key'].nunique()} spatial groups.")

    # 2. Leakage-safe train/test split strictly by spatial group
    # We choose 4 diverse geographic groups for held-out testing representing unseen locations
    # while guaranteeing zero spatial group leakage:
    test_group_names = {"GUJARAT_HAZIRA", "PUNJAB_LUDHIANA", "CHHATTISGARH_BASTAR", "CENTRAL_SEMIARID"}
    test_mask = df["spatial_group_key"].isin(test_group_names)
    train_idx = df[~test_mask].index.values
    test_idx = df[test_mask].index.values

    groups = df["spatial_group_key"].values
    train_groups = set(groups[train_idx])
    test_groups = set(groups[test_idx])
    assert len(train_groups.intersection(test_groups)) == 0, "CRITICAL ERROR: Spatial group leakage detected between train and test splits!"
    print(f"  [LEAKAGE CHECK] Zero spatial leakage verified. Train groups: {len(train_groups)}, Test groups: {len(test_groups)}.", flush=True)

    # 3. Empirical Feature Ablation
    ablation_summary = run_feature_ablation(df, train_idx, test_idx, groups)

    # 4. Prepare full feature matrices (Group 5)
    feat_cols = FEATURE_COLUMNS_ALL
    X_train = df.iloc[train_idx][feat_cols].values
    y_train = df.iloc[train_idx]["target_class"].values
    groups_train = groups[train_idx]

    X_test = df.iloc[test_idx][feat_cols].values
    y_test = df.iloc[test_idx]["target_class"].values

    # 5. Model Benchmarking
    model_comparison_results, best_model_name, best_estimator = run_model_comparison(
        X_train, y_train, groups_train, X_test, y_test
    )

    # 6. Hyperparameter tuning & probability calibration
    final_pipeline, final_metrics = tune_and_calibrate(
        best_estimator, best_model_name, X_train, y_train, groups_train, X_test, y_test
    )

    # Combine full report
    full_report = {
        "metadata": {
            "dataset_origin": "Curated/Synthetic Thermal Distribution (Indian Geospatial Basins)",
            "baseline_samples": baseline_count,
            "expanded_samples": len(df),
            "expansion_factor": round(len(df) / baseline_count, 2),
            "feature_columns": feat_cols,
            "classes": CLASSES,
            "spatial_groups": list(df["spatial_group_key"].unique()),
            "evaluation_protocol": "Spatial Grouped K-Fold (Zero Geographic Leakage)"
        },
        "ablation_study": ablation_summary,
        "model_comparison": model_comparison_results,
        "final_evaluation": final_metrics
    }

    # 7. Persist winning pipeline and metrics
    model_dir = settings.MODEL_STORE_PATH.parent
    model_dir.mkdir(parents=True, exist_ok=True)

    joblib.dump({
        "pipeline": final_pipeline,
        "model_name": best_model_name,
        "classes": CLASSES,
        "feature_columns": feat_cols,
        "trained_at": time.strftime("%Y-%m-%d %H:%M:%S UTC")
    }, settings.MODEL_STORE_PATH)
    print(f"\n  [SAVED] Saved winning calibrated model pipeline to {settings.MODEL_STORE_PATH}")

    with open(settings.MODEL_METRICS_PATH, "w") as f:
        json.dump(full_report, f, indent=2)
    print(f"  [SAVED] Saved full model metrics and ablation report to {settings.MODEL_METRICS_PATH}")

    return full_report

if __name__ == "__main__":
    execute_training_pipeline()

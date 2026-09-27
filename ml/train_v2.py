import pandas as pd
import numpy as np
import glob
import os
import sys
from pathlib import Path
from sklearn.neighbors import BallTree
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import GroupShuffleSplit
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix, classification_report
import joblib
import json

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
from ml.feature_extractor import extract_features_df, FEATURE_COLUMNS, load_json_file, INDUSTRIAL_SITES_FILE, RESIDENTIAL_AREAS_FILE

print("==================================================")
print("PHASE 1 - CONSTRUCT FINAL V2 LABEL DATASET")
print("==================================================")

cr_df = pd.read_csv("data/labels/creams_matched.csv")
wb_df = pd.read_csv("data/labels/worldbank_sepnov_matched.csv")
fsi_df = pd.read_csv("data/labels/fsi_sepnov_matched.csv")

conflicts_df = pd.read_csv("data/labels/conflicting_observations.csv")
conflict_ids = set(conflicts_df["observation_id"].values)

cr_df = cr_df[~cr_df["observation_id"].isin(conflict_ids)].copy()
wb_df = wb_df[~wb_df["observation_id"].isin(conflict_ids)].copy()
fsi_df = fsi_df[~fsi_df["observation_id"].isin(conflict_ids)].copy()

# Create group IDs
cr_df["evaluation_group"] = "AG_" + cr_df["creams_event_id"].astype(str)
wb_df["evaluation_group"] = "GF_" + wb_df["world_bank_id"].astype(str)
fsi_df["evaluation_group"] = "WF_" + fsi_df["fsi_event_id"].astype(str)

cr_df["target_class"] = "Agricultural Burn"
wb_df["target_class"] = "Gas Flare / Persistent Thermal Source"
fsi_df["target_class"] = "Wildfire / Natural Fire"

cols = ["observation_id", "target_class", "evaluation_group"]
merged_labels = pd.concat([cr_df[cols], wb_df[cols], fsi_df[cols]], ignore_index=True)
merged_labels.to_csv("data/labels/training_labels_v2.csv", index=False)

print("\n==================================================")
print("PHASE 2 & 3 - MERGE WITH FEATURES & EXTRACT")
print("==================================================")

firms_files = glob.glob("data/raw/firms_archive/2023/VIIRS_*_2023-*.csv")
firms_df = pd.concat([pd.read_csv(f) for f in firms_files], ignore_index=True)

def generate_obs_id(row):
    lat = float(row.get("latitude", 0.0))
    lon = float(row.get("longitude", 0.0))
    date_val = str(row.get("acq_date", ""))[:10]
    time_val = str(row.get("acq_time", "")).replace(":", "").zfill(4)
    if '.' in time_val: time_val = str(int(float(time_val))).zfill(4)
    sat = row.get("satellite", "")
    instr = row.get("instrument", "")
    return f"{lat:.4f}_{lon:.4f}_{date_val}_{time_val}_{sat}_{instr}"

firms_df["observation_id"] = firms_df.apply(generate_obs_id, axis=1)
firms_df["acq_date"] = pd.to_datetime(firms_df["acq_date"])

training_data = merged_labels.merge(firms_df, on="observation_id", how="inner")

# Compute Historical Features properly
tree = BallTree(np.deg2rad(firms_df[["latitude", "longitude"]].values), metric="haversine")
R_RAD = 1.0 / 6371.0

hist_counts = []
pers_scores = []
densities = []

for idx, row in training_data.iterrows():
    lat, lon = row["latitude"], row["longitude"]
    c_date = row["acq_date"]
    
    idx_list = tree.query_radius([[np.deg2rad(lat), np.deg2rad(lon)]], r=R_RAD)[0]
    nearby = firms_df.iloc[idx_list]
    past = nearby[nearby["acq_date"] < c_date]
    
    hist_counts.append(len(past))
    
    recent = past[past["acq_date"] >= c_date - pd.Timedelta(days=5)]
    diff_days = recent["acq_date"].dt.date.nunique()
    
    pers_scores.append(min(diff_days / 5.0, 1.0))
    densities.append(len(recent) / 5.0)

training_data["historical_fire_count"] = hist_counts
training_data["persistence_score"] = pers_scores
training_data["fire_cluster_density"] = densities

ind_sites = load_json_file(INDUSTRIAL_SITES_FILE)
res_areas = load_json_file(RESIDENTIAL_AREAS_FILE)

# Use production feature extractor
extracted_df = extract_features_df(training_data, ind_sites, res_areas)

# Merge labels back since extract_features_df only outputs FEATURE_COLUMNS + metadata
final_df = extracted_df.merge(training_data[["observation_id", "target_class", "evaluation_group"]], on="observation_id", how="left")
final_df = final_df.drop_duplicates(subset=["observation_id"])

print("\n==================================================")
print("PHASE 4 - DATA INTEGRITY")
print("==================================================")

print(f"Total observations: {len(final_df)}")
print(f"Duplicate observation_id: {final_df.duplicated(subset=['observation_id']).sum()}")
print(f"Observations with multiple classes: {final_df.groupby('observation_id')['target_class'].nunique().gt(1).sum()}")
print(f"Remaining 7 conflict observations: {final_df['observation_id'].isin(conflict_ids).sum()}")
print(f"NaN/Inf in ML features: {final_df[FEATURE_COLUMNS].isna().sum().sum() + np.isinf(final_df[FEATURE_COLUMNS]).sum().sum()}")

class_counts = final_df["target_class"].value_counts()
group_counts = final_df.groupby("target_class")["evaluation_group"].nunique()
print("\nObservations per class:")
print(class_counts)
print("\nUnique groups per class:")
print(group_counts)
print(f"\nFeature count: {len(FEATURE_COLUMNS)}")

print("\n==================================================")
print("PHASE 5 - GROUP-AWARE SPLIT")
print("==================================================")

gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42)

# Ensure both Train and Test have Wildfire
split_valid = False
attempt = 0
while not split_valid and attempt < 100:
    gss = GroupShuffleSplit(n_splits=1, test_size=0.2, random_state=42+attempt)
    train_idx, test_idx = next(gss.split(final_df, final_df["target_class"], final_df["evaluation_group"]))
    
    train_classes = final_df.iloc[train_idx]["target_class"].unique()
    test_classes = final_df.iloc[test_idx]["target_class"].unique()
    
    if "Wildfire / Natural Fire" in train_classes and "Wildfire / Natural Fire" in test_classes:
        split_valid = True
    else:
        attempt += 1

if not split_valid:
    print("WARNING: Could not find a split where Wildfire is in both train and test.")

train_df = final_df.iloc[train_idx]
test_df = final_df.iloc[test_idx]

train_groups = set(train_df["evaluation_group"])
test_groups = set(test_df["evaluation_group"])
overlap = train_groups.intersection(test_groups)
print(f"\nIntersection(train_groups, test_groups) == empty? {len(overlap) == 0}")

print("\nTRAIN:")
print(train_df["target_class"].value_counts())
print(train_df.groupby("target_class")["evaluation_group"].nunique())

print("\nTEST:")
print(test_df["target_class"].value_counts())
print(test_df.groupby("target_class")["evaluation_group"].nunique())

print("\n==================================================")
print("PHASE 6 & 7 - TRAIN & EVALUATE V2 RANDOM FOREST")
print("==================================================")

X_train = train_df[FEATURE_COLUMNS]
y_train = train_df["target_class"]
X_test = test_df[FEATURE_COLUMNS]
y_test = test_df["target_class"]

def train_and_eval(name, cw):
    print(f"\n--- MODEL: {name} ---")
    clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight=cw)
    clf.fit(X_train, y_train)
    preds = clf.predict(X_test)
    
    print(f"Accuracy: {accuracy_score(y_test, preds):.4f}")
    print(f"Macro Precision: {precision_score(y_test, preds, average='macro'):.4f}")
    print(f"Macro Recall: {recall_score(y_test, preds, average='macro'):.4f}")
    print(f"Macro F1: {f1_score(y_test, preds, average='macro'):.4f}")
    print(f"Weighted F1: {f1_score(y_test, preds, average='weighted'):.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, preds))
    
    print("\nConfusion Matrix:")
    labels = sorted(y_test.unique())
    cm = confusion_matrix(y_test, preds, labels=labels)
    cm_df = pd.DataFrame(cm, index=[f"True_{l}" for l in labels], columns=[f"Pred_{l}" for l in labels])
    print(cm_df)
    return clf

clf_unweighted = train_and_eval("UNWEIGHTED (class_weight=None)", None)
clf_balanced = train_and_eval("BALANCED (class_weight='balanced')", "balanced")

print("\n==================================================")
print("PHASE 8 - WILDFIRE ROBUSTNESS TEST")
print("==================================================")

wf_groups = final_df[final_df["target_class"] == "Wildfire / Natural Fire"]["evaluation_group"].unique()

for wf_g in wf_groups:
    print(f"\nHolding out Wildfire event: {wf_g}")
    train_mask = final_df["evaluation_group"] != wf_g
    test_mask = final_df["evaluation_group"] == wf_g
    
    X_t = final_df.loc[train_mask, FEATURE_COLUMNS]
    y_t = final_df.loc[train_mask, "target_class"]
    X_v = final_df.loc[test_mask, FEATURE_COLUMNS]
    y_v = final_df.loc[test_mask, "target_class"]
    
    rob_clf = RandomForestClassifier(n_estimators=100, random_state=42, class_weight="balanced")
    rob_clf.fit(X_t, y_t)
    
    preds = rob_clf.predict(X_v)
    probs = rob_clf.predict_proba(X_v)
    classes = rob_clf.classes_
    
    correct = (preds == y_v).sum()
    print(f"  Accuracy on held-out event: {correct}/{len(y_v)} ({(correct/len(y_v))*100:.1f}%)")
    
    wf_idx = list(classes).index("Wildfire / Natural Fire")
    print(f"  Mean probability of Wildfire class: {probs[:, wf_idx].mean():.3f}")

print("\n==================================================")
print("PHASE 9 - TEMPORAL ROBUSTNESS AUDIT")
print("==================================================")

print("NOTE: Calendar features are absent. Month/year are not ML predictors. However, source/time distribution differences remain a possible confounding factor.")
train_df["month"] = pd.to_datetime(train_df["acq_date"]).dt.month
test_df["month"] = pd.to_datetime(test_df["acq_date"]).dt.month

print("\nTrain Month Distribution:")
print(train_df.groupby(["target_class", "month"]).size())
print("\nTest Month Distribution:")
print(test_df.groupby(["target_class", "month"]).size())

print("\n==================================================")
print("PHASE 10 - FEATURE IMPORTANCE")
print("==================================================")

importances = clf_balanced.feature_importances_
feat_imp = pd.DataFrame({"Feature": FEATURE_COLUMNS, "Importance": importances}).sort_values(by="Importance", ascending=False)
print("\nTop 15 Features (Balanced Model):")
print(feat_imp.head(15).to_string())

print("\n==================================================")
print("PHASE 11 - SAVE V2 MODEL")
print("==================================================")

os.makedirs("ml/models", exist_ok=True)
model_path = "ml/models/fire_classifier_v2.pkl"
metrics_path = "ml/models/metrics_v2.json"

joblib.dump(clf_balanced, model_path)
print(f"Saved balanced model to {model_path}")

metrics = {
    "training_observation_count": int(len(X_train)),
    "test_observation_count": int(len(X_test)),
    "class_counts": class_counts.to_dict(),
    "group_counts": group_counts.to_dict(),
    "model_configuration": "RandomForestClassifier(n_estimators=100)",
    "class_weight": "balanced",
    "feature_list": FEATURE_COLUMNS,
    "training_timestamp": str(pd.Timestamp.now())
}

with open(metrics_path, "w") as f:
    json.dump(metrics, f, indent=4)
print(f"Saved metrics to {metrics_path}")

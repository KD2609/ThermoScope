import pandas as pd
from pathlib import Path


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

FEATURES_FILE = PROJECT_ROOT / "data/processed/firms_features_2023.csv"
LABELS_FILE = PROJECT_ROOT / "data/labels/jan2023_firms_labels.csv"

OUTPUT_FILE = PROJECT_ROOT / "data/processed/training_dataset.csv"


# ============================================================
# CONFIGURATION
# ============================================================

# Classes that are valid supervised-learning labels.
#
# Keep this list open for future classes. When CREAMS,
# industrial labels, etc. are integrated, simply add/use
# those labels in the label-generation pipeline.
VALID_CLASSES = {
    "Wildfire",
    "Agricultural Burn",
    "Gas Flare",
    "Industrial Fire",
    "Mining / Industrial Thermal Activity",
    "Other / Uncertain",
}


# Rows marked as "Unmatched" are NOT considered labeled.
# They mean that no independent labeling source matched them.
INVALID_SOURCES = {
    "Unmatched",
    "",
    "nan",
}


# ============================================================
# LOAD FEATURES
# ============================================================

print("\nLoading feature dataset...")

if not FEATURES_FILE.exists():
    raise FileNotFoundError(
        f"Features file not found:\n{FEATURES_FILE}"
    )

features = pd.read_csv(FEATURES_FILE)

print("Features shape:", features.shape)


# ============================================================
# LOAD LABELS
# ============================================================

print("\nLoading label dataset...")

if not LABELS_FILE.exists():
    raise FileNotFoundError(
        f"Labels file not found:\n{LABELS_FILE}"
    )

labels = pd.read_csv(LABELS_FILE)

print("Labels shape:", labels.shape)


# ============================================================
# BASIC VALIDATION
# ============================================================

required_label_columns = {
    "label",
    "label_source",
    "label_confidence",
}

missing_columns = required_label_columns - set(labels.columns)

if missing_columns:
    raise ValueError(
        f"Missing required label columns: {missing_columns}"
    )


# ============================================================
# OBSERVATION COUNT CHECK
# ============================================================
# (Removed row count check because we now merge safely on observation_id)


# ============================================================
# ALIGN LABELS WITH FEATURES
# ============================================================

print("\nMerging features and labels based on observation_id...")

if "observation_id" not in features.columns:
    raise ValueError("observation_id is missing from features dataset.")

if "observation_id" not in labels.columns:
    raise ValueError("observation_id is missing from labels dataset.")

# Deduplicate just in case of FIRMS duplicate records
features = features.drop_duplicates(subset=["observation_id"])
labels = labels.drop_duplicates(subset=["observation_id"])

# Select only necessary columns from labels
label_subset = labels[["observation_id", "label", "label_source", "label_confidence"]]

# Merge and ensure no row explosion
features = pd.merge(
    features,
    label_subset,
    on="observation_id",
    how="left",
    validate="1:1"
)

# ============================================================
# CLEAN LABEL INFORMATION
# ============================================================

features["label"] = (
    features["label"]
    .fillna("")
    .astype(str)
    .str.strip()
)

features["label_source"] = (
    features["label_source"]
    .fillna("")
    .astype(str)
    .str.strip()
)

features["label_confidence"] = pd.to_numeric(
    features["label_confidence"],
    errors="coerce"
)


# ============================================================
# VALIDATE LABELS
# ============================================================

unknown_classes = set(features["label"].unique()) - VALID_CLASSES - {""}

if unknown_classes:
    print("\nWARNING: Unknown label classes found:")
    for label in sorted(unknown_classes):
        print(" -", label)


# ============================================================
# IDENTIFY ACTUALLY LABELED OBSERVATIONS
# ============================================================

# "Unmatched" does NOT mean "Other".
#
# It means we currently have no independent evidence for the
# observation. Such rows must not be used as supervised labels.

labeled_mask = (
    features["label"].isin(VALID_CLASSES)
    &
    ~features["label_source"].isin(INVALID_SOURCES)
)


training_data = features[labeled_mask].copy()

# Map to full target class names for the model
CLASS_MAPPING = {
    "Gas Flare": "Gas Flare / Persistent Thermal Source",
    "Wildfire": "Wildfire / Natural Fire",
    "Agricultural Burn": "Agricultural Burn",
    "Industrial Fire": "Industrial Fire",
    "Mining / Industrial Thermal Activity": "Mining / Industrial Thermal Activity",
    "Other / Uncertain": "Other / Uncertain"
}

training_data["label"] = training_data["label"].map(CLASS_MAPPING).fillna(training_data["label"])

# ============================================================
# VALIDATE CONFIDENCE
# ============================================================

training_data = training_data[
    training_data["label_confidence"].notna()
].copy()

training_data = training_data[
    training_data["label_confidence"].between(0, 1)
].copy()


# ============================================================
# REMOVE DUPLICATE TRAINING ROWS
# ============================================================

before_duplicates = len(training_data)

training_data = training_data.drop_duplicates()

duplicates_removed = (
    before_duplicates - len(training_data)
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print("\n========================================")
print("TRAINING DATASET SUMMARY")
print("========================================")

print("\nTotal feature observations:")
print(len(features))

print("\nAll labels:")
print(features["label"].value_counts(dropna=False))

print("\nLabeled observations:")
print(len(training_data))

print("\nFinal class distribution:")

if len(training_data) > 0:
    print(
        training_data["label"]
        .value_counts()
    )
else:
    print("No labeled observations found.")

print("\nDuplicates removed:")
print(duplicates_removed)


# ============================================================
# SAVE
# ============================================================

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

training_data.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\n========================================")
print("DATASET CREATED")
print("========================================")

print("Saved to:")
print(OUTPUT_FILE)

print("\nFinal shape:")
print(training_data.shape)
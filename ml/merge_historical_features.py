import pandas as pd
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

FEATURES_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "firms_features_2023.csv"
)

HISTORICAL_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "historical_features.csv"
)


print("Loading feature files...")

features = pd.read_csv(FEATURES_FILE)
historical = pd.read_csv(HISTORICAL_FILE)

print(f"Current feature rows: {len(features)}")
print(f"Historical feature rows: {len(historical)}")


# Make sure both files represent the same observations
if "observation_id" not in features.columns or "observation_id" not in historical.columns:
    raise ValueError("observation_id missing")

historical_subset = historical[["observation_id", "historical_fire_count", "persistence_score", "fire_cluster_density"]].drop_duplicates("observation_id")

features = features.drop(columns=["historical_fire_count", "persistence_score", "fire_cluster_density"], errors="ignore")

features = pd.merge(features, historical_subset, on="observation_id", how="left")

# Save updated feature file
features.to_csv(
    FEATURES_FILE,
    index=False
)


print()
print("Done!")
print()
print("Updated file:")
print(FEATURES_FILE)

print()
print("Updated values:")
print(
    features[
        [
            "historical_fire_count",
            "persistence_score",
            "fire_cluster_density"
        ]
    ].head(10)
)
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.neighbors import BallTree
import sys

PROJECT_ROOT = Path(__file__).resolve().parent.parent

HISTORICAL_FILE = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "firms_archive"
    / "2023"
    / "firms_2023.csv"
)

CURRENT_FILE = HISTORICAL_FILE

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "processed"
    / "historical_features.csv"
)

# Around 1 km radius
RADIUS_KM = 1.0
EARTH_RADIUS_KM = 6371.0
PERSISTENCE_DAYS = 5

print("Loading historical FIRMS data...")

historical = pd.read_csv(HISTORICAL_FILE)
current = pd.read_csv(CURRENT_FILE)

print(f"Historical rows: {len(historical)}")
print(f"Current rows: {len(current)}")

historical["acq_date"] = pd.to_datetime(historical["acq_date"])
current["acq_date"] = pd.to_datetime(current["acq_date"])

if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
from ml.feature_extractor import generate_observation_id

results = []

# Build BallTree
historical_coords = np.radians(historical[["latitude", "longitude"]].values)
tree = BallTree(historical_coords, metric="haversine")
radius_rad = RADIUS_KM / EARTH_RADIUS_KM

current_coords = np.radians(current[["latitude", "longitude"]].values)
indices = tree.query_radius(current_coords, r=radius_rad)

for i, row in current.iterrows():
    lat = row["latitude"]
    lon = row["longitude"]
    current_date = row["acq_date"]

    nearby_idx = indices[i]
    nearby = historical.iloc[nearby_idx]

    past_nearby = nearby[nearby["acq_date"] < current_date]

    historical_fire_count = len(past_nearby)

    recent = past_nearby[
        past_nearby["acq_date"] >= current_date - pd.Timedelta(days=PERSISTENCE_DAYS)
    ]

    different_days = recent["acq_date"].dt.date.nunique()
    persistence_score = min(different_days / PERSISTENCE_DAYS, 1.0)
    fire_cluster_density = len(recent) / PERSISTENCE_DAYS
    
    obs_id = generate_observation_id(row)

    results.append({
        "observation_id": obs_id,
        "id": row.get("id", None),
        "latitude": lat,
        "longitude": lon,
        "acq_date": row["acq_date"],
        "historical_fire_count": historical_fire_count,
        "persistence_score": round(persistence_score, 4),
        "fire_cluster_density": round(fire_cluster_density, 4)
    })


result_df = pd.DataFrame(results)


# --------------------------------------------------
# Save
# --------------------------------------------------

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

result_df.to_csv(
    OUTPUT_FILE,
    index=False
)

print()
print("Done!")
print()
print("Output saved to:")
print(OUTPUT_FILE)

print()
print(result_df.head(10))
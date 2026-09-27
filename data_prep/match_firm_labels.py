import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.neighbors import BallTree


# ============================================================
# PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

FIRMS_FILE = PROJECT_ROOT / "data/raw/firms_archive/2023/firms_2023.csv"
FLARE_FILE = PROJECT_ROOT / "data/labels/india_flare_locations.csv"
FSI_FILE = PROJECT_ROOT / "data/raw/fsi_wildfire.csv"
OUTPUT_FILE = PROJECT_ROOT / "data/labels/jan2023_firms_labels.csv"


# ============================================================
# SETTINGS
# ============================================================

EARTH_RADIUS_KM = 6371.0
MAX_DISTANCE_KM = 1.0

START_DATE = pd.Timestamp("2023-01-01")
END_DATE = pd.Timestamp("2023-01-21")


# ============================================================
# HELPER: NEAREST POINT USING BALL TREE
# ============================================================

def nearest_distance_km(source_df, target_df, source_lat, source_lon,
                        target_lat, target_lon):

    if len(source_df) == 0 or len(target_df) == 0:
        return np.full(len(source_df), np.inf)

    source_coords = np.radians(
        source_df[[source_lat, source_lon]].values
    )

    target_coords = np.radians(
        target_df[[target_lat, target_lon]].values
    )

    tree = BallTree(target_coords, metric="haversine")

    distances, _ = tree.query(source_coords, k=1)

    return distances[:, 0] * EARTH_RADIUS_KM


# ============================================================
# 1. LOAD FIRMS
# ============================================================

print("\nLoading FIRMS data...")

if not FIRMS_FILE.exists():
    raise FileNotFoundError(
        f"FIRMS file not found:\n{FIRMS_FILE}"
    )

firms = pd.read_csv(FIRMS_FILE)

print("Total FIRMS records:", len(firms))

# Convert acquisition date
firms["acq_date"] = pd.to_datetime(
    firms["acq_date"],
    errors="coerce"
)

# Keep Jan 1-20, 2023
firms = firms[
    (firms["acq_date"] >= START_DATE) &
    (firms["acq_date"] < END_DATE)
].copy()

print("FIRMS Jan 1-20:", len(firms))


# ============================================================
# 2. LOAD WORLD BANK FLARE LOCATIONS
# ============================================================

print("\nLoading World Bank flare data...")

if not FLARE_FILE.exists():
    raise FileNotFoundError(
        f"World Bank flare file not found:\n{FLARE_FILE}"
    )

flares = pd.read_csv(FLARE_FILE)

# Only 2023 flare locations
flares = flares[
    flares["Year"] == 2023
].copy()

print("2023 World Bank flare locations:", len(flares))


# ============================================================
# 3. LOAD FSI WILDFIRE DATA
# ============================================================

print("\nLoading FSI data...")

if not FSI_FILE.exists():
    raise FileNotFoundError(
        f"FSI file not found:\n{FSI_FILE}"
    )

fsi = pd.read_csv(FSI_FILE)

print("Total FSI records:", len(fsi))

# IMPORTANT:
# Use Date, NOT the Year column.
fsi["Date"] = pd.to_datetime(
    fsi["Date"],
    format="%d/%m/%Y %H:%M:%S",
    errors="coerce"
)

# Keep Jan 1-20, 2023
fsi = fsi[
    (fsi["Date"] >= START_DATE) &
    (fsi["Date"] < END_DATE)
].copy()

print("FSI Jan 1-20:", len(fsi))


# ============================================================
# 4. PREPARE OUTPUT
# ============================================================

import sys
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
from ml.feature_extractor import generate_observation_id

print("\nGenerating observation IDs...")
firms["observation_id"] = firms.apply(generate_observation_id, axis=1)

firms["label"] = "Other / Uncertain"
firms["label_source"] = "Unmatched"
firms["label_confidence"] = 0.0

firms["fsi_distance_km"] = np.inf
firms["flare_distance_km"] = np.inf


# ============================================================
# 5. MATCH FIRMS -> FSI
# ============================================================

print("\nMatching FIRMS with FSI...")

if len(fsi) > 0:

    fsi_distance = nearest_distance_km(
        firms,
        fsi,
        "latitude",
        "longitude",
        "Lat",
        "Lon"
    )

    firms["fsi_distance_km"] = fsi_distance

    # First-pass spatial match
    fsi_spatial_match = fsi_distance <= MAX_DISTANCE_KM

    # --------------------------------------------------------
    # Need SAME DATE as well
    # --------------------------------------------------------

    fsi_dates = fsi["Date"].dt.normalize().values

    # For every FIRMS row, find nearest FSI point
    source_coords = np.radians(
        firms[["latitude", "longitude"]].values
    )

    target_coords = np.radians(
        fsi[["Lat", "Lon"]].values
    )

    tree = BallTree(target_coords, metric="haversine")

    distances, indices = tree.query(
        source_coords,
        k=1
    )

    nearest_indices = indices[:, 0]

    nearest_fsi_dates = fsi.iloc[
        nearest_indices
    ]["Date"].dt.normalize().values

    firms_dates = firms["acq_date"].dt.normalize().values

    same_date = firms_dates == nearest_fsi_dates

    fsi_match = fsi_spatial_match & same_date

    # Assign Wildfire
    firms.loc[fsi_match, "label"] = "Wildfire"
    firms.loc[fsi_match, "label_source"] = "FSI"
    firms.loc[fsi_match, "label_confidence"] = 0.95

else:
    fsi_match = np.zeros(len(firms), dtype=bool)


print("FSI matches:", fsi_match.sum())


# ============================================================
# 6. MATCH FIRMS -> WORLD BANK FLARES
# ============================================================

print("\nMatching FIRMS with World Bank flare locations...")

if len(flares) > 0:

    flare_distance = nearest_distance_km(
        firms,
        flares,
        "latitude",
        "longitude",
        "Latitude",
        "Longitude"
    )

    firms["flare_distance_km"] = flare_distance

    flare_match = flare_distance <= MAX_DISTANCE_KM

else:
    flare_match = np.zeros(len(firms), dtype=bool)


print("World Bank flare matches:", flare_match.sum())


# ============================================================
# 7. ASSIGN GAS FLARE LABEL
# ============================================================

# FSI gets priority if both sources match.
gas_flare_match = flare_match & (~fsi_match)

firms.loc[gas_flare_match, "label"] = "Gas Flare"
firms.loc[gas_flare_match, "label_source"] = "WorldBank_GFMR"
firms.loc[gas_flare_match, "label_confidence"] = 0.90


# ============================================================
# 8. SAVE
# ============================================================

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

firms.to_csv(
    OUTPUT_FILE,
    index=False
)


# ============================================================
# 9. SUMMARY
# ============================================================

print("\n========================================")
print("MATCHING COMPLETE")
print("========================================")

print("\nTotal FIRMS:", len(firms))

print("\nFSI matches:", fsi_match.sum())

print(
    "World Bank flare matches:",
    gas_flare_match.sum()
)

print("\nFinal classes:")

print(
    firms["label"].value_counts()
)

print("\nLabel sources:")

print(
    firms["label_source"].value_counts()
)

print("\nSaved to:")
print(OUTPUT_FILE)

print("\n========================================")
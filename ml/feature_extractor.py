"""Feature engineering and vectorization for Thermal Anomaly ML Classification.
Shared between offline training (ml/train.py) and real-time backend inference.
"""

from datetime import datetime
import math
from typing import Any, Dict, List, Union
import numpy as np
import pandas as pd

# Standard categorical vocabularies
INDUSTRIAL_SITE_TYPES = [
    "refinery",
    "steel_plant",
    "power_plant",
    "petrochemical",
    "chemical_facility",
    "none"
]

LAND_COVERS = [
    "industrial",
    "urban_industrial",
    "urban",
    "cropland",
    "forest",
    "barren",
    "other"
]

TARGET_CLASSES = [
    "Industrial Fire",
    "Gas Flare / Persistent Thermal Source",
    "Wildfire / Natural Fire",
    "Agricultural Burn",
    "Mining / Industrial Thermal Activity",
    "Other / Uncertain"
]

FEATURE_COLUMNS = [
    "brightness_temperature",
    "frp",
    "confidence",
    "is_night",
    "hour_sin",
    "hour_cos",
    "historical_fire_count",
    "persistence_score",
    "distance_to_industrial_site",
    "distance_to_residential_area",
    "fire_cluster_density"
] + [f"ind_type_{t}" for t in INDUSTRIAL_SITE_TYPES] + [f"land_cover_{lc}" for lc in LAND_COVERS]


def parse_hour_cyclic(dt_val: Union[str, datetime]) -> tuple[float, float]:
    """Calculate cyclic sine and cosine for hour of day to preserve 23h -> 00h continuity."""
    if isinstance(dt_val, str):
        try:
            # Handle ISO format strings like 2026-09-12T14:30:00Z
            clean_str = dt_val.replace("Z", "+00:00")
            dt = datetime.fromisoformat(clean_str)
            hour = dt.hour + (dt.minute / 60.0)
        except Exception:
            hour = 12.0
    elif isinstance(dt_val, datetime):
        hour = dt_val.hour + (dt_val.minute / 60.0)
    else:
        hour = 12.0

    hour_angle = 2 * math.pi * (hour / 24.0)
    return math.sin(hour_angle), math.cos(hour_angle)


def extract_feature_vector(row: Union[Dict[str, Any], pd.Series]) -> np.ndarray:
    """Extract a 1D numpy feature vector from a dictionary or Pandas series.
    Guarantees consistent feature order.
    """
    bt = float(row.get("brightness_temperature", 330.0))
    frp = float(row.get("frp", 50.0))
    conf = float(row.get("confidence", 70.0))

    day_night = str(row.get("day_night", "D")).upper()
    is_night = 1.0 if "N" in day_night else 0.0

    det_time = row.get("detection_time", "2026-09-17T12:00:00Z")
    sin_h, cos_h = parse_hour_cyclic(det_time)

    hist_count = float(row.get("historical_fire_count", 1))
    persist = float(row.get("persistence_score", 0.1))
    dist_ind = float(row.get("distance_to_industrial_site", 25.0))
    dist_res = float(row.get("distance_to_residential_area", 5.0))
    density = float(row.get("fire_cluster_density", 0.3))

    ind_type = str(row.get("industrial_site_type", "none")).lower().strip()
    land_cover = str(row.get("land_cover", "other")).lower().strip()

    features = [
        bt,
        frp,
        conf,
        is_night,
        sin_h,
        cos_h,
        hist_count,
        persist,
        dist_ind,
        dist_res,
        density
    ]

    # One-hot encoding for industrial site type
    for itype in INDUSTRIAL_SITE_TYPES:
        features.append(1.0 if ind_type == itype else 0.0)

    # One-hot encoding for land cover
    for lc in LAND_COVERS:
        features.append(1.0 if land_cover == lc else 0.0)

    return np.array(features, dtype=np.float32)


def extract_features_df(df: pd.DataFrame) -> pd.DataFrame:
    """Vectorize an entire pandas DataFrame of observations."""
    feature_matrix = [extract_feature_vector(row) for _, row in df.iterrows()]
    return pd.DataFrame(feature_matrix, columns=FEATURE_COLUMNS)

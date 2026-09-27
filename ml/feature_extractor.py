"""Feature engineering and vectorization for Thermal Anomaly ML Classification.

Shared between:
1. Offline training (ml/train.py)
2. Real-time backend inference

Supports:
- Raw NASA FIRMS observations
- Already feature-engineered observations
- Industrial site context
- Residential area context
- Historical/persistence features when available
"""

from datetime import datetime
import json
import math
from pathlib import Path
from typing import Any, Dict, Union

import numpy as np
import pandas as pd


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

RAW_FIRMS_FILE = PROJECT_ROOT / "data/raw/firms_archive/2023/firms_2023.csv"
# Change these two filenames if your actual JSON filenames differ.
INDUSTRIAL_SITES_FILE = (
    PROJECT_ROOT / "data" / "industrial_sites_seed.json"
)

RESIDENTIAL_AREAS_FILE = (
    PROJECT_ROOT / "data" / "residential_areas_seed.json"
)

OUTPUT_FILE = PROJECT_ROOT / "data/processed/firms_features_2023.csv"


# ============================================================
# CONFIGURATION
# ============================================================

# We only assign an industrial site type when the
# FIRMS detection is reasonably close to a known site.
INDUSTRIAL_CONTEXT_RADIUS_KM = 25.0


# ============================================================
# CATEGORICAL VOCABULARIES
# ============================================================

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


# ============================================================
# FINAL MODEL FEATURE COLUMNS
# ============================================================

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
]

FEATURE_COLUMNS += [
    f"ind_type_{site_type}"
    for site_type in INDUSTRIAL_SITE_TYPES
]

FEATURE_COLUMNS += [
    f"land_cover_{land_cover}"
    for land_cover in LAND_COVERS
]


# ============================================================
# BASIC HELPERS
# ============================================================

def safe_float(
    value: Any,
    default: float = 0.0
) -> float:
    """Safely convert a value to float."""

    try:

        if value is None:
            return default

        if pd.isna(value):
            return default

        return float(value)

    except (ValueError, TypeError):

        return default


def parse_confidence(value: Any) -> float:
    """
    Convert FIRMS confidence into numerical form.

    FIRMS commonly uses:
        l = low
        n = nominal
        h = high

    Numerical confidence values are also accepted.
    """

    if value is None:
        return 1.0

    if pd.isna(value):
        return 1.0

    value_str = str(value).strip().lower()

    confidence_map = {
        "l": 0.0,
        "n": 1.0,
        "h": 2.0
    }

    if value_str in confidence_map:
        return confidence_map[value_str]

    return safe_float(
        value,
        1.0
    )


# ============================================================
# DATE / TIME
# ============================================================

def parse_detection_time(
    row: Union[Dict[str, Any], pd.Series]
):
    """
    Extract detection time from either:

    Training data:
        detection_time

    Raw FIRMS:
        acq_date + acq_time
    """

    # Already engineered data
    detection_time = row.get(
        "detection_time"
    )

    if (
        detection_time is not None
        and not pd.isna(detection_time)
    ):
        return detection_time

    # Raw FIRMS data
    acq_date = row.get(
        "acq_date"
    )

    acq_time = row.get(
        "acq_time"
    )

    if (
        acq_date is not None
        and acq_time is not None
    ):

        try:

            time_str = str(
                acq_time
            ).split(".")[0].zfill(4)

            return f"{acq_date} {time_str}"

        except Exception:
            pass

    # Safe fallback
    return "2026-09-17T12:00:00"


def parse_hour_cyclic(
    dt_val: Union[str, datetime]
) -> tuple[float, float]:
    """
    Convert hour of day into cyclic sine/cosine.

    This preserves the fact that:
        23:00 and 00:00
    are close in time.
    """

    if isinstance(
        dt_val,
        str
    ):

        try:

            clean_str = dt_val.replace(
                "Z",
                "+00:00"
            )

            dt = datetime.fromisoformat(
                clean_str
            )

            hour = (
                dt.hour
                + dt.minute / 60.0
            )

        except Exception:

            try:

                dt = pd.to_datetime(
                    dt_val
                )

                hour = (
                    dt.hour
                    + dt.minute / 60.0
                )

            except Exception:

                hour = 12.0

    elif isinstance(
        dt_val,
        datetime
    ):

        hour = (
            dt_val.hour
            + dt_val.minute / 60.0
        )

    else:

        hour = 12.0

    hour_angle = (
        2
        * math.pi
        * (hour / 24.0)
    )

    return (
        math.sin(hour_angle),
        math.cos(hour_angle)
    )


# ============================================================
# JSON CONTEXT DATA
# ============================================================

def load_json_file(
    path: Path
) -> list:
    """Load JSON context data."""

    if not path.exists():

        print(
            f"WARNING: Context file not found:\n"
            f"  {path}"
        )

        return []

    try:

        with open(
            path,
            "r",
            encoding="utf-8"
        ) as file:

            data = json.load(file)

        if not isinstance(
            data,
            list
        ):

            print(
                f"WARNING: Expected a JSON list in {path}"
            )

            return []

        return data

    except Exception as e:

        print(
            f"WARNING: Could not load {path}"
        )

        print(
            f"Reason: {e}"
        )

        return []


# ============================================================
# GEO / DISTANCE
# ============================================================

def haversine_distance_km(
    lat1: float,
    lon1: float,
    lat2: float,
    lon2: float
) -> float:
    """
    Calculate great-circle distance between
    two latitude/longitude points.
    """

    earth_radius_km = 6371.0

    lat1_rad = math.radians(
        lat1
    )

    lat2_rad = math.radians(
        lat2
    )

    delta_lat = (
        lat2_rad
        - lat1_rad
    )

    delta_lon = math.radians(
        lon2 - lon1
    )

    a = (
        math.sin(delta_lat / 2) ** 2
        +
        math.cos(lat1_rad)
        *
        math.cos(lat2_rad)
        *
        math.sin(delta_lon / 2) ** 2
    )

    a = min(
        max(a, 0.0),
        1.0
    )

    c = (
        2
        * math.atan2(
            math.sqrt(a),
            math.sqrt(1 - a)
        )
    )

    return (
        earth_radius_km
        * c
    )


# ============================================================
# INDUSTRIAL CONTEXT
# ============================================================

def find_nearest_industrial_site(
    latitude: float,
    longitude: float,
    industrial_sites: list
) -> tuple[float, str]:
    """
    Find nearest known industrial site.

    Returns:
        distance in km
        industrial site type
    """

    if not industrial_sites:

        return (
            25.0,
            "none"
        )

    nearest_distance = float(
        "inf"
    )

    nearest_type = "none"

    for site in industrial_sites:

        site_lat = safe_float(
            site.get("latitude"),
            None
        )

        site_lon = safe_float(
            site.get("longitude"),
            None
        )

        if (
            site_lat is None
            or site_lon is None
        ):
            continue

        distance = haversine_distance_km(
            latitude,
            longitude,
            site_lat,
            site_lon
        )

        if distance < nearest_distance:

            nearest_distance = distance

            nearest_type = str(
                site.get(
                    "type",
                    "none"
                )
            ).lower().strip()

    # If no valid site was found
    if nearest_distance == float(
        "inf"
    ):

        return (
            25.0,
            "none"
        )

    # Only use the site type when reasonably close
    if (
        nearest_distance
        <= INDUSTRIAL_CONTEXT_RADIUS_KM
    ):

        if nearest_type not in INDUSTRIAL_SITE_TYPES:

            nearest_type = "none"

    else:

        nearest_type = "none"

    return (
        nearest_distance,
        nearest_type
    )


# ============================================================
# RESIDENTIAL CONTEXT
# ============================================================

def find_nearest_residential_area(
    latitude: float,
    longitude: float,
    residential_areas: list
) -> float:
    """
    Find nearest known residential area.
    """

    if not residential_areas:

        return 5.0

    nearest_distance = float(
        "inf"
    )

    for area in residential_areas:

        area_lat = safe_float(
            area.get("latitude"),
            None
        )

        area_lon = safe_float(
            area.get("longitude"),
            None
        )

        if (
            area_lat is None
            or area_lon is None
        ):
            continue

        distance = haversine_distance_km(
            latitude,
            longitude,
            area_lat,
            area_lon
        )

        if distance < nearest_distance:

            nearest_distance = distance

    if nearest_distance == float(
        "inf"
    ):

        return 5.0

    return nearest_distance


# ============================================================
# FEATURE EXTRACTION
# ============================================================

def extract_feature_vector(
    row: Union[
        Dict[str, Any],
        pd.Series
    ]
) -> np.ndarray:
    """
    Extract one consistent ML feature vector.

    Supports:
    - Raw FIRMS rows
    - Feature-engineered rows
    """

    # --------------------------------------------------------
    # BRIGHTNESS TEMPERATURE
    # --------------------------------------------------------

    if (
        "brightness_temperature" in row
        and not pd.isna(
            row.get(
                "brightness_temperature"
            )
        )
    ):

        brightness_temperature = safe_float(
            row.get(
                "brightness_temperature"
            ),
            330.0
        )

    else:

        brightness_temperature = safe_float(
            row.get(
                "bright_ti4"
            ),
            330.0
        )


    # --------------------------------------------------------
    # FRP
    # --------------------------------------------------------

    frp = safe_float(
        row.get(
            "frp"
        ),
        50.0
    )


    # --------------------------------------------------------
    # CONFIDENCE
    # --------------------------------------------------------

    confidence = parse_confidence(
        row.get(
            "confidence"
        )
    )


    # --------------------------------------------------------
    # DAY / NIGHT
    # --------------------------------------------------------

    day_night = row.get(
        "day_night",
        row.get(
            "daynight",
            "D"
        )
    )

    day_night = str(
        day_night
    ).upper()

    is_night = (
        1.0
        if "N" in day_night
        else 0.0
    )


    # --------------------------------------------------------
    # TIME
    # --------------------------------------------------------

    detection_time = parse_detection_time(
        row
    )

    hour_sin, hour_cos = parse_hour_cyclic(
        detection_time
    )


    # --------------------------------------------------------
    # HISTORICAL FEATURES
    #
    # These are supported here but will be calculated
    # properly in the next stage.
    # --------------------------------------------------------

    historical_fire_count = safe_float(
        row.get(
            "historical_fire_count"
        ),
        1.0
    )

    persistence_score = safe_float(
        row.get(
            "persistence_score"
        ),
        0.1
    )

    fire_cluster_density = safe_float(
        row.get(
            "fire_cluster_density"
        ),
        0.3
    )


    # --------------------------------------------------------
    # COORDINATES
    # --------------------------------------------------------

    latitude = safe_float(
        row.get(
            "latitude"
        ),
        None
    )

    longitude = safe_float(
        row.get(
            "longitude"
        ),
        None
    )


    # --------------------------------------------------------
    # INDUSTRIAL + RESIDENTIAL CONTEXT
    # --------------------------------------------------------

    industrial_sites = row.get(
        "_industrial_sites"
    )

    residential_areas = row.get(
        "_residential_areas"
    )


    # Industrial distance
    if (
        latitude is not None
        and longitude is not None
        and industrial_sites is not None
    ):

        distance_to_industrial_site, detected_industrial_type = (
            find_nearest_industrial_site(
                latitude,
                longitude,
                industrial_sites
            )
        )

    else:

        distance_to_industrial_site = safe_float(
            row.get(
                "distance_to_industrial_site"
            ),
            25.0
        )

        detected_industrial_type = str(
            row.get(
                "industrial_site_type",
                "none"
            )
        ).lower().strip()


    # Residential distance
    if (
        latitude is not None
        and longitude is not None
        and residential_areas is not None
    ):

        distance_to_residential_area = (
            find_nearest_residential_area(
                latitude,
                longitude,
                residential_areas
            )
        )

    else:

        distance_to_residential_area = safe_float(
            row.get(
                "distance_to_residential_area"
            ),
            5.0
        )


    # --------------------------------------------------------
    # INDUSTRIAL SITE TYPE
    # --------------------------------------------------------

    industrial_site_type = (
        detected_industrial_type
    )

    if (
        industrial_site_type
        not in INDUSTRIAL_SITE_TYPES
    ):

        industrial_site_type = "none"


    # --------------------------------------------------------
    # LAND COVER
    # --------------------------------------------------------

    land_cover = str(
        row.get(
            "land_cover",
            "other"
        )
    ).lower().strip()

    if (
        land_cover
        not in LAND_COVERS
    ):

        land_cover = "other"


    # --------------------------------------------------------
    # NUMERICAL FEATURES
    # --------------------------------------------------------

    features = [
        brightness_temperature,
        frp,
        confidence,
        is_night,
        hour_sin,
        hour_cos,
        historical_fire_count,
        persistence_score,
        distance_to_industrial_site,
        distance_to_residential_area,
        fire_cluster_density
    ]


    # --------------------------------------------------------
    # ONE-HOT ENCODING
    # INDUSTRIAL SITE TYPE
    # --------------------------------------------------------

    for site_type in INDUSTRIAL_SITE_TYPES:

        features.append(
            1.0
            if industrial_site_type == site_type
            else 0.0
        )


    # --------------------------------------------------------
    # ONE-HOT ENCODING
    # LAND COVER
    # --------------------------------------------------------

    for cover in LAND_COVERS:

        features.append(
            1.0
            if land_cover == cover
            else 0.0
        )


    return np.array(
        features,
        dtype=np.float32
    )


def generate_observation_id(row: Union[Dict[str, Any], pd.Series]) -> str:
    """Generate a stable observation ID."""
    lat = row.get("latitude")
    lon = row.get("longitude")
    date = row.get("acq_date", "")
    
    if hasattr(date, "strftime"):
        date_str = date.strftime("%Y-%m-%d")
    elif isinstance(date, str) and " " in date:
        date_str = date.split(" ")[0]
    else:
        date_str = str(date)
        
    time = row.get("acq_time", "")
    sat = row.get("satellite", "")
    instr = row.get("instrument", "")
    
    if lat is None or lon is None:
        return ""
    
    # Clean time to 4 digits if possible
    try:
        if str(time) != "nan" and time != "":
            time_str = str(time).split(".")[0].zfill(4)
        else:
            time_str = "0000"
    except Exception:
        time_str = "0000"
        
    return f"{lat:.4f}_{lon:.4f}_{date_str}_{time_str}_{sat}_{instr}"


# ============================================================
# DATAFRAME FEATURE EXTRACTION
# ============================================================

def extract_features_df(
    df: pd.DataFrame,
    industrial_sites: list = None,
    residential_areas: list = None
) -> pd.DataFrame:
    """
    Convert an entire DataFrame into ML features.

    Context data is passed into every row internally.
    """

    feature_matrix = []
    metadata = []

    for _, row in df.iterrows():

        row = row.copy()

        row["_industrial_sites"] = (
            industrial_sites
        )

        row["_residential_areas"] = (
            residential_areas
        )

        feature_vector = extract_feature_vector(
            row
        )
        
        obs_id = generate_observation_id(row)
        
        meta = {
            "observation_id": obs_id,
            "latitude": safe_float(row.get("latitude")),
            "longitude": safe_float(row.get("longitude")),
            "acq_date": row.get("acq_date"),
        }

        feature_matrix.append(feature_vector)
        metadata.append(meta)

    out_df = pd.DataFrame(
        feature_matrix,
        columns=FEATURE_COLUMNS,
        index=df.index
    )
    
    meta_df = pd.DataFrame(metadata, index=df.index)
    
    return pd.concat([meta_df, out_df], axis=1)


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print("=" * 60)
    print("THERMOSCOPE FEATURE EXTRACTION")
    print("=" * 60)


    # --------------------------------------------------------
    # CHECK RAW FIRMS FILE
    # --------------------------------------------------------

    print(
        "\nReading FIRMS data..."
    )

    if not RAW_FIRMS_FILE.exists():

        raise FileNotFoundError(
            f"\nRaw FIRMS file not found:\n"
            f"{RAW_FIRMS_FILE}"
        )

    df = pd.read_csv(
        RAW_FIRMS_FILE
    )

    print(
        f"Raw rows: {len(df)}"
    )


    # --------------------------------------------------------
    # LOAD INDUSTRIAL SITES
    # --------------------------------------------------------

    print(
        "\nLoading industrial sites..."
    )

    industrial_sites = load_json_file(
        INDUSTRIAL_SITES_FILE
    )

    print(
        f"Industrial sites loaded: "
        f"{len(industrial_sites)}"
    )


    # --------------------------------------------------------
    # LOAD RESIDENTIAL AREAS
    # --------------------------------------------------------

    print(
        "\nLoading residential areas..."
    )

    residential_areas = load_json_file(
        RESIDENTIAL_AREAS_FILE
    )

    print(
        f"Residential areas loaded: "
        f"{len(residential_areas)}"
    )


    # --------------------------------------------------------
    # EXTRACT FEATURES
    # --------------------------------------------------------

    print(
        "\nExtracting features..."
    )

    features = extract_features_df(
        df,
        industrial_sites=industrial_sites,
        residential_areas=residential_areas
    )


    # --------------------------------------------------------
    # SAVE
    # --------------------------------------------------------

    OUTPUT_FILE.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    features.to_csv(
        OUTPUT_FILE,
        index=False
    )


    # --------------------------------------------------------
    # SUMMARY
    # --------------------------------------------------------

    print(
        "\n" + "=" * 60
    )

    print(
        "FEATURE EXTRACTION COMPLETE"
    )

    print(
        "=" * 60
    )

    print(
        f"Rows: {features.shape[0]}"
    )

    print(
        f"Features: {features.shape[1]}"
    )

    print(
        f"Output:\n{OUTPUT_FILE}"
    )


    # --------------------------------------------------------
    # SHOW FEATURE COLUMNS
    # --------------------------------------------------------

    print(
        "\nGenerated feature columns:"
    )

    for i, column in enumerate(
        features.columns,
        start=1
    ):

        print(
            f"{i:2}. {column}"
        )


    # --------------------------------------------------------
    # SHOW SAMPLE
    # --------------------------------------------------------

    print(
        "\nFirst 5 rows:"
    )

    print(
        features.head().to_string()
    )
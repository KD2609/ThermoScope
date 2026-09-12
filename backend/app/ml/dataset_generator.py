import math
import numpy as np
import pandas as pd
from typing import Optional

CLASSES = [
    "Potential Industrial Fire",
    "Routine / Persistent Industrial Thermal Source",
    "Gas Flare / Combustion Source",
    "Agricultural / Biomass Burn",
    "Vegetation / Wildfire",
    "Mining-Related Thermal Activity",
    "Unknown Thermal Anomaly",
]

SPATIAL_GROUPS = [
    "GUJARAT_JAMNAGAR",
    "GUJARAT_HAZIRA",
    "GUJARAT_MUNDRA",
    "ODISHA_ANGUL",
    "CHHATTISGARH_KORBA",
    "JHARKHAND_JHARIA",
    "ASSAM_DIGBOI",
    "MAHARASHTRA_TROMBAY",
    "PUNJAB_SANGRUR",
    "PUNJAB_LUDHIANA",
    "HARYANA_KARNAL",
    "ODISHA_SIMILIPAL",
    "CHHATTISGARH_BASTAR",
    "DELHI_NCR",
    "CENTRAL_SEMIARID",
]

def generate_expanded_dataset(
    baseline_sample_count: int = 370,
    expansion_factor: float = 10.0,
    random_seed: int = 42
) -> pd.DataFrame:
    """
    Generate an expanded, diverse synthetic/curated training dataset for thermal anomaly classification.
    Scale: ~10x relative to the measured baseline dataset size (e.g. 370 -> ~3,700 samples).
    
    IMPORTANT:
    * Does NOT duplicate rows.
    * Generates realistic continuous and categorical distributions with physical noise and edge cases.
    * Each row is tagged with a `spatial_group_key` for grouped cross-validation to prevent spatial leakage.
    * Clearly documented as curated/synthetic training data until real satellite labels are integrated.
    """
    np.random.seed(random_seed)
    target_total = int(round(baseline_sample_count * expansion_factor))

    # Target class allocation balancing representation while mirroring real-world frequency
    # 0: Industrial Fire (~15%)
    # 1: Routine Industrial (~18%)
    # 2: Gas Flare (~14%)
    # 3: Agricultural Burn (~20%)
    # 4: Wildfire (~14%)
    # 5: Mining Activity (~14%)
    # 6: Unknown (~5%)
    class_ratios = [0.15, 0.18, 0.14, 0.20, 0.14, 0.14, 0.05]
    class_counts = [int(round(r * target_total)) for r in class_ratios]
    # Adjust last class so total exactly matches target_total
    class_counts[-1] = target_total - sum(class_counts[:-1])

    rows = []

    # -------------------------------------------------------------
    # Class 0: Potential Industrial Fire
    # -------------------------------------------------------------
    ind_groups = ["GUJARAT_JAMNAGAR", "GUJARAT_HAZIRA", "GUJARAT_MUNDRA", "ODISHA_ANGUL", "MAHARASHTRA_TROMBAY", "ASSAM_DIGBOI"]
    for i in range(class_counts[0]):
        group = np.random.choice(ind_groups)
        is_edge_case = (i % 5 == 0)

        if is_edge_case:
            # Edge case 1: Large facility perimeter (further from center but inside or on boundary)
            dist_m = float(np.random.uniform(800, 2600))
            is_inside = int(np.random.choice([0, 1], p=[0.25, 0.75]))
            dist_boundary = 0.0 if is_inside else float(np.random.uniform(10, 350))
            frp = float(np.random.uniform(75, 180))
            dev = float(np.random.uniform(45, 140))
            count_7d = int(np.random.randint(1, 4))
            count_30d = int(np.random.randint(2, 10))
            has_hist = 1
        elif i % 5 == 1:
            # Edge case 2: Sudden acute surge with low/sparse historical observations
            dist_m = float(np.random.uniform(30, 700))
            is_inside = 1
            dist_boundary = 0.0
            frp = float(np.random.uniform(120, 380))
            dev = float(np.random.uniform(80, 300))
            count_7d = 1
            count_30d = 1
            has_hist = 0
        else:
            # Standard Industrial Fire: high FRP, inside boundary, acute baseline elevation
            dist_m = float(np.random.uniform(20, 750))
            is_inside = 1
            dist_boundary = 0.0
            frp = float(np.random.uniform(110, 420))
            dev = float(np.random.uniform(65, 320))
            count_7d = int(np.random.randint(1, 5))
            count_30d = int(np.random.randint(3, 15))
            has_hist = 1

        is_night = int(np.random.choice([0, 1], p=[0.35, 0.65]))
        brightness = float(np.clip(330.0 + (frp * 0.22) + np.random.normal(0, 8), 320.0, 480.0))
        asset_cat = int(np.random.choice([0, 1, 2, 3]))  # Refinery, Power Plant, LNG, Steel
        asset_crit = int(np.random.choice([2, 3], p=[0.3, 0.7]))  # HIGH or CRITICAL
        land_code = 0  # Industrial
        settlement_dist = float(np.random.uniform(400, 3500))

        rows.append(_build_sample_dict(
            frp=frp, brightness=brightness, is_night=is_night,
            dist_m=dist_m, is_inside=is_inside, dist_boundary=dist_boundary,
            asset_cat=asset_cat, asset_crit=asset_crit, land_code=land_code,
            settlement_dist=settlement_dist, count_7d=count_7d, count_30d=count_30d,
            has_hist=has_hist, dev=dev, group=group, label=0
        ))

    # -------------------------------------------------------------
    # Class 1: Routine / Persistent Industrial Thermal Source
    # -------------------------------------------------------------
    routine_groups = ["CHHATTISGARH_KORBA", "ODISHA_ANGUL", "GUJARAT_MUNDRA", "GUJARAT_JAMNAGAR", "MAHARASHTRA_TROMBAY"]
    for i in range(class_counts[1]):
        group = np.random.choice(routine_groups)
        is_edge = (i % 6 == 0)

        dist_m = float(np.random.uniform(40, 950))
        is_inside = int(np.random.choice([1, 0], p=[0.92, 0.08]))
        dist_boundary = 0.0 if is_inside else float(np.random.uniform(10, 200))
        
        if is_edge:
            # Edge case: Operational load shift (slight deviation drop or rise)
            frp = float(np.random.uniform(30, 95))
            dev = float(np.random.uniform(-35, 35))
            count_7d = int(np.random.randint(3, 8))
            count_30d = int(np.random.randint(10, 25))
        else:
            # Steady baseline operational heat (power plant stack, slag furnace)
            frp = float(np.random.uniform(35, 85))
            dev = float(np.random.uniform(-18, 22))
            count_7d = int(np.random.randint(4, 14))
            count_30d = int(np.random.randint(18, 42))

        is_night = int(np.random.choice([0, 1], p=[0.45, 0.55]))
        brightness = float(np.clip(318.0 + (frp * 0.15) + np.random.normal(0, 5), 312.0, 360.0))
        asset_cat = int(np.random.choice([0, 1, 3], p=[0.25, 0.55, 0.20]))
        asset_crit = int(np.random.choice([1, 2, 3], p=[0.2, 0.5, 0.3]))
        land_code = 0
        settlement_dist = float(np.random.uniform(1200, 4500))

        rows.append(_build_sample_dict(
            frp=frp, brightness=brightness, is_night=is_night,
            dist_m=dist_m, is_inside=is_inside, dist_boundary=dist_boundary,
            asset_cat=asset_cat, asset_crit=asset_crit, land_code=land_code,
            settlement_dist=settlement_dist, count_7d=count_7d, count_30d=count_30d,
            has_hist=1, dev=dev, group=group, label=1
        ))

    # -------------------------------------------------------------
    # Class 2: Gas Flare / Combustion Source
    # -------------------------------------------------------------
    flare_groups = ["GUJARAT_HAZIRA", "GUJARAT_JAMNAGAR", "ASSAM_DIGBOI", "MAHARASHTRA_TROMBAY"]
    for i in range(class_counts[2]):
        group = np.random.choice(flare_groups)
        is_maintenance = (i % 7 == 0)

        dist_m = float(np.random.uniform(15, 450))
        is_inside = 1
        dist_boundary = 0.0

        if is_maintenance:
            # Maintenance flaring venting spike
            frp = float(np.random.uniform(70, 125))
            dev = float(np.random.uniform(20, 55))
            count_7d = int(np.random.randint(2, 6))
            count_30d = int(np.random.randint(8, 20))
        else:
            # Steady continuous flare combustion
            frp = float(np.random.uniform(32, 85))
            dev = float(np.random.uniform(-15, 28))
            count_7d = int(np.random.randint(4, 12))
            count_30d = int(np.random.randint(14, 35))

        is_night = int(np.random.choice([0, 1], p=[0.18, 0.82]))  # Strong night predominance
        brightness = float(np.clip(322.0 + (frp * 0.18) + np.random.normal(0, 6), 315.0, 385.0))
        asset_cat = int(np.random.choice([0, 2], p=[0.55, 0.45]))  # Refinery or LNG/Gas
        asset_crit = int(np.random.choice([2, 3], p=[0.35, 0.65]))
        land_code = 0
        settlement_dist = float(np.random.uniform(650, 2800))

        rows.append(_build_sample_dict(
            frp=frp, brightness=brightness, is_night=is_night,
            dist_m=dist_m, is_inside=is_inside, dist_boundary=dist_boundary,
            asset_cat=asset_cat, asset_crit=asset_crit, land_code=land_code,
            settlement_dist=settlement_dist, count_7d=count_7d, count_30d=count_30d,
            has_hist=1, dev=dev, group=group, label=2
        ))

    # -------------------------------------------------------------
    # Class 3: Agricultural / Biomass Burn
    # -------------------------------------------------------------
    agri_groups = ["PUNJAB_SANGRUR", "PUNJAB_LUDHIANA", "HARYANA_KARNAL", "CENTRAL_SEMIARID"]
    for i in range(class_counts[3]):
        group = np.random.choice(agri_groups)
        is_near_corridor = (i % 6 == 0)

        if is_near_corridor:
            # HARD NEGATIVE: Crop burning in farm field near an industrial corridor (1.5 - 3.5 km)
            dist_m = float(np.random.uniform(1500, 3500))
            is_inside = 0
            dist_boundary = float(np.random.uniform(800, 2200))
            frp = float(np.random.uniform(18, 55))
            asset_cat = int(np.random.choice([1, 5]))
            asset_crit = 1
        else:
            # Open rural agricultural field far from industrial infrastructure
            dist_m = float(np.random.uniform(3800, 35000))
            is_inside = 0
            dist_boundary = float(dist_m - 1500.0)
            frp = float(np.random.uniform(12, 65))
            asset_cat = 5  # Other / none
            asset_crit = 0  # LOW

        is_night = int(np.random.choice([0, 1], p=[0.82, 0.18]))  # Daytime predominance
        brightness = float(np.clip(308.0 + (frp * 0.12) + np.random.normal(0, 4), 302.0, 345.0))
        land_code = 1  # Agricultural
        settlement_dist = float(np.random.uniform(1200, 2600))
        count_7d = int(np.random.choice([1, 2, 3], p=[0.65, 0.25, 0.10]))
        count_30d = int(np.random.randint(1, 5))
        dev = 0.0
        has_hist = 0

        rows.append(_build_sample_dict(
            frp=frp, brightness=brightness, is_night=is_night,
            dist_m=dist_m, is_inside=is_inside, dist_boundary=dist_boundary,
            asset_cat=asset_cat, asset_crit=asset_crit, land_code=land_code,
            settlement_dist=settlement_dist, count_7d=count_7d, count_30d=count_30d,
            has_hist=has_hist, dev=dev, group=group, label=3
        ))

    # -------------------------------------------------------------
    # Class 4: Vegetation / Wildfire
    # -------------------------------------------------------------
    wildfire_groups = ["ODISHA_SIMILIPAL", "CHHATTISGARH_BASTAR", "CENTRAL_SEMIARID"]
    for i in range(class_counts[4]):
        group = np.random.choice(wildfire_groups)
        is_encroaching = (i % 8 == 0)

        if is_encroaching:
            # Wildfire near a remote industrial site or transmission corridor
            dist_m = float(np.random.uniform(4000, 7500))
            is_inside = 0
            dist_boundary = float(dist_m - 2000.0)
            frp = float(np.random.uniform(60, 220))
        else:
            # Deep reserve forest fire
            dist_m = float(np.random.uniform(8000, 45000))
            is_inside = 0
            dist_boundary = float(dist_m - 2000.0)
            frp = float(np.random.uniform(45, 340))

        is_night = int(np.random.choice([0, 1], p=[0.55, 0.45]))
        brightness = float(np.clip(320.0 + (frp * 0.16) + np.random.normal(0, 7), 312.0, 410.0))
        asset_cat = 5
        asset_crit = 0
        land_code = 2  # Forest
        settlement_dist = float(np.random.uniform(3500, 15000))
        count_7d = int(np.random.choice([1, 2, 3], p=[0.60, 0.30, 0.10]))
        count_30d = int(np.random.randint(1, 4))
        dev = 0.0
        has_hist = 0

        rows.append(_build_sample_dict(
            frp=frp, brightness=brightness, is_night=is_night,
            dist_m=dist_m, is_inside=is_inside, dist_boundary=dist_boundary,
            asset_cat=asset_cat, asset_crit=asset_crit, land_code=land_code,
            settlement_dist=settlement_dist, count_7d=count_7d, count_30d=count_30d,
            has_hist=has_hist, dev=dev, group=group, label=4
        ))

    # -------------------------------------------------------------
    # Class 5: Mining-Related Thermal Activity
    # -------------------------------------------------------------
    mining_groups = ["JHARKHAND_JHARIA", "CHHATTISGARH_KORBA", "ODISHA_ANGUL"]
    for i in range(class_counts[5]):
        group = np.random.choice(mining_groups)
        is_smoldering = (i % 4 == 0)

        dist_m = float(np.random.uniform(60, 2200))
        is_inside = int(np.random.choice([1, 0], p=[0.78, 0.22]))
        dist_boundary = 0.0 if is_inside else float(np.random.uniform(50, 450))

        if is_smoldering:
            # Smoldering subsurface coal seam fire (low FRP, highly persistent)
            frp = float(np.random.uniform(14, 38))
            dev = float(np.random.uniform(-10, 20))
            count_7d = int(np.random.randint(5, 15))
            count_30d = int(np.random.randint(18, 45))
        else:
            # Active opencast thermal blasting or coal heap fire
            frp = float(np.random.uniform(28, 85))
            dev = float(np.random.uniform(-15, 45))
            count_7d = int(np.random.randint(4, 12))
            count_30d = int(np.random.randint(12, 35))

        is_night = int(np.random.choice([0, 1], p=[0.25, 0.75]))  # Night predominance
        brightness = float(np.clip(314.0 + (frp * 0.14) + np.random.normal(0, 5), 310.0, 365.0))
        asset_cat = 4  # Mining Site
        asset_crit = int(np.random.choice([1, 2], p=[0.4, 0.6]))
        land_code = 4  # Mining
        settlement_dist = float(np.random.uniform(800, 2200))

        rows.append(_build_sample_dict(
            frp=frp, brightness=brightness, is_night=is_night,
            dist_m=dist_m, is_inside=is_inside, dist_boundary=dist_boundary,
            asset_cat=asset_cat, asset_crit=asset_crit, land_code=land_code,
            settlement_dist=settlement_dist, count_7d=count_7d, count_30d=count_30d,
            has_hist=1, dev=dev, group=group, label=5
        ))

    # -------------------------------------------------------------
    # Class 6: Unknown Thermal Anomaly
    # -------------------------------------------------------------
    unknown_groups = ["CENTRAL_SEMIARID", "DELHI_NCR", "PUNJAB_LUDHIANA"]
    for i in range(class_counts[6]):
        group = np.random.choice(unknown_groups)
        dist_m = float(np.random.uniform(1800, 9500))
        is_inside = 0
        dist_boundary = float(dist_m - 1200.0)
        frp = float(np.random.uniform(10, 48))
        is_night = int(np.random.choice([0, 1]))
        brightness = float(np.clip(306.0 + (frp * 0.11) + np.random.normal(0, 4), 302.0, 335.0))
        asset_cat = 5
        asset_crit = 0
        land_code = int(np.random.choice([3, 5]))  # Urban peripheral or open semi-arid
        settlement_dist = float(np.random.uniform(1500, 5000))
        count_7d = 1
        count_30d = 1
        dev = 0.0
        has_hist = 0

        rows.append(_build_sample_dict(
            frp=frp, brightness=brightness, is_night=is_night,
            dist_m=dist_m, is_inside=is_inside, dist_boundary=dist_boundary,
            asset_cat=asset_cat, asset_crit=asset_crit, land_code=land_code,
            settlement_dist=settlement_dist, count_7d=count_7d, count_30d=count_30d,
            has_hist=has_hist, dev=dev, group=group, label=6
        ))

    df = pd.DataFrame(rows)
    # Shuffle randomly
    df = df.sample(frac=1.0, random_state=random_seed).reset_index(drop=True)
    return df

def _build_sample_dict(
    frp: float,
    brightness: float,
    is_night: int,
    dist_m: float,
    is_inside: int,
    dist_boundary: float,
    asset_cat: int,
    asset_crit: int,
    land_code: int,
    settlement_dist: float,
    count_7d: int,
    count_30d: int,
    has_hist: int,
    dev: float,
    group: str,
    label: int
) -> dict:
    """Build standardized feature dictionary matching features.py definitions."""
    log_frp = round(math.log1p(max(0.0, frp)), 3)
    brightness_norm = round((brightness - 300.0) / 100.0, 3)
    frp_to_brightness_ratio = round(frp / max(1.0, brightness), 4)
    if frp < 25.0:
        frp_intensity_bucket = 0
    elif frp < 75.0:
        frp_intensity_bucket = 1
    elif frp < 150.0:
        frp_intensity_bucket = 2
    else:
        frp_intensity_bucket = 3
    frp_night_interaction = round(frp * is_night, 2)

    count_24h = min(count_7d, int(np.random.choice([0, 1, 2], p=[0.4, 0.4, 0.2])))
    distinct_active_days_30d = min(count_30d, max(1, count_7d * 2))
    recurrence_freq_per_week = round(count_30d * 7.0 / 30.0, 1)
    night_ratio = 1.0 if is_night else 0.2
    recent_vs_hist_ratio = round(count_24h / max(1, count_30d), 2)
    median_frp = round(frp / (1.0 + (dev / 100.0)), 1) if (has_hist and dev != 0.0) else frp

    asset_density_5km = 1 if is_inside else (0 if dist_m > 5000 else 1)
    asset_density_10km = 2 if is_inside else (1 if dist_m < 10000 else 0)
    nearest_asset_is_mining = 1 if (asset_cat == 4 or land_code == 4) else 0
    nearest_asset_is_flaring_type = 1 if asset_cat in [0, 2] else 0

    high_frp_inside_boundary = 1 if (frp > 100.0 and is_inside) else 0
    high_frp_high_abnormality = 1 if (frp > 100.0 and dev > 50.0) else 0
    industrial_proximity_and_persistence = 1 if (dist_m < 2000.0 and count_7d >= 3) else 0
    flare_candidate_interaction = 1 if (nearest_asset_is_flaring_type and is_inside and abs(dev) < 30.0) else 0
    forest_isolated_interaction = 1 if (land_code == 2 and count_30d <= 2) else 0
    agri_remote_interaction = 1 if (land_code == 1 and dist_m > 3000.0) else 0

    return {
        # Group 1: Baseline
        "frp": round(frp, 2),
        "distance_to_nearest_asset_m": round(dist_m, 1),

        # Group 2: Thermal
        "log_frp": log_frp,
        "brightness": round(brightness, 1),
        "brightness_norm": brightness_norm,
        "frp_to_brightness_ratio": frp_to_brightness_ratio,
        "frp_intensity_bucket": frp_intensity_bucket,
        "is_night": is_night,
        "frp_night_interaction": frp_night_interaction,

        # Group 3: Spatial
        "distance_to_boundary_m": round(dist_boundary, 1),
        "is_inside_boundary": is_inside,
        "asset_cat_code": asset_cat,
        "asset_crit_code": asset_crit,
        "asset_density_5km": asset_density_5km,
        "asset_density_10km": asset_density_10km,
        "nearest_asset_is_mining": nearest_asset_is_mining,
        "nearest_asset_is_flaring_type": nearest_asset_is_flaring_type,
        "land_code": land_code,
        "settlement_distance_m": round(settlement_dist, 1),

        # Group 4: Temporal
        "count_24h": count_24h,
        "count_7d": count_7d,
        "count_30d": count_30d,
        "distinct_active_days_30d": distinct_active_days_30d,
        "recurrence_freq_per_week": recurrence_freq_per_week,
        "night_ratio": night_ratio,
        "has_sufficient_history_flag": has_hist,
        "historical_median_frp_val": median_frp if has_hist else 0.0,
        "baseline_deviation_val": dev if has_hist else 0.0,
        "recent_vs_hist_ratio": recent_vs_hist_ratio,

        # Group 5: Interactions
        "high_frp_inside_boundary": high_frp_inside_boundary,
        "high_frp_high_abnormality": high_frp_high_abnormality,
        "industrial_proximity_and_persistence": industrial_proximity_and_persistence,
        "flare_candidate_interaction": flare_candidate_interaction,
        "forest_isolated_interaction": forest_isolated_interaction,
        "agri_remote_interaction": agri_remote_interaction,

        # Metadata
        "spatial_group_key": group,
        "target_class": label,
        "class_name": CLASSES[label]
    }

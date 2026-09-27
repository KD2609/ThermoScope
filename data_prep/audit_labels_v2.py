import pandas as pd
import numpy as np

pd.set_option('display.max_rows', 500)
pd.set_option('display.max_columns', 500)
pd.set_option('display.width', 1000)

print("--- FINAL LABEL-QUALITY AUDIT ---")

# Load labels
cr_df = pd.read_csv("data/labels/creams_matched.csv")
wb_df = pd.read_csv("data/labels/worldbank_sepnov_matched.csv")
fsi_df = pd.read_csv("data/labels/fsi_sepnov_matched.csv")

# 1. WORLD BANK SITE CONCENTRATION
print("\n=== AUDIT 1: WORLD BANK SITE CONCENTRATION ===")
wb_counts = wb_df.groupby("world_bank_id").size()
print(f"Min: {wb_counts.min()}")
print(f"Median: {wb_counts.median()}")
print(f"Mean: {wb_counts.mean():.2f}")
print(f"75th percentile: {wb_counts.quantile(0.75)}")
print(f"90th percentile: {wb_counts.quantile(0.90)}")
print(f"95th percentile: {wb_counts.quantile(0.95)}")
print(f"99th percentile: {wb_counts.quantile(0.99)}")
print(f"Max: {wb_counts.max()}")

print("\nDistribution of observations per site:")
print(f"  1 obs: {len(wb_counts[wb_counts == 1])}")
print(f"  2-5 obs: {len(wb_counts[(wb_counts >= 2) & (wb_counts <= 5)])}")
print(f"  6-10 obs: {len(wb_counts[(wb_counts >= 6) & (wb_counts <= 10)])}")
print(f"  11-25 obs: {len(wb_counts[(wb_counts >= 11) & (wb_counts <= 25)])}")
print(f"  26-50 obs: {len(wb_counts[(wb_counts >= 26) & (wb_counts <= 50)])}")
print(f"  51-100 obs: {len(wb_counts[(wb_counts >= 51) & (wb_counts <= 100)])}")
print(f"  >100 obs: {len(wb_counts[wb_counts > 100])}")

print("\nTop 20 most-observed flare locations:")
print(wb_counts.sort_values(ascending=False).head(20).to_string())

# 2. EVENT/SITE GROUPING
print("\n=== AUDIT 2: EVENT/SITE GROUPING ===")
def group_stats(name, df, group_col):
    if df.empty: return
    counts = df.groupby(group_col).size()
    print(f"\n{name} ({group_col}):")
    print(f"  Unique groups: {len(counts)}")
    print(f"  Observations: {len(df)}")
    print(f"  Obs/group -> min: {counts.min()}, median: {counts.median()}, mean: {counts.mean():.2f}, max: {counts.max()}")

group_stats("Agricultural Burn", cr_df, "creams_event_id")
group_stats("Gas Flare", wb_df, "world_bank_id")
group_stats("Wildfire", fsi_df, "fsi_event_id")

# 3. CROSS-SOURCE CONFLICTS CSV
print("\n=== AUDIT 3 & 5: CROSS-SOURCE CONFLICTS ===")
cr_obs = set(cr_df["observation_id"])
wb_obs = set(wb_df["observation_id"])
fsi_obs = set(fsi_df["observation_id"]) if not fsi_df.empty else set()

c_wb_cr = wb_obs.intersection(cr_obs)
c_fsi_wb = fsi_obs.intersection(wb_obs)
c_fsi_cr = fsi_obs.intersection(cr_obs)

print(f"FSI vs World Bank: {len(c_fsi_wb)} conflicts")
print(f"FSI vs CREAMS: {len(c_fsi_cr)} conflicts")
print(f"World Bank vs CREAMS: {len(c_wb_cr)} conflicts")

conflicts = []
for obs_id in c_wb_cr:
    wb_row = wb_df[wb_df["observation_id"] == obs_id].iloc[0]
    cr_row = cr_df[cr_df["observation_id"] == obs_id].iloc[0]
    
    conflicts.append({
        "observation_id": obs_id,
        "latitude": cr_row["latitude"],
        "longitude": cr_row["longitude"],
        "acq_date": str(cr_row["firms_datetime"])[:10],
        "acq_time": str(cr_row["firms_datetime"])[11:],
        "gas_flare_site_id": wb_row["world_bank_id"],
        "flare_distance_km": wb_row["spatial_distance_km"],
        "creams_event_id": cr_row["creams_event_id"],
        "creams_distance_km": cr_row["spatial_distance_km"],
        "time_difference_if_available": cr_row.get("temporal_difference_hours", "")
    })

if conflicts:
    conflicts_df = pd.DataFrame(conflicts)
    conflicts_df.to_csv("data/labels/conflicting_observations.csv", index=False)
    print("Created data/labels/conflicting_observations.csv")

# 4. DUPLICATES
print("\n=== AUDIT 4: DUPLICATES ===")
def check_dups(name, df):
    if df.empty: return
    dup_obs = df.duplicated(subset=["observation_id"]).sum()
    print(f"{name} duplicate observation_ids: {dup_obs}")

check_dups("CREAMS", cr_df)
check_dups("World Bank", wb_df)
check_dups("FSI", fsi_df)

# 6. TEMPORAL DISTRIBUTION
print("\n=== AUDIT 6: TEMPORAL DISTRIBUTION ===")
def temporal_dist(name, df):
    if df.empty: return
    df = df.copy()
    df["firms_datetime"] = pd.to_datetime(df["firms_datetime"])
    df["month"] = df["firms_datetime"].dt.month
    df["week"] = df["firms_datetime"].dt.isocalendar().week
    print(f"\n{name} by Month:")
    print(df["month"].value_counts().sort_index().to_dict())
    print(f"{name} by Week:")
    print(df["week"].value_counts().sort_index().to_dict())

temporal_dist("Agricultural Burn", cr_df)
temporal_dist("Gas Flare", wb_df)
temporal_dist("Wildfire", fsi_df)

# 7. FEATURE CONFOUNDING CHECK
print("\n=== AUDIT 7: FEATURE CONFOUNDING ===")
# We only have raw features for Sep-Nov so far. Let's load FIRMS raw for FRP and BT.
print("Loading raw FIRMS data to check available features...")
import glob
firms_files = glob.glob("data/raw/firms_archive/2023/VIIRS_*_2023-*.csv")
firms_df = pd.concat([pd.read_csv(f) for f in firms_files], ignore_index=True)
firms_df["acq_time_str"] = firms_df["acq_time"].astype(str).str.zfill(4)

def generate_observation_id(row):
    lat = float(row.get("latitude", 0.0))
    lon = float(row.get("longitude", 0.0))
    date_val = str(row.get("acq_date", ""))[:10]
    time_val = str(row.get("acq_time", "")).replace(":", "").zfill(4)
    if '.' in time_val: time_val = str(int(float(time_val))).zfill(4)
    sat = row.get("satellite", "")
    instr = row.get("instrument", "")
    return f"{lat:.4f}_{lon:.4f}_{date_val}_{time_val}_{sat}_{instr}"

firms_df["observation_id"] = firms_df.apply(generate_observation_id, axis=1)

def feature_stats(name, df):
    if df.empty: return
    merged = df.merge(firms_df, on="observation_id", how="inner")
    print(f"\n{name} ({len(merged)} matched records for features):")
    
    # FRP
    frp_col = "frp_x" if "frp_x" in merged.columns else "frp"
    if frp_col in merged.columns:
        s = merged[frp_col]
        print(f"  FRP -> Min: {s.min():.1f}, Med: {s.median():.1f}, Mean: {s.mean():.1f}, 75th: {s.quantile(0.75):.1f}, 95th: {s.quantile(0.95):.1f}, Max: {s.max():.1f}")
        
    # BT
    bt_col = "bright_ti4"
    if bt_col in merged.columns:
        s = merged[bt_col]
        print(f"  Bright_TI4 -> Min: {s.min():.1f}, Med: {s.median():.1f}, Mean: {s.mean():.1f}, 75th: {s.quantile(0.75):.1f}, 95th: {s.quantile(0.95):.1f}, Max: {s.max():.1f}")

    # Confidence
    conf = "confidence"
    if conf in merged.columns:
        print(f"  Confidence -> {merged[conf].value_counts().to_dict()}")
        
    # Day/Night
    dn = "daynight"
    if dn in merged.columns:
        print(f"  Day/Night -> {merged[dn].value_counts().to_dict()}")
        
feature_stats("Agricultural Burn", cr_df)
feature_stats("Gas Flare", wb_df)
feature_stats("Wildfire", fsi_df)

print("\n(Note: historical_fire_count, persistence_score, etc. are engineered during dataset construction and depend on proper chronological parsing. They are skipped here, but the extraction logic in ml/feature_extractor.py enforces chronological constraint.)")

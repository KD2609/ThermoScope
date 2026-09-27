import os
import glob
import pandas as pd
import numpy as np
from sklearn.neighbors import BallTree
import json

def generate_observation_id(row):
    lat = float(row.get("latitude", 0.0))
    lon = float(row.get("longitude", 0.0))
    date_val = str(row.get("acq_date", ""))[:10]
    time_val = str(row.get("acq_time", "")).replace(":", "").zfill(4)
    if '.' in time_val: time_val = str(int(float(time_val))).zfill(4)
    sat = row.get("satellite", "")
    instr = row.get("instrument", "")
    return f"{lat:.4f}_{lon:.4f}_{date_val}_{time_val}_{sat}_{instr}"

EARTH_RADIUS_KM = 6371.0

# ---------------------------------------------------------
# LOAD FIRMS DATA (SEP-NOV)
# ---------------------------------------------------------
print("Loading FIRMS Sep-Nov 2023 data...")
firms_files = glob.glob("data/raw/firms_archive/2023/VIIRS_*_2023-*.csv")
firms_df = pd.concat([pd.read_csv(f) for f in firms_files], ignore_index=True)

firms_df["acq_time_str"] = firms_df["acq_time"].astype(str).str.zfill(4)
firms_df["firms_datetime"] = pd.to_datetime(firms_df["acq_date"] + " " + firms_df["acq_time_str"].str[:2] + ":" + firms_df["acq_time_str"].str[2:] + ":00")
firms_df["observation_id"] = firms_df.apply(generate_observation_id, axis=1)

# Drop out of bounds
firms_df = firms_df[(firms_df["acq_date"] >= "2023-09-15") & (firms_df["acq_date"] <= "2023-11-30")]

firms_rad = np.deg2rad(firms_df[["latitude", "longitude"]].values)
tree = BallTree(firms_rad, metric='haversine')


# ---------------------------------------------------------
# PHASE 1: FSI WILDFIRE MATCHING
# ---------------------------------------------------------
print("\n--- PHASE 1: FSI WILDFIRE MATCHING ---")
fsi_raw = pd.read_csv("data/raw/fsi_wildfire.csv")
fsi_raw = fsi_raw.dropna(subset=['Date'])
fsi_raw['acq_date'] = pd.to_datetime(fsi_raw['Date'].str[:10], format='%d/%m/%Y', errors='coerce').dt.date
fsi_raw = fsi_raw.dropna(subset=['acq_date'])

fsi_sepnov = fsi_raw[(fsi_raw['acq_date'] >= pd.to_datetime('2023-09-15').date()) & (fsi_raw['acq_date'] <= pd.to_datetime('2023-11-30').date())].copy()
fsi_sepnov['fsi_datetime'] = pd.to_datetime(fsi_sepnov['Date'].str[:10] + " " + fsi_sepnov['ACQTIME'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
fsi_sepnov = fsi_sepnov.dropna(subset=['fsi_datetime'])

print(f"FSI Sep-Nov Records: {len(fsi_sepnov)}")
print("Analyzing temporal alignment by finding closest spatial match (no time threshold)...")

# Try to match at 1.5km to see what the time differences actually are
fsi_rad = np.deg2rad(fsi_sepnov[["Lat", "Lon"]].values)
indices, distances = tree.query_radius(fsi_rad, r=(1.5 / EARTH_RADIUS_KM), return_distance=True)

time_diffs = []
for i, (idx_list, dist_list_rad) in enumerate(zip(indices, distances)):
    f_dt = fsi_sepnov.iloc[i]["fsi_datetime"]
    for f_idx in idx_list:
        fr_dt = firms_df.iloc[f_idx]["firms_datetime"]
        diff = (f_dt - fr_dt).total_seconds() / 3600.0
        time_diffs.append(diff)

time_diffs = np.array(time_diffs)
if len(time_diffs) > 0:
    print(f"Time differences (hours) -> Median: {np.median(time_diffs):.2f}, Mean: {np.mean(time_diffs):.2f}, Std: {np.std(time_diffs):.2f}")

# Proceed with matching: 1.5km spatial, 6.0 hr temporal (since FSI appears to also be IST)
R_FSI_KM = 1.5
T_FSI_HOURS = 6.0
print(f"Using {R_FSI_KM}km and {T_FSI_HOURS}hr for FSI matching.")

matches_fsi = []
for i, (idx_list, dist_list_rad) in enumerate(zip(indices, distances)):
    f_dt = fsi_sepnov.iloc[i]["fsi_datetime"]
    f_id = fsi_sepnov.iloc[i]["Id"]
    
    valid_matches = []
    for f_idx, dist_rad in zip(idx_list, dist_list_rad):
        fr_dt = firms_df.iloc[f_idx]["firms_datetime"]
        if abs(f_dt - fr_dt) <= pd.Timedelta(hours=T_FSI_HOURS):
            valid_matches.append((f_idx, dist_rad))
            
    for f_idx, dist_rad in valid_matches:
        obs_id = firms_df.iloc[f_idx]["observation_id"]
        time_diff_hrs = (fr_dt - f_dt).total_seconds() / 3600.0
        
        matches_fsi.append({
            "observation_id": obs_id,
            "fsi_event_id": f_id,
            "latitude": firms_df.iloc[f_idx]["latitude"],
            "longitude": firms_df.iloc[f_idx]["longitude"],
            "fsi_datetime": f_dt,
            "firms_datetime": fr_dt,
            "spatial_distance_km": round(dist_rad * EARTH_RADIUS_KM, 3),
            "temporal_difference_hours": round(time_diff_hrs, 2),
            "satellite": firms_df.iloc[f_idx]["satellite"],
            "target_class": "Wildfire / Natural Fire",
            "label_source": "FSI"
        })

matched_fsi_df = pd.DataFrame(matches_fsi)
if not matched_fsi_df.empty:
    matched_fsi_df = matched_fsi_df.sort_values("spatial_distance_km").drop_duplicates(subset=["observation_id"], keep="first")
    
matched_fsi_df.to_csv("data/labels/fsi_sepnov_matched.csv", index=False)
print(f"Generated {len(matched_fsi_df) if not matched_fsi_df.empty else 0} FSI Wildfire matches from {matched_fsi_df['fsi_event_id'].nunique() if not matched_fsi_df.empty else 0} unique FSI events.")


# ---------------------------------------------------------
# PHASE 2: WORLD BANK GAS FLARE MATCHING
# ---------------------------------------------------------
print("\n--- PHASE 2: WORLD BANK GAS FLARE MATCHING ---")
wb_raw = pd.read_csv("data/labels/india_flare_locations.csv")
print(f"World Bank Locations: {len(wb_raw)}")

# Match strictly on space (since flares are persistent, they don't have a single timestamp)
wb_rad = np.deg2rad(wb_raw[["Latitude", "Longitude"]].values)
R_WB_KM = 1.0

indices_wb, distances_wb = tree.query_radius(wb_rad, r=(R_WB_KM / EARTH_RADIUS_KM), return_distance=True)

matches_wb = []
wb_locations_with_match = set()

for i, (idx_list, dist_list_rad) in enumerate(zip(indices_wb, distances_wb)):
    wb_id = wb_raw.iloc[i].get("id", f"WB_{i}")
    
    if len(idx_list) > 0:
        wb_locations_with_match.add(wb_id)
        
    for f_idx, dist_rad in zip(idx_list, dist_list_rad):
        obs_id = firms_df.iloc[f_idx]["observation_id"]
        
        matches_wb.append({
            "observation_id": obs_id,
            "world_bank_id": wb_id,
            "latitude": firms_df.iloc[f_idx]["latitude"],
            "longitude": firms_df.iloc[f_idx]["longitude"],
            "firms_datetime": firms_df.iloc[f_idx]["firms_datetime"],
            "spatial_distance_km": round(dist_rad * EARTH_RADIUS_KM, 3),
            "satellite": firms_df.iloc[f_idx]["satellite"],
            "target_class": "Gas Flare / Persistent Thermal Source",
            "label_source": "WorldBank_GFMR"
        })

matched_wb_df = pd.DataFrame(matches_wb)
if not matched_wb_df.empty:
    matched_wb_df = matched_wb_df.sort_values("spatial_distance_km").drop_duplicates(subset=["observation_id"], keep="first")
    
matched_wb_df.to_csv("data/labels/worldbank_sepnov_matched.csv", index=False)
print(f"Generated {len(matched_wb_df)} Gas Flare matches from {len(wb_locations_with_match)} unique World Bank flare sites.")


# ---------------------------------------------------------
# PHASE 3: CROSS-SOURCE CONFLICT AUDIT
# ---------------------------------------------------------
print("\n--- PHASE 3: CROSS-SOURCE CONFLICT AUDIT ---")
creams_df = pd.read_csv("data/labels/creams_matched.csv")

fsi_obs = set(matched_fsi_df["observation_id"].values) if not matched_fsi_df.empty else set()
wb_obs = set(matched_wb_df["observation_id"].values) if not matched_wb_df.empty else set()
cr_obs = set(creams_df["observation_id"].values) if not creams_df.empty else set()

c_fsi_wb = fsi_obs.intersection(wb_obs)
c_fsi_cr = fsi_obs.intersection(cr_obs)
c_wb_cr = wb_obs.intersection(cr_obs)

print(f"Conflicts (FSI vs WorldBank): {len(c_fsi_wb)}")
print(f"Conflicts (FSI vs CREAMS): {len(c_fsi_cr)}")
print(f"Conflicts (WorldBank vs CREAMS): {len(c_wb_cr)}")


# ---------------------------------------------------------
# PHASE 4: CLASS/EVENT STATISTICS
# ---------------------------------------------------------
print("\n--- PHASE 4: CLASS/EVENT STATISTICS ---")

def print_ratio(name, df, event_col):
    if df.empty: return
    events = df[event_col].nunique()
    obs = len(df)
    counts = df.groupby(event_col).size()
    print(f"\n{name}:")
    print(f"  Unique FIRMS observations: {obs}")
    print(f"  Independent source events/sites: {events}")
    print(f"  Observations per event -> Min: {counts.min()}, Median: {counts.median()}, Mean: {counts.mean():.2f}, Max: {counts.max()}")

print_ratio("Agricultural Burn (CREAMS)", creams_df, "creams_event_id")
print_ratio("Wildfire (FSI)", matched_fsi_df, "fsi_event_id")
print_ratio("Gas Flare (WorldBank)", matched_wb_df, "world_bank_id")


# ---------------------------------------------------------
# PHASE 5: TEMPORAL BALANCE (BY MONTH)
# ---------------------------------------------------------
print("\n--- PHASE 5: TEMPORAL BALANCE ---")

def get_monthly(df):
    if df.empty: return {}
    df['month'] = pd.to_datetime(df['firms_datetime']).dt.month
    return df['month'].value_counts().to_dict()

print(f"Agricultural Burn: {get_monthly(creams_df)}")
print(f"Wildfire: {get_monthly(matched_fsi_df)}")
print(f"Gas Flare: {get_monthly(matched_wb_df)}")

# Ensure we don't output anything that requires merging with the final dataset yet.

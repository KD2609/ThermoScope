import os
import glob
import pandas as pd
import numpy as np
from sklearn.neighbors import BallTree
import json

def generate_observation_id(row):
    lat = float(row.get("latitude", 0.0))
    lon = float(row.get("longitude", 0.0))
    
    date_val = row.get("acq_date", "")
    if hasattr(date_val, "strftime"):
        date_str = date_val.strftime("%Y-%m-%d")
    elif isinstance(date_val, str) and " " in date_val:
        date_str = date_val.split(" ")[0]
    else:
        date_str = str(date_val)[:10]
        
    time_val = row.get("acq_time", "")
    try:
        if str(time_val) != "nan" and time_val != "":
            # Handle float or string times
            time_str = str(int(float(time_val))).zfill(4) if '.' in str(time_val) or str(time_val).isdigit() else str(time_val).replace(":", "")[:4]
            # Since CREAMS has '01:48:08', we replace ':' and take first 4 -> '0148'
            if ':' in str(time_val):
                time_str = str(time_val).replace(":", "")[:4]
            else:
                time_str = str(time_val).zfill(4)
        else:
            time_str = "0000"
    except Exception:
        time_str = "0000"
        
    sat = row.get("satellite", "")
    instr = row.get("instrument", "")
    
    return f"{lat:.4f}_{lon:.4f}_{date_str}_{time_str}_{sat}_{instr}"


print("Loading datasets...")

# 1. Load CREAMS
creams_df = pd.read_csv("data/labels/creams_2023_events.csv")
creams_df["creams_datetime"] = pd.to_datetime(creams_df["acq_date"] + " " + creams_df["acq_time"])
creams_df["creams_id"] = ["CR_" + str(i) for i in range(len(creams_df))]

# 2. Load FIRMS
firms_files = glob.glob("data/raw/firms_archive/2023/VIIRS_SNPP_SP_2023-*.csv") + \
              glob.glob("data/raw/firms_archive/2023/VIIRS_NOAA20_SP_2023-*.csv")
dfs = []
for f in firms_files:
    dfs.append(pd.read_csv(f))
firms_df = pd.concat(dfs, ignore_index=True)

# Parse FIRMS datetime
firms_df["acq_time_str"] = firms_df["acq_time"].astype(str).str.zfill(4)
firms_df["firms_datetime"] = pd.to_datetime(firms_df["acq_date"] + " " + firms_df["acq_time_str"].str[:2] + ":" + firms_df["acq_time_str"].str[2:] + ":00")
firms_df["observation_id"] = firms_df.apply(generate_observation_id, axis=1)

# Clean date coverage
initial_rows = len(firms_df)
firms_df = firms_df[(firms_df["acq_date"] >= "2023-09-15") & (firms_df["acq_date"] <= "2023-11-30")]
removed_rows = initial_rows - len(firms_df)
print(f"Date Cleaning: Removed {removed_rows} rows outside 2023-09-15 to 2023-11-30.")

# 3. Load Existing Labels for Conflict Checking
try:
    fsi_df = pd.read_csv("data/labels/fsi_wildfires.csv")
    wb_df = pd.read_csv("data/labels/india_flares.csv")
    existing_obs_ids = set()
    if "observation_id" in fsi_df.columns:
        existing_obs_ids.update(fsi_df["observation_id"].values)
    if "observation_id" in wb_df.columns:
        existing_obs_ids.update(wb_df["observation_id"].values)
except Exception as e:
    existing_obs_ids = set()
    print("Warning: Could not load existing labels for conflict checking.", e)

EARTH_RADIUS_KM = 6371.0
firms_rad = np.deg2rad(firms_df[["latitude", "longitude"]].values)
creams_rad = np.deg2rad(creams_df[["latitude", "longitude"]].values)

# We want to match efficiently. Since there are only 2000 CREAMS and 250k FIRMS, 
# we can use BallTree on FIRMS and query for CREAMS.
tree = BallTree(firms_rad, metric='haversine')

radii = [0.5, 1.0, 2.0, 3.0, 5.0]
time_windows_hrs = [1.0, 3.0, 6.0, 12.0, 24.0]

results = []

for r_km in radii:
    r_rad = r_km / EARTH_RADIUS_KM
    
    # Query all points within max radius
    indices, distances = tree.query_radius(creams_rad, r=r_rad, return_distance=True)
    
    for t_hrs in time_windows_hrs:
        t_delta = pd.Timedelta(hours=t_hrs)
        
        matched_creams = set()
        matched_firms = set()
        
        c_to_many = 0
        dist_list = []
        time_diff_list = []
        conflicts = 0
        
        firms_matched_counts = {} # to check many-to-one
        
        for i, (idx_list, dist_list_rad) in enumerate(zip(indices, distances)):
            creams_dt = creams_df.iloc[i]["creams_datetime"]
            
            valid_firms_for_this_creams = []
            
            for f_idx, dist_rad in zip(idx_list, dist_list_rad):
                firms_dt = firms_df.iloc[f_idx]["firms_datetime"]
                
                # Check time window
                if abs(creams_dt - firms_dt) <= t_delta:
                    valid_firms_for_this_creams.append((f_idx, dist_rad))
                    
            if len(valid_firms_for_this_creams) > 0:
                matched_creams.add(i)
                if len(valid_firms_for_this_creams) > 1:
                    c_to_many += 1
                    
                for f_idx, dist_rad in valid_firms_for_this_creams:
                    matched_firms.add(f_idx)
                    dist_list.append(dist_rad * EARTH_RADIUS_KM)
                    
                    f_dt = firms_df.iloc[f_idx]["firms_datetime"]
                    time_diff_list.append(abs((creams_dt - f_dt).total_seconds() / 3600.0))
                    
                    obs_id = firms_df.iloc[f_idx]["observation_id"]
                    if obs_id in existing_obs_ids:
                        conflicts += 1
                        
                    firms_matched_counts[f_idx] = firms_matched_counts.get(f_idx, 0) + 1
                    
        many_to_one = sum(1 for v in firms_matched_counts.values() if v > 1)
        
        res = {
            "Radius (km)": r_km,
            "Time Window (hrs)": t_hrs,
            "CREAMS Matched": len(matched_creams),
            "CREAMS Unmatched": len(creams_df) - len(matched_creams),
            "FIRMS Matched": len(matched_firms),
            "Avg Dist (km)": round(np.mean(dist_list), 2) if dist_list else None,
            "Max Dist (km)": round(np.max(dist_list), 2) if dist_list else None,
            "Avg TimeDiff (hrs)": round(np.mean(time_diff_list), 2) if time_diff_list else None,
            "Max TimeDiff (hrs)": round(np.max(time_diff_list), 2) if time_diff_list else None,
            "1 CREAMS -> Multi FIRMS": c_to_many,
            "Multi CREAMS -> 1 FIRMS": many_to_one,
            "Conflicts": conflicts
        }
        results.append(res)
        
results_df = pd.DataFrame(results)
print("\n" + "="*80)
print("MATCHING CONFIGURATION RESULTS")
print("="*80)
print(results_df.to_string(index=False))

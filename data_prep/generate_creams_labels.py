import os
import glob
import pandas as pd
import numpy as np
from sklearn.neighbors import BallTree

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


print("Loading CREAMS and FIRMS datasets...")

creams_df = pd.read_csv("data/labels/creams_2023_events.csv")
creams_df["creams_datetime"] = pd.to_datetime(creams_df["acq_date"] + " " + creams_df["acq_time"])
creams_df["creams_event_id"] = ["CR_" + str(i) for i in range(len(creams_df))]

firms_files = glob.glob("data/raw/firms_archive/2023/VIIRS_SNPP_SP_2023-*.csv") + \
              glob.glob("data/raw/firms_archive/2023/VIIRS_NOAA20_SP_2023-*.csv")
dfs = [pd.read_csv(f) for f in firms_files]
firms_df = pd.concat(dfs, ignore_index=True)

firms_df["acq_time_str"] = firms_df["acq_time"].astype(str).str.zfill(4)
firms_df["firms_datetime"] = pd.to_datetime(firms_df["acq_date"] + " " + firms_df["acq_time_str"].str[:2] + ":" + firms_df["acq_time_str"].str[2:] + ":00")
firms_df["observation_id"] = firms_df.apply(generate_observation_id, axis=1)

firms_df = firms_df[(firms_df["acq_date"] >= "2023-09-15") & (firms_df["acq_date"] <= "2023-11-30")]

# Load existing labels
existing_labels_df = pd.DataFrame()
fsi_path = "data/labels/fsi_wildfires.csv"
wb_path = "data/labels/india_flares.csv"

if os.path.exists(fsi_path):
    fsi_df = pd.read_csv(fsi_path)
    fsi_df["conflict_source"] = "FSI"
    existing_labels_df = pd.concat([existing_labels_df, fsi_df])

if os.path.exists(wb_path):
    wb_df = pd.read_csv(wb_path)
    wb_df["conflict_source"] = "World Bank"
    existing_labels_df = pd.concat([existing_labels_df, wb_df])

existing_dict = {}
if not existing_labels_df.empty and "observation_id" in existing_labels_df.columns:
    for _, row in existing_labels_df.iterrows():
        existing_dict[row["observation_id"]] = row["conflict_source"]

EARTH_RADIUS_KM = 6371.0
firms_rad = np.deg2rad(firms_df[["latitude", "longitude"]].values)
creams_rad = np.deg2rad(creams_df[["latitude", "longitude"]].values)

tree = BallTree(firms_rad, metric='haversine')

R_KM = 1.0
T_HOURS = 6.0

r_rad = R_KM / EARTH_RADIUS_KM
t_delta = pd.Timedelta(hours=T_HOURS)

indices, distances = tree.query_radius(creams_rad, r=r_rad, return_distance=True)

matches = []
c_to_many = 0
firms_matched_counts = {}
conflicts_flagged = []

for i, (idx_list, dist_list_rad) in enumerate(zip(indices, distances)):
    creams_dt = creams_df.iloc[i]["creams_datetime"]
    c_event_id = creams_df.iloc[i]["creams_event_id"]
    source_file = creams_df.iloc[i]["source_file"]
    
    valid_firms_for_this_creams = []
    
    for f_idx, dist_rad in zip(idx_list, dist_list_rad):
        firms_dt = firms_df.iloc[f_idx]["firms_datetime"]
        
        if abs(creams_dt - firms_dt) <= t_delta:
            valid_firms_for_this_creams.append((f_idx, dist_rad))
            
    if len(valid_firms_for_this_creams) > 1:
        c_to_many += 1
        
    for f_idx, dist_rad in valid_firms_for_this_creams:
        firms_matched_counts[f_idx] = firms_matched_counts.get(f_idx, 0) + 1
        
        obs_id = firms_df.iloc[f_idx]["observation_id"]
        
        # Check conflict
        if obs_id in existing_dict:
            conflicts_flagged.append({
                "observation_id": obs_id,
                "creams_event_id": c_event_id,
                "existing_source": existing_dict[obs_id]
            })
            continue # Do not overwrite existing labels
            
        f_dt = firms_df.iloc[f_idx]["firms_datetime"]
        time_diff_hrs = (f_dt - creams_dt).total_seconds() / 3600.0
        
        matches.append({
            "observation_id": obs_id,
            "creams_event_id": c_event_id,
            "latitude": firms_df.iloc[f_idx]["latitude"],
            "longitude": firms_df.iloc[f_idx]["longitude"],
            "creams_datetime": creams_dt,
            "firms_datetime": f_dt,
            "spatial_distance_km": round(dist_rad * EARTH_RADIUS_KM, 3),
            "temporal_difference_hours": round(time_diff_hrs, 2),
            "satellite": firms_df.iloc[f_idx]["satellite"],
            "target_class": "Agricultural Burn",
            "label_source": "CREAMS",
            "source_filename": source_file
        })

many_to_one = sum(1 for v in firms_matched_counts.values() if v > 1)

matched_df = pd.DataFrame(matches)

# Deduplicate by observation_id
if not matched_df.empty:
    initial_matches = len(matched_df)
    # If multiple CREAMS match same FIRMS observation, keep the closest spatial one
    matched_df = matched_df.sort_values("spatial_distance_km").drop_duplicates(subset=["observation_id"], keep="first")
    dedup_removed = initial_matches - len(matched_df)
else:
    dedup_removed = 0

matched_df.to_csv("data/labels/creams_matched.csv", index=False)

print("\n" + "="*80)
print("FINAL CREAMS LABELS GENERATION REPORT")
print("="*80)
print(f"Total CREAMS events processed: {len(creams_df)}")
print(f"Time Window: {T_HOURS} hours | Radius: {R_KM} km")
print(f"1 CREAMS -> Multi FIRMS: {c_to_many}")
print(f"Multi CREAMS -> 1 FIRMS: {many_to_one}")
print(f"Deduplication removed {dedup_removed} duplicate assignments.")
print(f"Conflicts with existing labels (FSI/WB) ignored: {len(conflicts_flagged)}")
if conflicts_flagged:
    for c in conflicts_flagged:
        print(f" - {c['observation_id']} conflicts with {c['existing_source']}")
print(f"\nFINAL UNIQUE AGRICULTURAL BURN LABELS GENERATED: {len(matched_df)}")
print(f"Saved to data/labels/creams_matched.csv")

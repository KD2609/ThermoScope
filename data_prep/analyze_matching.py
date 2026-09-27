import pandas as pd
import numpy as np
from sklearn.neighbors import BallTree
import matplotlib.pyplot as plt

# Load CREAMS events
creams_df = pd.read_csv("data/labels/creams_2023_events.csv")
creams_df["acq_date"] = pd.to_datetime(creams_df["acq_date"])

# Load FIRMS data
# We'll just load the Sept-Nov VIIRS_SNPP_SP files for this analysis
import glob
files = glob.glob("data/raw/firms_archive/2023/VIIRS_SNPP_SP_2023-*.csv") + \
        glob.glob("data/raw/firms_archive/2023/VIIRS_NOAA20_SP_2023-*.csv")
        
dfs = [pd.read_csv(f) for f in files]
firms_df = pd.concat(dfs, ignore_index=True)
firms_df["acq_date"] = pd.to_datetime(firms_df["acq_date"])

print(f"Loaded {len(creams_df)} CREAMS events and {len(firms_df)} FIRMS observations.")

# 1. TEMPORAL MATCHING
# Since CREAMS is aggregated by daily bulletins, the exact acq_time might not perfectly match FIRMS, 
# but the acq_date should be the same day, or maybe +/- 1 day due to reporting delays.
# Let's check matching exactly on the same date first.

creams_df["date_str"] = creams_df["acq_date"].dt.strftime("%Y-%m-%d")
firms_df["date_str"] = firms_df["acq_date"].dt.strftime("%Y-%m-%d")

# Convert to radians for BallTree
creams_rad = np.deg2rad(creams_df[["latitude", "longitude"]].values)
firms_rad = np.deg2rad(firms_df[["latitude", "longitude"]].values)

tree = BallTree(firms_rad, metric='haversine')
EARTH_RADIUS_KM = 6371.0

print("\n--- Matching Radius Analysis ---")
for radius_km in [0.5, 1.0, 2.0, 3.0, 5.0, 10.0]:
    radius_rad = radius_km / EARTH_RADIUS_KM
    
    # Only match within same date to keep it simple for this analysis
    matched_creams = 0
    total_matches = 0
    
    # We can do a quick loop over dates
    for date in creams_df["date_str"].unique():
        c_mask = creams_df["date_str"] == date
        f_mask = firms_df["date_str"] == date
        
        c_sub = creams_df[c_mask]
        f_sub = firms_df[f_mask]
        
        if len(f_sub) == 0:
            continue
            
        c_rad_sub = np.deg2rad(c_sub[["latitude", "longitude"]].values)
        f_rad_sub = np.deg2rad(f_sub[["latitude", "longitude"]].values)
        
        sub_tree = BallTree(f_rad_sub, metric='haversine')
        indices, distances = sub_tree.query_radius(c_rad_sub, r=radius_rad, return_distance=True)
        
        for idx_list in indices:
            if len(idx_list) > 0:
                matched_creams += 1
                total_matches += len(idx_list)
                
    print(f"Radius {radius_km:4.1f}km -> Matched CREAMS: {matched_creams}/{len(creams_df)} ({(matched_creams/len(creams_df))*100:.1f}%) | Total FIRMS matches: {total_matches}")

print("\n--- Temporal Shift Analysis (at 2km radius) ---")
radius_rad = 2.0 / EARTH_RADIUS_KM
for day_shift in [-1, 0, 1]:
    matched_creams = 0
    for date in creams_df["acq_date"].unique():
        c_mask = creams_df["acq_date"] == date
        c_sub = creams_df[c_mask]
        
        f_date = date + pd.Timedelta(days=day_shift)
        f_mask = firms_df["acq_date"] == f_date
        f_sub = firms_df[f_mask]
        
        if len(f_sub) == 0:
            continue
            
        c_rad_sub = np.deg2rad(c_sub[["latitude", "longitude"]].values)
        f_rad_sub = np.deg2rad(f_sub[["latitude", "longitude"]].values)
        
        sub_tree = BallTree(f_rad_sub, metric='haversine')
        indices = sub_tree.query_radius(c_rad_sub, r=radius_rad)
        
        for idx_list in indices:
            if len(idx_list) > 0:
                matched_creams += 1
                
    print(f"Shift {day_shift:2d} days -> Matched CREAMS: {matched_creams}/{len(creams_df)} ({(matched_creams/len(creams_df))*100:.1f}%)")

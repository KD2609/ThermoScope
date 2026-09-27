import pandas as pd
import numpy as np
import glob
import os

print("--- FSI DATA EXPLORATION ---")
fsi_raw = pd.read_csv("data/raw/fsi_wildfire.csv")
# Date format: 01/01/2023 00:00:00
fsi_raw = fsi_raw.dropna(subset=['Date'])
fsi_raw['acq_date'] = pd.to_datetime(fsi_raw['Date'], format='%d/%m/%Y %H:%M:%S', errors='coerce').dt.date
fsi_raw = fsi_raw.dropna(subset=['acq_date'])

print(f"Total FSI raw records: {len(fsi_raw)}")
print(f"Date range: {fsi_raw['acq_date'].min()} to {fsi_raw['acq_date'].max()}")
sep_nov_fsi = fsi_raw[(fsi_raw['acq_date'] >= pd.to_datetime('2023-09-15').date()) & (fsi_raw['acq_date'] <= pd.to_datetime('2023-11-30').date())]
print(f"FSI records in Sep-Nov 2023: {len(sep_nov_fsi)}")

print("\n--- FEATURE DISTRIBUTION ESTIMATION ---")

# Load existing labels
jan_labels = pd.read_csv("data/labels/jan2023_firms_labels.csv")
jan_labels = pd.read_csv("data/labels/jan2023_firms_labels.csv")
gf_df = jan_labels[jan_labels["label"] == "Gas Flare"]
wf_df = jan_labels[jan_labels["label"] == "Wildfire"]
ab_df = pd.read_csv("data/labels/creams_matched.csv")

# Load FIRMS raw to get BT, FRP, daynight for Ag Burn
print("Loading FIRMS raw data...")
firms_files = glob.glob("data/raw/firms_archive/2023/*.csv")
dfs = []
for f in firms_files:
    if "firms_2023.csv" in f or "combine" in f: continue
    dfs.append(pd.read_csv(f))
firms_df = pd.concat(dfs, ignore_index=True)

def generate_obs_id(row):
    lat = float(row.get("latitude", 0.0))
    lon = float(row.get("longitude", 0.0))
    date_val = str(row.get("acq_date", ""))[:10]
    time_val = str(row.get("acq_time", "")).replace(":", "").zfill(4)
    if '.' in time_val: time_val = str(int(float(time_val))).zfill(4)
    sat = row.get("satellite", "")
    instr = row.get("instrument", "")
    return f"{lat:.4f}_{lon:.4f}_{date_val}_{time_val}_{sat}_{instr}"

firms_df["observation_id"] = firms_df.apply(generate_obs_id, axis=1)

# Merge back to get FRP and BT for Ag Burn
ab_merged = ab_df.merge(firms_df, on="observation_id", how="inner")

def print_stats(name, df):
    if df.empty:
        print(f"{name}: Empty")
        return
    print(f"\n{name} ({len(df)} records):")
    
    frp_col = "frp_x" if "frp_x" in df.columns else "frp"
    if frp_col in df.columns:
        print(f"  FRP -> min: {df[frp_col].min():.1f}, median: {df[frp_col].median():.1f}, mean: {df[frp_col].mean():.1f}, max: {df[frp_col].max():.1f}")
        
    bt_col = "brightness_temperature_x" if "brightness_temperature_x" in df.columns else ("bright_ti4" if "bright_ti4" in df.columns else "brightness_temperature")
    if bt_col in df.columns:
        print(f"  Brightness Temp -> min: {df[bt_col].min():.1f}, median: {df[bt_col].median():.1f}, mean: {df[bt_col].mean():.1f}, max: {df[bt_col].max():.1f}")
    
    dn_col = "day_night" if "day_night" in df.columns else "daynight"
    if dn_col in df.columns:
        print(f"  Day/Night -> {df[dn_col].value_counts().to_dict()}")

print_stats("Gas Flare", gf_df)
print_stats("Wildfire", wf_df)
print_stats("Agricultural Burn", ab_merged)


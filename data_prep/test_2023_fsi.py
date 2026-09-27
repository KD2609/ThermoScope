import pandas as pd
import numpy as np
from sklearn.neighbors import BallTree
import glob

print("Loading FIRMS 2023 data...")
firms = pd.read_csv('data/raw/firms_archive/2023/firms_2023.csv')
print(f"FIRMS rows: {len(firms)}")

print("Loading FSI 2023 data...")
fsi = pd.read_csv('data/raw/fsi_wildfire.csv')
print(f"FSI raw rows: {len(fsi)}")

fsi['dt'] = pd.to_datetime(fsi['Date'].str[:10] + ' ' + fsi['ACQTIME'], format='%d/%m/%Y %H:%M:%S', errors='coerce')
fsi = fsi.dropna(subset=['dt']).copy()

firms['acq_time_str'] = firms['acq_time'].astype(str).str.replace('.0', '', regex=False).str.zfill(4)
firms['acq_date_time'] = pd.to_datetime(firms['acq_date'] + ' ' + firms['acq_time_str'], format='%Y-%m-%d %H%M', errors='coerce')
firms = firms.dropna(subset=['acq_date_time']).copy()

print("Building tree...")
tree = BallTree(np.deg2rad(firms[['latitude', 'longitude']].values), metric='haversine')
idxs = tree.query_radius(np.deg2rad(fsi[['Lat', 'Lon']].values), r=(1.5/6371.0))

matched_fsi = []
unique_fsi_events = set()
matched_firms_obs = set()

for i, matches in enumerate(idxs):
    for m in matches:
        time_diff = (fsi.iloc[i]['dt'] - firms.iloc[m]['acq_date_time']).total_seconds() / 3600.0
        if abs(time_diff) <= 6.0:
            matched_fsi.append(i)
            # define event strictly by unique date/time since coords are pixel points
            # or better, use DBSCAN on FSI points to group them geographically.
            # But just for a count of unique timestamps:
            unique_fsi_events.add(fsi.iloc[i]['dt'].strftime('%Y%m%d_%H%M%S'))
            
            lat = firms.iloc[m]['latitude']
            lon = firms.iloc[m]['longitude']
            date_val = str(firms.iloc[m]['acq_date'])[:10]
            time_val = firms.iloc[m]['acq_time_str']
            sat = firms.iloc[m].get('satellite', '')
            instr = firms.iloc[m].get('instrument', '')
            obs_id = f"{lat:.4f}_{lon:.4f}_{date_val}_{time_val}_{sat}_{instr}"
            matched_firms_obs.add(obs_id)

print(f"Total candidate matches (FSI side): {len(matched_fsi)}")
print(f"Unique FIRMS observations: {len(matched_firms_obs)}")
print(f"Unique FSI events (by timestamp): {len(unique_fsi_events)}")

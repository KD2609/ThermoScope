import os
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent

years = [2021, 2022, 2024, 2025]

# Modify the script to take sys.argv or just overwrite it temporarily
# Actually, I'll just write a custom script since the other one is short
import time
import requests
import pandas as pd
from io import StringIO
from datetime import datetime, timedelta

MAP_KEY = "871bb1d69bfd88ea634c5faff4260dfd"
BBOX = "68,6,98,37"
SOURCES = ["VIIRS_SNPP_SP", "VIIRS_NOAA20_SP"]
OUTPUT_DIR = "data/raw/firms_archive"
CHUNK_DAYS = 5

def download_chunk(source, start_date, end_date):
    url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/{source}/{BBOX}/{CHUNK_DAYS}/{start_date}"
    try:
        response = requests.get(url, timeout=120)
        if response.status_code != 200 or not response.text.strip():
            return None
        df = pd.read_csv(StringIO(response.text))
        return None if df.empty else df
    except:
        return None

for y in years:
    if y == 2025:
        end = datetime(y, 12, 31) 
        # API doesn't return future dates anyway, but let's constrain to today for 2025
        end = min(end, datetime.now())
    else:
        end = datetime(y, 12, 31)
    
    start = datetime(y, 1, 1)
    
    for source in SOURCES:
        print(f"FIRMS {source} for {y}...")
        current = start
        while current <= end:
            chunk_end = min(current + timedelta(days=CHUNK_DAYS - 1), end)
            start_str = current.strftime("%Y-%m-%d")
            end_str = chunk_end.strftime("%Y-%m-%d")
            
            output_dir = os.path.join(OUTPUT_DIR, str(y))
            os.makedirs(output_dir, exist_ok=True)
            output_file = os.path.join(output_dir, f"{source}_{start_str}_{end_str}.csv")
            
            if os.path.exists(output_file):
                current = chunk_end + timedelta(days=1)
                continue
                
            df = download_chunk(source, start_str, end_str)
            if df is not None:
                df["source_product"] = source
                df.to_csv(output_file, index=False)
                print(f"Saved {len(df)} to {output_file}")
            
            time.sleep(0.5)
            current = chunk_end + timedelta(days=1)

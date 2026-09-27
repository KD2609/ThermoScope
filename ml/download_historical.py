import pandas as pd
from pathlib import Path

MAP_KEY = "871bb1d69bfd88ea634c5faff4260dfd"

PROJECT_ROOT = Path(__file__).resolve().parent.parent

OUTPUT_FILE = (
    PROJECT_ROOT
    / "data"
    / "raw"
    / "firms"
    / "historical_firms.csv"
)

BBOX = "68,6,97,37"

# 2026-09-17 se 2026-09-23 tak
DAYS = 5

url = (
    f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
    f"{MAP_KEY}/VIIRS_NOAA21_NRT/{BBOX}/{DAYS}"
)

print("Downloading historical FIRMS data...")

df = pd.read_csv(url)

print(f"Rows downloaded: {len(df)}")

OUTPUT_FILE.parent.mkdir(
    parents=True,
    exist_ok=True
)

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print(f"Saved to:\n{OUTPUT_FILE}")
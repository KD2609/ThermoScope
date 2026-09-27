import pandas as pd
from pathlib import Path

FOLDER = Path(__file__).parent
OUTPUT = FOLDER / "firms_2023.csv"

files = [
    f for f in FOLDER.glob("*.csv")
    if f.name != OUTPUT.name
]

print(f"Found {len(files)} CSV files")

dfs = []

for file in files:
    print("Reading:", file.name)
    df = pd.read_csv(file)
    dfs.append(df)

combined = pd.concat(dfs, ignore_index=True)

# Convert date
combined["acq_date"] = pd.to_datetime(combined["acq_date"])

# Keep only Jan 1-20, 2023
combined = combined[
    (combined["acq_date"] >= "2023-01-01") &
    (combined["acq_date"] < "2023-01-21")
].copy()

combined.to_csv(OUTPUT, index=False)

print("\nDone!")
print("Total Jan 1-20 FIRMS records:", len(combined))
print("Saved:", OUTPUT)
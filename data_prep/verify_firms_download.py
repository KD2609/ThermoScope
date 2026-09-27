import os
import glob
import pandas as pd

archive_dir = "data/raw/firms_archive/2023"
files = glob.glob(os.path.join(archive_dir, "VIIRS_*_2023-09*.csv")) + \
        glob.glob(os.path.join(archive_dir, "VIIRS_*_2023-10*.csv")) + \
        glob.glob(os.path.join(archive_dir, "VIIRS_*_2023-11*.csv"))

print(f"Found {len(files)} files for Sep-Nov 2023.")

df_list = []
for f in files:
    try:
        df = pd.read_csv(f)
        df_list.append(df)
    except Exception as e:
        print(f"Error reading {f}: {e}")

if df_list:
    full_df = pd.concat(df_list, ignore_index=True)
    full_df["acq_date"] = pd.to_datetime(full_df["acq_date"])
    
    print("\n================= FIRMS VERIFICATION =================\n")
    print(f"Total Rows: {len(full_df):,}")
    print(f"Date Coverage: {full_df['acq_date'].min().date()} to {full_df['acq_date'].max().date()}")
    
    print("\nMissing Values:")
    print(full_df.isnull().sum()[full_df.isnull().sum() > 0])
    
    print("\nSatellite Distribution:")
    print(full_df["satellite"].value_counts())
    
    print("\nInstrument Distribution:")
    print(full_df["instrument"].value_counts())
    
    print("\nSource Product Distribution:")
    if "source_product" in full_df.columns:
        print(full_df["source_product"].value_counts())
    else:
        print("source_product column not found.")
else:
    print("No valid data found.")

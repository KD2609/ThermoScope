import pandas as pd
import os

INPUT_FILE = "data/raw/wb_flares/2012-2024-Flare-Volume-Estimates-by-individual-Flare-Location.xlsx"
OUTPUT_FILE = "data/labels/india_flare_locations.csv"

os.makedirs("data/labels", exist_ok=True)

df = pd.read_excel(INPUT_FILE)

print("Original shape:", df.shape)
print("\nColumns:")
print(df.columns.tolist())

# Keep India only
india = df[df["Country"].astype(str).str.strip().str.lower() == "india"].copy()

print("\nIndia records:", len(india))

# Keep useful columns
india = india[
    [
        "Latitude",
        "Longitude",
        "Year",
        "Field  Type",
        "Field Name",
        "Field  Operator",
        "Location",
        "Flare Level",
        "Flaring Vol (million m3)"
    ]
]

# Clean coordinates
india["Latitude"] = pd.to_numeric(india["Latitude"], errors="coerce")
india["Longitude"] = pd.to_numeric(india["Longitude"], errors="coerce")

india = india.dropna(subset=["Latitude", "Longitude"])

# Sort
india = india.sort_values(
    ["Year", "Latitude", "Longitude"]
)

india.to_csv(OUTPUT_FILE, index=False)

print("\nSaved:", OUTPUT_FILE)
print("Final shape:", india.shape)

print("\nYears:")
print(sorted(india["Year"].dropna().unique()))

print("\n2023 records:")
print(len(india[india["Year"] == 2023]))

print("\nFirst 10 rows:")
print(india.head(10).to_string(index=False))
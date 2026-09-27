import pandas as pd

print("Starting...")

MAP_KEY = "871bb1d69bfd88ea634c5faff4260dfd"

url = f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/{MAP_KEY}/VIIRS_NOAA21_NRT/68,6,97,37/1"
print("Fetching FIRMS data...")

df = pd.read_csv(url)

print("Data downloaded!")
print("Shape:", df.shape)

print(df.head())

df.to_csv("india_firms.csv", index=False)

print("File saved!")
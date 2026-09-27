import os
import glob
import pandas as pd
import pdfplumber

creams_dir = "data/raw/creams/2023"
pdf_files = sorted(glob.glob(os.path.join(creams_dir, "*.pdf")))

all_events = []

for pdf_file in pdf_files:
    filename = os.path.basename(pdf_file)
    print(f"Processing {filename}...")
    try:
        with pdfplumber.open(pdf_file) as pdf:
            # We assume tables are near the end. Let's scan all pages.
            for page in pdf.pages:
                tables = page.extract_tables()
                for table in tables:
                    if not table or len(table) < 2:
                        continue
                        
                    header = [str(x).strip().lower() for x in table[0] if x is not None]
                    
                    if "latitude" in header and "longitude" in header:
                        # Find indices
                        lat_idx = header.index("latitude")
                        lon_idx = header.index("longitude")
                        
                        time_idx = header.index("acq_time") if "acq_time" in header else -1
                        sat_idx = header.index("satellite") if "satellite" in header else -1
                        dist_idx = header.index("district") if "district" in header else -1
                        
                        # Extract data rows
                        for row in table[1:]:
                            if len(row) <= max(lat_idx, lon_idx):
                                continue
                                
                            lat_val = row[lat_idx]
                            lon_val = row[lon_idx]
                            
                            if lat_val is None or lon_val is None or str(lat_val).strip() == "" or "latitude" in str(lat_val).lower():
                                continue
                                
                            try:
                                lat = float(lat_val)
                                lon = float(lon_val)
                                
                                event = {
                                    "latitude": lat,
                                    "longitude": lon,
                                    "source_file": filename,
                                }
                                if time_idx != -1 and len(row) > time_idx:
                                    event["acq_time"] = str(row[time_idx]).strip()
                                if sat_idx != -1 and len(row) > sat_idx:
                                    event["satellite"] = str(row[sat_idx]).strip()
                                if dist_idx != -1 and len(row) > dist_idx:
                                    event["district"] = str(row[dist_idx]).strip()
                                    
                                all_events.append(event)
                            except ValueError:
                                pass # Not a float, skip
    except Exception as e:
        print(f"Error parsing {filename}: {e}")

df = pd.DataFrame(all_events)
print(f"\nExtracted {len(df)} total events.")
if len(df) > 0:
    print(df.head())
    df.to_csv("data/raw/creams/2023/extracted_events.csv", index=False)

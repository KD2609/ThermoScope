import os
import glob
import pandas as pd
import pypdf
import re

creams_dir = "data/raw/creams/2023"
pdf_files = sorted(glob.glob(os.path.join(creams_dir, "*.pdf")))

all_events = []

for pdf_file in pdf_files:
    filename = os.path.basename(pdf_file)
    print(f"Processing {filename}...")
    try:
        pdf = pypdf.PdfReader(pdf_file)
        text = "\n".join([page.extract_text() for page in pdf.pages])
        
        # Extract date from filename (e.g., 01.RiceResidueFireBulletin_15Sep_2023_ICAR.pdf)
        date_match = re.search(r'(\d{2}[A-Za-z]{3}_\d{4})', filename)
        date_str = ""
        if date_match:
            date_str = pd.to_datetime(date_match.group(1), format="%d%b_%Y").strftime("%Y-%m-%d")
            
        for line in text.split("\n"):
            # Line format: 1 ROHTAK SAMPLA S-NPP 28.82142 76.85355 01:48:08 N 0.60
            match = re.search(r'(\d{2}\.\d{4,5})\s+(\d{2}\.\d{4,5})\s+(\d{2}:\d{2}:\d{2})\s+([DN])', line)
            if match:
                lat, lon, time, dn = match.groups()
                event = {
                    "latitude": float(lat),
                    "longitude": float(lon),
                    "acq_time": time,
                    "day_night": dn,
                    "acq_date": date_str,
                    "source_file": filename,
                    "target_class": "Agricultural Burn",
                    "label_source": "CREAMS",
                    "label_confidence": 1.0
                }
                all_events.append(event)
    except Exception as e:
        print(f"Error parsing {filename}: {e}")

df = pd.DataFrame(all_events)
print(f"\nExtracted {len(df)} total events.")
if len(df) > 0:
    out_file = "data/labels/creams_2023_events.csv"
    df.to_csv(out_file, index=False)
    print(f"Saved to {out_file}")

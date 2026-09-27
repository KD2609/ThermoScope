import os
import time
import requests
import pandas as pd
from io import StringIO
from datetime import datetime, timedelta
from tqdm import tqdm

MAP_KEY = "871bb1d69bfd88ea634c5faff4260dfd"

BBOX = "68,6,98,37"

START_DATE = "2023-01-01"
END_DATE = "2023-12-31"

SOURCES = [
    "VIIRS_SNPP_SP",
    "VIIRS_NOAA20_SP"
]

OUTPUT_DIR = "data/raw/firms_archive"

CHUNK_DAYS = 5


def download_chunk(source, start_date, end_date):
    url = (
        f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
        f"{MAP_KEY}/{source}/{BBOX}/{CHUNK_DAYS}/{start_date}"
    )

    try:
        response = requests.get(url, timeout=120)

        if response.status_code != 200:
            print(
                f"\nFailed: {source} | {start_date} | "
                f"HTTP {response.status_code}"
            )
            print(response.text[:300])
            return None

        if not response.text.strip():
            return None

        df = pd.read_csv(StringIO(response.text))

        if df.empty:
            return None

        return df

    except Exception as e:
        print(f"\nError: {source} | {start_date}")
        print(e)
        return None


def main():

    start = datetime.strptime(START_DATE, "%Y-%m-%d")
    end = datetime.strptime(END_DATE, "%Y-%m-%d")

    for source in SOURCES:

        print("\n" + "=" * 70)
        print(f"DOWNLOADING {source}")
        print("=" * 70)

        current = start

        while current <= end:

            chunk_end = min(
                current + timedelta(days=CHUNK_DAYS - 1),
                end
            )

            start_str = current.strftime("%Y-%m-%d")
            end_str = chunk_end.strftime("%Y-%m-%d")

            year = current.strftime("%Y")

            output_dir = os.path.join(
                OUTPUT_DIR,
                year
            )

            os.makedirs(output_dir, exist_ok=True)

            output_file = os.path.join(
                output_dir,
                f"{source}_{start_str}_{end_str}.csv"
            )

            # Skip already downloaded chunks
            if os.path.exists(output_file):
                print(f"Skipping {start_str} → {end_str}")
                current = chunk_end + timedelta(days=1)
                continue

            print(f"Downloading {start_str} → {end_str}")

            df = download_chunk(
                source,
                start_str,
                end_str
            )

            if df is not None:

                df["source_product"] = source

                df.to_csv(
                    output_file,
                    index=False
                )

                print(
                    f"Saved {len(df):,} rows → {output_file}"
                )

            else:
                print(
                    f"No data → {source} | "
                    f"{start_str} → {end_str}"
                )

            time.sleep(1)

            current = chunk_end + timedelta(days=1)


if __name__ == "__main__":
    main()
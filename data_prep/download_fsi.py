import requests
from bs4 import BeautifulSoup
import pandas as pd
import os
import time

YEARS = [2021, 2022, 2024, 2025]
MONTHS = list(range(1, 13))

os.makedirs("data/raw/fsi", exist_ok=True)

for year in YEARS:
    os.makedirs(f"data/raw/fsi/{year}", exist_ok=True)
    
    all_rows = []
    for month in MONTHS:
        # Don't try future months in 2025
        if year == 2025 and month > 12: # Actually current date is Sept 2026? Wait, it's 2026.
            pass

        start_date = f"{year}-{month:02d}-01"
        if month == 12:
            end_date = f"{year}-12-31"
        else:
            end_date = f"{year}-{month+1:02d}-01"
            # get last day of month by parsing with pandas
            end_date = str((pd.to_datetime(end_date) - pd.Timedelta(days=1)).date())
            
        print(f"Fetching FSI {start_date} to {end_date}...")
        
        s = requests.Session()
        s.headers.update({
            "User-Agent": "Mozilla/5.0",
        })
        
        try:
            r1 = s.get('https://fsiforestfire.gov.in/ArchivalData/Search', timeout=30)
            soup = BeautifulSoup(r1.text, 'html.parser')
            token = soup.find('input', {'name': '__RequestVerificationToken'})['value']
            
            data = {
                'FromDate': start_date,
                'ToDate': end_date,
                'SelectedState': '',
                'PageNumber': '1',
                '__RequestVerificationToken': token,
                '__Invariant': ['FromDate', 'ToDate']
            }
            
            r2 = s.post('https://fsiforestfire.gov.in/ArchivalData/Search', data=data, timeout=60)
            soup2 = BeautifulSoup(r2.text, 'html.parser')
            table = soup2.find('table')
            
            if not table:
                print(f"No table found for {start_date}")
                continue
                
            tbody = table.find('tbody')
            if not tbody:
                continue
                
            rows = tbody.find_all('tr')
            for tr in rows:
                tds = tr.find_all('td')
                if len(tds) >= 7:
                    all_rows.append([td.text.strip() for td in tds])
                    
            print(f"Found {len(rows)} records.")
            time.sleep(2)
        except Exception as e:
            print(f"Error fetching {start_date}: {e}")
            
    if all_rows:
        df = pd.DataFrame(all_rows, columns=['Date', 'Sensor', 'Lon', 'Lat', 'State', 'Year', 'ACQTIME'])
        df.to_csv(f"data/raw/fsi/{year}/fsi_wildfire_{year}.csv", index=False)
        print(f"Saved {len(df)} records for {year}")
    else:
        print(f"No records found for {year}")

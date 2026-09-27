import os
import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

out_dir = "data/raw/creams/2023"
os.makedirs(out_dir, exist_ok=True)

url = "https://creams.iari.res.in/?page_id=1123"
r = requests.get(url, verify=False)
soup = BeautifulSoup(r.text, 'html.parser')

base_url = "https://creams.iari.res.in"

downloaded_files = []
missing_dates = []

print("Downloading CREAMS bulletins...")

links = soup.find_all('a')
for a in links:
    href = a.get('href', '')
    if 'RiceResidueFireBulletin' in href and '2023' in href:
        filename = href.split('/')[-1]
        
        # Avoid redownloading if exists
        filepath = os.path.join(out_dir, filename)
        if not os.path.exists(filepath):
            full_url = base_url + href if href.startswith('/') else href
            
            try:
                pdf_r = requests.get(full_url, verify=False, timeout=10)
                if pdf_r.status_code == 200:
                    with open(filepath, 'wb') as f:
                        f.write(pdf_r.content)
                    downloaded_files.append(filename)
                    print(f"Downloaded {filename}")
                else:
                    missing_dates.append(filename)
                    print(f"Failed to download {filename}: {pdf_r.status_code}")
            except Exception as e:
                missing_dates.append(filename)
                print(f"Error downloading {filename}: {e}")
        else:
            downloaded_files.append(filename)
            # print(f"Already exists {filename}")

print(f"\nTotal files: {len(downloaded_files)}")
print(f"Missing/Failed: {len(missing_dates)}")

import os
import requests
from bs4 import BeautifulSoup
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

out_dir = "data/raw/creams/2023"
os.makedirs(out_dir, exist_ok=True)

# Main page might have a link to 2023 bulletins
url = "https://creams.iari.res.in/?page_id=3813" # The 2023 bulletin page maybe? Let's check the menu.
r = requests.get("https://creams.iari.res.in/", verify=False)
soup = BeautifulSoup(r.text, 'html.parser')

print("Links containing '2023':")
for a in soup.find_all('a', href=True):
    if '2023' in a.text or '2023' in a['href']:
        print(a.text.strip(), a['href'])

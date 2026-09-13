import urllib.parse
import httpx
from bs4 import BeautifulSoup
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
}

# Test 1: Search for Swiggy Instamart images of the item
queries = [
    'site:media-assets.swiggy.com OVACG3I2JD',
    'site:instamart-media-assets.swiggy.com OVACG3I2JD',
    'swiggy instamart "OVACG3I2JD" image',
    'swiggy "OVACG3I2JD"'
]

for q in queries:
    search_url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(q)}"
    r = httpx.get(search_url, headers=headers, timeout=10.0)
    print(f"Query '{q}': status {r.status_code}")
    soup = BeautifulSoup(r.text, 'html.parser')
    for a in soup.find_all('a', class_='result__url'):
        href = a.get('href', '')
        print('  Result URL:', href)
        if 'swiggy' in href or 'media-assets' in href:
            print('   -> MATCH:', href)

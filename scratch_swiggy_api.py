import httpx
import re
import json

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://www.swiggy.com/instamart',
    'Origin': 'https://www.swiggy.com',
    'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"'
}

# Test Instamart search API with latitude and longitude (e.g. Delhi or Mumbai or Bangalore)
search_queries = ["OVACG3I2JD", "Lay", "Lays Potato Chips", "Coca Cola"]
for q in search_queries:
    api_url = f"https://www.swiggy.com/dapi/instamart/search?lat=28.6139&lng=77.2090&query={q}"
    try:
        r = httpx.get(api_url, headers=headers, timeout=5.0)
        print(f"Instamart search for '{q}': status {r.status_code}")
        if r.status_code == 200:
            print(f"Response length: {len(r.text)}")
            # look for images and items
            data = r.json()
            images_found = []
            for item_match in re.finditer(r'"imageId":\s*"([^"]+)"', r.text):
                img_id = item_match.group(1)
                full_img_url = f"https://media-assets.swiggy.com/swiggy/image/upload/fl_lossy,f_auto,q_auto,w_800,h_800/{img_id}"
                images_found.append(full_img_url)
            print(f"Found {len(images_found)} Swiggy Instamart image URLs:")
            for img in images_found[:5]:
                print(f"  * {img}")
    except Exception as e:
        print(f"Error for {q}: {e}")

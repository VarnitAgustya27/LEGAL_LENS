import httpx
import requests

url = "https://cdn.grofers.com/app/images/products/full_screen/pro_588992.jpg"

# Test 1: requests with Chrome headers
req_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "image",
    "Sec-Fetch-Mode": "no-cors",
    "Sec-Fetch-Site": "cross-site",
    "Referer": "https://blinkit.com/",
    "Origin": "https://blinkit.com"
}

try:
    r = requests.get(url, headers=req_headers, timeout=10)
    print("Requests get status:", r.status_code, "Length:", len(r.content))
except Exception as e:
    print("Requests error:", e)

# Test 2: urllib.request
import urllib.request
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
try:
    with urllib.request.urlopen(req) as resp:
        print("Urllib status:", resp.status, "Length:", len(resp.read()))
except Exception as e:
    print("Urllib error:", e)

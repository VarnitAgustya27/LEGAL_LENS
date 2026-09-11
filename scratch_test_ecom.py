import sys
sys.path.insert(0, 'backend')
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

url = "https://blinkit.com/prn/superyou-chocolate-wafer-protein-bar/prid/588992"
print(f"Testing /api/inspections/ecom-scan-url with: {url}")

response = client.post(
    "/api/inspections/ecom-scan-url",
    data={
        "url": url,
        "category": "Packaged Food",
        "location": "New Delhi, Delhi"
    }
)

print(f"Status Code: {response.status_code}")
if response.status_code == 200:
    data = response.json()
    print("Case Number:", data.get("case_number"))
    print("Product Name:", data.get("product"))
    print("Platform:", data.get("platform"))
    print("Score:", data.get("score"))
    print("Status:", data.get("status"))
    print("Declarations Count:", len(data.get("declarations", [])))
    print("Sample Declarations:")
    for d in data.get("declarations", [])[:5]:
        print(f"  * {d.get('label')}: {d.get('value')} (Status: {d.get('status')})")
    print("Violations Count:", len(data.get("violations", [])))
else:
    print("Error:", response.text)

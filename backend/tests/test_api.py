import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["service"] == "Legal-Lens API"

def test_rules_endpoint():
    response = client.get("/api/rules")
    assert response.status_code == 200
    assert len(response.json()) >= 6

def test_dashboard_stats():
    response = client.get("/api/dashboard/stats")
    assert response.status_code == 200
    data = response.json()
    assert "total_inspections" in data
    assert "compliance_rate" in data

def test_seed_demo_case():
    response = client.post("/api/demo/seed/case_1_compliant")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "SUCCESS"
    assert "inspection_id" in data

def test_ecom_scan_url():
    response = client.post(
        "/api/inspections/ecom-scan-url",
        data={
            "url": "https://blinkit.com/prn/cadbury-dairy-milk-silk-chocolate-bar/prid/12345",
            "category": "Packaged Food",
            "location": "Blinkit Quick Commerce"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "case_number" in data
    assert "declarations" in data
    assert len(data["declarations"]) >= 6
    assert "images" in data
    assert len(data["images"]) >= 1
    # Verify image URL format
    first_img = data["images"][0]
    assert "url" in first_img
    assert first_img["url"].startswith("/uploads/") or first_img["url"].startswith("http")


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

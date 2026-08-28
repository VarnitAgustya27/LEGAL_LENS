import pytest
from app.rules.engine import RuleEngine

@pytest.fixture
def rule_engine():
    return RuleEngine()

def test_compliant_declarations(rule_engine):
    declarations = {
        "mrp": {"detected": True, "value": "?25.00", "raw_text": "MRP Rs. 25.00 (Inclusive of all taxes)", "confidence": 0.95},
        "net_quantity": {"detected": True, "value": "200 g", "raw_text": "Net Quantity: 200 g", "confidence": 0.98},
        "manufacturer": {"detected": True, "value": "Mfg by ABC Foods, Delhi", "raw_text": "Mfg by ABC Foods, Delhi", "confidence": 0.96},
        "country_of_origin": {"detected": True, "value": "India", "raw_text": "Made in India", "confidence": 0.97},
        "mfg_date": {"detected": True, "value": "08/2026", "raw_text": "Mfg Date: 08/2026", "confidence": 0.94},
        "best_before": {"detected": True, "value": "6 Months", "raw_text": "Best Before 6 Months", "confidence": 0.93},
        "consumer_care": {"detected": True, "value": "1800-11-2233", "raw_text": "Helpline: 1800-11-2233 | care@abc.com", "confidence": 0.91}
    }
    product_info = {"is_imported": False, "category": "Packaged Food"}
    res = rule_engine.evaluate_inspection(declarations, product_info)
    assert res["overall_status"] == "COMPLIANT"
    assert res["score"] >= 85.0
    assert len(res["violations"]) == 0

def test_missing_mrp_tax_qualifier(rule_engine):
    declarations = {
        "mrp": {"detected": True, "value": "?25.00", "raw_text": "MRP: 25.00", "confidence": 0.95},
        "net_quantity": {"detected": True, "value": "200 g", "raw_text": "Net Quantity: 200 g", "confidence": 0.98},
        "manufacturer": {"detected": True, "value": "Mfg by ABC Foods, Delhi", "raw_text": "Mfg by ABC Foods, Delhi", "confidence": 0.96},
        "mfg_date": {"detected": True, "value": "08/2026", "raw_text": "Mfg Date: 08/2026", "confidence": 0.94}
    }
    product_info = {"is_imported": False, "category": "Packaged Food"}
    res = rule_engine.evaluate_inspection(declarations, product_info)
    assert any(v["rule_code"] == "PCR-MRP-001" for v in res["violations"])
    assert res["overall_status"] == "NON_COMPLIANT"

def test_imported_missing_country_of_origin(rule_engine):
    declarations = {
        "mrp": {"detected": True, "value": "?599.00", "raw_text": "MRP: Rs. 599.00 (Incl. of all taxes)", "confidence": 0.95},
        "net_quantity": {"detected": True, "value": "50 g", "raw_text": "Net Weight: 50 g", "confidence": 0.98},
        "manufacturer": {"detected": True, "value": "Imported by Glow India", "raw_text": "Imported by Glow India", "confidence": 0.95},
        "country_of_origin": {"detected": False, "value": None, "raw_text": None, "confidence": 0.0}
    }
    product_info = {"is_imported": True, "category": "Cosmetics"}
    res = rule_engine.evaluate_inspection(declarations, product_info)
    assert any(v["rule_code"] == "PCR-COO-004" for v in res["violations"])
    assert res["overall_status"] == "NON_COMPLIANT"

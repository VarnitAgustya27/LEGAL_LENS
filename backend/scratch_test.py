import sys
import os
from pathlib import Path

# Add backend to path
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.rules.engine import RuleEngine

# Initialise RuleEngine
engine = RuleEngine()

# Mock declarations from Nutrimax Glucose Biscuits (case_1_compliant fallback)
declarations_dict = {
    "mrp": {
        "field": "mrp",
        "label": "Maximum Retail Price (MRP)",
        "value": "Rs. 25.00 (Inclusive of all taxes)",
        "raw_text": "Max. Retail Price: Rs. 25.00 (Inclusive of all taxes)",
        "confidence": 0.96,
        "detected": True,
        "bbox": [360, 220, 420, 780],
        "image_index": 1,
        "image_id": "FRONT",
        "rule_citation": "Rule 6(1)(e) of PCR, 2011"
    },
    "net_quantity": {
        "field": "net_quantity",
        "label": "Net Quantity",
        "value": "200 g",
        "raw_text": "Net Quantity: 200 g",
        "confidence": 0.99,
        "detected": True,
        "bbox": [280, 220, 330, 520],
        "image_index": 1,
        "image_id": "FRONT",
        "rule_citation": "Rule 6(1)(c) of PCR, 2011"
    },
    "manufacturer": {
        "field": "manufacturer",
        "label": "Manufacturer Details",
        "value": "",
        "raw_text": "",
        "confidence": 0.0,
        "detected": False,
        "bbox": None,
        "image_index": 1,
        "image_id": "FRONT",
        "rule_citation": "Rule 6(1)(a) of PCR, 2011"
    },
    "country_of_origin": {
        "field": "country_of_origin",
        "label": "Country of Origin",
        "value": "",
        "raw_text": "",
        "confidence": 0.0,
        "detected": False,
        "bbox": None,
        "image_index": 1,
        "image_id": "FRONT",
        "rule_citation": "Rule 6(1)(f) of PCR, 2011"
    },
    "mfg_date": {
        "field": "mfg_date",
        "label": "Manufacturing Date",
        "value": "",
        "raw_text": "",
        "confidence": 0.0,
        "detected": False,
        "bbox": None,
        "image_index": 1,
        "image_id": "FRONT",
        "rule_citation": "Rule 6(1)(d) of PCR, 2011"
    },
    "best_before": {
        "field": "best_before",
        "label": "Best Before / Expiry Date",
        "value": "",
        "raw_text": "",
        "confidence": 0.0,
        "detected": False,
        "bbox": None,
        "image_index": 1,
        "image_id": "FRONT",
        "rule_citation": "Rule 6(1)(d) of PCR, 2011"
    },
    "consumer_care": {
        "field": "consumer_care",
        "label": "Consumer Care Details",
        "value": "",
        "raw_text": "",
        "confidence": 0.0,
        "detected": False,
        "bbox": None,
        "image_index": 1,
        "image_id": "FRONT",
        "rule_citation": "Rule 6(1)(da) of PCR, 2011"
    },
    "unit_sale_price": {
        "field": "unit_sale_price",
        "label": "Unit Sale Price",
        "value": "",
        "raw_text": "",
        "confidence": 0.0,
        "detected": False,
        "bbox": None,
        "image_index": 1,
        "image_id": "FRONT",
        "rule_citation": "Rule 6(11) of PCR, 2011"
    }
}

product_info = {
    "name": "Nutrimax Glucose Biscuits 200g",
    "category": "Packaged Food",
    "is_imported": False,
    "barcode": "8901234567890"
}

res = engine.evaluate_inspection(declarations_dict, product_info)
print("SCORE:", res.get("score"))
print("STATUS:", res.get("overall_status"))
print("VIOLATIONS COUNT:", len(res.get("violations")))
for idx, v in enumerate(res.get("violations")):
    print(f"Violation {idx+1}: {v['rule_code']} - {v['message']}")

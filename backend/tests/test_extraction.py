import pytest
from app.extraction.extractor import DeclarationExtractor

def test_extraction_all_fields():
    detections = [
        {"text": "Net Quantity: 250 g", "confidence": 0.98, "bbox": [100, 100, 200, 400], "image_id": "img_01"},
        {"text": "MRP Rs. 150.00 (Inclusive of all taxes)", "confidence": 0.96, "bbox": [220, 100, 300, 500], "image_id": "img_01"},
        {"text": "Manufactured by ABC Pvt Ltd, New Delhi 110001", "confidence": 0.95, "bbox": [320, 100, 400, 800], "image_id": "img_01"},
        {"text": "Customer Care Helpline: 1800-200-3000", "confidence": 0.92, "bbox": [420, 100, 500, 600], "image_id": "img_01"}
    ]
    decls = DeclarationExtractor.extract_declarations(detections)
    assert decls["net_quantity"]["detected"] is True
    assert "250 g" in decls["net_quantity"]["value"]
    assert decls["mrp"]["detected"] is True
    assert "150" in decls["mrp"]["value"]
    assert decls["manufacturer"]["detected"] is True
    assert decls["consumer_care"]["detected"] is True

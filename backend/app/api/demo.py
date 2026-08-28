import os
import shutil
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.inspection import Inspection
from app.models.inspection_image import InspectionImage
from app.services.inspection_service import InspectionService

router = APIRouter(prefix="/demo", tags=["Demo Test Cases"])
service = InspectionService()

DEMO_CASES = {
    "case_1_compliant": {
        "name": "Nutrimax Glucose Biscuits 200g",
        "brand": "Nutrimax",
        "category": "Packaged Food",
        "barcode": "8901234567890",
        "is_imported": False,
        "location": "Connaught Place, Delhi",
        "filename": "demo_compliant_biscuit.png"
    },
    "case_2_missing_mrp": {
        "name": "Crispo Potato Chips 90g (Missing Taxes Statement)",
        "brand": "Crispo",
        "category": "Packaged Food",
        "barcode": "8902223334445",
        "is_imported": False,
        "location": "Karol Bagh, Delhi",
        "filename": "missing_mrp_sample.png"
    },
    "case_3_missing_mfr": {
        "name": "Suvarna Pure Ghee 500ml (Missing Manufacturer)",
        "brand": "Suvarna",
        "category": "Packaged Food",
        "barcode": "8903334445556",
        "is_imported": False,
        "location": "Nehru Place, Delhi",
        "filename": "missing_mfr_sample.png"
    },
    "case_4_imported_missing_origin": {
        "name": "Glow & Co. Vitamin C Cream 50g (Imported)",
        "brand": "Glow & Co.",
        "category": "Cosmetics",
        "barcode": "8905555444333",
        "is_imported": True,
        "location": "Lajpat Nagar, Delhi",
        "filename": "imported_cosmetic_sample.png"
    },
    "case_5_poor_quality": {
        "name": "Nutrimax Biscuits (Low Resolution / Blurry Image)",
        "brand": "Nutrimax",
        "category": "Packaged Food",
        "barcode": "8901112223334",
        "is_imported": False,
        "location": "Dwarka, Delhi",
        "filename": "blurry_poor_quality.png"
    }
}

@router.post("/seed/{case_key}")
def seed_demo_case(case_key: str, db: Session = Depends(get_db)):
    if case_key not in DEMO_CASES:
        raise HTTPException(status_code=404, detail="Demo case not found")

    cdata = DEMO_CASES[case_key]
    inspector = db.query(User).filter(User.role == "INSPECTOR").first()
    inspector_id = inspector.id if inspector else 1

    product = Product(
        name=cdata["name"],
        brand=cdata["brand"],
        category=cdata["category"],
        barcode=cdata["barcode"],
        is_imported=cdata["is_imported"]
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    case_no = f"LM/2026/000{str(product.id).zfill(3)}"
    inspection = Inspection(
        case_number=case_no,
        product_id=product.id,
        inspector_id=inspector_id,
        status="REVIEW",
        score=0.0,
        location=cdata["location"]
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    # Attach dummy demo image file
    upload_dir = os.path.abspath(f"./uploads/inspections/{inspection.id}")
    os.makedirs(upload_dir, exist_ok=True)
    img_path = os.path.join(upload_dir, cdata["filename"])
    
    # Create empty image file if not exists
    if not os.path.exists(img_path):
        import cv2
        import numpy as np
        blank = np.zeros((600, 800, 3), dtype=np.uint8) + 240
        cv2.putText(blank, cdata["name"][:30], (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (19, 34, 56), 2)
        cv2.imwrite(img_path, blank)

    image_obj = InspectionImage(
        inspection_id=inspection.id,
        image_type="FRONT",
        original_path=img_path,
        quality_status="GOOD" if "poor" not in cdata["filename"] else "POOR",
        quality_score=0.95 if "poor" not in cdata["filename"] else 0.35,
        quality_metrics={}
    )
    db.add(image_obj)
    db.commit()

    # Process scan automatically
    processed = service.process_inspection(db, inspection.id, user_name="Inspector")
    return {"status": "SUCCESS", "inspection_id": processed.id, "case_number": processed.case_number, "score": processed.score, "verdict": processed.status}

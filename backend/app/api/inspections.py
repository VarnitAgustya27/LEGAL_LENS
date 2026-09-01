import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.inspection import Inspection
from app.models.inspection_image import InspectionImage
from app.models.declaration import Declaration
from app.schemas.inspection import InspectionCreate, InspectionOut, InspectionReviewSubmit
from app.schemas.declaration import DeclarationUpdate, DeclarationOut
from app.auth.security import get_current_user, get_optional_user
from app.services.inspection_service import InspectionService
from app.services.audit_service import AuditService
from app.extraction.extractor import DeclarationExtractor

# Import OCRService from /ocr-test folder
import sys
from pathlib import Path
root_dir = Path(__file__).resolve().parent.parent.parent.parent
ocr_test_dir = root_dir / "ocr-test"
if str(ocr_test_dir) not in sys.path:
    sys.path.insert(0, str(ocr_test_dir))

try:
    from ocr_service import OCRService
except ImportError:
    OCRService = None

router = APIRouter(prefix="/inspections", tags=["Inspections"])
service = InspectionService()
ocr_service = OCRService() if OCRService else None

@router.get("", response_model=List[InspectionOut])
def list_inspections(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Inspection).join(Product)
    if status_filter:
        query = query.filter(Inspection.status == status_filter)
    if category:
        query = query.filter(Product.category == category)
    if search:
        query = query.filter(
            (Inspection.case_number.ilike(f"%{search}%")) |
            (Product.name.ilike(f"%{search}%")) |
            (Product.barcode.ilike(f"%{search}%"))
        )
    return query.order_by(Inspection.created_at.desc()).offset(skip).limit(limit).all()

@router.post("", response_model=InspectionOut)
def create_inspection(
    data: InspectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_id = current_user.id if current_user else 1

    product = Product(
        name=data.product_name,
        brand=data.brand,
        category=data.category,
        barcode=data.barcode,
        is_imported=data.is_imported,
        declared_net_quantity=None
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    case_no = f"LM/2026/{str(uuid.uuid4().int)[:6]}"
    inspection = Inspection(
        case_number=case_no,
        product_id=product.id,
        inspector_id=user_id,
        status="REVIEW",
        score=0.0,
        inspection_type=data.inspection_type,
        location=data.location or "New Delhi, Delhi",
        retailer_name=data.retailer_name,
        notes=data.notes
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    AuditService.log(
        db=db,
        action="INSPECTION_CREATED",
        entity_type="Inspection",
        entity_id=str(inspection.id),
        user_name=current_user.full_name if current_user else "Inspector",
        details={"case_number": case_no, "product": product.name}
    )

    return inspection

@router.get("/{inspection_id}", response_model=InspectionOut)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")
    return inspection

@router.get("/case/{case_number:path}", response_model=InspectionOut)
def get_inspection_by_case(case_number: str, db: Session = Depends(get_db)):
    cno_clean = case_number.strip()
    inspection = db.query(Inspection).filter(Inspection.case_number == cno_clean).first()
    if not inspection:
        inspection = db.query(Inspection).filter(Inspection.case_number.ilike(f"%{cno_clean}%")).first()
    if not inspection and cno_clean.isdigit():
        inspection = db.query(Inspection).filter(Inspection.id == int(cno_clean)).first()

    if not inspection:
        raise HTTPException(status_code=404, detail=f"Inspection '{case_number}' not found")
    return inspection

@router.post("/{inspection_id}/images")
def upload_inspection_images(
    inspection_id: int,
    image_type: str = Form("FRONT"),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    upload_dir = os.path.abspath(f"./uploads/inspections/{inspection_id}")
    os.makedirs(upload_dir, exist_ok=True)

    saved_images = []
    for file in files:
        fname = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(upload_dir, fname)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        from app.utils.supabase_uploader import upload_image_to_supabase_storage
        pub_url = upload_image_to_supabase_storage(file_path, fname)
        rel_url = f"/uploads/inspections/{inspection_id}/{fname}"

        img_obj = InspectionImage(
            inspection_id=inspection.id,
            image_type=image_type,
            original_path=file_path,
            image_url=pub_url or rel_url,
            quality_status="GOOD",
            quality_score=1.0,
            quality_metrics={}
        )
        db.add(img_obj)
        saved_images.append(file.filename)

    db.commit()
    return {"message": f"Successfully uploaded {len(saved_images)} images", "files": saved_images}

@router.post("/{inspection_id}/scan", response_model=InspectionOut)
def run_scan_inspection(
    inspection_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user_name = current_user.full_name if current_user else "Inspector"
    try:
        inspection = service.process_inspection(db, inspection_id, user_name=user_name)
        return inspection
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{inspection_id}/declarations/{decl_id}", response_model=DeclarationOut)
def update_declaration(
    inspection_id: int,
    decl_id: int,
    update_data: DeclarationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    decl = db.query(Declaration).filter(Declaration.id == decl_id, Declaration.inspection_id == inspection_id).first()
    if not decl:
        raise HTTPException(status_code=404, detail="Declaration not found")

    old_val = decl.value
    if update_data.value is not None:
        decl.value = update_data.value
        decl.source = "HUMAN_VERIFIED"
        decl.is_verified = True
        decl.verified_by = current_user.full_name if current_user else "Reviewer"
        decl.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(decl)

    # Re-run rule evaluation
    service.process_inspection(db, inspection_id, user_name=current_user.full_name if current_user else "Inspector")

    AuditService.log(
        db=db,
        action="DECLARATION_CORRECTED",
        entity_type="Declaration",
        entity_id=str(decl.id),
        user_name=current_user.full_name if current_user else "Reviewer",
        details={"field": decl.field, "old_value": old_val, "new_value": decl.value}
    )

    return decl

@router.post("/{inspection_id}/review")
def submit_officer_review(
    inspection_id: int,
    review_data: InspectionReviewSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    inspection.status = review_data.final_determination
    inspection.notes = f"{inspection.notes or ''}\n\nOfficer Review ({datetime.now().strftime('%Y-%m-%d %H:%M')}): {review_data.officer_notes}"
    db.commit()

    AuditService.log(
        db=db,
        action="OFFICER_REVIEW_SUBMITTED",
        entity_type="Inspection",
        entity_id=str(inspection.id),
        user_name=current_user.full_name if current_user else "Officer",
        details={"determination": review_data.final_determination, "notes": review_data.officer_notes}
    )

    return {"status": "SUCCESS", "message": "Officer determination recorded successfully."}
 
@router.post("/{inspection_id}/process-ocr")
def process_inspection_ocr(
    inspection_id: str,
    background_tasks: BackgroundTasks
):
    """
    Enqueues OCR processing for all uploaded images of an inspection in the background.
    Non-blocking, idempotent, and updates public.extracted_text in Supabase.
    """
    if not ocr_service:
        raise HTTPException(status_code=500, detail="OCRService from /ocr-test not initialized.")

    background_tasks.add_task(ocr_service.process_inspection_uploads, str(inspection_id))
    return {
        "status": "processing",
        "inspection_id": str(inspection_id),
        "message": "OCR processing job enqueued in background."
    }

@router.get("/{inspection_id}/ocr-status")
def get_inspection_ocr_status(
    inspection_id: str
):
    """
    Queries live OCR extraction status and full extracted text per packaging angle.
    """
    if not ocr_service:
        return {"status": "unavailable", "message": "OCRService not loaded"}
    return ocr_service.get_inspection_ocr_status(str(inspection_id))


@router.post("/direct-scan")
def direct_scan(
    product_name: str = Form("Packaged Commodity"),
    category: str = Form("Packaged Food"),
    location: str = Form("New Delhi, Delhi"),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    """
    Direct multi-image scan endpoint:
    Accepts any number of packaging photos (front, back, side, cap, bottom, etc.),
    runs EasyOCR & DeclarationExtractor across all images, evaluates PCR 2011 compliance,
    and returns the complete inspection result.
    """
    product = Product(
        name=product_name,
        category=category,
        brand=product_name.split()[0] if product_name else "Generic",
        barcode=None,
        is_imported=False
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    user_id = current_user.id if current_user else 1
    case_no = f"LM/2026/{str(uuid.uuid4().int)[:6]}"
    inspection = Inspection(
        case_number=case_no,
        product_id=product.id,
        inspector_id=user_id,
        status="REVIEW",
        score=0.0,
        inspection_type="RETAIL_PACK",
        location=location,
        retailer_name="Retail Store"
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)

    upload_dir = os.path.abspath(f"./uploads/inspections/{inspection.id}")
    os.makedirs(upload_dir, exist_ok=True)

    all_detections = []
    saved_images_list = []

    print(f"\n[DIRECT-SCAN] Received {len(files)} packaging photos: {[f.filename for f in files]}")

    for idx, file in enumerate(files):
        safe_name = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(upload_dir, safe_name)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        angle_label = f"PHOTO_{idx+1}"
        if "front" in file.filename.lower() or idx == 0:
            angle_label = "FRONT"
        elif "back" in file.filename.lower() or idx == 1:
            angle_label = "BACK"
        elif "side" in file.filename.lower() or "nutri" in file.filename.lower() or idx == 2:
            angle_label = "SIDE"

        img_obj = InspectionImage(
            inspection_id=inspection.id,
            image_type=angle_label,
            original_path=file_path,
            quality_status="GOOD",
            quality_score=1.0,
            quality_metrics={}
        )
        db.add(img_obj)
        db.commit()
        db.refresh(img_obj)

        web_url = f"/uploads/inspections/{inspection.id}/{safe_name}"
        saved_images_list.append({
            "id": f"img_{img_obj.id}",
            "angle": angle_label,
            "image_type": angle_label,
            "original_path": file_path,
            "image_url": web_url,
            "url": web_url,
            "filename": file.filename
        })

    # 1. Primary: Run Gemini Vision AI on all images (Lightning fast ~1.5s)
    gemini_successful = False
    declarations_dict = {}

    try:
        from app.config import settings
        from app.ocr.gemini_engine import GeminiVisionEngine
        gemini_engine = GeminiVisionEngine(api_key=settings.GEMINI_API_KEY)
        if gemini_engine.is_available():
            image_paths = [img["original_path"] for img in saved_images_list]
            print(f"\n==========================================================================")
            print(f"[GEMINI-VISION] 🤖 Dispatching {len(image_paths)} packaging photo(s) to Gemini Vision AI...")
            print(f"==========================================================================")
            gemini_result = gemini_engine.analyze_packaging_images(image_paths, category)
            # Normalise list output to dict if Gemini wrapped it in a list
            if isinstance(gemini_result, list):
                if len(gemini_result) > 0:
                    dict_item = next((item for item in gemini_result if isinstance(item, dict) and "declarations" in item), None)
                    gemini_result = dict_item if dict_item else (gemini_result[0] if isinstance(gemini_result[0], dict) else {})
                else:
                    gemini_result = {}

            if gemini_result and "declarations" in gemini_result and not gemini_result.get("error"):
                gemini_successful = True
                print(f"[GEMINI-VISION] Successfully extracted declarations across all {len(image_paths)} photos:")
                if gemini_result.get("product_name") and gemini_result["product_name"] not in ["string", ""]:
                    product.name = gemini_result["product_name"]
                    product.brand = gemini_result["product_name"].split()[0]
                    db.commit()
                    print(f"  * PRODUCT NAME: {product.name}")

                # Populate declarations_dict from Gemini
                for k, v in gemini_result["declarations"].items():
                    if v and v.get("value"):
                        raw_box = v.get("box_2d")
                        box = raw_box if (isinstance(raw_box, list) and len(raw_box) == 4) else None
                        img_idx = max(0, min(int(v.get("image_index", 1)) - 1, max(0, len(saved_images_list) - 1)))
                        matching_img_id = saved_images_list[img_idx]["id"] if saved_images_list else "img_01"

                        declarations_dict[k] = {
                            "field": k,
                            "label": k.replace("_", " ").title(),
                            "value": v["value"],
                            "raw_text": v.get("raw_text", v["value"]),
                            "confidence": float(v.get("confidence", 0.98)),
                            "detected": True,
                            "bbox": box,
                            "image_index": int(v.get("image_index", 1)),
                            "image_id": matching_img_id,
                            "rule_citation": "Rule 6(1) PCR 2011"
                        }
                        print(f"  * {k.upper()}: {v['value']} (Photo #{v.get('image_index', 1)}, Box: {box})")
                    else:
                        declarations_dict[k] = {
                            "field": k,
                            "label": k.replace("_", " ").title(),
                            "value": None,
                            "raw_text": None,
                            "confidence": 0.0,
                            "detected": False,
                            "bbox": None,
                            "image_index": 1,
                            "image_id": None,
                            "rule_citation": "Rule 6(1) PCR 2011"
                        }
            elif gemini_result and gemini_result.get("error"):
                print(f"[GEMINI-VISION] Note: {gemini_result.get('error')}")
    except Exception as e:
        print(f"[GEMINI-VISION] Exception: {e}")

    # 2. Fallback: If Gemini is offline/disabled, run local CPU EasyOCR engine
    if not gemini_successful:
        print("[FALLBACK] Running local CPU EasyOCR engine...")
        for img in saved_images_list:
            try:
                detections = service.ocr_engine.extract_text(img["original_path"], image_id=img["angle"])
                all_detections.extend(detections)
            except Exception as e:
                print(f"[OCR] Note on {img['filename']}: {e}")
        declarations_dict = DeclarationExtractor.extract_declarations(all_detections, category)

    # Evaluate Legal Metrology PCR 2011 compliance
    product_info = {
        "name": product.name,
        "category": product.category,
        "is_imported": product.is_imported,
        "barcode": product.barcode
    }
    eval_result = service.rule_engine.evaluate_inspection(declarations_dict, product_info)

    # Create a mapping of field to evaluated status from rule engine evaluations
    eval_status_map = {}
    for ev in eval_result.get("evaluations", []):
        f = ev.get("field")
        if f:
            current_status = eval_status_map.get(f, "PASS")
            new_status = ev.get("status", "PASS")
            if new_status == "FAIL" or current_status == "FAIL":
                eval_status_map[f] = "FAIL"
            elif new_status in ["REVIEW", "WARNING"] or current_status in ["REVIEW", "WARNING"]:
                eval_status_map[f] = "REVIEW"
            else:
                eval_status_map[f] = "PASS"

    # Save declarations
    saved_declarations = []
    for field, d in declarations_dict.items():
        evaluated_status = eval_status_map.get(field, "PASS" if d.get("detected") else "FAIL")
        decl_obj = Declaration(
            inspection_id=inspection.id,
            field=field,
            label=d.get("label", field),
            value=d.get("value"),
            raw_text=d.get("raw_text"),
            confidence=d.get("confidence", 0.0),
            source="AI",
            is_verified=False,
            status=evaluated_status,
            bbox=d.get("bbox"),
            image_id=d.get("image_id")
        )
        db.add(decl_obj)
        saved_declarations.append({
            "field": field,
            "label": d.get("label", field),
            "value": d.get("value"),
            "raw_text": d.get("raw_text"),
            "confidence": d.get("confidence", 0.0),
            "status": evaluated_status,
            "is_present": d.get("detected", False),
            "bbox": d.get("bbox"),
            "image_index": d.get("image_index", 1),
            "image_id": d.get("image_id"),
            "rule": d.get("rule_citation", "Rule 6(1) PCR 2011")
        })

    # Dynamic location update from manufacturer address
    mfr_info = declarations_dict.get("manufacturer")
    if mfr_info and mfr_info.get("value"):
        from app.utils.location_extractor import extract_location_from_manufacturer
        loc = extract_location_from_manufacturer(mfr_info["value"])
        if loc:
            inspection.location = loc

    inspection.status = eval_result.get("overall_status", "NON_COMPLIANT")
    inspection.score = eval_result.get("overall_score", 0.0)
    db.commit()
    db.refresh(inspection)

    return {
        "id": inspection.id,
        "case_number": inspection.case_number,
        "product": product.name,
        "category": product.category,
        "location": inspection.location,
        "status": inspection.status,
        "score": inspection.score,
        "date": inspection.created_at.strftime("%Y-%m-%d") if inspection.created_at else "2026-08-29",
        "inspector_name": current_user.full_name if current_user else "Authorized Officer",
        "declarations": saved_declarations,
        "images": saved_images_list,
        "violations": eval_result.get("violations", []),
        "ocr_detections": all_detections
    }

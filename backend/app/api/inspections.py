import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.user import User
from app.models.product import Product
from app.models.inspection import Inspection
from app.models.inspection_image import InspectionImage
from app.models.declaration import Declaration
from app.schemas.inspection import InspectionCreate, InspectionOut, InspectionReviewSubmit
from app.schemas.declaration import DeclarationUpdate, DeclarationOut
from app.auth.security import get_current_user
from app.services.inspection_service import InspectionService
from app.services.audit_service import AuditService

router = APIRouter(prefix="/inspections", tags=["Inspections"])
service = InspectionService()

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
        file_path = os.path.join(upload_dir, f"{uuid.uuid4().hex}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        img_obj = InspectionImage(
            inspection_id=inspection.id,
            image_type=image_type,
            original_path=file_path,
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

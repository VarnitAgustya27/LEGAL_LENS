from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.schemas.declaration import DeclarationOut

class ProductCreate(BaseModel):
    name: str
    brand: Optional[str] = None
    category: str = "Packaged Food"
    barcode: Optional[str] = None
    is_imported: bool = False
    declared_net_quantity: Optional[str] = None
    description: Optional[str] = None

class ProductOut(ProductCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ViolationOut(BaseModel):
    id: int
    inspection_id: int
    rule_code: str
    field: str
    status: str
    severity: str
    message: str
    expected: Optional[str] = None
    detected: Optional[str] = None
    statutory_reference: Optional[str] = None
    confidence: float
    evidence_image_id: Optional[str] = None
    evidence_bbox: Optional[List[Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InspectionImageOut(BaseModel):
    id: int
    inspection_id: int
    image_type: str
    original_path: str
    preprocessed_path: Optional[str] = None
    evidence_path: Optional[str] = None
    quality_status: str
    quality_score: float
    quality_metrics: Dict[str, Any]
    created_at: datetime

    class Config:
        from_attributes = True

class InspectionCreate(BaseModel):
    product_name: str
    brand: Optional[str] = None
    category: str = "Packaged Food"
    barcode: Optional[str] = None
    is_imported: bool = False
    inspection_type: str = "RETAIL_LABEL"
    location: Optional[str] = "New Delhi, Delhi"
    retailer_name: Optional[str] = None
    notes: Optional[str] = None

class InspectionOut(BaseModel):
    id: int
    case_number: str
    product_id: int
    inspector_id: int
    status: str
    score: float
    readability_score: float
    inspection_type: str
    location: str
    retailer_name: Optional[str] = None
    notes: Optional[str] = None
    total_checks: int
    passed_checks: int
    failed_checks: int
    warning_checks: int
    review_checks: int
    created_at: datetime
    updated_at: datetime

    product: ProductOut
    images: List[InspectionImageOut] = []
    declarations: List[DeclarationOut] = []
    violations: List[ViolationOut] = []

    class Config:
        from_attributes = True

class InspectionReviewSubmit(BaseModel):
    final_determination: str  # COMPLIANT, NON_COMPLIANT, WARNING_ISSUED
    officer_notes: str
    verified_by: Optional[str] = None

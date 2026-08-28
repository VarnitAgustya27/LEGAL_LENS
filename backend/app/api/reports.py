import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.inspection import Inspection
from app.auth.security import get_current_user
from app.services.inspection_service import InspectionService

router = APIRouter(prefix="/reports", tags=["Reports"])
service = InspectionService()

@router.post("/{inspection_id}/generate")
def generate_report(inspection_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    user_name = current_user.full_name if current_user else "Authorized Inspector"
    try:
        report = service.generate_inspection_report(db, inspection_id, generated_by=user_name)
        return {"status": "SUCCESS", "report_id": report.id, "case_number": report.case_number, "pdf_url": f"/api/reports/{inspection_id}/pdf"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{inspection_id}/pdf")
def download_pdf_report(inspection_id: int, db: Session = Depends(get_db)):
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if not inspection:
        raise HTTPException(status_code=404, detail="Inspection not found")

    pdf_filename = f"Report_{inspection.case_number.replace('/', '_')}.pdf"
    pdf_path = os.path.abspath(f"./uploads/reports/{pdf_filename}")

    if not os.path.exists(pdf_path):
        # Generate on the fly
        service.generate_inspection_report(db, inspection_id)

    if os.path.exists(pdf_path):
        return FileResponse(pdf_path, media_type="application/pdf", filename=pdf_filename)
    raise HTTPException(status_code=404, detail="PDF report could not be generated.")

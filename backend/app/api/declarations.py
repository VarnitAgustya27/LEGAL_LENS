from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.declaration import Declaration
from app.schemas.declaration import DeclarationOut

router = APIRouter(prefix="/declarations", tags=["Declarations"])

@router.get("", response_model=List[DeclarationOut])
def get_declarations(inspection_id: int, db: Session = Depends(get_db)):
    return db.query(Declaration).filter(Declaration.inspection_id == inspection_id).all()

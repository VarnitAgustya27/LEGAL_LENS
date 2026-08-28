from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database.session import get_db
from app.models.rule import Rule
from app.schemas.rule import RuleOut

router = APIRouter(prefix="/rules", tags=["Legal Rules"])

@router.get("", response_model=List[RuleOut])
def get_rules(db: Session = Depends(get_db)):
    return db.query(Rule).filter(Rule.is_active == True).all()

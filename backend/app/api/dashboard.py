from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database.session import get_db
from app.models.inspection import Inspection
from app.models.product import Product
from app.models.violation import Violation
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total = db.query(Inspection).count()
    compliant = db.query(Inspection).filter(Inspection.status == "COMPLIANT").count()
    non_compliant = db.query(Inspection).filter(Inspection.status == "NON_COMPLIANT").count()
    review = db.query(Inspection).filter(Inspection.status == "REVIEW").count()

    compliance_rate = round((compliant / max(1, total)) * 100, 1) if total > 0 else 0.0

    # Real Violations by Product Category from Database
    cat_counts = (
        db.query(Product.category, func.count(Violation.id))
        .join(Inspection, Inspection.product_id == Product.id)
        .join(Violation, Violation.inspection_id == Inspection.id)
        .group_by(Product.category)
        .all()
    )
    violations_by_category = [{"category": cat, "violations": cnt} for cat, cnt in cat_counts]
    if not violations_by_category:
        violations_by_category = []

    # Real Inspection Trend from Database
    inspections_trend = []
    if total > 0:
        # Group by month or day
        date_counts = (
            db.query(func.strftime("%b", Inspection.created_at), func.count(Inspection.id))
            .group_by(func.strftime("%b", Inspection.created_at))
            .all()
        )
        inspections_trend = [{"month": m or "Aug", "inspections": c} for m, c in date_counts]
    
    # Real Common Violations from Database
    viol_counts = (
        db.query(Violation.rule_code, Violation.message, func.count(Violation.id))
        .group_by(Violation.rule_code)
        .order_by(func.count(Violation.id).desc())
        .limit(5)
        .all()
    )
    common_violations = [{"rule": code, "desc": msg[:45] + "...", "count": cnt} for code, msg, cnt in viol_counts]

    return {
        "total_inspections": total,
        "compliant_count": compliant,
        "non_compliant_count": non_compliant,
        "review_count": review,
        "compliance_rate": compliance_rate,
        "violations_by_category": violations_by_category,
        "inspections_trend": inspections_trend,
        "common_violations": common_violations
    }

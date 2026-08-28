from pydantic import BaseModel
from typing import List, Dict, Any

class DashboardStats(BaseModel):
    total_inspections: int
    compliant_count: int
    non_compliant_count: int
    review_count: int
    compliance_rate: float
    violations_by_category: List[Dict[str, Any]]
    inspections_trend: List[Dict[str, Any]]
    common_violations: List[Dict[str, Any]]

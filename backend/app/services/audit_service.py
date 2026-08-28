from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, Any, Optional
from app.models.audit_log import AuditLog

class AuditService:
    @staticmethod
    def log(db: Session, action: str, entity_type: str, entity_id: str, user_name: str = "System", user_id: Optional[int] = None, details: Dict[str, Any] = None):
        log_entry = AuditLog(
            user_id=user_id,
            user_name=user_name,
            action=action,
            entity_type=entity_type,
            entity_id=str(entity_id),
            details=details or {},
            timestamp=datetime.utcnow()
        )
        db.add(log_entry)
        db.commit()

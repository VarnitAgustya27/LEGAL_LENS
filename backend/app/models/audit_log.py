from sqlalchemy import Column, Integer, String, DateTime, JSON, Text
from datetime import datetime
from app.database.session import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String, default="System")
    action = Column(String, index=True, nullable=False)
    entity_type = Column(String, nullable=False)
    entity_id = Column(String, nullable=True)
    details = Column(JSON, default=dict)
    timestamp = Column(DateTime, default=datetime.utcnow)

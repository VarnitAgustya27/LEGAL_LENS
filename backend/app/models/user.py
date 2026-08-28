from sqlalchemy import Column, Integer, String, Boolean, DateTime
from datetime import datetime
from app.database.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="INSPECTOR")  # ADMIN, INSPECTOR, REVIEWER
    badge_number = Column(String, nullable=True)
    department = Column(String, default="Legal Metrology Department")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

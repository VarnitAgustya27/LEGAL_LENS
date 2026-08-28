import json
import os
from sqlalchemy.orm import Session
from app.database.session import Base, engine, SessionLocal
from app.models.user import User
from app.models.product import Product
from app.models.rule import Rule
from app.models.inspection import Inspection
from app.models.declaration import Declaration
from app.models.violation import Violation
from app.auth.security import get_password_hash

def init_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Seed Essential System Users (Admin, Inspector, Reviewer)
        if db.query(User).count() == 0:
            users = [
                User(
                    email="inspector@legallens.gov.in",
                    full_name="R. Bhaskaran",
                    hashed_password=get_password_hash("inspector123"),
                    role="INSPECTOR",
                    badge_number="LM-DL-842",
                    department="Legal Metrology Enforcement Directorate"
                ),
                User(
                    email="admin@legallens.gov.in",
                    full_name="Department Administrator",
                    hashed_password=get_password_hash("admin123"),
                    role="ADMIN",
                    badge_number="LM-HQ-001",
                    department="Ministry of Consumer Affairs"
                ),
                User(
                    email="reviewer@legallens.gov.in",
                    full_name="A. Mehta (Senior Reviewer)",
                    hashed_password=get_password_hash("reviewer123"),
                    role="REVIEWER",
                    badge_number="LM-REV-104",
                    department="Legal Compliance Directorate"
                )
            ]
            db.add_all(users)
            db.commit()
            print("System users initialized.")

        # 2. Seed Legal Rules from official PCR 2011 source
        if db.query(Rule).count() == 0:
            rules_path = os.path.join(os.path.dirname(__file__), "..", "rules", "legal_rules.json")
            if os.path.exists(rules_path):
                with open(rules_path, "r", encoding="utf-8") as f:
                    rules_data = json.load(f)
                    for r in rules_data.get("rule_list", []):
                        rule_obj = Rule(
                            code=r.get("code"),
                            name=r.get("name"),
                            field=r.get("field"),
                            statutory_reference=r.get("statutory_reference"),
                            category_applicability=r.get("category_applicability", ["ALL"]),
                            is_mandatory=r.get("is_mandatory", True),
                            severity=r.get("severity", "HIGH"),
                            validation_type=r.get("validation_type", "FORMAT"),
                            description=r.get("description"),
                            rule_version=rules_data.get("version", "2026.1"),
                            is_active=True
                        )
                        db.add(rule_obj)
                db.commit()
                print("Legal Metrology (PCR 2011) rules loaded.")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()

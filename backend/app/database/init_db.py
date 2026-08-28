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
        # 1. Seed Users
        if db.query(User).count() == 0:
            users = [
                User(
                    email="inspector@legallens.gov.in",
                    full_name="R. Bhaskaran",
                    hashed_password=get_password_hash("inspector123"),
                    role="INSPECTOR",
                    badge_number="LM-DL-842",
                    department="Delhi Legal Metrology Enforcement"
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
            print("Users seeded successfully.")

        # 2. Seed Legal Rules
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
                print("Rules seeded successfully.")

        # 3. Seed Demo Products & Inspections
        if db.query(Inspection).count() == 0:
            inspector = db.query(User).filter(User.role == "INSPECTOR").first()
            p1 = Product(
                name="Nutrimax Glucose Biscuits 200g",
                brand="Nutrimax",
                category="Packaged Food",
                barcode="8901234567890",
                is_imported=False,
                declared_net_quantity="200 g"
            )
            p2 = Product(
                name="Silkessence Herbal Shampoo 340ml",
                brand="Silkessence",
                category="Cosmetics",
                barcode="8909876543210",
                is_imported=False,
                declared_net_quantity="340 ml"
            )
            p3 = Product(
                name="Glow & Co. Vitamin C Cream 50g",
                brand="Glow & Co.",
                category="Cosmetics",
                barcode="8905555444333",
                is_imported=True,
                declared_net_quantity="50 g"
            )
            db.add_all([p1, p2, p3])
            db.commit()

            i1 = Inspection(
                case_number="LM/2026/000482",
                product_id=p1.id,
                inspector_id=inspector.id,
                status="NON_COMPLIANT",
                score=78.5,
                readability_score=94.0,
                location="Karol Bagh, Delhi",
                total_checks=8,
                passed_checks=6,
                failed_checks=2,
                warning_checks=0,
                review_checks=0
            )
            i2 = Inspection(
                case_number="LM/2026/000481",
                product_id=p2.id,
                inspector_id=inspector.id,
                status="REVIEW",
                score=87.5,
                readability_score=72.0,
                location="Lajpat Nagar, Delhi",
                total_checks=8,
                passed_checks=7,
                failed_checks=0,
                warning_checks=1,
                review_checks=1
            )
            db.add_all([i1, i2])
            db.commit()

            print("Demo products & inspections seeded successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    init_database()

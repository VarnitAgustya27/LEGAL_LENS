import os
import shutil
from datetime import datetime
from typing import List, Dict, Any
from sqlalchemy.orm import Session

from app.models.inspection import Inspection
from app.models.product import Product
from app.models.inspection_image import InspectionImage
from app.models.declaration import Declaration
from app.models.violation import Violation
from app.models.report import Report
from app.cv.preprocessor import ImageQualityAssessment
from app.ocr.engine import OCREngine
from app.extraction.extractor import DeclarationExtractor
from app.rules.engine import RuleEngine
from app.reports.pdf_generator import InspectionReportGenerator
from app.services.audit_service import AuditService

class InspectionService:
    def __init__(self):
        self.ocr_engine = OCREngine()
        self.rule_engine = RuleEngine()

    def process_inspection(self, db: Session, inspection_id: int, user_name: str = "Inspector") -> Inspection:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise ValueError("Inspection not found")

        product = inspection.product
        product_info = {
            "name": product.name,
            "category": product.category,
            "is_imported": product.is_imported,
            "barcode": product.barcode
        }

        all_detections = []
        overall_quality_scores = []

        # Process each image
        for img in inspection.images:
            q_res = ImageQualityAssessment.assess_quality(img.original_path)
            img.quality_status = q_res.get("quality_status", "GOOD")
            img.quality_score = q_res.get("quality_score", 1.0)
            img.quality_metrics = q_res
            overall_quality_scores.append(img.quality_score)

            # Preprocess image
            preprocessed_path = img.original_path.replace(".png", "_prep.png").replace(".jpg", "_prep.jpg")
            ImageQualityAssessment.preprocess_for_ocr(img.original_path, preprocessed_path)
            img.preprocessed_path = preprocessed_path

            # OCR
            detections = self.ocr_engine.extract_text(img.original_path, image_id=f"img_{img.id}")
            all_detections.extend(detections)

        # Declaration Extraction
        declarations_dict = DeclarationExtractor.extract_declarations(all_detections, product.category)

        # Clear existing declarations & violations
        db.query(Declaration).filter(Declaration.inspection_id == inspection.id).delete()
        db.query(Violation).filter(Violation.inspection_id == inspection.id).delete()

        # Rule Engine Evaluation
        eval_result = self.rule_engine.evaluate_inspection(declarations_dict, product_info)

        # Save Declarations
        for field, d in declarations_dict.items():
            decl_obj = Declaration(
                inspection_id=inspection.id,
                field=field,
                label=d.get("label", field),
                value=d.get("value"),
                raw_text=d.get("raw_text"),
                confidence=d.get("confidence", 0.0),
                source="AI",
                is_verified=False,
                status="PASS" if d.get("detected") else "FAIL",
                bbox=d.get("bbox"),
                image_id=d.get("image_id")
            )
            db.add(decl_obj)

        # Save Violations
        for v in eval_result.get("violations", []):
            viol_obj = Violation(
                inspection_id=inspection.id,
                rule_code=v.get("rule_code", ""),
                field=v.get("field", ""),
                status=v.get("status", "FAIL"),
                severity=v.get("severity", "HIGH"),
                message=v.get("message", ""),
                expected=v.get("expected"),
                detected=v.get("detected"),
                statutory_reference=v.get("statutory_reference"),
                confidence=v.get("confidence", 0.9),
                evidence_image_id=v.get("evidence_image_id"),
                evidence_bbox=v.get("evidence_bbox")
            )
            db.add(viol_obj)

        # Update Inspection Summary
        inspection.score = eval_result.get("score", 0.0)
        inspection.status = eval_result.get("overall_status", "REVIEW")
        inspection.total_checks = eval_result.get("total_checks", 0)
        inspection.passed_checks = eval_result.get("passed_checks", 0)
        inspection.failed_checks = eval_result.get("failed_checks", 0)
        inspection.warning_checks = eval_result.get("warning_checks", 0)
        inspection.review_checks = eval_result.get("review_checks", 0)
        inspection.readability_score = round(sum(overall_quality_scores) / max(1, len(overall_quality_scores)) * 100, 1)

        db.commit()
        db.refresh(inspection)

        # Audit Log
        AuditService.log(
            db=db,
            action="SCAN_COMPLETED",
            entity_type="Inspection",
            entity_id=str(inspection.id),
            user_name=user_name,
            details={"score": inspection.score, "status": inspection.status, "violations_count": len(eval_result.get("violations", []))}
        )

        return inspection

    def generate_inspection_report(self, db: Session, inspection_id: int, generated_by: str = "Authorized Inspector") -> Report:
        inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
        if not inspection:
            raise ValueError("Inspection not found")

        eval_data = self.rule_engine.evaluate_inspection(
            DeclarationExtractor.extract_declarations([
                {"text": d.raw_text or d.value or "", "confidence": d.confidence, "bbox": d.bbox, "image_id": d.image_id}
                for d in inspection.declarations
            ], inspection.product.category),
            {"name": inspection.product.name, "category": inspection.product.category, "is_imported": inspection.product.is_imported}
        )

        pdf_filename = f"Report_{inspection.case_number.replace('/', '_')}.pdf"
        reports_dir = os.path.abspath("./uploads/reports")
        os.makedirs(reports_dir, exist_ok=True)
        pdf_path = os.path.join(reports_dir, pdf_filename)

        report_payload = {
            "case_number": inspection.case_number,
            "product_name": inspection.product.name,
            "category": inspection.product.category,
            "is_imported": inspection.product.is_imported,
            "score": inspection.score,
            "status": inspection.status,
            "inspector_name": generated_by,
            "created_at": inspection.created_at.strftime("%d %B %Y, %H:%M"),
            "evaluations": eval_data.get("evaluations", []),
            "violations": eval_data.get("violations", [])
        }

        InspectionReportGenerator.generate_pdf(report_payload, pdf_path)

        report = Report(
            inspection_id=inspection.id,
            case_number=inspection.case_number,
            pdf_path=pdf_path,
            summary=report_payload,
            generated_by=generated_by,
            status="COMPLETED"
        )
        db.add(report)
        db.commit()
        db.refresh(report)

        AuditService.log(
            db=db,
            action="REPORT_GENERATED",
            entity_type="Report",
            entity_id=str(report.id),
            user_name=generated_by,
            details={"case_number": inspection.case_number, "pdf_path": pdf_path}
        )

        return report

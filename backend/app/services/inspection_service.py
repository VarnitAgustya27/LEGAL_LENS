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

        # Process each image quality
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

        # Primary: Attempt Gemini Vision AI
        gemini_successful = False
        declarations_dict = {}

        try:
            from app.config import settings
            from app.ocr.gemini_engine import GeminiVisionEngine
            gemini_engine = GeminiVisionEngine(api_key=settings.GEMINI_API_KEY)
            if gemini_engine.is_available() and inspection.images:
                image_paths = [img.original_path for img in inspection.images]
                print(f"\n==========================================================================")
                print(f"[GEMINI-VISION] 🤖 Dispatching {len(image_paths)} photo(s) to Gemini Vision AI...")
                print(f"==========================================================================")
                gemini_result = gemini_engine.analyze_packaging_images(image_paths, product.category)
                if isinstance(gemini_result, list):
                    if len(gemini_result) > 0:
                        dict_item = next((item for item in gemini_result if isinstance(item, dict) and "declarations" in item), None)
                        gemini_result = dict_item if dict_item else (gemini_result[0] if isinstance(gemini_result[0], dict) else {})
                    else:
                        gemini_result = {}

                if gemini_result and "declarations" in gemini_result and not gemini_result.get("error"):
                    gemini_successful = True
                    print(f"[GEMINI-VISION] Successfully extracted declarations for Case {inspection.case_number}:")
                    for k, v in gemini_result["declarations"].items():
                        if v and v.get("value"):
                            raw_box = v.get("box_2d")
                            box = raw_box if (isinstance(raw_box, list) and len(raw_box) == 4) else None
                            img_idx = max(0, min(int(v.get("image_index", 1)) - 1, max(0, len(inspection.images) - 1)))
                            matching_img_id = f"img_{inspection.images[img_idx].id}" if inspection.images else None

                            declarations_dict[k] = {
                                "field": k,
                                "label": k.replace("_", " ").title(),
                                "value": v["value"],
                                "raw_text": v.get("raw_text", v["value"]),
                                "confidence": float(v.get("confidence", 0.98)),
                                "detected": True,
                                "bbox": box,
                                "image_id": matching_img_id
                            }
                            print(f"  * {k.upper()}: {v['value']}")
                        else:
                            declarations_dict[k] = {
                                "field": k,
                                "label": k.replace("_", " ").title(),
                                "value": None,
                                "raw_text": None,
                                "confidence": 0.0,
                                "detected": False,
                                "bbox": None,
                                "image_id": None
                            }
        except Exception as e:
            print(f"[GEMINI-VISION] Note: {e}")

        # Fallback to local CPU EasyOCR engine if Gemini not successful
        if not gemini_successful:
            print("[FALLBACK] Running local CPU EasyOCR engine...")
            for img in inspection.images:
                detections = self.ocr_engine.extract_text(img.original_path, image_id=f"img_{img.id}")
                all_detections.extend(detections)
            declarations_dict = DeclarationExtractor.extract_declarations(all_detections, product.category)

        # Clear existing declarations & violations
        db.query(Declaration).filter(Declaration.inspection_id == inspection.id).delete()
        db.query(Violation).filter(Violation.inspection_id == inspection.id).delete()

        # Rule Engine Evaluation
        eval_result = self.rule_engine.evaluate_inspection(declarations_dict, product_info)

        # Create a mapping of field to evaluated status from rule engine evaluations
        eval_status_map = {}
        for ev in eval_result.get("evaluations", []):
            f = ev.get("field")
            if f:
                current_status = eval_status_map.get(f, "PASS")
                new_status = ev.get("status", "PASS")
                if new_status == "FAIL" or current_status == "FAIL":
                    eval_status_map[f] = "FAIL"
                elif new_status in ["REVIEW", "WARNING"] or current_status in ["REVIEW", "WARNING"]:
                    eval_status_map[f] = "REVIEW"
                else:
                    eval_status_map[f] = "PASS"

        # Save Declarations
        for field, d in declarations_dict.items():
            evaluated_status = eval_status_map.get(field, "PASS" if d.get("detected") else "FAIL")
            decl_obj = Declaration(
                inspection_id=inspection.id,
                field=field,
                label=d.get("label", field),
                value=d.get("value"),
                raw_text=d.get("raw_text"),
                confidence=d.get("confidence", 0.0),
                source="AI",
                is_verified=False,
                status=evaluated_status,
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
        
        # Dynamic location update from manufacturer address
        mfr_info = declarations_dict.get("manufacturer")
        if mfr_info and mfr_info.get("value"):
            from app.utils.location_extractor import extract_location_from_manufacturer
            loc = extract_location_from_manufacturer(mfr_info["value"])
            if loc:
                inspection.location = loc
                
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

        declarations_dict = {}
        for d in inspection.declarations:
            declarations_dict[d.field] = {
                "detected": True if (d.value or d.raw_text) else False,
                "value": d.value or "",
                "raw_text": d.raw_text or d.value or "",
                "confidence": d.confidence or 0.95,
                "bbox": d.bbox,
                "image_id": d.image_id
            }

        eval_data = self.rule_engine.evaluate_inspection(
            declarations_dict,
            {"name": inspection.product.name, "category": inspection.product.category, "is_imported": inspection.product.is_imported}
        )

        pdf_filename = f"Report_{inspection.case_number.replace('/', '_')}.pdf"
        reports_dir = os.path.abspath("./uploads/reports")
        os.makedirs(reports_dir, exist_ok=True)
        pdf_path = os.path.join(reports_dir, pdf_filename)

        officer_name = generated_by
        if (not officer_name or officer_name in ["Authorized Inspector", "Inspector"]) and inspection.inspector:
            officer_name = inspection.inspector.full_name
        if not officer_name or officer_name == "Authorized Inspector":
            officer_name = "Enforcement Officer"

        badge_no = getattr(inspection.inspector, "badge_number", "LM-DL-842") if inspection.inspector else "LM-DL-842"

        evals = eval_data.get("evaluations", [])
        eval_score = eval_data.get("score", 0.0)
        if evals:
            passed_c = sum(1 for e in evals if e.get("status") == "PASS")
            eval_score = round((passed_c / len(evals)) * 100, 1)

        inspection.score = eval_score
        db.commit()

        report_payload = {
            "case_number": inspection.case_number,
            "product_name": inspection.product.name,
            "category": inspection.product.category,
            "is_imported": inspection.product.is_imported,
            "score": eval_score,
            "status": eval_data.get("overall_status", inspection.status),
            "inspector_name": officer_name,
            "badge_number": badge_no,
            "created_at": inspection.created_at.strftime("%d %B %Y, %H:%M"),
            "evaluations": evals,
            "violations": eval_data.get("violations", [])
        }

        InspectionReportGenerator.generate_pdf(report_payload, pdf_path)

        from app.utils.supabase_uploader import upload_pdf_to_supabase, save_report_to_supabase_db
        pdf_url = upload_pdf_to_supabase(pdf_path, pdf_filename)
        save_report_to_supabase_db({
            "case_number": inspection.case_number,
            "pdf_path": pdf_path,
            "pdf_url": pdf_url,
            "summary": report_payload,
            "generated_by": officer_name,
            "status": inspection.status
        })

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
            details={"case_number": inspection.case_number, "pdf_path": pdf_path, "pdf_url": pdf_url}
        )

        return report

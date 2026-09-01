import json
import os
import re
from typing import Dict, List, Any

class RuleEngine:
    """
    Data-Driven Rule Engine for Legal Metrology (Packaged Commodities) Rules, 2011 and Amendments.
    Loads rule specifications, statutory references, and validation logic dynamically from legal_rules.json.
    """
    def __init__(self, rules_file_path: str = None):
        if not rules_file_path:
            rules_file_path = os.path.join(os.path.dirname(__file__), "legal_rules.json")
        self.rules = []
        if os.path.exists(rules_file_path):
            with open(rules_file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.rules = data.get("rule_list", [])

    def evaluate_inspection(self, declarations: Dict[str, Dict[str, Any]], product_info: Dict[str, Any]) -> Dict[str, Any]:
        is_imported = product_info.get("is_imported", False)
        category = product_info.get("category", "Packaged Food")

        evaluations = []
        violations = []

        total_applicable = 0
        passed_count = 0
        failed_count = 0
        warning_count = 0
        review_count = 0

        for rule in self.rules:
            code = rule.get("code")
            field = rule.get("field")
            label = rule.get("name")
            stat_ref = rule.get("statutory_reference")
            severity = rule.get("severity", "HIGH")
            v_type = rule.get("validation_type", "PRESENCE")

            # Check category applicability
            cat_app = rule.get("category_applicability", ["ALL"])
            if "ALL" not in cat_app and category not in cat_app:
                continue

            # Check import applicability for Country of Origin
            if rule.get("is_mandatory_when_imported") and not is_imported and not rule.get("is_mandatory", True):
                continue

            decl = declarations.get(field, {})
            is_detected = decl.get("detected", False)
            raw_text = str(decl.get("raw_text") or "")
            val = str(decl.get("value") or "")
            conf = decl.get("confidence", 0.0)
            bbox = decl.get("bbox")
            image_id = decl.get("image_id")

            # If optional declaration is not detected, skip without failing
            is_mandatory = rule.get("is_mandatory", True)
            if not is_mandatory and not is_detected:
                continue

            total_applicable += 1

            # 1. Check for Missing or Not Detected
            if not is_detected or not val or val.strip().lower() == "missing":
                eval_res = {
                    "rule_code": code,
                    "field": field,
                    "label": label,
                    "status": "FAIL",
                    "severity": severity,
                    "message": f"Mandatory declaration '{label}' was NOT detected on the package label.",
                    "expected": f"Legible {label} complying with {stat_ref}",
                    "detected": "NOT DETECTED",
                    "statutory_reference": stat_ref,
                    "confidence": 0.0 if not is_detected else conf,
                    "evidence_image_id": image_id
                }
                evaluations.append(eval_res)
                violations.append(eval_res)
                failed_count += 1
                continue

            # 2. Check Low OCR Confidence Threshold
            if conf < 0.60:
                eval_res = {
                    "rule_code": code,
                    "field": field,
                    "label": label,
                    "status": "REVIEW",
                    "severity": "MEDIUM",
                    "message": f"Declaration detected with low OCR confidence ({int(conf*100)}%). Requires human inspector verification.",
                    "expected": f"Clear and unambiguous {label}",
                    "detected": raw_text or val,
                    "statutory_reference": stat_ref,
                    "confidence": conf,
                    "evidence_bbox": bbox,
                    "evidence_image_id": image_id
                }
                evaluations.append(eval_res)
                violations.append(eval_res)
                review_count += 1
                continue

            # 3. Data-Driven Validation Dispatch by validation_type
            if v_type == "FORMAT_AND_VALUE":
                # Price / MRP validation with statutory tax qualifier check
                tax_qualifiers = rule.get("required_tax_qualifier", ["inclusive of all taxes", "incl. of all taxes", "incl of taxes"])
                has_tax_qualifier = any(q.lower() in raw_text.lower() or q.lower() in val.lower() for q in tax_qualifiers)
                if not has_tax_qualifier:
                    combined_text = " ".join([str(d.get("raw_text") or "") + " " + str(d.get("value") or "") for d in declarations.values()])
                    has_tax_qualifier = any(q.lower() in combined_text.lower() for q in tax_qualifiers) or bool(re.search(r"(?:inclusive|incl\.|all\s*taxes)", combined_text, re.IGNORECASE))

                if not has_tax_qualifier:
                    eval_res = {
                        "rule_code": code,
                        "field": field,
                        "label": label,
                        "status": "FAIL",
                        "severity": severity,
                        "message": f"{label} is present, but mandatory statutory statement '(Inclusive of all taxes)' is missing.",
                        "expected": f"MRP Rs. XX.XX (Inclusive of all taxes)",
                        "detected": raw_text or val,
                        "statutory_reference": stat_ref,
                        "confidence": conf,
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    }
                    evaluations.append(eval_res)
                    violations.append(eval_res)
                    failed_count += 1
                else:
                    evaluations.append({
                        "rule_code": code,
                        "field": field,
                        "label": label,
                        "status": "PASS",
                        "severity": None,
                        "message": f"{label} declared in standard format with tax qualifier: {val}",
                        "detected": raw_text or val,
                        "confidence": conf,
                        "statutory_reference": stat_ref,
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    })
                    passed_count += 1

            elif v_type == "STANDARD_UNIT":
                # Prescribed SI unit validation
                allowed_units = rule.get("allowed_units", ["g", "kg", "ml", "l", "m", "cm", "pcs", "N", "U"])
                unit_ok = any(u in val.lower() for u in allowed_units)
                if not unit_ok:
                    eval_res = {
                        "rule_code": code,
                        "field": field,
                        "label": label,
                        "status": "FAIL",
                        "severity": severity,
                        "message": f"Net quantity unit in '{val}' does not conform to prescribed standard SI metric units.",
                        "expected": f"Quantity in standard units ({', '.join(allowed_units[:6])})",
                        "detected": val,
                        "statutory_reference": stat_ref,
                        "confidence": conf,
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    }
                    evaluations.append(eval_res)
                    violations.append(eval_res)
                    failed_count += 1
                else:
                    evaluations.append({
                        "rule_code": code,
                        "field": field,
                        "label": label,
                        "status": "PASS",
                        "severity": None,
                        "message": f"{label} declared in standard metric unit: {val}",
                        "detected": raw_text or val,
                        "confidence": conf,
                        "statutory_reference": stat_ref,
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    })
                    passed_count += 1

            elif v_type == "CONTACT_DETAILS":
                # Consumer care phone / email verification
                has_phone = bool(re.search(r"(\d{10}|1800|\+\d{2}|\d{3,4}[\s-]\d{6,8})", raw_text or val))
                has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text or val))
                if not (has_phone or has_email):
                    eval_res = {
                        "rule_code": code,
                        "field": field,
                        "label": label,
                        "status": "WARNING",
                        "severity": severity,
                        "message": f"{label} lacks explicit telephone number or email address.",
                        "expected": f"Helpline number or email address complying with {stat_ref}",
                        "detected": raw_text or val,
                        "statutory_reference": stat_ref,
                        "confidence": conf,
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    }
                    evaluations.append(eval_res)
                    violations.append(eval_res)
                    warning_count += 1
                else:
                    evaluations.append({
                        "rule_code": code,
                        "field": field,
                        "label": label,
                        "status": "PASS",
                        "severity": None,
                        "message": f"{label} contact details detected and valid.",
                        "detected": raw_text or val,
                        "confidence": conf,
                        "statutory_reference": stat_ref,
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    })
                    passed_count += 1

            else:
                # Default presence and legibility check
                evaluations.append({
                    "rule_code": code,
                    "field": field,
                    "label": label,
                    "status": "PASS",
                    "severity": None,
                    "message": f"{label} detected and legible: {val}",
                    "detected": raw_text or val,
                    "confidence": conf,
                    "statutory_reference": stat_ref,
                    "evidence_bbox": bbox,
                    "evidence_image_id": image_id
                })
                passed_count += 1

        score = round((passed_count / max(1, total_applicable)) * 100, 1)
        pass_ratio = passed_count / max(1, total_applicable)

        # Statutory Enforcement Classification:
        # 1. 100% (8/8) -> COMPLIANT
        # 2. < 50% (< 4/8, e.g. 3/8, 2/8) -> NON_COMPLIANT
        # 3. 50% to 99% (4/8 to 7/8) -> REVIEW (Requires Verification)
        if passed_count == total_applicable and total_applicable > 0:
            overall_status = "COMPLIANT"
        elif pass_ratio < 0.50:
            overall_status = "NON_COMPLIANT"
        else:
            overall_status = "REVIEW"

        return {
            "score": score,
            "overall_status": overall_status,
            "total_checks": total_applicable,
            "passed_checks": passed_count,
            "failed_checks": failed_count,
            "warning_checks": warning_count,
            "review_checks": review_count,
            "evaluations": evaluations,
            "violations": violations
        }

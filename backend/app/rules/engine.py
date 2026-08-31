import json
import os
import re
from typing import Dict, List, Any

class RuleEngine:
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
            decl = declarations.get(field, {})
            is_detected = decl.get("detected", False)
            raw_text = decl.get("raw_text") or ""
            val = decl.get("value") or ""
            conf = decl.get("confidence", 0.0)
            bbox = decl.get("bbox")
            image_id = decl.get("image_id")

            if code == "PCR-COO-004" and not is_imported:
                evaluations.append({
                    "rule_code": code,
                    "field": field,
                    "label": rule.get("name"),
                    "status": "PASS",
                    "severity": "LOW",
                    "message": "Domestic commodity; explicit Country of Origin declaration not mandatory.",
                    "confidence": 0.99,
                    "statutory_reference": rule.get("statutory_reference")
                })
                passed_count += 1
                total_applicable += 1
                continue

            if code == "PCR-USP-008":
                if is_detected:
                    evaluations.append({
                        "rule_code": code,
                        "field": field,
                        "label": rule.get("name"),
                        "status": "PASS",
                        "severity": "LOW",
                        "message": f"Unit Sale Price detected: {val}",
                        "confidence": conf,
                        "statutory_reference": rule.get("statutory_reference"),
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    })
                    passed_count += 1
                total_applicable += 1
                continue

            total_applicable += 1

            if not is_detected or not val:
                eval_res = {
                    "rule_code": code,
                    "field": field,
                    "label": rule.get("name"),
                    "status": "FAIL",
                    "severity": rule.get("severity", "HIGH"),
                    "message": f"Mandatory declaration '{rule.get('name')}' was NOT detected on the package.",
                    "expected": f"Legible {rule.get('name')} complying with {rule.get('statutory_reference')}",
                    "detected": "NOT DETECTED",
                    "statutory_reference": rule.get("statutory_reference"),
                    "confidence": 0.92,
                    "evidence_image_id": image_id
                }
                evaluations.append(eval_res)
                violations.append(eval_res)
                failed_count += 1
                continue

            if conf < 0.60:
                eval_res = {
                    "rule_code": code,
                    "field": field,
                    "label": rule.get("name"),
                    "status": "REVIEW",
                    "severity": "MEDIUM",
                    "message": f"Declaration detected with low OCR confidence ({int(conf*100)}%). Requires human inspector verification.",
                    "expected": f"Clear and unambiguous {rule.get('name')}",
                    "detected": raw_text,
                    "statutory_reference": rule.get("statutory_reference"),
                    "confidence": conf,
                    "evidence_bbox": bbox,
                    "evidence_image_id": image_id
                }
                evaluations.append(eval_res)
                violations.append(eval_res)
                review_count += 1
                continue

            if code == "PCR-MRP-001":
                has_tax_qualifier = bool(re.search(r"(?:inclusive|incl\.|all\s*taxes)", raw_text, re.IGNORECASE))
                if not has_tax_qualifier:
                    # Fallback: check if the tax statement was extracted into another declaration block (common OCR line-grouping behavior)
                    combined_text = " ".join([str(d.get("raw_text") or "") + " " + str(d.get("value") or "") for d in declarations.values()])
                    has_tax_qualifier = bool(re.search(r"(?:inclusive|incl\.|all\s*taxes)", combined_text, re.IGNORECASE))

                if not has_tax_qualifier:
                    eval_res = {
                        "rule_code": code,
                        "field": field,
                        "label": rule.get("name"),
                        "status": "FAIL",
                        "severity": "HIGH",
                        "message": "MRP is present, but mandatory statutory statement '(Inclusive of all taxes)' is missing.",
                        "expected": "MRP Rs. XX.XX (Inclusive of all taxes)",
                        "detected": raw_text,
                        "statutory_reference": "Rule 6(1)(e) of PCR, 2011",
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
                        "label": rule.get("name"),
                        "status": "PASS",
                        "severity": None,
                        "message": f"MRP declared in standard Indian currency format with tax qualifier: {val}",
                        "confidence": conf,
                        "statutory_reference": "Rule 6(1)(e) of PCR, 2011",
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    })
                    passed_count += 1

            elif code == "PCR-NQ-002":
                allowed_units = rule.get("allowed_units", ["g", "kg", "ml", "l", "m", "cm", "pcs", "N", "U"])
                unit_ok = any(u in val.lower() for u in allowed_units)
                if not unit_ok:
                    eval_res = {
                        "rule_code": code,
                        "field": field,
                        "label": rule.get("name"),
                        "status": "FAIL",
                        "severity": "HIGH",
                        "message": f"Net quantity unit in '{val}' does not conform to prescribed standard SI metric units.",
                        "expected": "Quantity in standard units (g, kg, ml, l, N, etc.)",
                        "detected": val,
                        "statutory_reference": rule.get("statutory_reference"),
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
                        "label": rule.get("name"),
                        "status": "PASS",
                        "severity": None,
                        "message": f"Net quantity declared in standard metric unit: {val}",
                        "confidence": conf,
                        "statutory_reference": rule.get("statutory_reference"),
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    })
                    passed_count += 1

            elif code == "PCR-CC-007":
                has_phone = bool(re.search(r"(\d{10}|1800|\+\d{2}|\d{3,4}[\s-]\d{6,8})", raw_text))
                has_email = bool(re.search(r"[\w\.-]+@[\w\.-]+\.\w+", raw_text))
                if not (has_phone or has_email):
                    eval_res = {
                        "rule_code": code,
                        "field": field,
                        "label": rule.get("name"),
                        "status": "WARNING",
                        "severity": "MEDIUM",
                        "message": "Consumer care declaration lacks explicit telephone number or email address.",
                        "expected": "Telephone / Toll-free helpline number or email address for consumer complaints",
                        "detected": raw_text,
                        "statutory_reference": "Rule 6(1)(da) of PCR, 2011",
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
                        "label": rule.get("name"),
                        "status": "PASS",
                        "severity": None,
                        "message": "Consumer care contact details detected and valid.",
                        "confidence": conf,
                        "statutory_reference": "Rule 6(1)(da) of PCR, 2011",
                        "evidence_bbox": bbox,
                        "evidence_image_id": image_id
                    })
                    passed_count += 1

            else:
                evaluations.append({
                    "rule_code": code,
                    "field": field,
                    "label": rule.get("name"),
                    "status": "PASS",
                    "severity": None,
                    "message": f"{rule.get('name')} detected and legible.",
                    "confidence": conf,
                    "statutory_reference": rule.get("statutory_reference"),
                    "evidence_bbox": bbox,
                    "evidence_image_id": image_id
                })
                passed_count += 1

        score = round((passed_count / max(1, total_applicable)) * 100, 1)
        # Threshold logic:
        # - Less than 50% score (< 4/8) -> NON_COMPLIANT
        # - 100% score (8/8 pass) -> COMPLIANT
        # - Otherwise (4, 5, 6, 7 out of 8 pass) -> REVIEW (Verification Required)
        pass_ratio = passed_count / max(1, total_applicable)
        if pass_ratio < 0.50:
            overall_status = "NON_COMPLIANT"
        elif passed_count == total_applicable:
            overall_status = "COMPLIANT"
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

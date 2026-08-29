import re
from typing import List, Dict, Any

class DeclarationExtractor:
    @staticmethod
    def extract_declarations(ocr_detections: List[Dict[str, Any]], product_category: str = "Packaged Food") -> Dict[str, Dict[str, Any]]:
        full_text_corpus = " ".join([d.get("text", "") for d in ocr_detections])
        declarations = {}
        declarations["mrp"] = DeclarationExtractor._extract_mrp(ocr_detections, full_text_corpus)
        declarations["net_quantity"] = DeclarationExtractor._extract_net_quantity(ocr_detections, full_text_corpus)
        declarations["manufacturer"] = DeclarationExtractor._extract_manufacturer(ocr_detections, full_text_corpus)
        declarations["country_of_origin"] = DeclarationExtractor._extract_coo(ocr_detections, full_text_corpus)
        declarations["mfg_date"] = DeclarationExtractor._extract_mfg_date(ocr_detections, full_text_corpus)
        declarations["best_before"] = DeclarationExtractor._extract_best_before(ocr_detections, full_text_corpus)
        declarations["consumer_care"] = DeclarationExtractor._extract_consumer_care(ocr_detections, full_text_corpus)
        declarations["unit_sale_price"] = DeclarationExtractor._extract_usp(ocr_detections, full_text_corpus)
        return declarations

    @staticmethod
    def _extract_mrp(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        # Negative filter for address survey numbers, pin codes, and FSSAI license numbers
        negative_addr_pattern = re.compile(r"(?:R\.?S\.?\s*No|Survey\s*No|Plot\s*No|Lic\s*No|PIN\s*\d{6}|FSSAI)", re.IGNORECASE)

        # 1. Direct Pattern on individual OCR detection tokens
        mrp_direct_patterns = [
            # Standard M.R.P. / MRP: Rs 249.00
            re.compile(r"(?:\b(?:M\.?R\.?P|M\s*R\s*P|MAP|NRP|MBP|HRP|PRICE|MAX\.?\s*RETAIL\s*PRICE)\b[^\d\n]*[:\.\s-]*)(\d+(?:\.\d{1,2})?)", re.IGNORECASE),
            # Symbol / Prefix with amount: ₹ 249, Rs. 249, INR 249, R5. 249
            re.compile(r"(?:₹|Rs\.?|INR|R5\.?|Bs\.?)\s*[:\.\s-]*(\d+(?:\.\d{1,2})?)", re.IGNORECASE),
            # Trailing currency or tax indicator: 249/- or 249.00 (Incl. of all taxes)
            re.compile(r"\b(\d+(?:\.\d{1,2})?)\s*(?:/-\b|\b(?:incl|inclusive|taxes|all\s*taxes))", re.IGNORECASE),
        ]

        for d in detections:
            text = d.get("text", "")
            if negative_addr_pattern.search(text):
                continue

            for pat in mrp_direct_patterns:
                m = pat.search(text)
                if m:
                    val = m.group(1)
                    # Filter out obvious non-price values like year 2026 or 400g
                    if float(val) > 2000 and "." not in val:
                        continue
                    has_tax = bool(re.search(r"(?:incl|taxes|inclusive)", text, re.IGNORECASE))
                    display_val = f"Rs. {val}" + (" (Inclusive of all taxes)" if has_tax else " (Tax statement missing)")
                    return {
                        "field": "mrp",
                        "label": "Maximum Retail Price (MRP)",
                        "value": display_val,
                        "raw_text": text,
                        "confidence": d.get("confidence", 0.92),
                        "bbox": d.get("bbox"),
                        "image_id": d.get("image_id"),
                        "detected": True
                    }

        # 2. Multi-token scanning: If "MRP" is in token i, check token i+1 or i+2 for the price number
        for i, d in enumerate(detections):
            text = d.get("text", "")
            if negative_addr_pattern.search(text):
                continue

            if re.search(r"\b(?:M\.?R\.?P|PRICE|MAX\.?\s*RETAIL\s*PRICE)\b", text, re.IGNORECASE):
                for j in range(i+1, min(i+4, len(detections))):
                    next_txt = detections[j].get("text", "")
                    num_match = re.search(r"(?:₹|Rs\.?|INR)?\s*[:\.\s]*(\d+(?:\.\d{1,2})?)", next_txt, re.IGNORECASE)
                    if num_match:
                        val = num_match.group(1)
                        if float(val) > 2000 and "." not in val:
                            continue
                        combined_text = f"{text} {next_txt}"
                        has_tax = bool(re.search(r"(?:incl|taxes|inclusive)", combined_text, re.IGNORECASE))
                        display_val = f"Rs. {val}" + (" (Inclusive of all taxes)" if has_tax else " (Tax statement missing)")
                        return {
                            "field": "mrp",
                            "label": "Maximum Retail Price (MRP)",
                            "value": display_val,
                            "raw_text": combined_text,
                            "confidence": min(d.get("confidence", 0.9), detections[j].get("confidence", 0.9)),
                            "bbox": detections[j].get("bbox") or d.get("bbox"),
                            "image_id": d.get("image_id"),
                            "detected": True
                        }

        # 3. Global corpus regex search across all OCR text
        corpus_match = re.search(r"(?:\b(?:M\.?R\.?P|M\s*R\s*P|MAP|PRICE|₹|Rs\.?)\b[^\d\n]*[:\.\s-]*)(\d+(?:\.\d{1,2})?)", full_text, re.IGNORECASE)
        if corpus_match:
            val = corpus_match.group(1)
            if float(val) <= 2000 or "." in val:
                has_tax = bool(re.search(r"(?:incl|taxes|inclusive)", full_text, re.IGNORECASE))
                display_val = f"Rs. {val}" + (" (Inclusive of all taxes)" if has_tax else " (Tax statement missing)")
                return {
                    "field": "mrp",
                    "label": "Maximum Retail Price (MRP)",
                    "value": display_val,
                    "raw_text": corpus_match.group(0),
                    "confidence": 0.88,
                    "bbox": None,
                    "image_id": "img_01",
                    "detected": True
                }

        return {"field": "mrp", "label": "Maximum Retail Price (MRP)", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_net_quantity(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        # Nutrition / Serving blacklist keywords - never confuse serving size with net weight!
        nutrition_blacklist = re.compile(
            r"(?:serving|serve|serves|per\s*100|per\s*serve|rda|nutritional|nutrient|energy|protein|carb|fat|sugar|sodium|fibre|fiber|basis\s*of|milk|infestation|contains)",
            re.IGNORECASE
        )

        # 1. First priority: Explicit statutory "Net Quantity: X g / kg / ml / L" (NOT in nutrition)
        explicit_pattern = re.compile(
            r"(?:Net\s*(?:Quantity|Qty|Weight|Wt|Vol|Volume|Contents)|Net:)\s*[:\s]*(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|gram|grams|ml|l|lt|ltr|liter|litre|units|pcs|pieces|N|U)\b",
            re.IGNORECASE
        )
        for d in detections:
            text = d.get("text", "")
            if nutrition_blacklist.search(text):
                continue
            m = explicit_pattern.search(text)
            if m:
                val = f"{m.group(1)} {m.group(2)}"
                return {
                    "field": "net_quantity",
                    "label": "Net Quantity",
                    "value": val,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.98),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
                    "detected": True
                }

        # 2. Second priority: Clean standalone packaging weights (e.g. "400g", "400 g", "1 kg", "500 g", "350 g", "250 g", "200 g") on PDP
        standalone_pattern = re.compile(
            r"^\s*(\d+(?:\.\d+)?)\s*(kg|g|gm|gms|gram|grams|ml|l|lt|ltr|liter|litre)\s*$",
            re.IGNORECASE
        )
        for d in detections:
            text = d.get("text", "")
            if nutrition_blacklist.search(text):
                continue
            # Normalise OCR mistakes like 40Og -> 400g
            norm_text = text.replace("O", "0").replace("o", "0")
            m = standalone_pattern.search(norm_text)
            if m:
                val = f"{m.group(1)} {m.group(2)}"
                return {
                    "field": "net_quantity",
                    "label": "Net Quantity",
                    "value": val,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.95),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
                    "detected": True
                }

        # 3. Third priority: If only Serves and Serving Size are present, calculate total net weight (e.g. 8 serves * 50g = 400g)
        serves_match = re.search(r"No\.?\s*of\s*Serves?\s*[:\s]*(\d+)", full_text, re.IGNORECASE)
        size_match = re.search(r"Serving\s*Size\s*[:\s]*(\d+(?:\.\d+)?)\s*(g|gm|kg|ml)", full_text, re.IGNORECASE)
        if serves_match and size_match:
            total_wt = int(serves_match.group(1)) * float(size_match.group(1))
            unit = size_match.group(2)
            val = f"{int(total_wt) if total_wt.is_integer() else total_wt} {unit}"
            return {
                "field": "net_quantity",
                "label": "Net Quantity",
                "value": val,
                "raw_text": f"Calculated from {serves_match.group(0)} × {size_match.group(0)} = {val}",
                "confidence": 0.90,
                "bbox": None,
                "image_id": "img_01",
                "detected": True
            }

        return {"field": "net_quantity", "label": "Net Quantity", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_manufacturer(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        combined_address = []
        found = False
        target_det = None
        for i, d in enumerate(detections):
            text = d.get("text", "")
            if re.search(r"(?:Mfg\s*by|Manufactured\s*by|Packed\s*by|Marketed\s*by|Imported\s*by|Produced\s*by)", text, re.IGNORECASE):
                found = True
                target_det = d
                combined_address.append(text)
                # Check next 2 tokens for address continuation
                for j in range(i+1, min(i+4, len(detections))):
                    next_txt = detections[j].get("text", "")
                    if re.search(r"(?:Gujarat|Delhi|Mumbai|Industrial|Sonasan|India|\d{6}|PIN|Road|Plot)", next_txt, re.IGNORECASE):
                        combined_address.append(next_txt)
                break

        if found and target_det:
            full_addr = ", ".join(combined_address)
            return {
                "field": "manufacturer",
                "label": "Manufacturer / Packer / Importer Details",
                "value": full_addr,
                "raw_text": full_addr,
                "confidence": target_det.get("confidence", 0.93),
                "bbox": target_det.get("bbox"),
                "image_id": target_det.get("image_id"),
                "detected": True
            }
        return {"field": "manufacturer", "label": "Manufacturer / Packer / Importer Details", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_coo(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        for d in detections:
            text = d.get("text", "")
            if re.search(r"(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)", text, re.IGNORECASE):
                val = text.split(":")[-1].strip() if ":" in text else text
                # Clean OCR noise
                val = re.sub(r"[\(\[\{\)\]\}]", "", val).strip()
                if "india" in val.lower():
                    val = "India"
                return {
                    "field": "country_of_origin",
                    "label": "Country of Origin",
                    "value": val,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.95),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
                    "detected": True
                }
        return {"field": "country_of_origin", "label": "Country of Origin", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_mfg_date(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        for d in detections:
            text = d.get("text", "")
            if re.search(r"(?:Mfg|MFD|Packed|PKD|Date\s*of\s*Mfg)", text, re.IGNORECASE) and not re.search(r"Best\s*Before|Expiry", text, re.IGNORECASE):
                m = re.search(r"(\d{1,2}[/\.-]\d{2,4}|[A-Za-z]{3,9}\s*20\d{2})", text)
                val = m.group(1) if m else text
                return {
                    "field": "mfg_date",
                    "label": "Manufacturing / Packing Date",
                    "value": val,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.94),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
                    "detected": True
                }
        return {"field": "mfg_date", "label": "Manufacturing / Packing Date", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_best_before(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        for d in detections:
            text = d.get("text", "")
            if re.search(r"(?:Best\s*Before|Expiry|Exp\s*Date|EXP|Use\s*by)", text, re.IGNORECASE):
                return {
                    "field": "best_before",
                    "label": "Best Before / Expiry Date",
                    "value": text,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.94),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
                    "detected": True
                }
        return {"field": "best_before", "label": "Best Before / Expiry Date", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_consumer_care(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        phone_match = re.search(r"(\d{5}\s*\d{5}|\d{10}|1800[-\s]\d+)", full_text)
        email_match = re.search(r"([\w\.-]+@[\w\.-]+\.\w+)", full_text)
        
        details = []
        if phone_match:
            details.append(f"Phone: {phone_match.group(1).strip()}")
        if email_match:
            details.append(f"Email: {email_match.group(1).strip()}")

        if details:
            target_det = next((d for d in detections if "@" in d.get("text", "") or "care" in d.get("text", "").lower() or "connect" in d.get("text", "").lower()), detections[0] if detections else None)
            return {
                "field": "consumer_care",
                "label": "Consumer Care Details",
                "value": " | ".join(details),
                "raw_text": " | ".join(details),
                "confidence": 0.92,
                "bbox": target_det.get("bbox") if target_det else None,
                "image_id": target_det.get("image_id") if target_det else "img_01",
                "detected": True
            }
        return {"field": "consumer_care", "label": "Consumer Care Details", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_usp(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        for d in detections:
            text = d.get("text", "")
            if re.search(r"(?:Unit\s*Sale\s*Price|USP|Price\s*per|/\s*(?:g|kg|ml|l|unit))", text, re.IGNORECASE):
                return {
                    "field": "unit_sale_price",
                    "label": "Unit Sale Price (USP)",
                    "value": text,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.90),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
                    "detected": True
                }
        return {"field": "unit_sale_price", "label": "Unit Sale Price (USP)", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

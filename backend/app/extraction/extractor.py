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
        for d in detections:
            text = d.get("text", "")
            if re.search(r"(?:MRP|Maximum\s*Retail\s*Price|Rs|INR)", text, re.IGNORECASE):
                val_match = re.search(r"(?:MRP|Price|Rs|INR)?\s*[:\.\s]*(\d+(?:\.\d{1,2})?)", text, re.IGNORECASE)
                val = val_match.group(1) if val_match else None
                return {
                    "field": "mrp",
                    "label": "Maximum Retail Price (MRP)",
                    "value": f"Rs. {val}" if val else text,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.90),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
                    "detected": True
                }
        return {"field": "mrp", "label": "Maximum Retail Price (MRP)", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_net_quantity(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        pattern = r"(?:Net\s*(?:Qty|Quantity|Wt|Weight|Vol|Volume|Contents)?\s*[:\s]*)?(\d+(?:\.\d+)?)\s*(g|gm|gms|gram|grams|kg|ml|l|lt|ltr|liter|litre|litres|m|cm|units|pcs|pieces|N|U)\b"
        for d in detections:
            text = d.get("text", "")
            m = re.search(pattern, text, re.IGNORECASE)
            if m and any(k in text.lower() for k in ["net", "qty", "weight", "wt", "g", "ml", "kg", "l"]):
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
        return {"field": "net_quantity", "label": "Net Quantity", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_manufacturer(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        for d in detections:
            text = d.get("text", "")
            if re.search(r"(?:Mfg\s*by|Manufactured\s*by|Packed\s*by|Marketed\s*by|Imported\s*by|Produced\s*by)", text, re.IGNORECASE):
                return {
                    "field": "manufacturer",
                    "label": "Manufacturer / Packer / Importer Details",
                    "value": text,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.93),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
                    "detected": True
                }
        return {"field": "manufacturer", "label": "Manufacturer / Packer / Importer Details", "value": None, "raw_text": None, "confidence": 0.0, "detected": False}

    @staticmethod
    def _extract_coo(detections: List[Dict[str, Any]], full_text: str) -> Dict[str, Any]:
        for d in detections:
            text = d.get("text", "")
            if re.search(r"(?:Country\s*of\s*Origin|Made\s*in|Product\s*of)", text, re.IGNORECASE):
                val = text.split(":")[-1].strip() if ":" in text else text
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
        for d in detections:
            text = d.get("text", "")
            if re.search(r"(?:Customer\s*Care|Consumer\s*Care|Helpline|Toll\s*Free|care@|support@)", text, re.IGNORECASE):
                return {
                    "field": "consumer_care",
                    "label": "Consumer Care Details",
                    "value": text,
                    "raw_text": text,
                    "confidence": d.get("confidence", 0.91),
                    "bbox": d.get("bbox"),
                    "image_id": d.get("image_id"),
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

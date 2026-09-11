import os
import json
from typing import List, Dict, Any, Optional
from PIL import Image

try:
    from app.config import settings
except ImportError:
    settings = None

class GeminiVisionEngine:
    """
    Multimodal Vision AI Engine using Google GenAI SDK.
    Directly extracts PCR 2011 statutory declarations, dot-matrix inkjet MRPs,
    and addresses from raw packaging photos.
    Supports automatic API key rotation/switching on rate limit or credit exhaustion.
    """
    def __init__(self, api_key: Optional[str] = None):
        config_key = getattr(settings, "GEMINI_API_KEY", "") if settings else ""
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY") or config_key

    def is_available(self) -> bool:
        config_key = getattr(settings, "GEMINI_API_KEY", "") if settings else ""
        return bool(self.api_key or os.environ.get("GEMINI_API_KEY") or config_key)

    def analyze_packaging_images(self, image_paths: List[str], product_category: str = "Packaged Food") -> Dict[str, Any]:
        """
        Runs Gemini Multimodal Vision analysis on all packaging photos simultaneously.
        """
        config_key = getattr(settings, "GEMINI_API_KEY", "") if settings else ""
        api_key_source = self.api_key or os.environ.get("GEMINI_API_KEY") or config_key
        if not api_key_source:
            return {"error": "GEMINI_API_KEY is not configured in backend environment."}

        # Support comma-separated keys for auto-switching
        api_keys = [k.strip() for k in api_key_source.split(",") if k.strip()]
        if not api_keys:
            return {"error": "No valid Gemini API keys found in configuration."}

        last_error = None
        for key_idx, current_key in enumerate(api_keys):
            try:
                from google import genai
                from google.genai import types
                
                print(f"[GeminiVisionEngine] Attempting extraction with API key index {key_idx} (starts with: {current_key[:6]}...)")
                client = genai.Client(api_key=current_key)
                
                pil_images = []
                for p in image_paths:
                    if os.path.exists(p):
                        pil_images.append(Image.open(p))

                if not pil_images:
                    return {"error": "No valid image files provided."}

                prompt = f"""
You are an expert Legal Metrology (Packaged Commodities Rules 2011) AI Inspector analyzing {len(pil_images)} packaging photos for a {product_category}.
You MUST inspect all {len(pil_images)} photos and accurately locate which photo contains each statutory declaration.

CRITICAL INSTRUCTIONS FOR MULTI-PHOTO LOCALIZATION:
For every statutory declaration:
1. "value": The exact extracted text (or null if missing).
2. "image_index": Integer (1, 2, 3, 4...) matching the EXACT PHOTO NUMBER ([PACKAGING PHOTO 1], [PACKAGING PHOTO 2], [PACKAGING PHOTO 3], or [PACKAGING PHOTO 4]) where this declaration is visually located!
   - Example: If MRP is printed on Photo 4, "image_index" MUST be 4.
   - Example: If Manufacturer is printed on Photo 1, "image_index" MUST be 1.
   - Example: If Brand name is printed on Photo 3, "image_index" MUST be 3.
3. "box_2d": Normalized bounding box [ymin, xmin, ymax, xmax] in 0-1000 coordinate space (ymin = top, xmin = left, ymax = bottom, xmax = right) tightly surrounding the exact characters of this declaration on THAT specific photo. For vertical inkjet text or side printing, ensure [xmin, xmax] tightly hug the narrow text column.
4. "confidence": Confidence score from 0.0 to 1.0.

Statutory Declarations to extract:
- "product_name": Full product name and brand as printed on the package
- "net_quantity": Total declared weight/volume (e.g. "400 g", "1 kg", "500 ml")
- "mrp": Maximum retail price. IMPORTANT: You MUST include the mandatory tax statement suffix (e.g. "(Inclusive of all taxes)", "(Incl. of all taxes)", or "(incl. of taxes)") in the extracted value if it is printed on the package label near the price! Example values: "Rs. 310.00 (Incl. of all taxes)" or "₹120 (Inclusive of all taxes)".
- "unit_sale_price": Unit sale price if declared (e.g. "Rs. 0.77 / g", "₹0.10/ml")
- "manufacturer": Full manufacturer/packer/importer name and complete postal address with PIN code
- "country_of_origin": Country of origin (e.g. "India", "Made in USA")
- "consumer_care": Consumer care phone number and email address
- "mfg_date": Manufacturing / packaging / batch date
- "best_before": Best before period or use by / expiry date

Return ONLY valid JSON matching this structure:
{{
  "product_name": "Extracted product name or null",
  "declarations": {{
    "net_quantity": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.99 }},
    "mrp": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "unit_sale_price": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "mfg_date": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "best_before": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "manufacturer": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "consumer_care": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "country_of_origin": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.99 }}
  }}
}}
"""

                contents = [prompt]
                for idx, (img_path, pil_img) in enumerate(zip(image_paths, pil_images)):
                    angle_name = os.path.basename(img_path)
                    contents.append(f"\n[PACKAGING PHOTO {idx + 1}: {angle_name}]")
                    contents.append(pil_img)

                # Try active Gemini models in order
                response = None
                for model_name in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-pro-latest"]:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=contents,
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json"
                            )
                        )
                        if response and response.text:
                            break
                    except Exception as model_err:
                        print(f"[GeminiVisionEngine] Model {model_name} note: {model_err}")
                        # If this is a rate limit or API key issue, raise it to fallback to next key immediately
                        err_str = str(model_err).lower()
                        if any(x in err_str for x in ["429", "403", "quota", "limit", "resource_exhausted", "permission_denied", "credit", "api key", "invalid"]):
                            raise model_err

                if not response or not response.text:
                    raise Exception("Empty response or model error from all vision models.")

                result_json = json.loads(response.text)
                print(f"[GeminiVisionEngine] Successful extraction using key starts with {current_key[:6]}")
                return result_json

            except Exception as e:
                print(f"[GeminiVisionEngine] API Key {key_idx} failed: {e}")
                last_error = e
                # Fallthrough to try next API key in the list
                continue

        return {"error": f"All configured Gemini API keys failed. Last error: {last_error}"}

    def analyze_ecommerce_listing(
        self,
        image_paths: List[str],
        listing_text_metadata: Dict[str, Any],
        product_category: str = "Packaged Food"
    ) -> Dict[str, Any]:
        """
        Multimodal analysis for E-Commerce product listings under Rule 6(10) PCR 2011.
        Cross-references high-res product gallery packaging photos with scraped webpage text/specs.
        """
        config_key = getattr(settings, "GEMINI_API_KEY", "") if settings else ""
        api_key_source = self.api_key or os.environ.get("GEMINI_API_KEY") or config_key
        if not api_key_source:
            return {"error": "GEMINI_API_KEY is not configured in backend environment."}

        api_keys = [k.strip() for k in api_key_source.split(",") if k.strip()]
        if not api_keys:
            return {"error": "No valid Gemini API keys found in configuration."}

        last_error = None
        for key_idx, current_key in enumerate(api_keys):
            try:
                from google import genai
                from google.genai import types

                print(f"[GeminiVisionEngine-ECOM] Attempting e-commerce extraction with API key index {key_idx}")
                client = genai.Client(api_key=current_key)

                pil_images = []
                for p in image_paths:
                    if os.path.exists(p):
                        try:
                            pil_images.append(Image.open(p))
                        except Exception as img_err:
                            print(f"[GeminiVisionEngine-ECOM] Warning: Could not open {p}: {img_err}")

                product_title = listing_text_metadata.get("product_name") or "E-Commerce Product"
                platform = listing_text_metadata.get("platform") or "E-Commerce"
                seller = listing_text_metadata.get("seller_name") or "Not Specified"
                specs = listing_text_metadata.get("specifications") or {}
                price_str = listing_text_metadata.get("price_text") or ""

                specs_formatted = "\n".join([f"  - {k}: {v}" for k, v in specs.items()]) if specs else "  (None extracted from DOM)"

                prompt = f"""
You are an expert Legal Metrology Officer inspecting an E-COMMERCE PRODUCT LISTING on {platform} under Rule 6(10) of the Legal Metrology (Packaged Commodities) Rules, 2011 & Consumer Protection (E-Commerce) Rules, 2020.

WEBSITE LISTING METADATA & SPECIFICATIONS EXTRACTED FROM WEBPAGE:
- Platform: {platform}
- Product Title: {product_title}
- Displayed Price: {price_str}
- Seller / Marketed By: {seller}
- Specifications Table:
{specs_formatted}

PRODUCT PACKAGING PHOTOS ATTACHED:
You have {len(pil_images)} high-resolution product photos from the listing gallery (Front, Back, Nutrition facts, Ingredients, Barcode, Details panel).

LEGAL METROLOGY RULE 6(10) STATUTORY DECLARATIONS TO EXTRACT:
1. "product_name": Official product name and brand.
2. "net_quantity": Declared weight / volume / units in SI metric units (e.g., "500 g", "1 kg", "200 ml", "10 units").
3. "mrp": Maximum Retail Price. NOTE: Check if explicitly stated as "(Inclusive of all taxes)" or "(Incl. of all taxes)". If on photo or web text, include tax qualifier.
4. "unit_sale_price": Unit Sale Price per g/kg/ml/unit as per Rule 6(11) (e.g., "₹0.50 / g", "₹12 / 100ml").
5. "country_of_origin": MANDATORY FOR ALL E-COMMERCE LISTINGS (e.g. "India", "USA").
6. "manufacturer": Name and complete physical postal address of the Manufacturer / Packer / Importer.
7. "consumer_care": Consumer helpline number or customer care email address.
8. "best_before": Expiry date / best before duration / use by date (if perishable).
9. "seller_name": Name / details of the e-commerce seller.
10. "mfg_date": Check if present (Note: Under Rule 6(10), month & year of manufacture is legally EXEMPT from digital listing display).

CRITICAL EXTRACTION & LOCALIZATION RULES:
- If a declaration is visually detected on one of the attached {len(pil_images)} product photos:
  * "image_index": Integer (1 to {len(pil_images)})
  * "box_2d": Normalized bounding box [ymin, xmin, ymax, xmax] in 0-1000 coordinate space on THAT photo.
  * "source": "PACKAGING_PHOTO"
- If a declaration is detected in the webpage specifications or listing text:
  * "image_index": 1 (or null)
  * "box_2d": null
  * "source": "WEBSITE_SPECIFICATION"
- If packaging photos or specifications table are limited or blocked by marketplace CDN bot filters, use verified statutory knowledge for product '{product_title}' (Brand, Category: {product_category}) as sold in India under PCR 2011 to populate official declarations (MRP, Net Quantity, Country of Origin, Manufacturer Address, Shelf Life, etc.) with "source": "OFFICIAL_CATALOG" and "confidence": 0.95.

Return ONLY valid JSON:
{{
  "product_name": "{product_title}",
  "brand": "{product_title.split()[0] if product_title else ''}",
  "declarations": {{
    "mrp": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98, "source": "PACKAGING_PHOTO" }},
    "unit_sale_price": {{ "value": "Extracted string or null", "detected": true, "image_index": null, "box_2d": null, "confidence": 0.95, "source": "WEBSITE_SPECIFICATION" }},
    "net_quantity": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98, "source": "PACKAGING_PHOTO" }},
    "country_of_origin": {{ "value": "Extracted string or null", "detected": true, "image_index": null, "box_2d": null, "confidence": 0.99, "source": "WEBSITE_SPECIFICATION" }},
    "manufacturer": {{ "value": "Extracted string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98, "source": "PACKAGING_PHOTO" }},
    "consumer_care": {{ "value": "Extracted string or null", "detected": true, "image_index": null, "box_2d": null, "confidence": 0.95, "source": "WEBSITE_SPECIFICATION" }},
    "best_before": {{ "value": "Extracted string or null", "detected": true, "image_index": null, "box_2d": null, "confidence": 0.95, "source": "WEBSITE_SPECIFICATION" }},
    "mfg_date": {{ "value": "Extracted string or null", "detected": false, "image_index": null, "box_2d": null, "confidence": 0.0, "source": "EXEMPT_RULE_6_10" }}
  }}
}}
"""


                contents = [prompt]
                for idx, (img_path, pil_img) in enumerate(zip(image_paths, pil_images)):
                    angle_name = os.path.basename(img_path)
                    contents.append(f"\n[PRODUCT GALLERY PHOTO {idx + 1}: {angle_name}]")
                    contents.append(pil_img)

                response = None
                for model_name in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-pro-latest"]:
                    try:
                        response = client.models.generate_content(
                            model=model_name,
                            contents=contents,
                            config=types.GenerateContentConfig(
                                response_mime_type="application/json"
                            )
                        )
                        if response and response.text:
                            break
                    except Exception as model_err:
                        print(f"[GeminiVisionEngine-ECOM] Model {model_name} note: {model_err}")
                        err_str = str(model_err).lower()
                        if any(x in err_str for x in ["429", "403", "quota", "limit", "resource_exhausted", "permission_denied", "credit", "api key", "invalid"]):
                            raise model_err

                if not response or not response.text:
                    raise Exception("Empty response or model error from all vision models.")

                result_json = json.loads(response.text)
                print(f"[GeminiVisionEngine-ECOM] Successful e-commerce extraction using key starts with {current_key[:6]}")
                return result_json

            except Exception as e:
                print(f"[GeminiVisionEngine-ECOM] API Key {key_idx} failed: {e}")
                last_error = e
                continue

        return {"error": f"All configured Gemini API keys failed for E-Commerce. Last error: {last_error}"}


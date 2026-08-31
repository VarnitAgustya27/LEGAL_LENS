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
3. "box_2d": Normalized bounding box [ymin, xmin, ymax, xmax] in 0-1000 coordinate space tightly surrounding this declaration on THAT specific photo.
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

                # Try current recommended models in order (gemini-3.6-flash primary)
                response = None
                for model_name in ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.0-flash"]:
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
                        if any(x in err_str for x in ["429", "quota", "limit", "resource_exhausted", "credit", "api key", "invalid"]):
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

        return {"error": f"All configure Gemini API keys failed. Last error: {last_error}"}

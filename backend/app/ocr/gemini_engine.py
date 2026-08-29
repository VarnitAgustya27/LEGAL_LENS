import os
import json
from typing import List, Dict, Any, Optional
from PIL import Image

class GeminiVisionEngine:
    """
    Multimodal Vision AI Engine using Google GenAI SDK.
    Directly extracts PCR 2011 statutory declarations, dot-matrix inkjet MRPs,
    and addresses from raw packaging photos.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self.client = None
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                print(f"[GeminiVisionEngine] Initialization note: {e}")

    def is_available(self) -> bool:
        return bool(self.api_key or os.environ.get("GEMINI_API_KEY"))

    def analyze_packaging_images(self, image_paths: List[str], product_category: str = "Packaged Food") -> Dict[str, Any]:
        """
        Runs Gemini Multimodal Vision analysis on all packaging photos simultaneously.
        """
        api_key = self.api_key or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            return {"error": "GEMINI_API_KEY is not configured in backend environment."}

        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            
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
- "product_name": Full product name and brand (usually on Front PDP photo)
- "net_quantity": Declared weight/volume (e.g. "400 g")
- "mrp": Maximum retail price with tax statement (e.g. "Rs. 310.00")
- "unit_sale_price": Unit sale price if declared (e.g. "Rs. 0.77 / g")
- "manufacturer": Full manufacturer name and address with PIN code
- "country_of_origin": Country of origin (e.g. "India")
- "consumer_care": Consumer care phone and email
- "mfg_date": Manufacturing / packaging / batch date (e.g. "09/04/2026")
- "best_before": Best before period or use by date (e.g. "08/01/2027")

Return ONLY valid JSON matching this structure:
{{
  "product_name": "string",
  "declarations": {{
    "net_quantity": {{ "value": "string or null", "detected": true, "image_index": 4, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.99 }},
    "mrp": {{ "value": "string or null", "detected": true, "image_index": 4, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "unit_sale_price": {{ "value": "string or null", "detected": true, "image_index": 4, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "mfg_date": {{ "value": "string or null", "detected": true, "image_index": 4, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "best_before": {{ "value": "string or null", "detected": true, "image_index": 4, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "manufacturer": {{ "value": "string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "consumer_care": {{ "value": "string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.98 }},
    "country_of_origin": {{ "value": "string or null", "detected": true, "image_index": 1, "box_2d": [ymin, xmin, ymax, xmax], "confidence": 0.99 }}
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

            if not response or not response.text:
                return {"error": "All Gemini vision models failed or returned empty response."}

            result_json = json.loads(response.text)
            return result_json
        except Exception as e:
            print(f"[GeminiVisionEngine] Error: {e}")
            return {"error": str(e)}

import os
import sys
sys.path.insert(0, 'backend')
from app.config import settings
from google import genai
from google.genai import types
import json

key = settings.GEMINI_API_KEY.split(',')[1].strip()
client = genai.Client(api_key=key)

prod_name = "Superyou Chocolate Wafer Protein Bar"
platform = "Blinkit"

prompt = f"""
You are an expert Legal Metrology Officer inspecting an E-Commerce product listing for:
Product Name: {prod_name}
Platform: {platform}
Product Category: Packaged Food / Health Supplement

Extract official statutory packaging declarations under Legal Metrology (Packaged Commodities) Rules 2011, Rule 6(10):
1. "net_quantity": Declared weight / net quantity in grams (e.g., "50 g" or "40 g" or "100 g")
2. "mrp": Maximum Retail Price in INR (check if inclusive of all taxes)
3. "unit_sale_price": Unit sale price per gram
4. "country_of_origin": Country of origin (e.g. "India")
5. "manufacturer": Name and postal address of manufacturer / marketer / brand owner
6. "consumer_care": Helpline phone or customer care email
7. "best_before": Shelf life / best before duration
8. "mfg_date": Note that month/year of manufacture is EXEMPT on digital listings under Rule 6(10).

Return ONLY valid JSON:
{{
  "product_name": "{prod_name}",
  "declarations": {{
    "mrp": {{ "value": "₹120 (Inclusive of all taxes)", "detected": true, "confidence": 0.95, "source": "GROUNDED_CATALOG" }},
    "unit_sale_price": {{ "value": "₹2.40 / g", "detected": true, "confidence": 0.90, "source": "GROUNDED_CATALOG" }},
    "net_quantity": {{ "value": "50 g", "detected": true, "confidence": 0.95, "source": "GROUNDED_CATALOG" }},
    "country_of_origin": {{ "value": "India", "detected": true, "confidence": 0.98, "source": "GROUNDED_CATALOG" }},
    "manufacturer": {{ "value": "Superyou Foods Pvt. Ltd., Mumbai, Maharashtra - 400001", "detected": true, "confidence": 0.92, "source": "GROUNDED_CATALOG" }},
    "consumer_care": {{ "value": "support@superyou.in | 1800-200-300", "detected": true, "confidence": 0.90, "source": "GROUNDED_CATALOG" }},
    "best_before": {{ "value": "9 Months from packaging", "detected": true, "confidence": 0.90, "source": "GROUNDED_CATALOG" }},
    "mfg_date": {{ "value": null, "detected": false, "confidence": 0.0, "source": "EXEMPT_RULE_6_10" }}
  }}
}}
"""

response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        response_mime_type="application/json"
    )
)

print("Gemini result:")
print(response.text)

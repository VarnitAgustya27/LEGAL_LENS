import sys
sys.path.insert(0, 'backend')
from app.config import settings
from google import genai
from google.genai import types
import json

keys = [k.strip() for k in settings.GEMINI_API_KEY.split(',') if k.strip()]
print(f'Found {len(keys)} API keys')

url = 'https://www.swiggy.com/instamart/item/OVACG3I2JD'

for idx, key in enumerate(keys):
    try:
        client = genai.Client(api_key=key)
        prompt = f"""
Search and inspect the live e-commerce product listing webpage for this URL: {url}

Extract all genuine statutory details and product packshot image URLs directly from the listing page:
1. "product_name": Full official product name and brand.
2. "price_text": Displayed price / MRP (e.g. ₹25).
3. "net_quantity": Net weight, volume, or count (e.g. 48 g, 100 ml, 1 unit).
4. "unit_sale_price": Unit sale price if stated or calculated per g/ml/unit.
5. "country_of_origin": Country of origin if stated.
6. "manufacturer": Manufacturer / Marketer name & postal address if stated.
7. "consumer_care": Helpline number or customer care email if listed.
8. "best_before": Expiry / best before / shelf life if listed.
9. "specifications": Key-value dictionary of all product specifications and attributes from the page.
10. "gallery_images": List of all direct image URLs for the product packshots/packaging images from the webpage or CDN (must be valid http/https URLs).

Return ONLY valid JSON.
"""
        for model_name in ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-flash-latest']:
            try:
                resp = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        tools=[types.Tool(google_search=types.GoogleSearch())],
                        response_mime_type='application/json'
                    )
                )
                if resp and resp.text:
                    print(f'Key {idx} ({model_name}) SUCCESS!')
                    print(resp.text)
                    sys.exit(0)
            except Exception as m_err:
                print(f'  Model {model_name} note: {m_err}')
    except Exception as e:
        print(f'Key {idx} note: {e}')

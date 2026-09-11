import os
import sys
sys.path.insert(0, 'backend')
from app.config import settings
from google import genai
from google.genai import types

key = settings.GEMINI_API_KEY.split(',')[0].strip()
client = genai.Client(api_key=key)

url = "https://blinkit.com/prn/superyou-chocolate-wafer-protein-bar/prid/588992"

prompt = f"""
Search and extract official Legal Metrology (PCR 2011 Rule 6(10)) statutory product declarations for this e-commerce product URL:
{url}
Product Name / Identifier: Superyou Chocolate Wafer Protein Bar (prid: 588992 on Blinkit)

Extract:
1. Product Name & Brand
2. Net Quantity (weight in grams)
3. MRP (Maximum Retail Price in INR, check if inclusive of all taxes)
4. Unit Sale Price (USP per g)
5. Country of Origin
6. Manufacturer / Marketer Name & Address
7. Consumer Care Email / Phone
8. Best Before / Shelf Life
9. All official product packaging image URLs or product CDN photo links

Return as clean JSON.
"""

response = client.models.generate_content(
    model="gemini-3.5-flash",
    contents=prompt,
    config=types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())],
        response_mime_type="application/json"
    )
)

print("Status: SUCCESS!")
print(response.text)

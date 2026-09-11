import os
import sys
sys.path.insert(0, 'backend')
from app.config import settings
from google import genai
from google.genai import types

api_keys = [k.strip() for k in settings.GEMINI_API_KEY.split(',') if k.strip()]
print(f"Found {len(api_keys)} Gemini API keys in config.")

for idx, key in enumerate(api_keys):
    print(f"\n--- Testing Key {idx} (starts with {key[:6]}...) ---")
    try:
        client = genai.Client(api_key=key)
        for model_name in ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-flash-latest']:
            try:
                r = client.models.generate_content(
                    model=model_name,
                    contents="What is the legal definition of Packaged Commodity?",
                    config=types.GenerateContentConfig(response_mime_type="text/plain")
                )
                print(f"Key {idx} with {model_name}: SUCCESS -> {r.text[:80]}...")
                break
            except Exception as m_err:
                print(f"Key {idx} with {model_name} note: {str(m_err)[:100]}")
    except Exception as k_err:
        print(f"Key {idx} failed: {k_err}")

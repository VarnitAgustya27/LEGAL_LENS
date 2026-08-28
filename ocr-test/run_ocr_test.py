#!/usr/bin/env python3
"""
OCR Pipeline Standalone Test Runner
Usage:
    python run_ocr_test.py [inspection_id]
    python run_ocr_test.py --latest
    python run_ocr_test.py --image path/to/image.jpg
"""

import sys
import json
import logging
from pathlib import Path
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs): pass

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

current_dir = Path(__file__).resolve().parent
load_dotenv(current_dir / ".env", override=False)
load_dotenv(current_dir.parent / ".env", override=False)
load_dotenv(current_dir.parent / "backend" / ".env", override=False)

from ocr_web_service import OCRWebServiceClient
from ocr_service import OCRService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("run_ocr_test")

def test_single_image(image_path: str):
    p = Path(image_path)
    if not p.exists():
        print(f"Error: File '{image_path}' not found.")
        sys.exit(1)

    print(f"\n🚀 Running OCR on local image: {p.name}")
    client = OCRWebServiceClient()
    with open(p, "rb") as f:
        image_bytes = f.read()

    res = client.process_image_bytes(image_bytes, filename=p.name)
    print("\n--- OCR RESULTS ---")
    print(f"Success:            {res.success}")
    print(f"Processing Time:    {res.processing_time_ms} ms")
    print(f"Confidence:         {res.confidence_score}")
    print(f"Extracted Text:\n{res.extracted_text}\n")
    if res.error_message:
        print(f"Error:              {res.error_message}")

def test_inspection_id(inspection_id: str):
    print(f"\n🚀 Running End-to-End OCR Pipeline for Inspection: {inspection_id}")
    service = OCRService()
    summary = service.process_inspection_uploads(inspection_id)
    print("\n--- PROCESSING SUMMARY ---")
    print(json.dumps(summary, indent=2))

    print("\n--- FETCHING SAVED SUPABASE RECORDS ---")
    status = service.get_inspection_ocr_status(inspection_id)
    print(json.dumps(status, indent=2))

def test_latest_inspection():
    service = OCRService()
    headers = service._get_headers()
    import httpx
    url = f"{service.supabase_url}/rest/v1/inspections?select=id,inspection_no,created_at&order=created_at.desc&limit=1"
    with httpx.Client(timeout=10.0) as client:
        res = client.get(url, headers=headers)
        if res.is_success and len(res.json()) > 0:
            latest = res.json()[0]
            insp_id = latest["id"]
            case_no = latest.get("inspection_no", "N/A")
            print(f"Found latest case: {case_no} (ID: {insp_id})")
            test_inspection_id(insp_id)
        else:
            print("No inspections found in Supabase.")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        arg = sys.argv[1]
        if arg == "--latest":
            test_latest_inspection()
        elif arg == "--image" and len(sys.argv) > 2:
            test_single_image(sys.argv[2])
        else:
            test_inspection_id(arg)
    else:
        test_latest_inspection()

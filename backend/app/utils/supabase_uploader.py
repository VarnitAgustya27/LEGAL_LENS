import os
import requests
from typing import Optional
from app.config import settings

def upload_pdf_to_supabase(pdf_file_path: str, filename: str) -> str:
    """
    Uploads a generated PDF file to Supabase Storage bucket 'reports'.
    Returns the public URL if successful, or falls back to backend local URL.
    """
    if not os.path.exists(pdf_file_path):
        return f"{settings.API_V1_STR}/reports/pdf"

    supabase_url = settings.SUPABASE_URL.rstrip('/')
    anon_key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY

    if supabase_url and anon_key:
        upload_endpoint = f"{supabase_url}/storage/v1/object/reports/{filename}"
        public_url = f"{supabase_url}/storage/v1/object/public/reports/{filename}"

        try:
            with open(pdf_file_path, "rb") as f:
                pdf_data = f.read()

            headers = {
                "apikey": anon_key,
                "Authorization": f"Bearer {anon_key}",
                "x-upsert": "true",
                "Content-Type": "application/pdf"
            }

            resp = requests.post(upload_endpoint, data=pdf_data, headers=headers, timeout=10)
            if resp.status_code in [200, 201]:
                print(f"[SUPABASE-STORAGE] Successfully uploaded report to Supabase: {public_url}")
                return public_url
            else:
                print(f"[SUPABASE-STORAGE] Upload note: Storage bucket 'reports' returned status {resp.status_code}")
        except Exception as e:
            print(f"[SUPABASE-STORAGE] Upload note: {e}")

    # Fallback to local server API URL
    return f"/api/reports/file/{filename}"

def save_report_to_supabase_db(report_data: dict) -> bool:
    """
    Saves/Upserts a report metadata row into Supabase PostgreSQL 'public.reports' table.
    """
    supabase_url = settings.SUPABASE_URL.rstrip('/')
    anon_key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY
    if not supabase_url or not anon_key:
        return False

    endpoint = f"{supabase_url}/rest/v1/reports"
    headers = {
        "apikey": anon_key,
        "Authorization": f"Bearer {anon_key}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }

    payload = {
        "case_number": report_data.get("case_number"),
        "pdf_path": report_data.get("pdf_path"),
        "pdf_url": report_data.get("pdf_url"),
        "summary": report_data.get("summary", {}),
        "generated_by": report_data.get("generated_by", "Enforcement Officer"),
        "status": report_data.get("status", "REVIEW")
    }

    try:
        r = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        if r.status_code in [200, 201]:
            print(f"[SUPABASE-DB] Successfully saved report to Supabase DB table 'reports': {report_data.get('case_number')}")
            return True
        else:
            print(f"[SUPABASE-DB] DB insert note: {r.status_code} {r.text}")
    except Exception as e:
        print(f"[SUPABASE-DB] Error saving to Supabase DB: {e}")
    return False

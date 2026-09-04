import os
import requests
from typing import Optional
from app.config import settings

def ensure_supabase_bucket(bucket_name: str, supabase_url: str, key: str):
    """Ensures that the public storage bucket exists in Supabase."""
    try:
        url = f"{supabase_url}/storage/v1/bucket"
        headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json"
        }
        payload = {"id": bucket_name, "name": bucket_name, "public": True}
        requests.post(url, json=payload, headers=headers, timeout=5)
    except Exception as e:
        print(f"[SUPABASE-STORAGE] ensure_bucket note: {e}")

def upload_pdf_to_supabase(pdf_file_path: str, filename: str) -> str:
    """
    Uploads a generated PDF file to Supabase Storage bucket 'reports'.
    Returns the public URL if successful, or falls back to backend local URL.
    """
    if not os.path.exists(pdf_file_path):
        return f"{settings.API_V1_STR}/reports/pdf"

    supabase_url = settings.SUPABASE_URL.rstrip('/')
    anon_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

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
                # Attempt to create bucket and retry
                ensure_supabase_bucket("reports", supabase_url, anon_key)
                retry_resp = requests.post(upload_endpoint, data=pdf_data, headers=headers, timeout=10)
                if retry_resp.status_code in [200, 201]:
                    print(f"[SUPABASE-STORAGE] Successfully uploaded report to Supabase after bucket creation: {public_url}")
                    return public_url
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
    anon_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY
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
        resp = requests.post(endpoint, json=payload, headers=headers, timeout=10)
        return resp.status_code in [200, 201]
    except Exception:
        return False

def upload_image_to_supabase_storage(file_path: str, filename: str) -> Optional[str]:
    """
    Uploads an inspection photo to Supabase Storage bucket 'product-images'.
    Returns the public CDN URL if successful.
    """
    if not os.path.exists(file_path):
        return None

    supabase_url = settings.SUPABASE_URL.rstrip('/')
    anon_key = settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY

    if supabase_url and anon_key:
        upload_endpoint = f"{supabase_url}/storage/v1/object/product-images/{filename}"
        public_url = f"{supabase_url}/storage/v1/object/public/product-images/{filename}"

        try:
            with open(file_path, "rb") as f:
                img_data = f.read()

            content_type = "image/jpeg"
            if filename.lower().endswith(".png"):
                content_type = "image/png"
            elif filename.lower().endswith(".webp"):
                content_type = "image/webp"

            headers = {
                "apikey": anon_key,
                "Authorization": f"Bearer {anon_key}",
                "x-upsert": "true",
                "Content-Type": content_type
            }

            resp = requests.post(upload_endpoint, data=img_data, headers=headers, timeout=10)
            if resp.status_code in [200, 201]:
                print(f"[SUPABASE-STORAGE] Successfully uploaded image to Supabase Cloud CDN: {public_url}")
                return public_url
            else:
                # Attempt to create bucket and retry
                ensure_supabase_bucket("product-images", supabase_url, anon_key)
                retry_resp = requests.post(upload_endpoint, data=img_data, headers=headers, timeout=10)
                if retry_resp.status_code in [200, 201]:
                    print(f"[SUPABASE-STORAGE] Successfully uploaded image to Supabase after bucket creation: {public_url}")
                    return public_url
                print(f"[SUPABASE-STORAGE] Image upload note: bucket 'product-images' status {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[SUPABASE-STORAGE] Image upload note: {e}")

    return None

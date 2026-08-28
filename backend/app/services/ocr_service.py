import os
import base64
import logging
import httpx
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from app.config import settings
from app.ocr.ocr_web_service import OCRWebServiceClient, OCRProcessResult

logger = logging.getLogger("app.services.ocr_service")

class OCRService:
    """
    Orchestrates the end-to-end OCR processing pipeline for inspections:
    1. Fetches upload records from Supabase inspection_uploads.
    2. Upserts placeholder records in public.extracted_text.
    3. Downloads image bytes from Supabase Storage.
    4. Calls OCRWebService with timing, retries, and schema parsing.
    5. Updates public.extracted_text with final completed/failed state.
    6. Updates public.inspections when all uploads reach terminal state.
    """
    def __init__(self, ocr_client: Optional[OCRWebServiceClient] = None):
        self.ocr_client = ocr_client or OCRWebServiceClient()

    @property
    def supabase_url(self) -> str:
        return (os.getenv("SUPABASE_URL") or settings.SUPABASE_URL or "https://snxwxahlotngsllqmvyj.supabase.co").rstrip("/")

    @property
    def supabase_key(self) -> str:
        return (os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY or "").strip()

    def _get_headers(self) -> Dict[str, str]:
        key = self.supabase_key
        return {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=representation,resolution=merge-duplicates"
        }

    def process_inspection_uploads(self, inspection_id: str) -> Dict[str, Any]:
        """
        Main worker method to process all images for an inspection.
        Idempotent and safe to run in background tasks.
        """
        logger.info(f"Starting OCR processing for inspection: {inspection_id}")

        # 1. Query Supabase for all uploads associated with this inspection
        uploads = self._fetch_inspection_uploads(inspection_id)
        if not uploads:
            logger.warning(f"No uploads found for inspection_id: {inspection_id}")
            return {
                "inspection_id": inspection_id,
                "status": "no_uploads",
                "processed_count": 0,
                "total_uploads": 0
            }

        total_uploads = len(uploads)
        completed_count = 0
        failed_count = 0

        for upload in uploads:
            upload_id = upload.get("id")
            angle_type = upload.get("angle_type", "unknown")
            bucket_name = upload.get("bucket_name", "inspection_images")
            storage_path = upload.get("storage_path")
            image_url = upload.get("image_url")
            file_name = upload.get("file_name", f"{angle_type}.jpg")

            logger.info(f"Processing upload {upload_id} (angle: {angle_type}) for inspection {inspection_id}")

            # Step A: Insert/Update placeholder in public.extracted_text (status: processing)
            self._upsert_extracted_text(
                inspection_id=inspection_id,
                upload_id=upload_id,
                angle_type=angle_type,
                ocr_status="processing",
                processed_image_path=storage_path
            )

            # Step B: Download image bytes
            image_bytes, download_err = self._download_image_bytes(bucket_name, storage_path, image_url)
            if download_err or not image_bytes:
                logger.error(f"Image download failed for upload {upload_id}: {download_err}")
                self._upsert_extracted_text(
                    inspection_id=inspection_id,
                    upload_id=upload_id,
                    angle_type=angle_type,
                    ocr_status="failed",
                    processed_image_path=storage_path,
                    error_message=f"Failed to download image bytes: {download_err}",
                    processing_time_ms=0
                )
                failed_count += 1
                continue

            # Step C: Call OCRWebService API
            ocr_result = self.ocr_client.process_image_bytes(image_bytes, filename=file_name)

            # Step D & E: Update extracted_text with result
            if ocr_result.success:
                self._upsert_extracted_text(
                    inspection_id=inspection_id,
                    upload_id=upload_id,
                    angle_type=angle_type,
                    ocr_status="completed",
                    extracted_text=ocr_result.extracted_text,
                    confidence_score=ocr_result.confidence_score,
                    word_data=ocr_result.word_data,
                    raw_response=ocr_result.raw_response,
                    processed_image_path=storage_path,
                    processing_time_ms=ocr_result.processing_time_ms,
                    error_message=None
                )
                completed_count += 1
                logger.info(f"Successfully processed upload {upload_id} in {ocr_result.processing_time_ms}ms")
            else:
                self._upsert_extracted_text(
                    inspection_id=inspection_id,
                    upload_id=upload_id,
                    angle_type=angle_type,
                    ocr_status="failed",
                    raw_response=ocr_result.raw_response,
                    processed_image_path=storage_path,
                    processing_time_ms=ocr_result.processing_time_ms,
                    error_message=ocr_result.error_message
                )
                failed_count += 1
                logger.error(f"OCR failed for upload {upload_id}: {ocr_result.error_message}")

        # Final step: Update inspection overall status if all reached terminal state
        overall_status = "completed" if completed_count > 0 else "failed"
        self._update_inspection_status(inspection_id, overall_status)

        return {
            "inspection_id": inspection_id,
            "status": overall_status,
            "total_uploads": total_uploads,
            "completed_count": completed_count,
            "failed_count": failed_count
        }

    def _fetch_inspection_uploads(self, inspection_id: str) -> List[Dict[str, Any]]:
        """Queries public.inspection_uploads from Supabase."""
        try:
            url = f"{self.supabase_url}/rest/v1/inspection_uploads"
            params = {
                "select": "*",
                "inspection_id": f"eq.{inspection_id}"
            }
            with httpx.Client(timeout=15.0) as client:
                res = client.get(url, headers=self._get_headers(), params=params)
                if res.is_success:
                    return res.json()
                logger.warning(f"Fetch uploads returned HTTP {res.status_code}: {res.text}")
        except Exception as e:
            logger.error(f"Exception querying inspection_uploads: {e}")
        return []

    def _download_image_bytes(
        self,
        bucket_name: str,
        storage_path: Optional[str],
        image_url: Optional[str]
    ) -> tuple[Optional[bytes], Optional[str]]:
        """Downloads binary image bytes from Supabase Storage, direct URL, or Base64 data URI."""
        # 1. Try Supabase Storage authenticated download
        if storage_path:
            for bucket in [bucket_name, "inspection_images", "inspection-images"]:
                if not bucket:
                    continue
                try:
                    storage_url = f"{self.supabase_url}/storage/v1/object/authenticated/{bucket}/{storage_path}"
                    with httpx.Client(timeout=25.0) as client:
                        res = client.get(storage_url, headers=self._get_headers())
                        if res.is_success and len(res.content) > 0:
                            return res.content, None
                except Exception:
                    pass

        # 2. Try direct HTTP(S) image URL
        if image_url and image_url.startswith("http"):
            try:
                with httpx.Client(timeout=25.0) as client:
                    res = client.get(image_url)
                    if res.is_success and len(res.content) > 0:
                        return res.content, None
            except Exception as e:
                return None, f"HTTP image download error: {str(e)}"

        # 3. Try base64 data URI
        if image_url and image_url.startswith("data:"):
            try:
                encoded = image_url.split(",")[1]
                return base64.b64decode(encoded), None
            except Exception as e:
                return None, f"Base64 decode error: {str(e)}"

        return None, "No valid storage_path, image_url, or data URI provided."

    def _upsert_extracted_text(
        self,
        inspection_id: str,
        upload_id: Any,
        angle_type: str,
        ocr_status: str,
        extracted_text: Optional[str] = None,
        confidence_score: Optional[float] = None,
        word_data: Optional[Any] = None,
        raw_response: Optional[Dict[str, Any]] = None,
        processed_image_path: Optional[str] = None,
        processing_time_ms: Optional[int] = None,
        error_message: Optional[str] = None,
        ocr_engine: str = "ocrwebservice",
        ocr_version: Optional[str] = "1.0",
        ocr_language: str = "english"
    ) -> bool:
        """Idempotently upserts records into public.extracted_text matching the exact schema."""
        try:
            headers = self._get_headers()
            base_url = f"{self.supabase_url}/rest/v1/extracted_text"
            payload = {
                "inspection_id": str(inspection_id),
                "upload_id": str(upload_id),
                "angle_type": angle_type,
                "ocr_engine": ocr_engine,
                "ocr_version": ocr_version,
                "ocr_language": ocr_language,
                "ocr_status": ocr_status,
                "extracted_text": extracted_text,
                "confidence_score": confidence_score,
                "word_data": word_data,
                "raw_response": raw_response,
                "processed_image_path": processed_image_path,
                "processing_time_ms": processing_time_ms,
                "error_message": error_message
            }

            with httpx.Client(timeout=15.0) as client:
                # 1. Check if record already exists for (inspection_id, upload_id)
                check_params = {
                    "select": "id",
                    "inspection_id": f"eq.{inspection_id}",
                    "upload_id": f"eq.{upload_id}"
                }
                check_res = client.get(base_url, headers=headers, params=check_params)
                existing = check_res.json() if check_res.is_success else []

                if existing and len(existing) > 0:
                    row_id = existing[0]["id"]
                    patch_params = {"id": f"eq.{row_id}"}
                    res = client.patch(base_url, headers=headers, params=patch_params, json=payload)
                    return res.is_success
                else:
                    res = client.post(base_url, headers=headers, json=payload)
                    return res.is_success

        except Exception as e:
            logger.error(f"Exception upserting extracted_text: {e}")
        return False

    def _update_inspection_status(self, inspection_id: str, status: str) -> None:
        """Updates status in public.inspections table."""
        try:
            url = f"{self.supabase_url}/rest/v1/inspections"
            params = {"id": f"eq.{inspection_id}"}
            payload = {
                "status": status,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            with httpx.Client(timeout=10.0) as client:
                client.patch(url, headers=self._get_headers(), params=params, json=payload)
        except Exception as e:
            logger.error(f"Exception updating inspection status: {e}")

    def get_inspection_ocr_status(self, inspection_id: str) -> Dict[str, Any]:
        """
        Retrieves live OCR processing status and results for an inspection.
        Used by frontend polling or status queries.
        """
        try:
            url = f"{self.supabase_url}/rest/v1/extracted_text"
            params = {
                "select": "*",
                "inspection_id": f"eq.{inspection_id}",
                "order": "created_at.asc"
            }
            with httpx.Client(timeout=10.0) as client:
                res = client.get(url, headers=self._get_headers(), params=params)
                if res.is_success:
                    results = res.json()
                    total = len(results)
                    completed = sum(1 for r in results if r.get("ocr_status") == "completed")
                    failed = sum(1 for r in results if r.get("ocr_status") == "failed")
                    processing = sum(1 for r in results if r.get("ocr_status") == "processing")

                    if total == 0:
                        overall = "pending"
                    elif processing > 0:
                        overall = "processing"
                    elif completed > 0:
                        overall = "completed"
                    else:
                        overall = "failed"

                    return {
                        "inspection_id": inspection_id,
                        "overall_status": overall,
                        "total_uploads": total,
                        "completed_count": completed,
                        "failed_count": failed,
                        "processing_count": processing,
                        "results": results
                    }
        except Exception as e:
            logger.error(f"Exception querying OCR status: {e}")

        return {
            "inspection_id": inspection_id,
            "overall_status": "unknown",
            "total_uploads": 0,
            "completed_count": 0,
            "failed_count": 0,
            "processing_count": 0,
            "results": []
        }

import os
import time
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass
import httpx
try:
    from dotenv import load_dotenv
except ImportError:
    def load_dotenv(*args, **kwargs): pass

# Automatically load .env from current directory, parent directory, or backend directory
current_dir = Path(__file__).resolve().parent
load_dotenv(current_dir / ".env", override=False)
load_dotenv(current_dir.parent / ".env", override=False)
load_dotenv(current_dir.parent / "backend" / ".env", override=False)

@dataclass
class OCRProcessResult:
    success: bool
    extracted_text: Optional[str]
    confidence_score: Optional[float]
    word_data: Optional[Any]
    raw_response: Dict[str, Any]
    processing_time_ms: int
    attempt_count: int
    error_message: Optional[str] = None

class OCRWebServiceClient:
    """
    Production-grade HTTP client for OCRWebService REST API.
    Supports Basic Auth, automatic retries with exponential backoff,
    transient error handling, and robust schema-safe response parsing.
    """
    def __init__(
        self,
        user: Optional[str] = None,
        license_code: Optional[str] = None,
        endpoint_url: Optional[str] = None,
        timeout_seconds: float = 45.0,
        max_retries: int = 3
    ):
        self.user = user
        self.license_code = license_code
        self.endpoint_url = (endpoint_url or os.getenv("OCR_WEB_SERVICE_URL") or "https://www.ocrwebservice.com/restservices/processDocument").strip()
        self.timeout_seconds = timeout_seconds
        self.max_retries = max_retries

    def _get_credentials(self) -> tuple[str, str]:
        user = (self.user or os.getenv("OCR_WEB_SERVICE_USER") or "").strip()
        license_code = (self.license_code or os.getenv("OCR_WEB_SERVICE_LICENSE_CODE") or "").strip()
        return user, license_code

    def process_image_bytes(self, image_bytes: bytes, filename: str = "image.jpg") -> OCRProcessResult:
        """
        Submits image bytes to OCRWebService via POST request.
        Retries on transient errors (429, 5xx, timeouts) with exponential backoff.
        Never retries 401/403 authentication failures.
        """
        user, license_code = self._get_credentials()
        if not user or not license_code:
            return OCRProcessResult(
                success=False,
                extracted_text=None,
                confidence_score=None,
                word_data=None,
                raw_response={"error": "MISSING_CREDENTIALS"},
                processing_time_ms=0,
                attempt_count=0,
                error_message="OCRWebService credentials (OCR_WEB_SERVICE_USER / OCR_WEB_SERVICE_LICENSE_CODE) not configured in .env"
            )

        start_time = time.perf_counter()
        params = {
            "gettext": "true",
            "language": "english"
        }
        auth = (user, license_code)
        headers = {
            "Content-Type": "application/octet-stream"
        }

        attempt = 0
        last_error_message = None
        raw_response_data: Dict[str, Any] = {}

        while attempt < self.max_retries:
            attempt += 1
            try:
                with httpx.Client(timeout=self.timeout_seconds) as client:
                    response = client.post(
                        self.endpoint_url,
                        params=params,
                        auth=auth,
                        headers=headers,
                        content=image_bytes
                    )

                # Check for non-retryable authentication failures
                if response.status_code in (401, 403):
                    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
                    return OCRProcessResult(
                        success=False,
                        extracted_text=None,
                        confidence_score=None,
                        word_data=None,
                        raw_response={"status_code": response.status_code, "body": response.text[:500]},
                        processing_time_ms=elapsed_ms,
                        attempt_count=attempt,
                        error_message=f"OCRWebService authentication failed (HTTP {response.status_code}). Verify username and license code."
                    )

                # Check for transient server errors (429, 5xx)
                if response.status_code == 429 or response.status_code >= 500:
                    last_error_message = f"Transient HTTP error {response.status_code}: {response.text[:200]}"
                    if attempt < self.max_retries:
                        backoff_delay = 1.0 * (2 ** (attempt - 1))
                        time.sleep(backoff_delay)
                        continue

                # Parse JSON response
                try:
                    raw_response_data = response.json()
                except Exception:
                    raw_response_data = {"status_code": response.status_code, "raw_text": response.text[:1000]}

                if response.is_success:
                    elapsed_ms = int((time.perf_counter() - start_time) * 1000)
                    return self._parse_ocr_response(raw_response_data, elapsed_ms, attempt)
                else:
                    err_msg = raw_response_data.get("ErrorMessage") or f"HTTP {response.status_code}: {response.text[:300]}"
                    last_error_message = err_msg
                    break

            except (httpx.TimeoutException, httpx.NetworkError) as net_err:
                last_error_message = f"Network/Timeout error: {str(net_err)}"
                if attempt < self.max_retries:
                    backoff_delay = 1.0 * (2 ** (attempt - 1))
                    time.sleep(backoff_delay)
                    continue
                break
            except Exception as ex:
                last_error_message = f"Unexpected client error: {str(ex)}"
                break

        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        return OCRProcessResult(
            success=False,
            extracted_text=None,
            confidence_score=None,
            word_data=None,
            raw_response=raw_response_data or {"error": last_error_message},
            processing_time_ms=elapsed_ms,
            attempt_count=attempt,
            error_message=last_error_message or "OCR processing failed"
        )

    def _parse_ocr_response(self, response_data: Dict[str, Any], elapsed_ms: int, attempt_count: int) -> OCRProcessResult:
        """Extracts OCR text, confidence, and bounding boxes safely from OCRWebService schema."""
        error_msg = response_data.get("ErrorMessage")
        if error_msg:
            return OCRProcessResult(
                success=False,
                extracted_text=None,
                confidence_score=None,
                word_data=None,
                raw_response=response_data,
                processing_time_ms=elapsed_ms,
                attempt_count=attempt_count,
                error_message=str(error_msg)
            )

        extracted_text: Optional[str] = None
        ocr_text_field = response_data.get("OCRText")

        if ocr_text_field is not None:
            if isinstance(ocr_text_field, list):
                flattened_lines: List[str] = []
                for item in ocr_text_field:
                    if isinstance(item, list):
                        flattened_lines.extend([str(line) for line in item if line])
                    elif isinstance(item, str):
                        flattened_lines.append(item)
                extracted_text = "\n".join(flattened_lines).strip()
            elif isinstance(ocr_text_field, str):
                extracted_text = ocr_text_field.strip()

        word_data: Optional[Any] = None
        for key in ["OCRWSWords", "Words", "WordData", "ocr_words"]:
            if key in response_data and response_data[key]:
                word_data = response_data[key]
                break

        confidence_score: Optional[float] = None
        if "Confidence" in response_data and response_data["Confidence"] is not None:
            try:
                raw_conf = float(response_data["Confidence"])
                confidence_score = round(raw_conf / 100.0 if raw_conf > 1.0 else raw_conf, 4)
            except (ValueError, TypeError):
                confidence_score = None
        elif isinstance(word_data, list) and len(word_data) > 0:
            confidences = []
            for w in word_data:
                if isinstance(w, dict) and "Confidence" in w:
                    try:
                        c = float(w["Confidence"])
                        confidences.append(c / 100.0 if c > 1.0 else c)
                    except (ValueError, TypeError):
                        pass
            if confidences:
                confidence_score = round(sum(confidences) / len(confidences), 4)

        return OCRProcessResult(
            success=True,
            extracted_text=extracted_text,
            confidence_score=confidence_score,
            word_data=word_data,
            raw_response=response_data,
            processing_time_ms=elapsed_ms,
            attempt_count=attempt_count,
            error_message=None
        )

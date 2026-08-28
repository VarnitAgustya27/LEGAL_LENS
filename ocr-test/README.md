# OCR Pipeline Test Suite (`/ocr-test`)

Standalone OCR testing and execution suite for Legal-Lens using **OCRWebService** and **Supabase**.

## Files
- `ocr_web_service.py`: Standalone REST client with Basic Auth, retries, exponential backoff, and robust schema-safe parsing.
- `ocr_service.py`: Pipeline service that pulls images from Supabase Storage (`inspection_images`), runs OCR, and saves extracted text directly into `public.extracted_text`.
- `run_ocr_test.py`: Interactive CLI tool.
- `test_ocr_pipeline.py`: Pytest unit tests.

## Usage

### 1. Process the latest inspection in Supabase
```bash
python run_ocr_test.py --latest
```

### 2. Process a specific inspection ID
```bash
python run_ocr_test.py dcb2e894-9712-4569-bdee-8691a0c410df
```

### 3. Run OCR on a local image
```bash
python run_ocr_test.py --image path/to/image.jpg
```

### 4. Run Pytest Unit Tests
```bash
pytest test_ocr_pipeline.py
```

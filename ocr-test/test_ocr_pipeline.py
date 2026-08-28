import pytest
from ocr_web_service import OCRWebServiceClient, OCRProcessResult

def test_ocr_web_service_response_parsing_nested_list():
    client = OCRWebServiceClient(user="dummy", license_code="dummy")
    raw_mock_response = {
        "OCRText": [
            ["NUTRIMAX GLUCOSE BISCUITS 200g", "Net Quantity: 200 g"],
            ["MRP: Rs. 25.00", "Manufactured By: Nutrimax Foods Pvt. Ltd."]
        ],
        "OCRWSWords": [
            {"WordText": "NUTRIMAX", "Confidence": "98"},
            {"WordText": "GLUCOSE", "Confidence": "96"}
        ],
        "ErrorMessage": ""
    }

    result = client._parse_ocr_response(raw_mock_response, elapsed_ms=1200, attempt_count=1)
    assert result.success is True
    assert "NUTRIMAX GLUCOSE BISCUITS 200g" in result.extracted_text
    assert "MRP: Rs. 25.00" in result.extracted_text
    assert result.confidence_score == 0.97
    assert result.processing_time_ms == 1200
    assert result.attempt_count == 1
    assert result.error_message is None

def test_ocr_web_service_response_parsing_string():
    client = OCRWebServiceClient(user="dummy", license_code="dummy")
    raw_mock_response = {
        "OCRText": "Single block text output",
        "Confidence": "94.5",
        "ErrorMessage": ""
    }

    result = client._parse_ocr_response(raw_mock_response, elapsed_ms=800, attempt_count=1)
    assert result.success is True
    assert result.extracted_text == "Single block text output"
    assert result.confidence_score == 0.945

def test_ocr_web_service_error_response():
    client = OCRWebServiceClient(user="dummy", license_code="dummy")
    raw_mock_response = {
        "OCRText": None,
        "ErrorMessage": "Daily page limit exceeded"
    }

    result = client._parse_ocr_response(raw_mock_response, elapsed_ms=450, attempt_count=1)
    assert result.success is False
    assert result.extracted_text is None
    assert result.error_message == "Daily page limit exceeded"

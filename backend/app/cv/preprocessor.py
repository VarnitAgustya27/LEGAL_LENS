import cv2
import numpy as np
import os
from typing import Dict, Any

class ImageQualityAssessment:
    @staticmethod
    def assess_quality(image_path: str) -> Dict[str, Any]:
        if not os.path.exists(image_path):
            return {
                "quality_status": "POOR",
                "quality_score": 0.0,
                "blur_score": 0.0,
                "resolution": "0x0",
                "is_blurry": True,
                "message": "Image file not found."
            }

        img = cv2.imread(image_path)
        if img is None:
            return {
                "quality_status": "POOR",
                "quality_score": 0.0,
                "blur_score": 0.0,
                "resolution": "0x0",
                "is_blurry": True,
                "message": "Could not decode image."
            }

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        blur_variance = float(laplacian.var())
        is_blurry = blur_variance < 70.0

        brightness = float(np.mean(gray))
        contrast = float(np.std(gray))

        blur_factor = min(1.0, blur_variance / 200.0)
        res_factor = min(1.0, (w * h) / (1200 * 1200))
        contrast_factor = min(1.0, contrast / 50.0)
        quality_score = round(0.5 * blur_factor + 0.3 * contrast_factor + 0.2 * res_factor, 2)

        if quality_score >= 0.70 and not is_blurry:
            quality_status = "GOOD"
            msg = "Image quality is optimal for automated Legal Metrology inspection."
        elif quality_score >= 0.40:
            quality_status = "ACCEPTABLE"
            msg = "Image quality is acceptable. Minor blur or glare detected."
        else:
            quality_status = "POOR"
            msg = "Image quality is insufficient for reliable automated analysis. Please capture a clearer, well-lit image."

        return {
            "quality_status": quality_status,
            "quality_score": quality_score,
            "blur_score": round(blur_variance, 1),
            "brightness": round(brightness, 1),
            "contrast": round(contrast, 1),
            "resolution": f"{w}x{h}",
            "is_blurry": is_blurry,
            "message": msg
        }

    @staticmethod
    def preprocess_for_ocr(image_path: str, output_path: str) -> str:
        img = cv2.imread(image_path)
        if img is None:
            return image_path

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        denoised = cv2.bilateralFilter(enhanced, 9, 75, 75)

        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, denoised)
        return output_path

    @staticmethod
    def estimate_text_height(image_path: str) -> Dict[str, Any]:
        img = cv2.imread(image_path)
        if img is None:
            return {"estimated_height_px": 0, "estimated_height_mm": 0.0, "status": "NOT_ASSESSABLE"}

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        heights = [cv2.boundingRect(c)[3] for c in contours if 8 <= cv2.boundingRect(c)[3] <= 120]

        if not heights:
            return {"estimated_height_px": 0, "estimated_height_mm": 0.0, "status": "NOT_ASSESSABLE"}

        median_px = float(np.median(heights))
        est_mm = round(median_px / 3.78, 2)

        return {
            "estimated_height_px": round(median_px, 1),
            "estimated_height_mm": est_mm,
            "status": "PASS" if est_mm >= 1.0 else "NEEDS_REVIEW",
            "note": "Assisted physical estimation. Calibration target recommended for official legal dispute."
        }

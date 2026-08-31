import re

def extract_location_from_manufacturer(mfr_text: str) -> str:
    """
    Dynamically extracts the city and state/pin-location from a manufacturer address string.
    Specifically parses standard Indian packaging address formats (e.g. City - Pin, State).
    """
    if not mfr_text or not isinstance(mfr_text, str) or mfr_text.strip() == "":
        return "New Delhi, Delhi"
    
    text = mfr_text.strip()
    # Clean ending trailing punctuation/whitespaces
    text = re.sub(r"[.\s]+$", "", text)
    
    # Split by comma
    segments = [s.strip() for s in text.split(",") if s.strip()]
    if not segments:
        return "New Delhi, Delhi"
        
    # Remove country if it's the last segment
    last_seg = segments[-1].lower()
    if any(x in last_seg for x in ["india", "made in", "republic of"]):
        segments.pop()
        
    if not segments:
        return "New Delhi, Delhi"
        
    # Clean PIN codes (e.g. 122001, 334001, etc.)
    last_seg = segments[-1]
    last_seg_cleaned = re.sub(r"\b\d{6}\b", "", last_seg).replace("-", "").strip()
    
    if len(segments) >= 2:
        prev_seg = segments[-2]
        prev_seg_cleaned = re.sub(r"\b\d{6}\b", "", prev_seg).replace("-", "").strip()
        
        # Extract last word of previous segment (usually city) and first word of last segment (usually state)
        city = prev_seg_cleaned.split()[-1] if prev_seg_cleaned else ""
        state = last_seg_cleaned.split()[0] if last_seg_cleaned else ""
        if city and state:
            return f"{city}, {state}"
        return f"{prev_seg_cleaned}, {last_seg_cleaned}"
    
    return last_seg_cleaned or "New Delhi, Delhi"

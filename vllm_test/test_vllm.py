import base64
import json
import mimetypes
import os
import re
import time
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq

# Resolve paths relative to this script so it works regardless of CWD
SCRIPT_DIR = Path(__file__).parent

load_dotenv(dotenv_path=SCRIPT_DIR / ".env")

# Ensure the Groq key exists early – helpful error if .env is missing
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found in environment variables\n"
                     f"Expected in: {SCRIPT_DIR / '.env'}")

MODEL_NAME = os.getenv(
    "GROQ_VISION_MODEL",
    "qwen/qwen3.6-27b"
)

TEMPERATURE = float(
    os.getenv("GROQ_TEMPERATURE", "0.1")
)

# Reasoning models (qwen3, deepseek-r1, etc.) burn tokens on a
# <think>...</think> block before writing the actual answer, and
# on Groq that hidden reasoning still counts against max_tokens.
#
# IMPORTANT: some Groq accounts (free / on_demand tier) are capped
# at only ~8000 TOKENS PER MINUTE (TPM) - total, across prompt +
# image + completion, and across ALL requests in that 60s window.
# A vision request's image + prompt alone can already be a few
# thousand tokens, so max_tokens must be kept modest or a single
# request will exceed the cap outright (HTTP 413 rate_limit_exceeded),
# and back-to-back images will exceed it cumulatively even if each
# one individually fits.
#
# Tune these via env vars to match your actual Groq plan's TPM limit.
MAX_TOKENS = int(os.getenv("GROQ_MAX_TOKENS", "3000"))
RETRY_MAX_TOKENS = int(os.getenv("GROQ_RETRY_MAX_TOKENS", "5000"))

# Seconds to wait between processing consecutive images, to avoid
# stacking requests inside the same TPM window. Set to 0 to disable
# (e.g. if you're on a higher/dev tier with a much larger TPM limit).
DELAY_BETWEEN_IMAGES_SECONDS = float(
    os.getenv("DELAY_BETWEEN_IMAGES_SECONDS", "20")
)

# When Groq returns a rate-limit error mid-request, how long to wait
# before retrying (a TPM window is 60s, so wait a bit past that).
RATE_LIMIT_WAIT_SECONDS = float(
    os.getenv("RATE_LIMIT_WAIT_SECONDS", "65")
)
RATE_LIMIT_MAX_RETRIES = int(
    os.getenv("RATE_LIMIT_MAX_RETRIES", "3")
)


# ============================================================
# VISION LLM
# ============================================================

def _make_llm(max_tokens: int) -> ChatGroq:
    """
    Build a ChatGroq client with a given max_tokens budget.
    Kept as a factory so the retry path can request a bigger budget
    without mutating a shared client mid-run.
    """

    return ChatGroq(
        api_key=GROQ_API_KEY,
        model=MODEL_NAME,
        temperature=TEMPERATURE,
        max_tokens=max_tokens,
        # Suppress the <think>...</think> reasoning trace from
        # reasoning-capable Groq models so we only get the answer.
        # NOTE: langchain_groq exposes this as a top-level field -
        # passing it inside model_kwargs raises a pydantic ValidationError.
        reasoning_format="hidden",
    )


llm = _make_llm(MAX_TOKENS)
llm_retry = _make_llm(RETRY_MAX_TOKENS)


# ============================================================
# SYSTEM PROMPT
# ============================================================

EXTRACTION_PROMPT = """
You are an image-to-text extraction system for Metria, an Indian
Legal Metrology packaged-commodity inspection platform.

Your job is ONLY to read and extract information that is visibly
present in the product/package image.

DO NOT determine whether the package is legally compliant.
DO NOT invent missing information.
DO NOT infer values that cannot be clearly read.

Extract all visible text and identify relevant packaged-commodity
declarations.

Pay special attention to:

- Product / commodity name
- Manufacturer name
- Manufacturer address
- Packer name
- Packer address
- Importer name
- Importer address
- Net quantity
- MRP
- Unit of measurement
- Date of manufacture / packing
- Best before / expiry
- Batch / lot number
- Customer care details
- Consumer care phone number
- Consumer care email
- Country of origin
- FSSAI licence number
- Barcode
- Other visible mandatory declarations
- Any other important text visible on the package

Respond with ONLY the JSON object below and nothing else -
no <think> tags, no explanations, no markdown code fences,
no commentary before or after it.

Use this exact structure:

{
  "full_text": "all clearly readable text from the image",
  "fields": {
    "commodity_name": null,
    "manufacturer_name": null,
    "manufacturer_address": null,
    "packer_name": null,
    "packer_address": null,
    "importer_name": null,
    "importer_address": null,
    "net_quantity": null,
    "net_quantity_unit": null,
    "mrp": null,
    "date_of_manufacture": null,
    "best_before": null,
    "expiry_date": null,
    "batch_number": null,
    "customer_care_phone": null,
    "customer_care_email": null,
    "country_of_origin": null,
    "fssai_license_number": null,
    "barcode": null
  },
  "additional_text": [],
  "uncertain_text": []
}

Rules:

1. Use null when a field is not visible or cannot be read.
2. Never fabricate a value.
3. Preserve numbers exactly when possible.
4. Preserve addresses as they appear.
5. If a value is ambiguous (e.g. two license numbers), put the
   clearest/primary one in the field and mention the rest in
   additional_text - do not leave the field truncated or partial.
6. If text is partially readable, put it in uncertain_text instead
   of guessing.
7. full_text should contain only text that can actually be read.
8. Do not provide explanations outside the JSON.
"""


# ============================================================
# MIME TYPE
# ============================================================

def get_mime_type(image_path: str) -> str:
    """
    Determine the correct MIME type from the image extension.
    """

    mime_type, _ = mimetypes.guess_type(image_path)

    if mime_type and mime_type.startswith("image/"):
        return mime_type

    # Safe fallback
    return "image/jpeg"


# ============================================================
# IMAGE → BASE64 DATA URL
# ============================================================

def image_to_data_url(image_path: str) -> str:
    """
    Read an image and convert it into a Base64 data URL.
    """

    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    mime_type = get_mime_type(image_path)

    with open(path, "rb") as image_file:
        encoded = base64.b64encode(
            image_file.read()
        ).decode("utf-8")

    return f"data:{mime_type};base64,{encoded}"


# ============================================================
# JSON EXTRACTION
# ============================================================

def _strip_think_blocks(text: str) -> str:
    """
    Remove any <think>...</think> reasoning traces, even if the
    model ignores reasoning_format=hidden and emits them anyway.
    Handles an unclosed trailing <think> too (truncated output).
    """

    # Fully closed think blocks
    text = re.sub(
        r"<think>.*?</think>",
        "",
        text,
        flags=re.DOTALL,
    )

    # Defensive: unclosed think tag with no JSON after it
    if "<think>" in text and "</think>" not in text:
        text = text.split("<think>")[0]

    return text.strip()


def _extract_json_substring(text: str) -> str:
    """
    Pull out the outermost {...} block in case the model added
    stray text or markdown fences around the JSON.
    """

    start = text.find("{")
    end = text.rfind("}")

    if start == -1 or end == -1 or end < start:
        raise ValueError("No JSON object found in response.")

    return text[start:end + 1]


def parse_llm_json(content: Any) -> dict:
    """
    Convert the LLM response into a Python dictionary.

    Handles:
      - stray <think>...</think> reasoning traces
      - markdown ```json fences
      - extra text before/after the JSON object
    """

    if not isinstance(content, str):
        content = str(content)

    content = content.strip()

    content = _strip_think_blocks(content)

    # Remove markdown JSON fences if present
    if "```" in content:
        content = content.replace("```json", "")
        content = content.replace("```", "")
        content = content.strip()

    json_str = _extract_json_substring(content)

    try:
        return json.loads(json_str)

    except json.JSONDecodeError as exc:
        raise ValueError(
            f"LLM did not return valid JSON.\n"
            f"Response:\n{content}"
        ) from exc


# ============================================================
# PROCESS ONE IMAGE
# ============================================================

_RATE_LIMIT_MARKERS = (
    "rate_limit_exceeded",
    "Request too large",
    "tokens per minute",
    "TPM",
)


def _is_rate_limit_error(exc: Exception) -> bool:
    """
    Detect a Groq TPM/rate-limit error (HTTP 413/429 style) from the
    exception text, so we know to wait-and-retry instead of failing
    immediately or burning the escalate-max_tokens retry on it.
    """

    message = str(exc)
    return any(marker in message for marker in _RATE_LIMIT_MARKERS)


def _invoke_with_rate_limit_retry(
    llm_client: ChatGroq,
    message: HumanMessage,
):
    """
    Call llm_client.invoke, and if Groq comes back with a TPM/rate
    limit error, wait for the window to reset and retry - up to
    RATE_LIMIT_MAX_RETRIES times - before giving up.
    """

    last_exc: Exception | None = None

    for attempt in range(1, RATE_LIMIT_MAX_RETRIES + 1):

        try:
            return llm_client.invoke([message])

        except Exception as exc:
            last_exc = exc

            if _is_rate_limit_error(exc) and attempt < RATE_LIMIT_MAX_RETRIES:
                print(
                    f"  Rate limited by Groq (attempt {attempt}/"
                    f"{RATE_LIMIT_MAX_RETRIES}). Waiting "
                    f"{RATE_LIMIT_WAIT_SECONDS:.0f}s for the TPM "
                    f"window to reset..."
                )
                time.sleep(RATE_LIMIT_WAIT_SECONDS)
                continue

            raise

    raise last_exc  # pragma: no cover - unreachable, satisfies type checkers


def _build_message(image_data_url: str) -> HumanMessage:
    return HumanMessage(
        content=[
            {
                "type": "text",
                "text": EXTRACTION_PROMPT,
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": image_data_url,
                },
            },
        ]
    )


def extract_product_information(
    image_path: str,
) -> dict:
    """
    Extract packaged-commodity information from one image.

    If the first attempt comes back empty or unparsable (typically
    because a dense image's hidden reasoning trace ate the whole
    token budget), retry once with a much larger max_tokens budget
    before giving up.
    """

    image_data_url = image_to_data_url(image_path)
    message = _build_message(image_data_url)

    try:
        response = _invoke_with_rate_limit_retry(llm, message)
        return parse_llm_json(response.content)

    except Exception as exc:
        if _is_rate_limit_error(exc):
            # Already retried inside _invoke_with_rate_limit_retry and
            # still rate limited - a bigger max_tokens retry would
            # just get rate limited again, so don't bother escalating.
            raise

        # Non-rate-limit failure (empty/unparsable JSON) - retry once
        # with a bigger token budget.
        response = _invoke_with_rate_limit_retry(llm_retry, message)
        return parse_llm_json(response.content)


# ============================================================
# PROCESS LOCAL FOLDER
# ============================================================

def process_images_from_folder(
    folder_path: str,
) -> dict:
    """
    Process every supported image inside a folder.

    Returns ONE consolidated dict:
    {
        "summary": {
            "total": int,
            "successful_count": int,
            "failed_count": int,
            "successful": [filenames...],
            "failed": [filenames...]
        },
        "results": {
            filename: {
                "status": "success" | "failed",
                "data": {...}      # present only on success
                "error": "..."     # present only on failure
            },
            ...
        }
    }

    Nothing is printed here - printing happens once, at the very
    end, in __main__.
    """

    folder = Path(folder_path)

    if not folder.exists():
        raise FileNotFoundError(
            f"Folder not found: {folder_path}"
        )

    supported_extensions = {
        ".jpg",
        ".jpeg",
        ".png",
        ".webp",
    }

    image_paths = sorted(
        path
        for path in folder.iterdir()
        if path.is_file()
        and path.suffix.lower() in supported_extensions
    )

    results = {}
    successful = []
    failed = []

    for index, image_path in enumerate(image_paths):

        name = image_path.name

        if index > 0 and DELAY_BETWEEN_IMAGES_SECONDS > 0:
            time.sleep(DELAY_BETWEEN_IMAGES_SECONDS)

        try:
            data = extract_product_information(str(image_path))

            results[name] = {
                "status": "success",
                "data": data,
            }
            successful.append(name)

        except Exception as exc:
            results[name] = {
                "status": "failed",
                "error": str(exc),
            }
            failed.append(name)

    return {
        "summary": {
            "total": len(image_paths),
            "successful_count": len(successful),
            "failed_count": len(failed),
            "successful": successful,
            "failed": failed,
        },
        "results": results,
    }


# ============================================================
# LOCAL TEST
# ============================================================

if __name__ == "__main__":

    folder = os.getenv(
        "TEST_IMAGE_FOLDER",
        str(SCRIPT_DIR / "harsh"),
    )

    try:
        results = process_images_from_folder(folder)
    except FileNotFoundError as e:
        print(f"\nError: {e}")
        print(f"Ensure the image folder exists at: {SCRIPT_DIR / 'harsh'}")
        raise

    print(
        json.dumps(
            results,
            indent=2,
            ensure_ascii=False,
        )
    )
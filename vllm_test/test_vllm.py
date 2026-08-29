import base64
import json
import mimetypes
import os
import re
import time
from pathlib import Path

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage
from langchain_groq import ChatGroq


# ============================================================
# CONFIG
# ============================================================

SCRIPT_DIR = Path(__file__).parent

load_dotenv(dotenv_path=SCRIPT_DIR / ".env")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError(
        "GROQ_API_KEY not found.\n"
        f"Expected in: {SCRIPT_DIR / '.env'}"
    )


# Your .env uses these names
MODEL_NAME = os.getenv(
    "VLLM_MODEL",
    "qwen/qwen3.6-27b"
)

TEMPERATURE = float(
    os.getenv(
        "VLLM_TEMPERATURE",
        "0.0"
    )
)

MAX_TOKENS = int(
    os.getenv(
        "GROQ_MAX_TOKENS",
        "2500"
    )
)

RATE_LIMIT_WAIT_SECONDS = float(
    os.getenv(
        "RATE_LIMIT_WAIT_SECONDS",
        "65"
    )
)

RATE_LIMIT_MAX_RETRIES = int(
    os.getenv(
        "RATE_LIMIT_MAX_RETRIES",
        "2"
    )
)


# ============================================================
# VISION LLM
# ============================================================

def make_llm() -> ChatGroq:
    """
    Create the Groq vision model.

    Reasoning is disabled because the model is being used only
    for reading/transcribing visible text.
    """

    return ChatGroq(
        api_key=GROQ_API_KEY,
        model=MODEL_NAME,
        temperature=TEMPERATURE,
        max_tokens=MAX_TOKENS,
        reasoning_effort="none",
        reasoning_format="hidden",
    )


llm = make_llm()


# ============================================================
# PROMPT
# ============================================================

TEXT_EXTRACTION_PROMPT = """
You are a pure image text transcription system.

Your ONLY task is to read and transcribe text that is visibly
present in the provided product/package images.

DO NOT:
- determine legal compliance
- identify violations
- classify information
- extract fields
- create structured JSON
- infer missing information
- correct spelling
- correct numbers
- guess unclear words
- guess hidden text
- summarize the package
- explain anything

Simply transcribe the visible text.

Rules:

1. Extract all clearly readable text.
2. Preserve wording as closely as possible.
3. Preserve numbers exactly as visible.
4. Preserve addresses.
5. Preserve punctuation when readable.
6. Do not silently correct spelling.
7. If something is unclear, write [UNCLEAR].
8. Do not invent information.
9. Do not perform compliance analysis.
10. Output only the transcribed text.

There are multiple images.

For EACH image, return the result using this exact format:

IMAGE: <filename>
TEXT:
<transcribed visible text>

IMAGE: <filename>
TEXT:
<transcribed visible text>

Do not output JSON.
Do not use markdown code fences.
Do not add explanations.
"""


# ============================================================
# MIME TYPE
# ============================================================

def get_mime_type(
    image_path: str
) -> str:

    mime_type, _ = mimetypes.guess_type(
        image_path
    )

    if (
        mime_type
        and mime_type.startswith("image/")
    ):
        return mime_type

    return "image/jpeg"


# ============================================================
# IMAGE → BASE64 DATA URL
# ============================================================

def image_to_data_url(
    image_path: str
) -> str:

    path = Path(image_path)

    if not path.exists():
        raise FileNotFoundError(
            f"Image not found: {image_path}"
        )

    mime_type = get_mime_type(
        image_path
    )

    with open(
        path,
        "rb"
    ) as image_file:

        encoded = base64.b64encode(
            image_file.read()
        ).decode("utf-8")

    return (
        f"data:{mime_type};base64,{encoded}"
    )


# ============================================================
# THINK BLOCK CLEANUP
# ============================================================

def strip_think_blocks(
    text: str
) -> str:

    if "<think>" not in text:
        return text.strip()

    before = text.split(
        "<think>",
        1
    )[0]

    if "</think>" in text:

        after = text.split(
            "</think>",
            1
        )[1]

        text = before + after

    else:

        text = before

    return text.strip()


# ============================================================
# TEXT FORMATTING CLEANUP
# ============================================================

def clean_extracted_text(
    text: str
) -> str:
    """
    Clean formatting of extracted text.

    IMPORTANT:
    This function ONLY changes formatting.

    It does NOT:
    - correct OCR mistakes
    - change numbers
    - interpret text
    - identify fields
    - add information
    - remove meaningful content
    """

    if not text:
        return ""

    # Normalize newline characters
    text = text.replace(
        "\r\n",
        "\n"
    )

    text = text.replace(
        "\r",
        "\n"
    )

    # Remove trailing/leading whitespace
    # from each line.
    lines = [
        line.strip()
        for line in text.split("\n")
    ]

    cleaned_lines = []

    previous_blank = False

    for line in lines:

        # Blank line
        if not line:

            # Allow at most ONE blank line.
            if not previous_blank:
                cleaned_lines.append("")

            previous_blank = True

            continue

        cleaned_lines.append(line)

        previous_blank = False

    # Remove blank lines from beginning
    while (
        cleaned_lines
        and not cleaned_lines[0]
    ):
        cleaned_lines.pop(0)

    # Remove blank lines from end
    while (
        cleaned_lines
        and not cleaned_lines[-1]
    ):
        cleaned_lines.pop()

    return "\n".join(
        cleaned_lines
    ).strip()


# ============================================================
# RATE LIMIT DETECTION
# ============================================================

RATE_LIMIT_MARKERS = (
    "rate_limit_exceeded",
    "Request too large",
    "tokens per minute",
    "TPM",
    "429",
    "413",
)


def is_rate_limit_error(
    exc: Exception
) -> bool:

    message = str(exc).lower()

    return any(
        marker.lower() in message
        for marker in RATE_LIMIT_MARKERS
    )


# ============================================================
# GROQ REQUEST WITH RETRIES
# ============================================================

def invoke_with_retry(
    message: HumanMessage
):

    last_exception = None

    for attempt in range(
        1,
        RATE_LIMIT_MAX_RETRIES + 1
    ):

        try:

            return llm.invoke(
                [message]
            )

        except Exception as exc:

            last_exception = exc

            if (
                is_rate_limit_error(exc)
                and attempt
                < RATE_LIMIT_MAX_RETRIES
            ):

                print(
                    f"Groq rate limit hit. "
                    f"Waiting "
                    f"{RATE_LIMIT_WAIT_SECONDS:.0f}s..."
                )

                time.sleep(
                    RATE_LIMIT_WAIT_SECONDS
                )

                continue

            raise

    raise last_exception


# ============================================================
# BUILD MULTI-IMAGE MESSAGE
# ============================================================

def build_multi_image_message(
    image_paths: list[Path]
) -> HumanMessage:

    content = [
        {
            "type": "text",
            "text": TEXT_EXTRACTION_PROMPT,
        }
    ]

    for image_path in image_paths:

        image_data_url = (
            image_to_data_url(
                str(image_path)
            )
        )

        # Tell the model which filename
        # belongs to the following image.
        content.append(
            {
                "type": "text",
                "text": (
                    f"\nIMAGE FILENAME: "
                    f"{image_path.name}\n"
                ),
            }
        )

        content.append(
            {
                "type": "image_url",
                "image_url": {
                    "url": image_data_url
                },
            }
        )

    return HumanMessage(
        content=content
    )


# ============================================================
# PARSE IMAGE RESULTS
# ============================================================

def parse_image_results(
    response_text: str,
    image_paths: list[Path]
) -> dict:

    response_text = (
        strip_think_blocks(
            response_text
        )
    )

    results = {}

    # Create entries for all expected images.
    for image_path in image_paths:

        results[image_path.name] = {
            "status": "success",
            "text": ""
        }

    current_image = None
    current_text = []

    lines = response_text.splitlines()

    for line in lines:

        stripped = line.strip()

        # ----------------------------------------------------
        # Detect:
        #
        # IMAGE: harsh_1.jpeg
        # ----------------------------------------------------

        if stripped.upper().startswith(
            "IMAGE:"
        ):

            # Save previous image
            if current_image is not None:

                if current_image in results:

                    results[current_image][
                        "text"
                    ] = clean_extracted_text(
                        "\n".join(
                            current_text
                        )
                    )

            filename = stripped[
                len("IMAGE:")
            ].strip()

            matched_filename = None

            # Match against actual filenames
            for image_path in image_paths:

                if (
                    image_path.name
                    == filename
                ):

                    matched_filename = (
                        image_path.name
                    )

                    break

            if matched_filename:

                current_image = (
                    matched_filename
                )

            else:

                current_image = filename

            current_text = []

            continue

        # ----------------------------------------------------
        # Ignore TEXT: marker
        # ----------------------------------------------------

        if stripped.upper() == "TEXT:":
            continue

        # ----------------------------------------------------
        # Add text to current image
        # ----------------------------------------------------

        if current_image is not None:

            current_text.append(
                line
            )

    # Save final image
    if current_image is not None:

        if current_image in results:

            results[current_image][
                "text"
            ] = clean_extracted_text(
                "\n".join(
                    current_text
                )
            )

    return results


# ============================================================
# PROCESS IMAGES
# ============================================================

def process_images_from_folder(
    folder_path: str
) -> dict:

    folder = Path(folder_path)

    if not folder.exists():

        raise FileNotFoundError(
            f"Folder not found: "
            f"{folder_path}"
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
        if (
            path.is_file()
            and path.suffix.lower()
            in supported_extensions
        )
    )

    if not image_paths:

        return {
            "status": "success",
            "message": "No images found.",
            "results": {}
        }

    results = {}

    # ========================================================
    # MAXIMUM 3 IMAGES PER GROQ REQUEST
    #
    # If 3 images exceed the 8K TPM limit, automatically
    # split the batch into smaller batches.
    # ========================================================

    BATCH_SIZE = 3

    pending_batches = []

    for start in range(
        0,
        len(image_paths),
        BATCH_SIZE
    ):

        pending_batches.append(
            image_paths[
                start:start + BATCH_SIZE
            ]
        )

    # ========================================================
    # PROCESS BATCHES
    # ========================================================

    while pending_batches:

        batch = pending_batches.pop(0)

        print(
            "Processing: "
            + ", ".join(
                image.name
                for image in batch
            )
        )

        try:

            # Build ONE request
            message = (
                build_multi_image_message(
                    batch
                )
            )

            response = invoke_with_retry(
                message
            )

            content = response.content

            if not isinstance(
                content,
                str
            ):

                content = str(content)

            content = strip_think_blocks(
                content
            )

            if not content:

                raise ValueError(
                    "Vision model returned "
                    "empty text."
                )

            batch_results = (
                parse_image_results(
                    content,
                    batch
                )
            )

            results.update(
                batch_results
            )

        except Exception as exc:

            error_text = str(exc)

            # ==================================================
            # IF REQUEST IS TOO LARGE
            #
            # Split the batch automatically.
            # ==================================================

            if (
                is_rate_limit_error(exc)
                and len(batch) > 1
            ):

                print(
                    f"Batch of "
                    f"{len(batch)} images "
                    f"is too large. "
                    f"Splitting..."
                )

                midpoint = len(batch) // 2

                first_half = batch[
                    :midpoint
                ]

                second_half = batch[
                    midpoint:
                ]

                # Process first half first
                pending_batches.insert(
                    0,
                    second_half
                )

                pending_batches.insert(
                    0,
                    first_half
                )

                continue

            # ==================================================
            # SINGLE IMAGE FAILURE
            # ==================================================

            for image_path in batch:

                results[
                    image_path.name
                ] = {
                    "status": "failed",
                    "error": error_text
                }

    # ========================================================
    # SUMMARY
    # ========================================================

    successful = [
        filename
        for filename, data
        in results.items()
        if data.get("status")
        == "success"
    ]

    failed = [
        filename
        for filename, data
        in results.items()
        if data.get("status")
        == "failed"
    ]

    return {
        "status": (
            "success"
            if not failed
            else "partial"
        ),
        "model": MODEL_NAME,
        "image_count": len(image_paths),
        "successful_count": len(
            successful
        ),
        "failed_count": len(
            failed
        ),
        "results": results
    }


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    folder = os.getenv(
        "TEST_IMAGE_FOLDER",
        str(
            SCRIPT_DIR / "harsh"
        )
    )

    try:

        results = (
            process_images_from_folder(
                folder
            )
        )

        print(
            json.dumps(
                results,
                indent=2,
                ensure_ascii=False
            )
        )

    except Exception as exc:

        print(
            json.dumps(
                {
                    "status": "failed",
                    "error": str(exc)
                },
                indent=2,
                ensure_ascii=False
            )
        )
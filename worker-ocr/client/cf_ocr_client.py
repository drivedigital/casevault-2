"""
Cloudflare Workers AI OCR Client
Model: @cf/meta/llama-3.2-11b-vision-instruct
"""

import os
import sys
import json
import base64
import argparse
import subprocess
import tempfile
from pathlib import Path
from typing import Dict, Any, Optional, Union
import requests

DEFAULT_OCR_ENDPOINT = os.getenv("CF_OCR_ENDPOINT", "http://localhost:8787")

def convert_pdf_page_to_png(pdf_path: Union[str, Path], page_num: int = 1) -> bytes:
    """
    Converts a single PDF page into PNG bytes.
    Uses macOS native `sips` tool (zero extra dependencies).
    """
    pdf_path = Path(pdf_path).resolve()
    if not pdf_path.exists():
        raise FileNotFoundError(f"PDF file not found: {pdf_path}")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_png = Path(tmpdir) / f"page_{page_num}.png"
        # macOS sips command
        cmd = ["sips", "-s", "format", "png", str(pdf_path), "--out", str(out_png)]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode != 0 or not out_png.exists():
            raise RuntimeError(f"sips conversion failed: {res.stderr}")
        return out_png.read_bytes()

def call_ocr_worker(
    image_data: Union[bytes, str, Path],
    endpoint_url: str = DEFAULT_OCR_ENDPOINT,
    mode: str = "markdown",
    custom_prompt: Optional[str] = None,
    max_tokens: int = 4096,
    temperature: float = 0.1,
    auth_token: Optional[str] = None,
    as_structured: bool = False,
) -> Dict[str, Any]:
    """
    Calls the Cloudflare OCR Worker with image bytes or base64.
    """
    # 1. Resolve image bytes
    if isinstance(image_data, (str, Path)):
        p = Path(image_data)
        if p.suffix.lower() == ".pdf":
            raw_bytes = convert_pdf_page_to_png(p, page_num=1)
        elif p.exists():
            raw_bytes = p.read_bytes()
        elif image_data.startswith("http://") or image_data.startswith("https://"):
            res = requests.get(image_data)
            res.raise_for_status()
            raw_bytes = res.content
        else:
            raise ValueError(f"Invalid image path or URL: {image_data}")
    elif isinstance(image_data, bytes):
        raw_bytes = image_data
    else:
        raise TypeError(f"Unsupported image_data type: {type(image_data)}")

    # 2. Select endpoint path
    base_url = endpoint_url.rstrip("/")
    if as_structured or mode == "structured":
        target_url = f"{base_url}/ocr/structured"
    elif mode == "table":
        target_url = f"{base_url}/ocr/table"
    else:
        target_url = f"{base_url}/ocr"

    # 3. Headers
    headers = {
        "Content-Type": "image/png",
    }
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"

    # 4. Query params for tuning
    params = {
        "mode": mode,
        "max_tokens": str(max_tokens),
        "temperature": str(temperature),
    }
    if custom_prompt:
        params["prompt"] = custom_prompt

    resp = requests.post(target_url, headers=headers, params=params, data=raw_bytes, timeout=120)
    if resp.status_code != 200:
        try:
            err_data = resp.json()
            raise RuntimeError(f"OCR Worker Error ({resp.status_code}): {err_data.get('error', resp.text)}")
        except json.JSONDecodeError:
            raise RuntimeError(f"OCR Worker Error ({resp.status_code}): {resp.text}")

    return resp.json()

def agree_to_license(endpoint_url: str = DEFAULT_OCR_ENDPOINT, auth_token: Optional[str] = None) -> Dict[str, Any]:
    """
    Calls POST /agree on the worker to accept Meta License terms.
    """
    base_url = endpoint_url.rstrip("/")
    headers = {}
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    resp = requests.post(f"{base_url}/agree", headers=headers, timeout=60)
    return resp.json()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Cloudflare Llama-3.2-11b Vision OCR Client")
    parser.add_argument("image_path", help="Path to image (PNG/JPEG) or PDF file")
    parser.add_argument("--page", type=int, default=1, help="Page number if input is PDF (default: 1)")
    parser.add_argument("--mode", choices=["markdown", "plain", "structured", "table"], default="markdown", help="OCR output mode")
    parser.add_argument("--endpoint", default=DEFAULT_OCR_ENDPOINT, help="Cloudflare Worker endpoint URL")
    parser.add_argument("--tokens", type=int, default=4096, help="Max output tokens")
    parser.add_argument("--agree", action="store_true", help="Send Meta license agreement request")
    args = parser.parse_args()

    if args.agree:
        print("Sending Meta license agreement to worker...")
        res = agree_to_license(args.endpoint)
        print(json.dumps(res, indent=2))
        sys.exit(0)

    print(f"Running OCR on: {args.image_path} (mode={args.mode}) via {args.endpoint}...")
    try:
        if args.image_path.lower().endswith(".pdf"):
            print(f"Converting PDF page {args.page} to PNG image...")
            img_bytes = convert_pdf_page_to_png(args.image_path, args.page)
        else:
            img_bytes = Path(args.image_path).read_bytes()

        result = call_ocr_worker(
            img_bytes,
            endpoint_url=args.endpoint,
            mode=args.mode,
            max_tokens=args.tokens,
            as_structured=(args.mode == "structured")
        )
        print("\n--- OCR Result ---")
        if "structured" in result and result["structured"]:
            print(json.dumps(result["structured"], indent=2))
        else:
            print(result.get("text", ""))

        meta = result.get("metadata", {})
        print(f"\n[Completed in {meta.get('processingTimeMs', 0)}ms | Size: {meta.get('imageSizeBytes', 0)} bytes]")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

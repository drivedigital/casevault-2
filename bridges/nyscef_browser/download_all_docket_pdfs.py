"""
Batch Downloader for NYSCEF Case 450551/2025 Docket Documents
Uses Cloudflare Browser Run with same-origin in-page fetch.
"""

import os
import re
import sys
import time
import json
import base64
import subprocess
from pathlib import Path
from typing import Dict, Any, List
from playwright.sync_api import sync_playwright, Browser, Page

def load_env_local():
    env_path = Path(__file__).resolve().parent.parent / ".env.local"
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    key = key.strip()
                    val = val.strip().strip("'\"")
                    if key not in os.environ:
                        os.environ[key] = val

def close_all_browser_sessions(account_id: str, api_token: str):
    try:
        env = os.environ.copy()
        env["CLOUDFLARE_API_TOKEN"] = api_token
        env["CLOUDFLARE_ACCOUNT_ID"] = account_id
        res = subprocess.run(["npx", "wrangler", "browser", "list"], capture_output=True, text=True, env=env)
        session_ids = re.findall(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", res.stdout)
        for sid in session_ids:
            subprocess.run(["npx", "wrangler", "browser", "close", sid], capture_output=True, env=env)
    except Exception:
        pass

def sanitize_filename(text: str) -> str:
    # Remove newlines, non-alphanumeric (keep underscores and dashes)
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"\s+", "_", text.strip())
    return text[:60]

def main():
    load_env_local()
    account_id = os.getenv("CLOUDFLARE_ACCOUNT_ID", "2eb39046954b68cb7fb92ce98a6679b4")
    api_token = os.getenv("CLOUDFLARE_API_TOKEN")

    if not api_token:
        print("[!] Error: CLOUDFLARE_API_TOKEN is required.")
        sys.exit(1)

    json_path = Path(__file__).resolve().parent / "nyscef_450551_2025_results.json"
    if not json_path.exists():
        print(f"[!] Results JSON not found at {json_path}")
        sys.exit(1)

    with open(json_path, "r", encoding="utf-8") as f:
        docket_data = json.load(f)

    entries: List[Dict[str, Any]] = docket_data.get("entries", [])
    print(f"[*] Loaded {len(entries)} docket entries from {json_path.name}")

    output_dir = Path(__file__).resolve().parent / "downloads" / "450551_2025"
    output_dir.mkdir(parents=True, exist_ok=True)

    # Filter entries that have a PDF URL
    pdf_entries = [e for e in entries if e.get("pdf_url")]
    print(f"[*] {len(pdf_entries)} documents available to download.")

    target_url = docket_data.get(
        "source_url",
        "https://iapps.courts.state.ny.us/nyscef/DocumentList?docketId=ecI11XOsbEkeyrYFYND8Xg==&display=all&courtType=New%20York%20County%20Supreme%20Court&resultsPageNum=1"
    )

    close_all_browser_sessions(account_id, api_token)

    endpoint = f"wss://api.cloudflare.com/client/v4/accounts/{account_id}/browser-rendering/devtools/browser?keep_alive=600000"
    headers = {"Authorization": f"Bearer {api_token}"}

    start_time = time.time()
    downloaded_count = 0
    skipped_count = 0
    failed_count = 0

    print("=" * 70)
    print(" BATCH DOWNLOADING ALL NYSCEF 450551/2025 DOCKET DOCUMENTS ")
    print("=" * 70)

    with sync_playwright() as p:
        print("[*] Connecting to Cloudflare Browser Run via CDP...")
        browser: Browser = p.chromium.connect_over_cdp(endpoint, headers=headers, timeout=30000)
        page: Page = browser.new_page()

        print("[*] Loading NYSCEF DocumentList to establish authenticated session...")
        page.goto(target_url, wait_until="domcontentloaded", timeout=45000)
        print(f"[+] Loaded: {page.title()}")

        for i, entry in enumerate(pdf_entries, 1):
            raw_doc_num = entry.get("doc_number", str(i))
            doc_num_padded = raw_doc_num.zfill(3) if raw_doc_num.isdigit() else raw_doc_num
            desc_clean = sanitize_filename(entry.get("description", "document"))
            filename = f"450551_2025_doc_{doc_num_padded}_{desc_clean}.pdf"
            file_path = output_dir / filename
            pdf_url = entry["pdf_url"]

            # Check if already downloaded
            if file_path.exists() and file_path.stat().st_size > 1000:
                # Quick verify magic bytes
                with open(file_path, "rb") as f_check:
                    if f_check.read(5) == b"%PDF-":
                        print(f"[{i:02d}/{len(pdf_entries)}] SKIP (already exists): {filename} ({file_path.stat().st_size} bytes)")
                        skipped_count += 1
                        continue

            print(f"[{i:02d}/{len(pdf_entries)}] Downloading Doc #{raw_doc_num} -> {filename}...")
            t_req = time.time()
            data_res = page.evaluate("""async (url) => {
                try {
                    const resp = await fetch(url);
                    if (!resp.ok) return { status: resp.status, error: "HTTP " + resp.status };
                    const blob = await resp.blob();
                    return new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve({ status: 200, data: reader.result });
                        reader.onerror = () => reject(new Error("FileReader failed"));
                        reader.readAsDataURL(blob);
                    });
                } catch (e) {
                    return { status: 500, error: e.message };
                }
            }""", pdf_url)

            elapsed_req = time.time() - t_req

            if data_res.get("status") == 200 and data_res.get("data"):
                raw_b64 = data_res["data"].split("base64,")[1]
                pdf_bytes = base64.b64decode(raw_b64)
                if pdf_bytes.startswith(b"%PDF-"):
                    with open(file_path, "wb") as f_out:
                        f_out.write(pdf_bytes)
                    print(f"       -> OK! {len(pdf_bytes):,} bytes ({elapsed_req:.2f}s)")
                    downloaded_count += 1
                else:
                    print(f"       -> [!] Error: Payload does not start with %PDF- ({len(pdf_bytes)} bytes)")
                    failed_count += 1
            else:
                print(f"       -> [!] Error fetching: {data_res.get('error')}")
                failed_count += 1

            # Friendly 200ms throttle to prevent server-side rate limiting
            time.sleep(0.2)

        browser.close()

    total_elapsed = time.time() - start_time
    total_minutes = total_elapsed / 60.0

    print("=" * 70)
    print(" DOWNLOAD SUMMARY ")
    print("=" * 70)
    print(f"Total Documents Processed: {len(pdf_entries)}")
    print(f"Successfully Downloaded:   {downloaded_count}")
    print(f"Already Cached (Skipped):  {skipped_count}")
    print(f"Failed:                    {failed_count}")
    print(f"Destination Directory:     {output_dir}")
    print(f"Elapsed Time:              {total_elapsed:.1f}s ({total_minutes:.2f} browser minutes)")
    print(f"Daily Allowance Remaining: ~{max(0.0, 10.0 - total_minutes):.2f} / 10.0 minutes")
    print("=" * 70)

    # Clean up Cloudflare remote sessions
    close_all_browser_sessions(account_id, api_token)

if __name__ == "__main__":
    main()

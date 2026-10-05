"""
Cloudflare Browser Run — NYSCEF Docket Acquisition Experiment
Target Case: 450551/2025
Target URL: https://iapps.courts.state.ny.us/nyscef/DocumentList?docketId=ecI11XOsbEkeyrYFYND8Xg==&display=all&courtType=New%20York%20County%20Supreme%20Court&resultsPageNum=1

Experiment objectives:
1. Connect to Cloudflare Browser Run (remote Playwright via CDP).
2. Navigate to the observed live NYSCEF docket URL.
3. Detect court gate / Cloudflare Turnstile challenge:
   - Pause execution and alert operator.
   - Provide Live View URL for human solving.
   - Resume once the document table is detected.
4. Capture all observed pagination and docket entries.
5. Retrieve the original filing PDF responses and verify PDF integrity.
6. Measure browser duration against the 10 min/day free tier budget.
"""

import os
import sys
import time
import json
import argparse
from pathlib import Path
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup
from playwright.sync_api import sync_playwright, Page, BrowserContext, Browser

# Target Defaults
DEFAULT_CASE = "450551/2025"
DEFAULT_URL = (
    "https://iapps.courts.state.ny.us/nyscef/DocumentList?"
    "docketId=ecI11XOsbEkeyrYFYND8Xg==&display=all&"
    "courtType=New%20York%20County%20Supreme%20Court&resultsPageNum=1"
)
DEFAULT_ACCOUNT_ID = os.getenv("CLOUDFLARE_ACCOUNT_ID", "2eb39046954b68cb7fb92ce98a6679b4")

def load_env_local():
    """Load variables from .env.local if present."""
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

def is_gate_present(page: Page) -> bool:
    """
    Detects if the page is currently on a Cloudflare challenge, Turnstile, or NYSCEF gate.
    """
    try:
        title = page.title().lower()
        content = page.content().lower()

        # Cloudflare challenge indicators
        if "just a moment" in title or "attention required" in title:
            return True
        if "cf-mitigated" in content or "turnstile" in content or "challenges.cloudflare.com" in content:
            # Check if actual docket table is already rendered despite challenge scripts
            if page.locator("table#tblDocumentList, table.docketTable, table.docket_table").count() > 0:
                return False
            return True
        if "verify you are human" in content or "security check" in content:
            return True

        # Check if docket content is visible
        docket_table = page.locator("table#tblDocumentList, table.docketTable, tr.docketRow")
        if docket_table.count() > 0:
            return False

        # If page has very little content or error
        if len(content) < 1500 and "iapps" in page.url:
            return True

        return False
    except Exception:
        return False

def get_live_view_url(account_id: str, api_token: str) -> Optional[str]:
    """
    Retrieves the direct Live View URL using wrangler browser view --json.
    """
    import subprocess
    try:
        env = os.environ.copy()
        env["CLOUDFLARE_API_TOKEN"] = api_token
        env["CLOUDFLARE_ACCOUNT_ID"] = account_id
        res = subprocess.run(["npx", "wrangler", "browser", "view", "--json"], capture_output=True, text=True, env=env)
        if res.returncode == 0 and res.stdout.strip():
            data = json.loads(res.stdout.strip())
            if isinstance(data, dict):
                return data.get("devtoolsFrontendUrl")
            elif isinstance(data, list) and len(data) > 0:
                return data[0].get("devtoolsFrontendUrl")
    except Exception:
        pass
    return None

def close_all_browser_sessions(account_id: str, api_token: str):
    """
    Cleans up any running Browser Run sessions to protect daily minute limits.
    """
    import subprocess
    import re
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

def wait_for_court_gate_clear(page: Page, timeout_sec: int = 300) -> bool:
    """
    Polls the page until the court gate/challenge is resolved or timeout expires.
    """
    print(f"[*] Pausing automation. Waiting up to {timeout_sec}s for human completion in Live View...")
    start_wait = time.time()
    last_print = 0
    while time.time() - start_wait < timeout_sec:
        time.sleep(2)
        elapsed = int(time.time() - start_wait)
        if elapsed - last_print >= 10:
            print(f"[*] Waiting for challenge solve... ({elapsed}s elapsed, up to {timeout_sec}s)")
            last_print = elapsed

        try:
            # Check common NYSCEF table selectors or document links
            has_table = page.locator("table#tblDocumentList, table.docketTable, tr.docketRow, a[href*='ViewDocument']").count() > 0
            if has_table:
                print("[+] Court gate resolved! Docket table detected.")
                return True

            title = page.title().lower()
            if "just a moment" not in title and "document" in title:
                print(f"[+] Page title updated to: '{page.title()}'. Re-checking table...")
                page.wait_for_load_state("domcontentloaded", timeout=5000)
                return True
        except Exception:
            pass

    print("[-] Timed out waiting for human to clear the court gate.")
    return False

def parse_docket_page(html_content: str, base_url: str) -> Dict[str, Any]:
    """
    Parses docket rows, case metadata, and pagination links from NYSCEF DocumentList HTML.
    """
    soup = BeautifulSoup(html_content, "html.parser")
    result: Dict[str, Any] = {
        "metadata": {},
        "entries": [],
        "pagination": {
            "current_page": 1,
            "total_pages": 1,
            "next_page_url": None,
        }
    }

    # Extract Case Metadata (Caption, Index Number, Court, Judge)
    caption_elem = soup.find(id="lblCaseCaption") or soup.find(class_="caseCaption")
    if caption_elem:
        result["metadata"]["caption"] = caption_elem.get_text(strip=True)

    index_elem = soup.find(id="lblIndexNo") or soup.find(class_="indexNo")
    if index_elem:
        result["metadata"]["index_number"] = index_elem.get_text(strip=True)

    # Find table containing documents
    # NYSCEF DocumentList typically uses a table with id tblDocumentList or rows with specific classes
    tables = soup.find_all("table")
    docket_table = None
    for t in tables:
        if t.find("th", string=lambda s: s and ("Doc #" in s or "Document #" in s or "Doc" in s)):
            docket_table = t
            break
        if "documentlist" in str(t.get("id", "")).lower() or "docket" in str(t.get("class", "")).lower():
            docket_table = t
            break

    if not docket_table and tables:
        # Fallback to largest table
        docket_table = max(tables, key=lambda t: len(t.find_all("tr")))

    if docket_table:
        rows = docket_table.find_all("tr")
        for row in rows:
            cols = row.find_all(["td", "th"])
            # Skip header row
            if not cols or row.find("th"):
                continue

            text_cols = [c.get_text(strip=True) for c in cols]
            if len(text_cols) >= 3:
                # Find PDF download link in any column
                pdf_link = None
                for a in row.find_all("a", href=True):
                    href = a["href"]
                    if "ViewDocument" in href or "docIndex" in href or href.endswith(".pdf"):
                        pdf_link = href if href.startswith("http") else f"https://iapps.courts.state.ny.us/nyscef/{href.lstrip('/')}"
                        break

                entry = {
                    "raw_columns": text_cols,
                    "doc_number": text_cols[0] if text_cols else "",
                    "description": text_cols[1] if len(text_cols) > 1 else "",
                    "doc_type": text_cols[2] if len(text_cols) > 2 else "",
                    "filed_date": text_cols[3] if len(text_cols) > 3 else "",
                    "pdf_url": pdf_link,
                }
                result["entries"].append(entry)

    # Detect pagination controls
    # Look for page links like resultsPageNum=2 or 'Next' links
    next_link = soup.find("a", string=lambda s: s and ("next" in s.lower() or ">" in s))
    if next_link and next_link.get("href"):
        href = next_link["href"]
        result["pagination"]["next_page_url"] = href if href.startswith("http") else f"https://iapps.courts.state.ny.us/nyscef/{href.lstrip('/')}"

    page_inputs = soup.find_all(["input", "select"], id=lambda s: s and "page" in s.lower())
    for inp in page_inputs:
        val = inp.get("value")
        if val and val.isdigit():
            result["pagination"]["current_page"] = int(val)

    return result

def run_experiment(
    account_id: str,
    api_token: str,
    target_url: str = DEFAULT_URL,
    keep_alive_sec: int = 600,
    download_dir: Optional[str] = None
):
    """
    Executes the Browser Run docket acquisition experiment.
    """
    output_dir = Path(download_dir or Path(__file__).resolve().parent / "downloads")
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=" * 70)
    print(" Cloudflare Browser Run — NYSCEF Docket Acquisition Experiment ")
    print("=" * 70)
    print(f"Target URL: {target_url}")
    print(f"Account ID: {account_id}")
    print(f"Keep-Alive: {keep_alive_sec}s (10 min max)")
    print(f"Daily free allowance tracking active (10 browser min/day)")
    print("-" * 70)

    # Construct Cloudflare CDP Endpoint
    cdp_endpoint = (
        f"wss://api.cloudflare.com/client/v4/accounts/{account_id}/"
        f"browser-rendering/devtools/browser?keep_alive={keep_alive_sec * 1000}"
    )

    headers = {
        "Authorization": f"Bearer {api_token}",
    }

    start_time = time.time()
    all_entries = []
    metadata = {}

    with sync_playwright() as p:
        print("[*] Connecting over CDP to Cloudflare Browser Run...")
        try:
            browser: Browser = p.chromium.connect_over_cdp(
                cdp_endpoint,
                headers=headers,
                timeout=60000
            )
        except Exception as e:
            # Also try alternative path 'browser-run'
            print(f"[!] Primary endpoint failed ({e}). Trying fallback path /browser-run/...")
            alt_endpoint = (
                f"wss://api.cloudflare.com/client/v4/accounts/{account_id}/"
                f"browser-run/devtools/browser?keep_alive={keep_alive_sec * 1000}"
            )
            browser = p.chromium.connect_over_cdp(
                alt_endpoint,
                headers=headers,
                timeout=60000
            )

        print("[+] Successfully connected to Cloudflare Browser Run instance!")
        contexts = browser.contexts
        context: BrowserContext = contexts[0] if contexts else browser.new_context()
        page: Page = context.pages[0] if context.pages else context.new_page()

        # Provide Live View dashboard information
        live_view_dash = f"https://dash.cloudflare.com/{account_id}/workers-and-pages/browser-rendering"
        print(f"[*] Cloudflare Live View Dashboard: {live_view_dash}")
        print("    (You can view and interact with this live session in your browser)")

        current_url = target_url
        page_num = 1

        while current_url:
            print(f"\n[*] Navigating to page {page_num}: {current_url}")
            page.goto(current_url, wait_until="domcontentloaded", timeout=45000)
            time.sleep(2)

            # Check for Court Gate / Cloudflare Turnstile
            if is_gate_present(page):
                direct_live_url = get_live_view_url(account_id, api_token)
                screenshot_gate = output_dir / "gate_detected.png"
                try:
                    page.screenshot(path=str(screenshot_gate))
                except Exception:
                    pass

                print("\n" + "!" * 70)
                print("[!] COURT GATE / CLOUDFLARE CHALLENGE DETECTED!")
                if direct_live_url:
                    print(f"[!] DIRECT LIVE VIEW LINK (Click to solve):")
                    print(f"    {direct_live_url}")
                print(f"[!] Cloudflare Live Sessions Dashboard:")
                print(f"    {live_view_dash}")
                print(f"[!] Gate screenshot saved to: {screenshot_gate}")
                print("!" * 70 + "\n")

                resolved = wait_for_court_gate_clear(page, timeout_sec=300)
                if not resolved:
                    print("[-] ABORTING: Court gate was not cleared. Will not produce an empty docket.")
                    break
                else:
                    screenshot_loaded = output_dir / "docket_loaded.png"
                    try:
                        page.screenshot(path=str(screenshot_loaded))
                        print(f"[+] Post-gate screenshot saved to: {screenshot_loaded}")
                    except Exception:
                        pass

            # Capture HTML content
            html = page.content()
            parsed = parse_docket_page(html, current_url)

            if parsed["metadata"]:
                metadata.update(parsed["metadata"])

            page_entries = parsed["entries"]
            print(f"[+] Page {page_num}: Extracted {len(page_entries)} docket entries.")
            all_entries.extend(page_entries)

            # Handle pagination
            next_url = parsed["pagination"].get("next_page_url")
            if next_url and next_url != current_url and len(page_entries) > 0:
                current_url = next_url
                page_num += 1
            else:
                current_url = None

        # Step 5: Retrieve Original Filing PDF
        pdf_downloaded = False
        pdf_path = None
        if all_entries:
            # Find the original filing (Doc #1 or first filing with a PDF link)
            target_entry = None
            for entry in all_entries:
                if entry.get("doc_number") == "1" and entry.get("pdf_url"):
                    target_entry = entry
                    break
            if not target_entry:
                for entry in all_entries:
                    if entry.get("pdf_url"):
                        target_entry = entry
                        break

            if target_entry and target_entry.get("pdf_url"):
                pdf_url = target_entry["pdf_url"]
                doc_num = target_entry.get("doc_number", "doc_1")
                try:
                    # Target the exact ViewDocument anchor by docIndex
                    if "docIndex=" in pdf_url:
                        doc_index = pdf_url.split("docIndex=")[-1]
                        doc_link = page.locator(f"a[href*='{doc_index}']").first
                    else:
                        doc_link = page.locator(f"a[href*='ViewDocument']:has-text('{doc_num}')").first

                    with page.expect_popup() as popup_info:
                        doc_link.click()
                    popup = popup_info.value
                    popup.wait_for_load_state()

                    data_base64 = popup.evaluate("""async () => {
                        const resp = await fetch(window.location.href);
                        const blob = await resp.blob();
                        return new Promise((resolve, reject) => {
                            const reader = new FileReader();
                            reader.onloadend = () => resolve(reader.result);
                            reader.onerror = reject;
                            reader.readAsDataURL(blob);
                        });
                    }""")

                    if data_base64 and "base64," in data_base64:
                        import base64
                        raw_b64 = data_base64.split("base64,")[1]
                        pdf_bytes = base64.b64decode(raw_b64)
                        if pdf_bytes.startswith(b"%PDF-"):
                            pdf_path = output_dir / f"NYSCEF_450551_2025_doc_{doc_num}.pdf"
                            with open(pdf_path, "wb") as f:
                                f.write(pdf_bytes)
                            print(f"[+] Original filing PDF successfully retrieved! ({len(pdf_bytes)} bytes)")
                            print(f"[+] Saved to: {pdf_path}")
                            pdf_downloaded = True
                        else:
                            print(f"[-] Data did not start with %PDF- (length {len(pdf_bytes)})")
                    else:
                        print("[-] Could not extract base64 data from popup.")
                except Exception as ex:
                    print(f"[-] PDF retrieval error: {ex}")

        # Measure duration and budget
        elapsed_sec = time.time() - start_time
        elapsed_min = elapsed_sec / 60.0

        print("\n" + "=" * 70)
        print(" EXPERIMENT SUMMARY ")
        print("=" * 70)
        print(f"Docket Case: 450551/2025")
        print(f"Total Filings Captured: {len(all_entries)}")
        print(f"Total Pages Scraped: {page_num}")
        print(f"Original Filing PDF Retrieved: {'SUCCESS' if pdf_downloaded else 'NO/SKIPPED'}")
        if pdf_path:
            print(f"PDF Location: {pdf_path}")
        print(f"Browser Execution Time: {elapsed_sec:.1f}s ({elapsed_min:.2f} browser minutes)")
        print(f"Daily Allowance Remaining: ~{max(0.0, 10.0 - elapsed_min):.2f} / 10.0 minutes")
        print("=" * 70)

        # Save structured results
        result_file = Path(__file__).resolve().parent / "nyscef_450551_2025_results.json"
        with open(result_file, "w", encoding="utf-8") as f:
            json.dump({
                "case": "450551/2025",
                "source_url": target_url,
                "metadata": metadata,
                "entries_count": len(all_entries),
                "entries": all_entries,
                "pdf_retrieved": pdf_downloaded,
                "pdf_file": str(pdf_path) if pdf_path else None,
                "browser_minutes_used": round(elapsed_min, 3),
            }, f, indent=2)
        print(f"[+] Saved structured output to: {result_file}")

        browser.close()
        # Clean up any lingering remote session on Cloudflare
        close_all_browser_sessions(account_id, api_token)

if __name__ == "__main__":
    load_env_local()
    parser = argparse.ArgumentParser(description="Cloudflare Browser Run NYSCEF Experiment")
    parser.add_argument("--account-id", default=os.getenv("CLOUDFLARE_ACCOUNT_ID", DEFAULT_ACCOUNT_ID))
    parser.add_argument("--api-token", default=os.getenv("CLOUDFLARE_API_TOKEN"))
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--keep-alive", type=int, default=600)
    args = parser.parse_args()

    if not args.api_token:
        print("[!] Error: CLOUDFLARE_API_TOKEN is required.")
        print("    Set it in .env.local or pass via --api-token <token>.")
        print("    Ensure the token has 'Browser Rendering - Edit' permission in Cloudflare Dashboard.")
        sys.exit(1)

    # Ensure no lingering sessions before starting
    close_all_browser_sessions(args.account_id, args.api_token)

    run_experiment(
        account_id=args.account_id,
        api_token=args.api_token,
        target_url=args.url,
        keep_alive_sec=args.keep_alive
    )


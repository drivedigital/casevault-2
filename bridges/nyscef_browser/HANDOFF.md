# Handoff: NYSCEF Docket Acquisition via Cloudflare Browser Run

**Target Case**: NYSCEF `450551/2025`  
**Court**: New York County Supreme Court  
**Observed Live Docket URL**: `https://iapps.courts.state.ny.us/nyscef/DocumentList?docketId=ecI11XOsbEkeyrYFYND8Xg==&display=all&courtType=New%20York%20County%20Supreme%20Court&resultsPageNum=1`  
**Execution Date**: 2026-10-04  
**Source Repository**: `drivedigital/docket-key`

---

## 1. Executive Summary

This handoff packages the findings, implementation scripts, parsed docket dataset, and 100% of acquired PDF documents (72 filings, 27 MB) for NYSCEF Case `450551/2025` executed via **Cloudflare Browser Run** (formerly Browser Rendering) over the Chrome DevTools Protocol (CDP).

### Key Accomplishments
1. **Automated Docket Ingestion**: Successfully extracted all 72 docket rows, document types, descriptions, filing dates, and document URLs in **7.0 seconds** (0.12 browser minutes).
2. **Complete Document Retrieval**: Batch-downloaded all 72 docket PDFs (Doc #1 through Doc #72) totaling **27 MB** in **48.0 seconds** (0.80 browser minutes) with zero failures.
3. **Budget Compliance**: Total Cloudflare Browser Run duration across both operations was **~0.92 browser minutes**, leaving **~9.08 minutes** of the 10.0-minute daily free tier allowance intact.
4. **Court Gate Architecture**: Implemented automated court-gate / Cloudflare Turnstile detection with human-in-the-loop pause and direct **Live View** inspection links (`https://live.browser.run/ui/view?...`).

---

## 2. Critical Technical Discoveries & Operational Facts

### A. NYSCEF Edge Protection vs. Direct Docket Navigation
* Direct HTTP GET requests (`curl`, Python `requests`) to NYSCEF URLs receive `HTTP/2 403 Forbidden` with header `cf-mitigated: challenge`, pointing to `https://challenges.cloudflare.com` (Cloudflare Turnstile).
* However, when Cloudflare Browser Run connects via headless Chromium to an **observed live docket URL** (`DocumentList?docketId=...`), NYSCEF serves the full docket page immediately **without triggering an interactive captcha**.
* *Takeaway*: Routine docket refreshes using internal `docketId` keys can run unattended in Cloudflare Browser Run without human intervention.

### B. Overcoming the HTTP 403 on PDF Downloads
* Direct API calls via Playwright's headless request client (`context.request.get(pdf_url)`) failed with `HTTP 403 Forbidden` because NYSCEF validates browser-level navigation headers (`Sec-Fetch-Dest`, `Sec-Fetch-Mode`) and session cookies.
* Attempting to spawn separate popup tabs for each document resulted in slow execution and timeout risks.
* **The Breakthrough**: Because the `DocumentList` page and `ViewDocument` endpoints are on the exact same origin (`https://iapps.courts.state.ny.us`), running an in-page fetch inside the DOM (`page.evaluate`) carries all authenticated cookies and Cloudflare clearance automatically:
  ```javascript
  const resp = await fetch(url);
  const blob = await resp.blob();
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  ```
  This allowed sequential, in-page extraction at **~0.3–0.5 seconds per PDF**, downloading the entire 72-document case record in just 48 seconds.

### C. Cloudflare Browser Run Session Concurrency & Rate Limiting
* Cloudflare Browser Run enforces strict concurrency limits on the free tier (1-2 concurrent sessions). If a session is open with `keep_alive`, creating another session immediately fails with:
  `429 Too Many Requests: {"code":1001,"message":"Rate limit exceeded"}`
* Calling `browser.close()` in Playwright only disconnects the CDP WebSocket client; it does **not** terminate the remote session if `keep_alive` was specified.
* To prevent session leaks and wasted budget minutes, every run must explicitly query active sessions and close them using Wrangler CLI or REST API:
  ```python
  session_ids = re.findall(r"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", res.stdout)
  for sid in session_ids:
      subprocess.run(["npx", "wrangler", "browser", "close", sid], capture_output=True, env=env)
  ```

---

## 3. Package File Manifest

```
handoff_nyscef_browser_run/
├── HANDOFF.md                          # This master technical handoff document
├── cf_browser_nyscef.py                # Standalone runner: docket scrape + gate detection + Live View
├── download_all_docket_pdfs.py         # High-throughput batch PDF downloader via in-page fetch
├── nyscef_450551_2025_results.json     # Complete 72-row docket manifest and metadata
└── downloads/
    └── 450551_2025/                    # 72 downloaded filing PDFs (27 MB total)
        ├── 450551_2025_doc_001_SUMMONS_COMPLAINT.pdf
        ├── 450551_2025_doc_002_NO_FEE_AUTHORIZATION_LETTERORDERAFFIRMATION.pdf
        ├── 450551_2025_doc_003_ORDER_TO_SHOW_CAUSE_PROPOSEDMotion_001_Corrected.pdf
        ...
        └── 450551_2025_doc_072_SUBSTITUTION_OF_ATTORNEY_POST_RJI.pdf
```

---

## 4. How to Run / Reproduce

### Prerequisites
* Python 3.10+
* `playwright`, `beautifulsoup4`, `requests`
* Cloudflare Wrangler CLI (`wrangler` installed globally or via `npx`)

### Environment Variables
Set in `.env.local` or environment:
```bash
CLOUDFLARE_ACCOUNT_ID=2eb39046954b68cb7fb92ce98a6679b4
CLOUDFLARE_API_TOKEN=<token_with_browser_rendering_edit_permission>
```

### Execution Commands
1. **Scrape Docket & Metadata (with Challenge Detection)**:
   ```bash
   python3 cf_browser_nyscef.py
   ```
   *Outputs*: `nyscef_450551_2025_results.json` and `NYSCEF_450551_2025_doc_1.pdf`.

2. **Batch-Download All Docket PDFs**:
   ```bash
   python3 download_all_docket_pdfs.py
   ```
   *Outputs*: Downloads all PDFs into `downloads/450551_2025/`.

---

## 5. Next Steps for Incoming Agent (Architecture Integration)

As documented in `BUILD_SPEC.md` (v4.0) for `docket-key` / `drivedigital/casevault`:
1. **Ingest to Supabase Postgres (`docket.entries`)**:
   Map the 72 entries in `nyscef_450551_2025_results.json` into `docket.entries` with `source_system = 'nyscef'` and natural key `(matter_id, doc_number)`.
2. **Canonical Storage in Cloudflare R2**:
   Upload the acquired PDF files from `downloads/450551_2025/` to R2 bucket at `sources/{matter_id}/{sha256}.pdf`.
3. **Text Extraction & OCR Pipeline**:
   Audit the text layer of each PDF (e.g. Doc 1 has 20 native text pages); route scanned exhibits to Document AI / Cloudflare Workers OCR, writing layout tokens and bounding boxes to `source_pages.layout_json`.
4. **Index into Cloudflare AI Search**:
   Embed extracted text via `google-ai-studio/gemini-embedding-001` (`VECTOR(1536)`) for hybrid semantic + lexical search.

# Docket-Key OCR Worker
### Multimodal OCR Processing with `@cf/meta/llama-3.2-11b-vision-instruct`

This Cloudflare Worker provides high-accuracy OCR (Optical Character Recognition) and legal document transcription using Meta's multimodal **Llama 3.2 11B Vision Instruct** model on Cloudflare Workers AI.

---

## Features

- **Direct Workers AI Binding**: Uses `env.AI` native binding without requiring external API calls or outbound egress.
- **Multimodal Document Processing**: Transcribes high-resolution scans, photographed filings, stamps, and complex layouts.
- **Multiple Extraction Modes**:
  - `markdown` (default): Preserves document layout, captions, headings, and paragraph boundaries.
  - `structured`: Extracts structured JSON (`court`, `index_or_docket_number`, `document_title`, `filing_date`, `parties`, `full_text`).
  - `plain`: Clean raw text without markdown decorators.
  - `table`: Transcribes tables into GitHub-flavored Markdown tables.
- **Flexible Input Formats**:
  - Raw binary image stream (`image/png`, `image/jpeg`, `image/webp`).
  - Multipart form upload (`multipart/form-data` with `file` or `image` field).
  - JSON payload with Base64-encoded string (`image`) or remote URL (`imageUrl`).
- **Meta License Automation**: Built-in `/agree` endpoint to accept Meta's Terms of Service and Acceptable Use Policy.
- **Zero-Dependency PDF Conversion**: Integrates with `scraper/cf_ocr_client.py` using macOS `sips` for instant PDF-to-image extraction.

---

## Directory Structure

```
worker/
├── package.json              # Worker scripts & types
├── tsconfig.json             # TypeScript configuration
├── wrangler.jsonc            # Cloudflare Worker & Workers AI configuration
└── src/
    ├── index.ts              # Request routing, CORS, secret authorization
    ├── ocr.ts                # Model invocation & response normalization
    ├── prompts.ts            # Specialized system prompts for legal & tabular OCR
    ├── types.ts              # TypeScript interfaces
    └── utils.ts              # Body parsers (binary, multipart, JSON) & CORS
```

---

## Getting Started

### 1. One-Time Meta License Agreement
Meta requires an initial agreement before using Llama 3.2 Vision. You can trigger this through the worker:

```bash
# Via curl to your deployed worker (or local dev):
curl -X POST http://localhost:8787/agree

# Or via Python client:
python scraper/cf_ocr_client.py --agree
```

### 2. Local Development

Run the worker locally with Wrangler:
```bash
npm run worker:dev
# Or from the worker directory:
cd worker && npx wrangler dev
```

### 3. Deploy to Cloudflare Workers

Deploy the worker to your Cloudflare account:
```bash
npm run worker:deploy
# Or from the worker directory:
cd worker && npx wrangler deploy
```

---

## API Endpoints

### 1. Health & Discovery
`GET /` or `GET /health`
Returns worker health status and available endpoints.

### 2. Standard OCR (`POST /ocr`)
Transcribes an image into Markdown or plain text.

**Option A: Raw Binary Image**
```bash
curl -X POST "http://localhost:8787/ocr?mode=markdown" \
  -H "Content-Type: image/png" \
  --data-binary "@/path/to/scan.png"
```

**Option B: Multipart Form Upload**
```bash
curl -X POST http://localhost:8787/ocr \
  -F "file=@/path/to/scan.png" \
  -F "mode=markdown"
```

**Option C: JSON with Base64**
```bash
curl -X POST http://localhost:8787/ocr \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/png;base64,...",
    "mode": "markdown",
    "max_tokens": 4096,
    "temperature": 0.1
  }'
```

**Response Format**:
```json
{
  "success": true,
  "text": "# SUPREME COURT OF THE STATE OF NEW YORK\nCOUNTY OF NEW YORK\n...",
  "metadata": {
    "model": "@cf/meta/llama-3.2-11b-vision-instruct",
    "mode": "markdown",
    "imageSizeBytes": 87040,
    "processingTimeMs": 1420
  }
}
```

---

### 3. Structured Legal OCR (`POST /ocr/structured`)
Analyzes court filing pages and extracts structured case metadata:

```bash
curl -X POST http://localhost:8787/ocr/structured \
  -H "Content-Type: image/png" \
  --data-binary "@/path/to/complaint_page_1.png"
```

**Response Format**:
```json
{
  "success": true,
  "text": "...",
  "structured": {
    "court": "Supreme Court of the State of New York, County of New York",
    "index_or_docket_number": "450551/2025",
    "document_title": "SUMMONS AND COMPLAINT",
    "filing_date": "2025-01-15",
    "parties": {
      "plaintiffs": ["People of the State of New York"],
      "defendants": ["Target Entity Corp."]
    },
    "full_text": "..."
  },
  "metadata": { ... }
}
```

---

## Python Ingestion Client

A ready-to-use Python client is included in [`scraper/cf_ocr_client.py`](../scraper/cf_ocr_client.py). It seamlessly processes image files or converts PDF pages automatically:

```bash
# OCR a scanned image
python scraper/cf_ocr_client.py ./path/to/page.png

# OCR page 1 of a court filing PDF
python scraper/cf_ocr_client.py scraper/downloads/NYSCEF_450551_2025_doc_1.pdf --page 1

# Structured extraction of legal metadata
python scraper/cf_ocr_client.py scraper/downloads/NYSCEF_450551_2025_doc_1.pdf --mode structured
```

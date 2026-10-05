# Hosted document-processing pilot

Implemented October 4, 2026. Public viewing remains enabled. Owner Google sign-in or the trusted workspace machine credential is required for submissions, approval, retry, configuration changes and human acceptance. Execution/lease renewal is machine-only.

## Fixed rollout

The manifest contains ten distinct original hashes: Drive document 1007; court documents 1, 3, 4; and 510W42 uploads 152, 154, 158, 161, 167, 174. It includes digitally searchable filings/contracts, financial tables, a term sheet, and a scanned page. The immutable database manifest rejects replacement or outside-document approval. The general extraction backlog stays queued. This pilot never creates legal claims, merges identities, populates the Knowledge Graph, or delivers derivatives to NotebookLM.

One document runs at a time. Original-file limit: 50 MB. Page limit: 200. Encrypted, corrupt and oversized files pause with actionable errors. A maximum of three claims is permitted per approved run; user-requested retries preserve the approved snapshot. Expired leases recover under the same cap. A five-minute scheduled processor claims only approved `pilot_process` jobs and renews ten-minute leases. Stale results cannot update runs or document text.

## Extraction and cloud OCR

The separate, service-bound Cloudflare Worker verifies the original SHA-256, extracts embedded text with PDF.js, and copies only insufficient-text pages into single-page PDF derivatives for OCR.space. There is no Container, Python, Tesseract, local OCR, or paid OCR fallback. OCR.space's documented free endpoint has a 1 MB file limit and three-page PDF limit; this implementation sends one page, refuses derivatives above 1,000,000 bytes, and caps OCR requests at 30 pages per run. Free-service failures and quota limits pause affected pages. See [OCR.space free API documentation](https://ocr.space/ocrapi).

The extraction receipt retains original page numbers, embedded/OCR/unavailable method, engine versions and quality warnings. Content-addressed R2 receipts record derivative SHA-256 and original hash; a complete extraction cache avoids repeated OCR for subsequent requests. The document's existing text field displays the extracted text. Partial receipts remain partial, preserve usable pages, and stop AI analysis. OCR text always carries a quality-review warning; readable text is not a guarantee of correct table layout or perfect recognition.

## Agent snapshot and free-only inference

The initial OpenRouter smoke test used `nvidia/nemotron-3.5-lightning:free`. The owner subsequently authorized Gemini or direct NVIDIA alternatives; the pilot now binds a separate NVIDIA agent to `nvidia/nemotron-3.5-lightning-30b-a3b`. Previous run snapshots remain intact. An agent binds one explicit model from its provider's active models; settings can retain several active model options. Approved runs snapshot agent instructions, special document instructions, model ID, original hash and extraction version. A retry preserves this snapshot.

Before every new inference call, the app checks OpenRouter's current catalog for the exact `:free` model and zero prices for all reported pricing components. Unknown price/entitlement, unavailable models, quotas, timeouts and invalid responses pause execution. No paid provider/model fallback is allowed. A key alone does not prove free entitlement. Direct NVIDIA inference is allowed only for the explicit Nemotron model on the fixed `integrate.api.nvidia.com` prototyping endpoint: every call verifies NVIDIA’s model page still labels its free endpoint available and verifies the model catalog. This documented prototyping entitlement applies to the ten-document evaluation, not a production/backlog license. Gemini remains paused pending account-specific free-tier verification. [NVIDIA endpoint](https://build.nvidia.com/nvidia/nemotron-3.5-lightning-30b-a3b), [NVIDIA pricing/entitlement](https://docs.api.nvidia.com/nim/docs/run-anywhere). Returned usage/cost receipts are saved, and a nonzero reported cost halts the run.

Evidence is untrusted data, not agent instructions. Analysis uses bounded groups of at most 20,000 text characters, at most twelve groups, followed by summary synthesis for multi-group documents. Validated batch outputs are saved in R2 so interrupted retries can reuse completed groups. Structured facts require a source page and supporting passage. The server checks each passage against that extracted page; unmatched passages stay flagged and are excluded from supported/accepted facts. Matching a quote confirms citation location, not the truth of a document's assertion. The summary and facts remain drafts until human acceptance.

## Review and API

Individual document pages and the review queue provide the special-processing form. A saved request awaits explicit approval. Processing history shows the snapshotted model, extraction and AI states, timestamps, errors, warnings and special instructions beside the PDF. Facts link to extracted pages, which link to the corresponding original PDF page. Human acceptance/rejection is independent of processing success. Routine court-review bypass remains intact.

Workspace-scoped PostgreSQL tables: `processing_pilot`, `processing_requests`, `processing_runs`. RLS restricts the application role to this workspace. Legacy R2 processing requests migrate idempotently, keeping their prompts and waiting for approval; the old objects are preserved.

| Endpoint | Responsibility |
| --- | --- |
| `GET /api/processing/pilot` | Public manifest and run states |
| `POST /api/processing/pilot` | Trusted manifest installation and legacy request migration |
| `POST /api/processing-instructions` | Owner/trusted pending request |
| `PATCH /api/processing-instructions` | Owner/trusted explicit approval |
| `GET /api/processing/documents/:id` | Public requests, runs and extraction receipt |
| `PATCH /api/processing/runs/:id` | Owner/trusted retry or human acceptance/rejection |
| `POST /api/processing/tick` | Machine-only claim and execution |
| `PATCH /api/processing/tick` | Machine-only valid lease renewal |

## Deployment and verification

Migration: `supabase/migrations/20261004065447_processing_pilot.sql`. Processor configuration: `processor/wrangler.jsonc`. App configuration binds `PROCESSOR`; AI credentials remain in the app Worker. The processor has only the shared machine credential and OCR key, with R2/app service bindings and no public workers.dev URL. No account plan upgrade was requested. Billing/remaining account allowance could not be independently verified through the available account APIs; do not describe platform usage as proven zero cost.

Automated tests cover embedded text bypassing OCR, mixed and rotated pages, partial OCR failure, encrypted/corrupt PDFs, the page limit, pricing uncertainty, unsupported citations, expired/stale leases, and invalid extraction receipts. Live verification covers public reads, mutation authentication, duplicate approval, outside-pilot rejection, deployed extraction and price enforcement. The pilot result receipt records actual outcomes and remaining limitations. Deliberate provider outages/quota exhaustion and Worker crashes have not all been reproduced live; do not claim that unit coverage constitutes a full chaos test.

See [pilot results](processing-pilot-verification.json), [Cloudflare planning research](CLOUDFLARE_EVALUATION.md), and [deployment setup](SETUP.md). Review the fixed pilot before authorizing a larger batch.

### Observed interpretation limitation

The first successful NVIDIA smoke draft contained unsupported narrative additions (for example, service/appearance status) and interpreted a document date as a possible accrual date. Literal quote checking cannot validate those interpretations. The UI explicitly describes summaries and fact interpretations as drafts; human review must correct/reject them before acceptance. This is a material pilot finding and a reason to hold backlog expansion, even when extraction and AI execution succeed.

## Pilot outcome

All ten originals passed SHA-256 readback and have complete extraction receipts: 29 pages, of which 28 supplied usable embedded text and one required OCR. Nine documents have saved draft summaries and cited facts. Document 174 has complete OCR but malformed AI JSON and an unsupported `entity` kind; its response receipt is preserved and the run remains `needs_human`. A new schema-focused approved request or another verified-free model is the next action. No run is human-accepted, and 507 general extraction jobs remain queued. The initial OpenRouter failures remain separately visible rather than being rewritten as successes.

## Readability and provider controls follow-up

The separate mixed-scan benchmark demonstrated that v1 can accept filing headers even when the page body is scanned. New source code uses `text-first-ocrspace-body-v2` and retains v1 receipts for historical display; changing the extraction policy requires a new approval, rather than rewriting existing pilot snapshots or cache results. Provider on/off controls pause new calls while preserving credentials and model selections. These changes passed local verification/build but are not deployed because the Cloudflare integration rejected write operations. See [current implementation and planned workflow](DOCUMENT_PROCESSING_STRATEGY.md) before interpreting historical “complete” extraction as full visual coverage.

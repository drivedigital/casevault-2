# Initial build status — 2026-10-03, America/Chicago

The private repository and new Worker are provisioned. The supplied prototype was adapted to Cloudflare/Supabase and populated with verified originals and real source observations. The original prototype remains at its existing address.

## Imported corpus

| Dataset | Imported records |
| --- | ---: |
| Notion lawsuits | 25 |
| Separate 510W42 evidence collection matter | 1 |
| Notion parties and lawyers | 54 |
| Notion case-role links | 72 |
| NYSCEF dockets | 2 |
| Docket entries | 117 |
| NYSCEF PDFs | 102 |
| 510W42 legacy document associations | 404 |
| Total document associations | 506 |
| Distinct original R2 objects, across both sets | 466 |
| Durable queued extraction jobs | 506 |
| Historical NotebookLM associations/attempt receipts | 118 |

The 118 notebook receipts include one earlier failed/retried attempt beyond the previously verified 117 combined remote sources. They do not indicate 118 sources currently present in NotebookLM. No fresh notebook upload or Notion mutation was made.

## Validation

TypeScript and lint passed. Session tampering/expiry and import schema tests passed. Production dependency audit reported zero known vulnerabilities. OpenNext production build and Cloudflare deployment succeeded. Live tests verified six private pages, rejected anonymous API/file access, rejected invalid imports and cross-origin cookie mutations, verified browser session exchange and machine-only bootstrap, and confirmed a replay created zero jobs. Ten retrieved originals from both docket and legacy sets matched their stored SHA-256 receipts. The security advisor reported no findings for the initial schema.

## Remaining build work

Run extraction/OCR through a leased cloud processor, preserve derivative receipts and quality review, implement retries and dead letters, and add real search/embeddings. Reconnect NYSCEF and NotebookLM session bridges and configure any requested Drive delivery. Expand the prototype schema into the canonical evidence/actor model with reviewed matching, individual identity and permissions, and attributed audit history. The queued corpus is ready for that work; it has not been labeled OCR-complete or legally verified.

## Google sign-in update

Google OAuth through Supabase is enabled and verified for the authorized operator. The access-key browser login is retired; machine credentials remain separate. The authorized Google account completed sign-in and reached the dashboard with all 506 documents. See `GOOGLE_SIGN_IN.md` for configuration and authorization details.

## Settings and workflow update — 2026-10-04

Court filings bypass routine review, with explicit flags returning them to the queue. Knowledge Graph is a placeholder. Settings provides private credential status and model discovery for OCR.space, OpenRouter, NVIDIA, and Gemini. Provider secrets are installed in the deployed Worker. The new Gemini key passed a synthetic generation test after a temporary HTTP 503; see `SETTINGS_AND_PROVIDERS.md` and `provider-verification.json`. Extraction jobs still require a processor.

## Source controls update — 2026-10-04

Settings offers persistent active-model pills, and Drive file selection is connected. The sidebar background spans the entire document while navigation remains visible during scrolling. Ingestion and human review queues are explained separately in the app. Local source adapters and leased cloud contracts are implemented. The LT notebook completed fresh reconciliation of all 32 sources with zero uploads; both corpus plans require no new uploads. NYSCEF HTTP acquisition encountered the court access gate and paused for a supervised browser capture. This is an initial bridge implementation; automatic browser downloads, unattended hosting, Drive token refresh, and the OCR processor remain open work.

2026-10-04: Added AI Agents configuration page and document-specific special-processing prompts. Requests are durable and awaiting the processing worker. Temporary public review is enabled by owner request; document reads are public, privileged connector and execution actions remain authenticated. No credentials are exposed.

## Hosted document pilot — 2026-10-04

The separate Cloudflare processor is deployed and uses embedded text first, cloud OCR only when needed, and durable approved pilot jobs. The fixed ten-document pilot extracted 29 pages: 28 embedded-text pages and one OCR page. Nine documents have AI drafts from direct NVIDIA Nemotron 3.5 Lightning; the scanned document has saved OCR but failed AI JSON/schema validation and remains actionable in history. All results await human review. Quote matching found 84 matching passages and flagged additional unmatched citations; it does not establish factual/legal correctness. The smoke test exposed unsupported interpretations that must be corrected during review.

Public viewing remains enabled, with privileged processing controls authenticated. No general extraction jobs were consumed: 507 remain queued. No Container, paid OCR endpoint, paid-model fallback, legal-record generation, or NotebookLM delivery was used. Current billing/remaining account allowance was not independently verified. See [pilot methodology](PROCESSING_PILOT.md), [verification receipt](processing-pilot-verification.json) and [Cloudflare OCR/browser planning](CLOUDFLARE_EVALUATION.md). Hold expansion pending review.

## Mixed scanned-document benchmark — 2026-10-04

An independent 13-page scan test reproduced a false-completion defect: the deployed extraction rule accepts court filing headers as sufficient text while the page bodies remain scanned. No pilot snapshots or artifacts were changed. Six NVIDIA hosted vision models and the legacy PaliGemma endpoint were tested on representative pages, with full draft outputs saved privately. No model passed all handwriting, strikeout, and structured-output checks. AI Search account inspection confirmed zero instances and no enabled OCR; current APIs can export chunk text but do not generate a searchable PDF. Gemini 3.8 Flash free-tier status is verified, but native PDF inference returned HTTP 503/high demand; 3.1 Pro has no API free tier and was not invoked. See [benchmark findings](OCR_MODEL_BENCHMARK.md) and [call receipts](ocr-model-benchmark-results.json). Keep expansion paused pending body-text detection and extraction-policy correction.

Gemini follow-up: Google AI Studio confirmed the valid `casevault` key's project is on the free tier with billing not set up. Native PDF inference tests, including the complete original and the Interactions API, encountered HTTP 503/high demand rather than producing transcripts. This clears the free-tier uncertainty but leaves quality unassessed because of service availability. See [Gemini test receipts](gemini-ocr-verification.json). The app's production keys and processor remain unchanged.

## Cloudflare integration OCR tests — 2026-10-04

Moondream was tested directly through the Cloudflare integration on three scan pages. All calls returned output, but the model missed strikeouts, misread a checked box, and made handwriting/text errors. The Llama call requires explicit model agreement and produced no OCR. A protected standalone OCR Worker implementation and six tests are added; deployment was rejected by the connector with “No access to the specified resource.” Gemini tests are paused and credentials retained, but the app settings pause could not be applied because the connector rejected the R2 write. No production pilot records changed. See [Cloudflare test findings](CLOUDFLARE_OCR_BENCHMARK.md) and [receipts](cloudflare-ocr-verification.json).

## Provider switches and readability fix — 2026-10-04

Implemented independent on/off switches for all provider cards with retained keys and model selections, server-side execution guards and skipped refresh calls for paused providers. Gemini defaults off in the new code. Extraction v2 checks readable body content instead of accepting filing-header text. Diagnostic extraction of the 13-page `8.pdf` accepted zero pages as embedded body text and remained partial with zero external calls. Historical receipts/snapshots remain intact; old runs require new approval to apply the new policy. Tests and production build passed. Deployment and live Gemini-off state remain blocked by Cloudflare integration write errors; no live update is claimed. The [processing strategy](DOCUMENT_PROCESSING_STRATEGY.md) distinguishes implemented behavior from searchable-PDF, re-OCR versioning, knowledge-base hint and full-docket context designs still to build.

## Authorized Llama agreement and OCR sandbox research — 2026-10-04

The explicitly requested Llama agree call returned HTTP 200 through the Cloudflare integration. A subsequent page-12 image request also executed, but its invented sections and incorrect strikeouts failed OCR quality review. No accepted extraction, searchable PDF, production job consumption or new deployment resulted. The agreement gate is resolved independently of existing deployment access errors. See [receipt](llama-agreement-followup.json) and [sandbox research](OCR_SANDBOX_OPTIONS.md). NVIDIA’s configured catalog returned DeepSeek chat/coding IDs, but no DeepSeek-OCR entry. E2B is proposed for isolated PDF preparation and searchable-PDF assembly; no sandbox was created.

## Derivative UX design and NVIDIA/OpenRouter comparison — 2026-10-04

Recorded existing R2 extraction receipts and the proposed workspace-scoped searchable-PDF version registry, reader selector, independent PDF/AI review and version-pinned citations. NVIDIA Llama 11B and 90B image calls returned HTTP 200 but failed markings/reference/structure checks. OpenRouter Dots returned truncated output; Qwen returned upstream 429. No searchable PDF, deployed UI, schema migration or production job consumption resulted. Provider request conventions and sanitized benchmark receipts are saved in documentation.

## OCR round 2 and storage inventory — 2026-10-04

Verified specialized Nemotron OCR v2 inference at 130/300 DPI and exercised Dots/DeepSeek OCR 2 public API demos. Recognition/marking errors prevent promotion; DeepSeek Flash/Kimi timed out; some follow-up demo tests were blocked. No production jobs or deployed changes. See [comparison](OCR_COMPARISON_ROUND_2.md) and [Supabase/R2 file-library design](STORAGE_AND_FILE_LIBRARY.md).

## Streaming retries and operator annotation review — 2026-10-04

Qwen3.8 free completed in 13 seconds with cost zero reported; Kimi K3 completed with low reasoning effort in 66 seconds. Both identified the correct crossed-out paragraphs; the operator confirmed the underlying §81.16(c)(4) text and explained that its exact citation is not critical because the paragraph is invalidated. Fidelity warnings remain, but these models pass that annotation check. Qwen higher-resolution follow-up returned 429; DeepSeek streaming retry produced no events in five minutes. Dots3-Note is removed from future comparison candidates, while historical outputs remain. BHL published-license inventory is documented with Dots supplemental-agreement and SmolDocling metadata inconsistencies. No app deployment or production processing resulted.

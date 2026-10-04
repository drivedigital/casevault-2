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

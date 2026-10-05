# Workflow methodologies and dependencies

Recorded 2026-10-03 from the two referenced Codex chats, the recent build-plan workspace, actual acquisition manifests, NotebookLM sync receipts, and the legacy Cloudflare inventory. These methods distinguish successful experiments from deployed capabilities.

## NYSCEF docket acquisition

A supervised authenticated browser session opens the exact case, captures every docket row, and retrieves available PDFs through that session. Persist a snapshot and per-document receipt before parsing: case/index, sequence number, docket description, filing date, status, source URL, retrieval method, filename, bytes, SHA-256, actual page count, and acquisition time. Keep deleted, restricted and unavailable entries as metadata; a missing PDF is not a missing docket row.

Dependencies: court session and browser bridge, browser download access, local staging, Python/PyMuPDF inspection, the source manifest, and a private storage destination. Fresh unauthenticated HTTP requests encountered a court challenge in the prior work. The successful browser session does not prove unattended future scraping. Human recovery remains an exception path with its own receipt.

Verified inputs:

| Case | Docket rows | PDFs | Actual pages | Acquisition caveat |
| --- | ---: | ---: | ---: | --- |
| Nasca, 153243/2026 | 84 | 70 | 480 | 21.61 seconds measured active downloading only; excluded navigation, pauses and session acquisition |
| West 42 Developers v. Urban Resort, LT-316530-24/NY | 33 | 32 | 277 | 29 automated downloads; documents 2, 3 and 4 recovered by a human; entry 28 deleted |

The new Worker accepts manifest-backed records and originals. Its NYSCEF bridge is currently disconnected; a refresh does not fabricate another docket or claim to solve a challenge.

## Original preservation and ingestion

Inspect source bytes, compute SHA-256, and count actual PDF pages. Store immutable originals in R2 at `casevault-2/originals/<sha256>` and keep separate source associations in Supabase. Hash identity can deduplicate storage without erasing different docket or collection associations. Do not infer original authenticity from legacy notes, filenames, titles, or an OCR string.

`prepare-corpus.py` reconciles source manifests and local originals. `import-corpus.mjs` uploads through the authenticated Worker, compares returned size/hash, checkpoints object receipts privately, imports stable external IDs, and inserts extraction jobs using a unique idempotency key. Safe replays retain existing imported records rather than silently replacing reviewed values. Each batch commits separately; recovery is a replay, not a claim of one atomic corpus transaction.

Dependencies: manifests and staging files; PyMuPDF for validation; the private machine credential; R2 binding; Hyperdrive; restricted Supabase role; migrations; Node 22 LTS. The source-path defaults record this initial import workstation and must be adjusted when staging elsewhere. Administrative bootstrap is for trusted operators, not a general public upload API.

The legacy live Cloudflare KV inventory contained 404 records and 403 unique legacy IDs. Local originals reconciled to all 404 records, representing 390 distinct hashes. One reused legacy ID is disambiguated by source path. Only six legacy KV file payload keys existed, and the prior R2 bucket was empty at inspection. Therefore these files were recovered from local originals matched against the Cloudflare inventory and uploaded to R2; they were not 404 pre-existing R2 objects. Prior placeholder OCR and the blanket 12-page labels were not promoted to extracted text or trusted counts. Actual PDFs total 2,407 pages.

The current queue stores durable extraction requests. A leased processor, OCR policy, quality review, structured indexing, retry/dead-letter handling, and completion receipts remain build work. Job creation never means processing has succeeded.

## NotebookLM delivery and updates

Use the existing authenticated local NotebookLM adapter. Resolve the notebook explicitly; list remote sources before uploading. Store notebook ID, source ID, artifact SHA-256, filename, upload attempt, remote processing status, and verification time. After a timeout, reconcile the remote source ID before retrying; otherwise duplicate sources can be created. Poll remote processing and report failures separately from successful upload acknowledgments.

Verified results: LT notebook `3f1b2655-d8c6-4774-ae6f-44998e8dcea3` had 32 sources ready, including the timeout recovery for document 12; a repeat sync uploaded zero additional sources. Nasca notebook `8a82e6be-2018-422a-9371-437ed1ad3269` retained 50 original sources and added 35, reaching 85 sources: 84 ready and document 56 failed. Matching an existing source title is a candidate association, not verified byte equivalence. The working notebook was not replaced by the OCR evaluation notebook.

Dependencies: a live consumer NotebookLM session, local adapter/API package and its private authentication, source-list access, durable sync receipts, original/derivative mapping, and source capacity. This consumer-session bridge is not a deployed Cloudflare connector or guaranteed public NotebookLM API. CaseVault 2 imports 118 historical association/attempt receipts without changing those notebooks: 117 correspond to the previously verified combined source totals, plus an earlier failed document 56 attempt. These receipts are historical observations, not a fresh assertion of remote presence. Subsequent updates require reconnecting the adapter.

For OCR derivatives, retain the original hash, derivative hash, engine/version, source pages, extraction settings, quality observations, and human review separately. Original-plus-derivative correspondence must remain explicit. Ten evaluated pages and 31 selected fields are a small routing experiment: OCR.space Engine 3 recovered 29/31, Nemotron 26/31 and Kimi 23/31. These are not general accuracy scores. Native filing stamps can coexist with scanned body text.

## Google Drive delivery

Use the connected Drive adapter with an explicit destination folder and authenticated user/OAuth grant. Search or reconcile an existing destination receipt first. Record Drive file ID, original or derivative hash, version, parent folder and delivery outcome. Retries should use that mapping, not a filename-only duplicate check. Shared permissions must follow the chosen private workspace policy.

Dependencies: Drive connector/OAuth session, destination folder, scopes sufficient for the selected operation, source artifact, and durable delivery receipt. No Drive folder or delivery was requested for this initial corpus, and no Drive sync was performed. The new application's Drive route reports the missing adapter rather than pretending it synchronized.

## Cloudflare R2 and Supabase

R2 holds private original bytes; it does not establish OCR quality or legal authenticity. The Worker reads and writes through a bucket binding, avoiding client-side R2 credentials. Document routes stream files after authentication. SHA-256 storage keys and actual file inspection support reconciliation.

Supabase Postgres holds matters, actors/contacts, docket snapshots and entries, source provenance, notebook associations, and jobs. The new `casevault2` schema is isolated inside the existing CaseVault project. A restricted login role connects through Hyperdrive; private-workspace RLS applies on all tables. No service-role key is required in the browser or Worker. These initial tables are a prototype-compatible adapter, not the full canonical shared schema proposed in the handoff.

## Notion seed data

Read the lawsuit, litigant and lawyer data sources. Retain original Notion page IDs, URLs, raw fields and relationship observations in provenance. Copy records into new source identities; do not merge people by name or claim that a global lawyer-client relationship proves representation in every matter. Case links create explicitly labeled Notion-derived roles. Document the imported count in the receipt. No Notion records were edited.

## Causes of action workflow

The attached `Causes of Action Workflow.md` is a requirements reference, not an instruction to make legal findings. The future workflow should support jurisdiction-specific claim research, elements and burden, evidence-to-element links, defenses, procedural gates, remedies, and reviewed drafting. Each proposition needs a source and review state. No claim viability, deadlines, or legal conclusions were generated during this import.

## Source bridge implementation — 2026-10-04

The first local adapters are now in `bridges/`, with cloud queue/lease/completion contracts and app controls. NotebookLM source reconciliation was exercised against the existing LT notebook without adding duplicates. NYSCEF anonymous HTTP access paused for the supervised browser rather than importing an empty docket. A DOM capture adapter preserves observed court pagination in a private dated bundle. Google Drive has separate read-only OAuth, real file selection, and source-version ingestion. These additions preserve the historical methods above; they do not prove unattended court access or implement corpus OCR. See `QUEUES_AND_BRIDGES.md` and `workflow-verification.json`.

Docket overview cards and detail pages link to the recorded live NYSCEF source URL in a new tab. Links preserve the court's opaque docket identifier; source URLs are not reconstructed from index numbers.
# Standalone Cloudflare OCR evaluation

Use the Cloudflare integration for account actions and direct model tests. The protected implementation is in `ocr-worker/`, with an explicit model choice and a required `OCR_SECRET_KEY` secret binding. It accepts page images and returns unverified transcription, with no searchable PDF or automatic legal-record updates. Deployment remains blocked by connector upload access. See [Cloudflare OCR evaluation](CLOUDFLARE_OCR_BENCHMARK.md) for dependencies, test results, Gemini pause limitations, and deployment requirements.

Provider switches, the new body-readability check, searchable-PDF/versioning design, recognition hints and docket-context summarization are documented in [Document processing strategy](DOCUMENT_PROCESSING_STRATEGY.md). The switches/readability fix are locally implemented; searchable derivatives and context-aware retrieval remain future work. Cloudflare integration write access currently blocks applying the code to production.

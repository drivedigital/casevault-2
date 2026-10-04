# Queues, file selection, and source bridges

## Two queues, two responsibilities

| Queue | Purpose | What completion means |
| --- | --- | --- |
| Ingestion | Durable work: source acquisition, private original storage, text extraction/OCR, and delivery to a notebook | That specific job succeeded, with its source/artifact receipt. It does not imply legal verification. |
| Document review | Human decisions: assigning matters/parties, correcting metadata, checking quality, and resolving flags | The operator has reviewed that document or resolved its flag. It is separate from processing success. |

A document can have several ingestion jobs, and one ingestion job can acquire several docket records. Job counts are therefore not document counts. Court filings skip routine human intake review, while extraction is still required. A court filing explicitly flagged for review returns to the review queue. Drive imports enter the review queue and receive a durable extraction job. Source bridge jobs use the existing `queued`, `running`, `needs_human`, `succeeded`, `partial`, and `failed` states. The original OCR/extraction backlog remains separate from the local source bridge.

## Active inference models

Settings uses accessible pill buttons, with multiple active models per remote provider: OpenRouter, NVIDIA, and Gemini. Search narrows the available model pills. The clear-selection control removes all active selections. No model is selected automatically. Selection is saved server-side in private R2 at `casevault-2/settings/active-models/<provider>.json`, so it survives reloads and works across browsers. Each provider has its own object to avoid overwriting another provider's setting.

The server rejects models absent from that provider's latest discovered catalog, connections that failed their check, and models declared to return only non-text outputs. NVIDIA's catalog has limited capability metadata; discovery does not prove every listed model supports chat. Model disappearance leaves the saved selection visible but blocks inference until a valid available model is selected. Each processing agent binds one explicit model from those active selections; approved runs snapshot that binding. Legacy single-model selections remain supported. Selecting a model does not trigger the legal evidence backlog.

## Google Drive file selector

**Choose Drive files** is available in Settings, Document Review, and Drive & Ingest Connectors. The selector supports folder navigation, global filename search, pagination, and selection of up to five files per import. It uses the real Google Drive API rather than a hard-coded file inventory. Imports support stored files up to 20 MB and PDF exports of native Google Docs, Sheets, and Slides. Native exports retain the source file's ID, modified timestamp and MIME type in provenance, while preserving the exported artifact's actual SHA-256. Google imposes its own export size limits. Shortcuts and other Google app types need their actual target file.

Drive authorization is an explicit separate flow using the existing Supabase Google OAuth client with `drive.readonly`. That grant allows browsing and downloading; the integration does not modify Drive originals or sharing. The extra provider token is captured only after Supabase verifies the authorized owner. It is stored encrypted with AES-GCM in private R2, using the server `SESSION_SECRET` with a Drive-specific derivation context. Neither the token nor its refresh credential is returned to the browser. Connections are bound to the allowed account. This initial version uses a short-lived access grant and asks the operator to reconnect when it expires; automatic refresh is not yet configured.

The Google Drive API must be enabled in the OAuth client's Google Cloud project. No Google Picker developer key is needed because this is a custom file selector backed by server-side Drive requests. Private routes enforce workspace Google authorization and same-origin cookie mutations. File IDs, search inputs and import batch sizes are validated server-side.

An import reads actual metadata/bytes from Drive, computes SHA-256, stores the artifact under the existing original-object prefix, and transactionally inserts its source association and extraction request. A repeated selection of the same source version reuses the existing association/job. Distinct source associations can share the same original hash. Partial batch failures are reported per selected file. No page count, OCR text, or AI analysis is invented.

## NYSCEF and NotebookLM bridge

The app's **Court & NotebookLM** page queues source work for the local adapter. This keeps court challenges and the consumer NotebookLM session on the operator's machine. The bridge does not inspect browser cookies or copy browser profiles into the Worker.

The local runner claims only `nyscef_refresh` and `notebooklm_sync` jobs. It cannot accidentally consume the OCR/extraction backlog. Claims use database row locks with `SKIP LOCKED`, opaque lease tokens and ten-minute leases. The runner renews leases while transferring files or processing a notebook batch. Expired leases can be recovered; after three abandoned attempts the job pauses for human attention. Completion rejects stale leases, wrong result types, duplicate filing numbers and mismatched original-object receipts. Source observations and notebook associations commit with the job result; private R2 holds a separate acquisition/delivery receipt.

### NYSCEF first adapter

`bridges/nyscef.py` fetches the exact observed DocumentList URL, follows observed pagination for the same opaque docket ID, parses every numbered filing row and retains metadata-only, restricted and deleted entries. It does not derive opaque court IDs from index numbers. Downloads retain separate filing identity, inspect PDF signatures, compute SHA-256, and count pages if PyMuPDF is installed. Missing PyMuPDF leaves page count unknown.

Challenges, access denials, empty unexpected pages and pagination uncertainty pause acquisition. A challenge never becomes a successful zero-row docket. Downloads have time/size limits and partial failures remain visible. The cloud API verifies each object's stored hash/size before linking it to a filing. New court originals receive idempotent extraction jobs; existing reviewed document values are preserved.

This is the first portable HTTP acquisition adapter, not a proven unattended authenticated browser scraper. The prior successful authenticated browser capture remains the fallback. For a challenge, capture the complete dated docket HTML through the supervised browser and preserve the downloaded PDFs locally. `bridges/browser-capture.mjs` captures the docket table and observed pagination through a tab supplied by the supported Codex browser runtime. It reads table DOM, not authentication stores. It produces a dated JSON bundle for the scraper; downloaded originals can be supplied from the private staging folder. Multi-page bundles must include every observed page, and the adapter stops instead of pretending a first page is complete. Full automatic downloads through the authenticated browser remain to be integrated.

### NotebookLM first adapter

The bridge uses the existing authenticated `nlm` CLI, verified locally as 0.15.1. It lists sources before planning or uploading, preserves existing IDs, and distinguishes a title candidate from known uploaded-hash correspondence. It never deletes/replaces notebook sources.

Before a new upload, it downloads the private original through CaseVault and verifies its actual hash. A local journal is written before upload. After an upload or timeout it lists sources again, reconciles the returned ID or deterministic artifact title, and records remote processing status. A pending attempt with no confirmed remote match pauses rather than blindly uploading again. Successful uploads and confirmed ready sources remain distinct. Existing title-only associations are not promoted to byte-verified matches.

Initial live checks found 32 LT sources and 85 Nasca sources. The plan required zero additional uploads for both imported corpora. The LT job completed with 32 sources ready and zero uploads. These are fresh observations, not a new delivery of the entire corpus. The Nasca prior failed source remains a separate condition to reconcile.

## Running locally

Run from the repository root with Node 24 LTS, Python 3, the private CaseVault machine credential, and the existing authenticated `nlm` CLI. The runner accepts credentials from process environment or ignored `.env.local`. Never commit the token, local adapter authentication, journals, source snapshots or downloaded originals.

```sh
# Read-only notebook plan; docket IDs are returned by the app, not guessed.
node bridges/runner.mjs --plan-notebook=2

# Process one queued source job.
npm run bridge:once

# Run the local source bridge until stopped.
npm run bridge:watch

# Supervised capture recovery: supply actual observation time and staged originals.
python3 bridges/nyscef.py --url '<observed court URL>' \
  --snapshot '<complete dated capture.html>' --observed-at '<UTC capture time>' \
  --originals '<private staged PDF directory>' --output '<private output directory>'

# Queue a new court request in the app, then supply its matching acquisition manifest.
node bridges/runner.mjs --court-manifest='<private output directory>/manifest.json'
```

Use `CASEVAULT_URL` and `CASEVAULT_API_TOKEN` for an explicitly configured deployment, and `CASEVAULT_PYTHON` for a particular Python interpreter. Install PyMuPDF in the adapter environment if actual PDF page counts are required. The original experiment's Python environment includes PyMuPDF 1.28.2. No local server is exposed publicly; the adapter makes authenticated outbound requests to the Worker.

The local CLI is an external consumer-session dependency, not Google's official NotebookLM Enterprise API. Authentication expiry and remote protocol changes can require adapter maintenance. The OCR processor, full browser session orchestration, automatic Drive token refresh, and unattended bridge hosting remain future implementation work.

## Validation

Automated tests cover model selection boundaries, Drive query escaping and batch limits, notebook deduplication plans, source receipt validation, preservation of unavailable docket rows, observed pagination, and court challenge handling. Live checks cover settings persistence, unauthorized access rejection, real Drive folder/search/import behavior, notebook reconciliation and scraper pause behavior. See `workflow-verification.json` for the current receipt.

## Primary API references

- [Drive files.list](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/list)
- [Drive API scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth)
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)

## AI agents and special processing requests

`/agents` stores named agent configurations (provider, role instructions, active state) in separate R2 objects. Active configurations appear in the Document Review Queue’s special-processing form. Each saved request binds an existing document, active agent and prompt; requests are persisted under `casevault-2/processing-instructions/<documentId>/`. Status is `awaiting_processor`. This is configuration and durable intake, not a running autonomous agent service. The extraction/AI worker must consume these requests, combine role and document instructions, and use the provider’s current active model. Saving a request does not falsely mark a document processed.

## Temporary public review access

At the owner’s request, `PUBLIC_REVIEW=true` disables the sign-in gate for app pages and ordinary read APIs, including document previews and downloads. Anyone with the URL can review the workspace and its documents. Adding/toggling agent configurations and submitting special-processing requests is also open, with same-origin checks for browser mutations. Drive operations, provider model changes/refresh, existing document edits and source bridge operations continue to require the owner’s Google session or machine token. Machine-only lease and receipt routes keep their additional token check. Provider keys, Drive grants and machine secrets remain server-side. Set `PUBLIC_REVIEW=false` and deploy to restore the sign-in gate.

## Hosted document processing

The fixed pilot now uses a separate Cloudflare Worker for embedded text extraction and cloud OCR on insufficient-text pages. The scheduled worker consumes only approved `pilot_process` jobs, never the general backlog or source bridge jobs. See [Processing pilot](PROCESSING_PILOT.md) for policies, receipts, results, and rollout restrictions. [Cloudflare evaluation](CLOUDFLARE_EVALUATION.md) records AI Search OCR and Browser Run planning.

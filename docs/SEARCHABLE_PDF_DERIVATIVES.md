# Searchable PDF derivatives, reader and review workflow

Design recorded 2026-10-04. This document distinguishes existing implementation from proposed additions. It does not claim that searchable PDFs currently exist.

## Existing storage and tracking

The `EVIDENCE` binding points to R2 bucket `legal-evidence-arena`. Original bytes are referenced by `documents.objectKey` and verified against `documents.sha256`. The pilot currently saves extraction JSON at `casevault-2/derivatives/{originalSha256}/{extractionPolicyVersion}/{receiptSha256}.json`. The sibling `complete.json` is a reusable completion lookup, not the immutable authoritative receipt.

Workspace-scoped `casevault2.processing_runs` records retain `extraction_key`, the approved execution snapshot, extraction/AI states, results, errors and a separate human review decision. `documents.ocrText` is the display copy of page text. The document page serves the original at `/api/documents/{id}/file`, and the processing history displays page text, warnings, cited facts and draft acceptance controls. These are extraction receipts and AI drafts; the current schema has no searchable-PDF version registry, primary-version selection, or derivative download route.

## Proposed immutable objects

Store searchable PDFs in the same R2 bucket, in a distinct workspace-scoped namespace:

`casevault-2/workspaces/{workspaceId}/derivatives/{originalSha256}/{versionId}/`

Retain `manifest.json`, `pages.json`, `chunks.json`, provider responses and `searchable.pdf` where supported. Content-address artifact filenames or record each object's SHA-256 in the immutable manifest. Never overwrite originals or older versions. A model that returns prose without reliable coordinates yields a text-only version; a failed run must not advertise a searchable PDF.

Define a recognition recipe hash from original hash, provider, model and available revision, extraction policy, normalized parameters, prompt and context hash. Include renderer/assembly versions in the derivative manifest. An explicit fresh retry creates a new version even if the recipe is unchanged; ordinary repeated requests can reuse an identical successful artifact. Do not treat the recipe hash alone as a receipt proving execution or quality.

## Proposed database registry

Add a workspace-scoped derivative version registry with original hash, version ID, recipe hash, creating run, provider/model, creation time, page coverage, artifact keys/hashes/sizes and validation warnings. Keep extraction, PDF assembly/validation and human review states separate. Add an auditable primary-version pointer per document, and retain reviewer/time/comment for decisions. This is a design, not an applied migration.

Validate source identity, page count, dimensions, rotation, visual preservation, text search/copy and coordinate alignment before marking a PDF ready. Classify partial extraction visibly. Geometry returned by a model also needs validation; its presence alone does not prove an aligned PDF.

Serve derivative downloads through a document/version route that verifies workspace membership and original association. Do not accept an arbitrary R2 key from a browser. Public readers may view permitted results; submissions, retries, primary selection and review require owner/trusted credentials.

## Proposed document screen

- Keep Original as an always-available view. Add Searchable PDF only for an assembled and validated artifact, with a version selector and downloads for both.
- Show provider/model, processing date, coverage, quality warnings and a clear Unreviewed / Accepted / Rejected label beside every derivative.
- Add Reprocess OCR with explicit provider/model and optional recognition hints; permit page selection for flagged pages. Save instructions before approval, snapshot them on approval, then enqueue a new version through the existing ledger.
- Add Compare versions and Use this version controls. Primary selection controls the default extracted-text view and future processing, but does not rewrite earlier summaries, decisions or citations.
- Bind page citations to the extraction version and physical page. A historical draft must display its own extraction, rather than the latest run's text. The current history loader displays the latest extraction; historical version-aware viewing is a required enhancement.

## Workflow integration

Ingestion queue: verify original → assess body readability → extract embedded text → OCR insufficient pages → validate/save extraction → assemble/validate searchable PDF when geometry permits → generate cited AI draft. Report extraction, PDF and AI failures independently. Absence of a searchable PDF need not invalidate usable page text; expose the difference.

Document review queue: inspect original alongside selected derivative, text and AI draft; review recognition errors and markings separately from accepting AI facts. Court filings retain routine-review bypass unless flagged. Processing success does not count as human acceptance. Searchable-PDF validation does not count as legal verification.

Settings: provider main toggle retains credentials; model pills enable models; each OCR execution chooses one supported image/OCR model explicitly. Agent summarization model binding remains independent of OCR selection. AI Agents shows configuration and recent runs, not a false Running label for an enabled configuration.

Future retrieval/search indexes only the explicitly selected eligible extraction and retains version/page references. Changing primary selection schedules reindexing; it does not mutate history. No automatic NotebookLM delivery or Knowledge Graph updates are included in this design.

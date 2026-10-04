# Document processing, OCR versions and context — 2026-10-04

## What exists and what remains

The hosted pilot preserves originals in R2, verifies their SHA-256, extracts PDF text page by page, requests cloud OCR for insufficient-text pages, saves immutable extraction receipts, and generates page-cited AI drafts for human review. General backlog execution remains held. OCR.space is the currently wired pilot OCR adapter, not the intended standalone solution for the backlog. Workers AI/Moondream has separate evaluation code, but its Worker deployment is blocked and its latest results failed handwriting/marking checks. No local OCR or Container is used.

The new provider switches and body-readability correction are implemented and locally verified, but not deployed: the Cloudflare integration rejected the app assets upload session with “No access to the specified resource” and the Gemini control R2 write with authentication error 10000. The live app must not be described as changed. Once deployed, Gemini defaults off while retaining credentials and model selections. Provider controls are independent from model selection; both are private, authenticated mutations.

The existing extraction receipts are page-level text JSON, and the document text field supplies the reader. AI processing groups pages into bounded context batches, but those batches are not a reusable search-chunk index. There is currently no generated searchable-PDF artifact, OCR-model selection/reprocessing UI, automated party-hint injection, or full-docket context retrieval. These capabilities below are the next design, not completed features.

## Extraction/readability correction

The new extraction version is `text-first-ocrspace-body-v2`. PDF.js text positions are tested against the unrotated page box, ignoring the top 12% and bottom 8% when deciding whether there is enough readable **body** text. The existing character/corruption check applies to body text; filing-header text alone no longer bypasses OCR. Margin text is still retained when the body passes. An insufficient page needs OCR, or remains visibly unavailable/partial if OCR cannot run.

This is a conservative heuristic, not proof that every visual element was extracted. It can send a sparse cover page to OCR and can miss unrecognized handwriting on a page with enough embedded typed text. Page-image coverage, tables, handwriting and critical markings still need quality flags and human inspection. Future coverage classification must account for image-dominated regions rather than merely counting characters.

Diagnostic verification on `8.pdf` with OCR callbacks intentionally disabled found all 13 pages need OCR: zero pages were accepted as embedded-body text, and the receipt remained partial. No external calls or production receipts changed. Synthetic tests verify genuinely embedded text still bypasses OCR, including rotated pages.

Historical v1 receipts remain readable. New approvals snapshot v2. An old approval cannot silently run the changed extraction policy: it requires a new request/approval. The separate v2 cache avoids reusing a false-complete v1 extraction. Neither original files nor historical run snapshots are rewritten.

## Intended workflow

1. Store the original once in R2 under its content hash; record source, matter/docket association, file type, original hash and ingestion receipt. Verify the hash before processing.
2. Inspect each page for body-text readability and extraction coverage. Preserve embedded text on readable pages; send only pages requiring OCR to the explicitly selected cloud OCR model. Allow a user override for handwriting, tables, markings or a suspect text layer.
3. Save a versioned extraction receipt containing page text, layout/coordinates when supplied, raw provider response, warnings, model/engine version, parameters, exact recognition hints and their provenance. Failure or partial coverage must remain visible.
4. Derive reusable chunks from that extraction version. Each chunk records document/original hash, extraction version/hash, page number(s), character offsets, chunk hash and any region references. Keep source text and provenance authoritative; embeddings/search indexes can be rebuilt.
5. Create a searchable PDF only when usable text positioning is available, or save a clearly labeled text-only derivative while searchable-PDF construction remains pending. Verify page count, dimensions/rotation, visual preservation and search/copy behavior before labeling the derivative searchable.
6. Generate the AI draft from the chosen extraction plus a snapshotted optional context packet. Validate citations and surface unsupported statements. Human acceptance remains independent of extraction/AI completion.

## Searchable PDF: how

A searchable scan preserves the original visual pages and adds an invisible text layer aligned with their words/lines. This does not require running local OCR: recognition stays with the cloud API; PDF assembly is a separate operation.

Two implementation paths are available. A cloud OCR service can return a searchable PDF directly, which we retrieve, validate, hash and retain in R2 as a derivative. Alternatively, a cloud service returns text plus word/line bounding boxes; the Worker copies the original PDF pages and adds an invisible text layer using those coordinates. Rendering scale, rotation, crop boxes, font coverage and reading order must be mapped and verified. For mixed PDFs, retain existing searchable pages and add OCR text only where needed; do not duplicate a bad original text layer blindly.

OCR.space documents `isCreateSearchablePdf=true` together with `isSearchablePdfHideTextLayer=true`, as well as bounding boxes through `isOverlayRequired=true`; its free searchable PDFs include a watermark. The current adapter requests none of those artifacts, and its file limits remain unsuitable as the sole backlog strategy. This is an optional adapter capability, not an automatic fallback. [OCR.space API](https://ocr.space/ocrapi), [searchable PDF details](https://ocr.space/searchablepdf).

Workers AI vision output in our evaluation is a transcription string, not a verified coordinate map. Do not fabricate word positions from prose/Markdown and claim an accurately aligned PDF. Until a model/API returns validated geometry or a complete searchable PDF, that output can support a page-linked text view but not a reliable positioned layer.

AI Search offers extracted/chunked text and embeddings for retrieval. Its OCR indexing pipeline is separate from creating the downloadable searchable PDF we need to retain ourselves. [AI Search ingestion](https://developers.cloudflare.com/ai-search/configuration/data-source/), [indexing pipeline](https://developers.cloudflare.com/ai-search/concepts/how-ai-search-works/).

## OCR redo and multiple versions

Retain multiple derivative versions when a user explicitly requests another OCR model, settings or context. Keep one immutable original. A run identity should include original hash, extractor/model ID and revision, parameters hash, hints hash and extraction-policy version. Reuse an existing identical successful version unless the user explicitly requests a fresh execution; do not reuse another model's result as if it were the requested model.

Each version can retain `receipt.json`, `pages.json`, `chunks.json`, raw response, and `searchable.pdf` when supported, under an immutable version/hash prefix. Some versions may have text only; others may be partial or failed. Track this explicitly rather than implying every OCR model creates a PDF. Record each derivative's own SHA-256. A separate primary-version selection determines which extraction feeds the reader and future summaries/search. Switching the primary version does not delete older versions, acceptance decisions or citations.

Proposed document controls: **Redo OCR**, explicit provider/model, selected pages, optional recognition hints, and an explicit **Use this version** action after comparison. Reprocessing creates a new approved job and receipt; it never overwrites the original. Existing summaries remain tied to their original extraction version and context. Changed extraction creates a new analysis version rather than silently updating accepted findings. Provider-off blocks new calls even for previously approved jobs; an already submitted remote request cannot be recalled.

## Recognition hints from the knowledge base

Use a small matter/docket-scoped lexicon of names, aliases, lawyers, firms, organizations and relevant abbreviations. Include each hint's source record and review status. Prefer confirmed source spellings; describe unreviewed Notion/import observations as provisional. Do not send the entire cross-matter contact list to each provider. OCR.space's documented API does not expose arbitrary prompting; hints belong only in adapters that support contextual prompts/lexicons.

Snapshot the exact hints and prompt in the OCR receipt. Present them as untrusted recognition candidates, not facts or instructions. The model must transcribe visible characters, mark ambiguity and preserve competing readings. It must not insert an absent name, guess a signature identity, complete an account number, or infer the effect of a strikeout. Name normalization is a separate proposed annotation after raw transcription, with source passage and uncertainty; it does not replace raw text or merge identities.

Measure the effect with matched page tests using identical model/image/settings with and without hints, comparing name accuracy **and** invented substitutions, omissions, checkbox state and strikeout handling. Hints may improve recognition, but can also bias a model into finding a familiar name where none is legible.

## Single-document summaries with full-docket context

Build two levels of context, bounded to the selected lawsuit:

- **Docket overview:** caption, court/index number, known parties/roles, filing entry number/date/type, full available docket-entry metadata, and a concise sourced procedural timeline. Mark metadata-only/deleted/missing filings explicitly. A docket description is not a verified statement of a filing's content.
- **Relevant evidence:** locate entries explicitly referenced in the target, adjacent motion/opposition/reply/order filings, exhibits and relevant prior orders. Retrieve their extracted page chunks within a fixed context budget. Sending all docket PDFs on every summary is unnecessary and can exceed context limits.

Existing `documents.docketId`, `docket_entries.documentId`, docket captions/source URLs and matter/contact-role links provide the relationships. Future retrieval should use the chosen extraction-version chunks, filter by workspace and docket, and exclude unavailable pages or mark them as missing. Rank explicit references first; use semantic search only to find additional candidates, with source verification. If a full overview exceeds the context budget, report that it was condensed and retain the underlying snapshot; never claim the model read the full docket when only metadata or selected pages were provided.

Give the model separate `target_document`, `docket_metadata` and `context_documents` inputs. Treat every source as evidence rather than instructions. The summary output should separate **This document says** from **Docket context**, distinguishing allegations, arguments, orders and metadata. Target-document facts require target page citations. Context-derived statements require that other document's ID, extraction hash, page and supporting passage; procedural metadata cites the docket-entry source. Existing pilot facts only support `{page, quote}` on the target, so multi-document citation/schema/UI support must be added before context-derived facts can be accepted.

Save the context packet alongside each run: source capture/as-of timestamp, docket snapshot hash, selected entry/document IDs, original/extraction hashes, exact retrieved passages and page references, hints, retrieval version and truncation/missing-source warnings. Later docket imports affect future runs, not this saved context. A regenerated docket-context summary is a new version.

This prevents a prior filing or later order from being presented as something the target document itself says. Literal quote matching checks citation location, while human review still determines whether the summarized interpretation is justified.

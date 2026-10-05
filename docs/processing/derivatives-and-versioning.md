# Derivatives and versioning

Distinguish pilot receipts, bounded comparison PDFs and the proposed general version registry.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Implemented pilot receipts](#implemented-pilot-receipts)
- [Implemented Doc 8 comparison artifacts](#implemented-doc-8-comparison-artifacts)
- [Proposed general registry and reader](#proposed-general-registry-and-reader)
- [Proposed hints and context](#proposed-hints-and-context)
- [Sources](#sources)

## Implemented pilot receipts

The pilot writes `casevault-2/derivatives/{originalHash}/{extractionPolicy}/{receiptHash}.json` and a separate mutable `complete.json` lookup. Run snapshots retain the original and extraction policy; `processing_runs.extractionKey` points to the receipt. The document text field is a display copy. The current [history loader](../../src/lib/processing.ts) fetches the latest run with an extraction key, so historical drafts do not yet get a fully version-pinned reader.

The OCR.space pilot adapter does not request a provider-generated searchable PDF or geometry overlay. An extraction receipt is therefore not a downloadable searchable-PDF artifact.

## Implemented Doc 8 comparison artifacts

[Comparison code](../../comparison-worker/worker.mjs) uses a workspace/comparison prefix with these objects:

| Object | Meaning |
| --- | --- |
| `manifest.json` | Approved original, image hashes, candidates, renderer, prompt and agent snapshot |
| `pages/{modelId}/{page}.json` | Latest page lookup, updated on explicit retry |
| `attempts/{modelId}/{page}/{leaseToken}.json` | Immutable attempt receipt in the revised adapter; early receipts predate it |
| `leases/{modelId}/{page}.json` | Conditional claim and five-minute expiry |
| `models/{modelId}/{pdfSha256}.pdf` and `artifact.json` | Published derivative and immutable coverage/validation metadata |
| `models/{modelId}/pages.json` | Page text, warnings, image hashes and receipt references |
| `models/{modelId}/analysis.json` | Draft analysis receipt; separate from human acceptance |

The [assembler](../../scripts/assemble-comparison-pdfs.py) requires all 13 local page receipts for a candidate. It preserves all original pages, adds text only for usable pages, and produces no PDF when zero pages are usable. Nemotron word geometry is clamped to page bounds; other candidates use **page-anchored** text with approximate highlight positions. This is not proof of word alignment.

Structural checks compare every page's raster, dimensions/count and added extractable text. Word alignment and human transcription remain explicitly unverified. The assembler uses a restricted character encoding with replacement; visual preservation does not guarantee perfect Unicode transcription in the text layer. Full search/copy review remains necessary.

Publication requires authenticated multipart `pdf`, `pages` and `manifest`, with coverage matching effective server receipts. Inspect [publication validation](../../comparison-worker/worker.mjs) before resuming; the Worker trusts recorded structural validation fields rather than rerendering the PDF itself. Published artifact immutability means improvements need a new comparison/version. The October 4 checkpoint recorded no published PDFs; local code existence does not update that observation.

## Proposed general registry and reader

The wider design calls for workspace-scoped derivative versions keyed to original identity and a recognition recipe: provider/model/revision, extraction policy, parameters, prompts/hints/context, and renderer/assembly versions. Retain pages, chunks, raw responses and PDF only when supported. A recipe hash identifies inputs; it is not evidence that an execution succeeded.

Add a database registry and audited primary-version pointer, separate extraction/PDF/AI/review states, document/version download authorization, and historical version-bound citations. Reprocessing creates a new approved run/version; ordinary identical successes may be reused, while explicit fresh execution gets a new version. Primary selection affects future processing/search without rewriting older summaries or decisions.

## Proposed hints and context

Recognition hints should be a small matter-scoped lexicon carrying source and review status. Snapshot exact hints and treat them as candidates, never permission to invent text or infer signature identity. Compare matched hinted/unhinted tests for omissions and invented substitutions. Only adapters supporting prompts/lexicons can consume them.

Docket-aware analysis would separate target text, docket overview and relevant retrieved documents within a fixed budget. Context statements need document ID, extraction hash, page and passage; current pilot facts only carry target `{page, quote}`. Retain context selection, source dates, hashes, retrieval version and truncation/missing-source warnings. Docket updates affect new runs, not saved context packets.

## Sources

[SEARCHABLE_PDF_DERIVATIVES.md](../history/archive/2026-10-04/SEARCHABLE_PDF_DERIVATIVES.md), [DOCUMENT_PROCESSING_STRATEGY.md](../history/archive/2026-10-04/DOCUMENT_PROCESSING_STRATEGY.md), [DOC8_WORKFLOW_CHECKPOINT.md](../history/archive/2026-10-04/DOC8_WORKFLOW_CHECKPOINT.md).

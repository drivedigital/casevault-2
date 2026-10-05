# UX and roadmap

Separate the existing user experience from proposed work without inventing delivery commitments. Use the [feature inventory](feature-inventory.md) to prioritize complete feature and completion items.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Existing screens](#existing-screens)
- [Proposed document and file experience](#proposed-document-and-file-experience)
- [Processing and knowledge roadmap](#processing-and-knowledge-roadmap)
- [Deferred research](#deferred-research)
- [Sources](#sources)

## Existing screens

The [application routes](../../src/app/) include the dashboard, documents/review, matter pages and chronology/deadlines, docket detail and bridge controls, ingestion, settings and agents. The [sidebar](../../src/components/Sidebar.tsx) is the navigation source. [Knowledge Graph](../../src/components/KnowledgeGraph.tsx) renders a placeholder; graph-shaped schema is not a completed graph feature.

The document reader renders original PDFs locally with PDF.js and same-origin worker/font assets. Images and escaped small text files have format-specific previews; unsupported types fall back to download. HTML/SVG are not executed as inline evidence. Current preview behavior does not provide OCR text selection or evidence annotations.

Settings separates provider enable switches from active-model pills. Filters only change visible choices; they do not change the saved selection. Multiple active models do not fan out every inference automatically. Agent configuration, run snapshots and recent processing history must not be conflated with a continuously running autonomous agent.

## Proposed document and file experience

| Proposal | Intended behavior | Dependency |
| --- | --- | --- |
| Files catalog | Group originals and derivatives by document, filter by matter/source/processing/review | General derivative registry and permitted document/version lookup |
| Original and searchable views | Always retain Original; offer validated derivative download and version selector | Assembly/validation receipts and coverage metadata |
| Reprocess OCR | Explicit model, selected pages and optional sourced recognition hints | Approved versioned execution; never overwrite originals or prior snapshots |
| Compare and use a version | Explicit primary selection controls future reading/search | Auditable pointer, preserved historic citations, reindex scheduling |
| Historical draft reader | Show the extraction actually used for that draft | Fix history loader's current latest-extraction selection |
| Storage health | Owner-only missing/orphan/duplicate/upload diagnostics | Prefix-limited reconciliation; exclude credentials/configuration objects |

The bounded Doc 8 viewer already supports comparison artifacts; it does not supply the general Files/version-selection feature above. Initial file-library design is read-only browsing and download, with upload/association and version selection following the registry. Destructive file management was not part of that proposal.

## Processing and knowledge roadmap

These are existing proposals and dependencies, not a delivery order or new commitment:

- **OCR quality and rollout:** reviewed reference transcripts and separate scores for text, handwriting, checkboxes, strikeouts and geometry before promoting a provider or widening the pilot.
- **Versioned retrieval:** stable extraction/page chunks precede rebuildable search indexes, embeddings, primary-version indexing and source-aware retrieval.
- **Recognition hints:** matter-scoped names/aliases with source and review state, snapshotted into adapters that support hints; assess hallucinated substitutions as well as recognition gains.
- **Docket-context summaries:** separate target content, docket metadata and selected context documents; require multi-document citations and a preserved context packet before accepting context-derived facts.
- **Identity and access:** reviewed Actor/Observation/Source modeling, individual membership, permissions and audit attribution before broader access.
- **Acquisition and delivery:** authenticated browser download orchestration, Drive grant refresh and explicitly requested Drive delivery; retain reconciliation before retries.
- **Claim research and drafting:** jurisdiction/element/defense/procedure/remedy workflows require sources and human review. The historical requirements artifact does not authorize legal findings.

## Deferred research

AI Search is a proposed retrieval layer, not an authoritative transcript/PDF store. Browser Run is an unvalidated hosted acquisition option; court acceptance and original-file capture remain gates. Sandbox preparation/assembly was researched, but E2B setup was explicitly deferred in the Doc 8 checkpoint. None of these proposals establishes a provisioned service or current commercial entitlement.

## Sources

[SEARCHABLE_PDF_DERIVATIVES.md](../history/archive/2026-10-04/SEARCHABLE_PDF_DERIVATIVES.md), [STORAGE_AND_FILE_LIBRARY.md](../history/archive/2026-10-04/STORAGE_AND_FILE_LIBRARY.md), [DOCUMENT_PROCESSING_STRATEGY.md](../history/archive/2026-10-04/DOCUMENT_PROCESSING_STRATEGY.md), [CLOUDFLARE_EVALUATION.md](../history/archive/2026-10-04/CLOUDFLARE_EVALUATION.md), [OCR_SANDBOX_OPTIONS.md](../history/archive/2026-10-04/OCR_SANDBOX_OPTIONS.md).

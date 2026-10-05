# Features and use cases

Understand what users can do and the limits of each result.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Application purpose](#application-purpose)
- [Capability map](#capability-map)
- [Queues and meaning of success](#queues-and-meaning-of-success)
- [Historical corpus context](#historical-corpus-context)
- [Sources](#sources)

## Application purpose

CaseVault combines a document library, court dockets, matter records, contacts and entities (parties) records, source acquisition and reviewed document processing. Original evidence remains separate from derived text and AI interpretation. The current design serves one configured owner.

## Capability map

| User goal | Implemented local capability | Limit or next step |
| --- | --- | --- |
| Find original evidence | Document and docket pages, matter associations, original previews/downloads | Association counts differ from unique original counts; full-text/semantic retrieval is not established |
| Inspect PDFs | PDF.js canvas preview, page navigation, zoom and download | Does not imply selectable OCR text, annotations or word-aligned highlights |
| Bring in Drive files | Separate authorization, folder/search navigation and source-version import | Up to five files per selection; stored-file cap of 20 MB; expired grants need reconnection |
| Refresh a court docket | Queue an observed URL for the local source bridge | Court challenges require supervised capture; unattended authenticated scraping is unproven |
| Reconcile NotebookLM | Local CLI adapter, remote source listing, upload journal and status receipts | Consumer-session dependency; title matching is not byte equivalence |
| Review documents | Source-based queue policy and explicit flags | Court filings bypass routine intake review, not extraction or human acceptance of AI |
| Configure analysis | Provider controls, multiple selected models, named agents and document instructions | Enabled configuration is not a running agent; pilot approval binds a snapshot |
| Process pilot documents | Fixed ten-document approval, embedded text/OCR, cited draft summaries, separate human decisions | General backlog remains held; partial extraction blocks pilot AI |
| Compare OCR on Doc 8 | Fixed candidate manifest, page receipts, comparison viewer and PDF/analysis endpoints | Work in progress; checkpoint counts are dated; partial PDFs and drafts require review |
| Build claims or a knowledge graph | Prototype structures and a graph placeholder exist | Reviewed legal-analysis automation, identity resolution and graph population remain proposed |

Source: [module guide](../architecture/modules.md), [processing flow](../processing/intake-and-processing.md), and [current state](../status/current-state.md).

## Queues and meaning of success

The ingestion queue represents work; the document review queue represents human attention. One document can have multiple jobs, and an acquisition job can return many filings. A successful upload, successful extraction, successful AI call, structurally valid searchable PDF and accepted interpretation are different outcomes.

Court records with `isFlagged` or `status=flagged` re-enter review. Imported Drive/upload/email records keep the normal review policy. Provider discovery proves connectivity/catalog visibility only. A matched quote establishes passage location, not truth or a legally sound interpretation.

## Historical corpus context

The initial October 3 import recorded 25 Notion lawsuits plus one evidence-collection matter, 54 contacts, 72 role links, two dockets with 117 entries, 506 document associations, 466 distinct original objects, and 118 NotebookLM association/attempt receipts. These are historical totals, not current counts. The notebook receipt total includes a prior failed/retried attempt beyond 117 observed remote sources.

Legacy 510W42 originals were recovered locally against an inventory, not found as 404 existing R2 files. Placeholder OCR and blanket page counts were not promoted as extracted evidence. The imported Notion relationships remain observations, not automatic proof of representation in every matter.

## Sources

[BUILD_STATUS.md](../history/archive/2026-10-04/BUILD_STATUS.md), [DOCUMENT_PREVIEWS.md](../history/archive/2026-10-04/DOCUMENT_PREVIEWS.md), [docs/initial-import-report.json](../initial-import-report.json), [docs/corpus-reconciliation.json](../corpus-reconciliation.json).

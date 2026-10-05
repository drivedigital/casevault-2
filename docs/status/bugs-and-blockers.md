# Bugs and blockers

Track observed defects, operational failures and evidence gaps without conflating them.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Implementation and correctness](#implementation-and-correctness)
- [Operational observations](#operational-observations)
- [Roadmap gaps](#roadmap-gaps)
- [Closing an item](#closing-an-item)
- [Sources](#sources)

## Implementation and correctness

| ID | Issue and impact | Evidence / next verification |
| --- | --- | --- |
| B01 | v1 accepted filing headers as complete extraction while body text remained scanned | v2 correction and [regression tests](../../tests/processing.test.ts) exist; preserve v1 receipts and verify deployment/new approved runs before expanding |
| B02 | Body heuristic is not visual completeness detection | [PDF extraction](../../processor/pdf.ts); handwriting/tables/image regions still need review and future coverage work |
| B03 | Historical processing view selects the latest extraction, not each draft's own | [processingHistory](../../src/lib/processing.ts); implement version-pinned viewing before presenting historical citations against a selectable latest version |
| B04 | Some Dots receipts have raw `complete` state with quota text | [comparison Worker](../../comparison-worker/worker.mjs) read/coverage paths correct classification; POST replay guard still returns raw complete receipts even with retry header. Static discrepancy, not exercised here |
| B05 | Comparison runner skips every existing local receipt, including failures | [runner](../../scripts/run-document-comparison.mjs); reconcile server state and choose explicit retries; do not assume resume means retry failures |
| B06 | Searchable PDF text can be page-anchored, with encoding replacement and unverified alignment | [assembler](../../scripts/assemble-comparison-pdfs.py); inspect search/copy, Unicode and word placement; raster equality alone is insufficient |
| B07 | AI schema/interpretation limitations | Pilot document 174 had malformed JSON/unsupported kind; successful drafts also contained unsupported interpretations. [Pilot evidence](../processing-pilot-verification.json); retain raw output and review independently |
| B08 | Comparison analysis receipts are reused even when failed | [analysis handler](../../comparison-worker/worker.mjs); a repeated POST is not a fresh inference. Recovery/version policy needs an explicit implementation decision before retrying |

B04–B06 and B08 are local source observations, not claims of newly reproduced live failures. The existing [comparison tests](../../tests/ocr-comparison.test.mjs) were untracked at baseline; they do not cover every publication/analysis/retry scenario and were not run here.

## Operational observations

| ID | Last recorded condition | Current evidence gap |
| --- | --- | --- |
| O01 | Standalone OCR Worker upload denied; Gemini-control R2 write authentication error | Later app/comparison deployments are separate; recheck the specific service/control only in a new operational task |
| O02 | Main app asset upload returned 401; integration wrapper served selected R2 assets | Reproduce intended asset routing or fix normal uploads in the next deployment; avoid silently serving stale assets |
| O03 | Doc 8 comparison incomplete | Earlier checkpoint: 86 receipts. Newer local cache: 114 effective receipts, no artifacts/analyses ([timestamp and limits](../operations/handoff.md#newer-saved-local-observation)); live state/publication/browser checks unverified |
| O04 | Provider availability failures | Gemini 503, Qwen 429, NVIDIA timeouts/empty outputs and HF quota/SSE errors; no inference quality should be inferred from missing output |
| O05 | Court HTTP challenge | Supervised full capture remains fallback; unattended authenticated downloads not demonstrated |
| O06 | Drive token expires and outbound delivery is absent | Reconnect read-only grant; automatic refresh and delivery require separate implementation |
| O07 | Nasca notebook document 56 failed historically | Reconcile remote IDs/readiness before any new upload; archived counts are not live source state |

## Roadmap gaps

General backlog rollout, reliable annotation-aware OCR, derivative registry/primary selection, multi-document citations, search/retrieval, the Files view, shared actor modeling, membership/access expansion and automated graph population remain tracked proposals. See [roadmap](../product/ux-and-roadmap.md); do not treat these gaps as fresh incidents or assign invented priorities.

## Closing an item

Record the specific code change and verification result, then add a dated deployment/execution observation when applicable. Keep the original failure and receipt. A unit test, successful HTTP call or changed configuration alone closes only the aspect it actually verifies.

## Sources

[OCR_MODEL_BENCHMARK.md](../history/archive/2026-10-04/OCR_MODEL_BENCHMARK.md), [DOC8_WORKFLOW_CHECKPOINT.md](../history/archive/2026-10-04/DOC8_WORKFLOW_CHECKPOINT.md), [SEARCHABLE_PDF_DERIVATIVES.md](../history/archive/2026-10-04/SEARCHABLE_PDF_DERIVATIVES.md), [docs/ocr-round-2-verification.json](../ocr-round-2-verification.json).

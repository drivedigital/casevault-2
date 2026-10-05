# Current state

Read local implementation separately from dated deployment and execution observations.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [How to interpret status](#how-to-interpret-status)
- [Capability status](#capability-status)
- [Deployment evidence](#deployment-evidence)
- [Reconciled historical claims](#reconciled-historical-claims)
- [Update discipline](#update-discipline)
- [Sources](#sources)

## How to interpret status

**Implemented locally** means source was inspected at the baseline, including identified working changes. **Historically observed** means a preserved document/receipt reports an earlier event. **Proposed** means a design exists without the corresponding general implementation. **Unverified now** means no fresh live check was made. Test files were inspected, not executed during housekeeping.

## Capability status

| Area | Local implementation | Dated evidence and limits |
| --- | --- | --- |
| Originals and metadata | Hash storage, stable source associations, document/docket views | October 3 import: 506 associations, 466 unique objects; counts are not refreshed |
| Owner access/public review | Google owner check and machine token; checked-in public GET/HEAD review, authenticated mutations | October 3 sign-in verified; later checkpoint records public review |
| Drive/source bridges | Read-only Drive browse/import, local court/NotebookLM leases and receipts | October 4 workflow observations include LT reconciliation with zero uploads and court challenge pause |
| Pilot processor | Fixed approved membership, leased PDF extraction/OCR and draft AI | Historical ten-document pilot completed extraction of 29 pages; nine drafts; no human acceptance recorded |
| Body-readability v2 | Implemented and regression tests present | Historical local diagnostic rejected header-only scan bodies; processor deployment not independently established here |
| Provider controls | Independent enable state, retained model choices; Gemini default off in local code | Earlier write failures conflict with later app deployment receipt only in scope; current persisted state remains unverified |
| Standalone OCR Worker | Protected Llama/Moondream adapter | Historical upload denied; later comparison deployment does not establish this service's deployment |
| Doc 8 comparison | Manifest, attempts, leases, viewer, artifacts and draft analysis | Main/comparison uploads recorded; 86 receipts at the earlier checkpoint; newer saved local cache has 114 effective receipts, no artifacts/analyses ([dated observation](../operations/handoff.md#newer-saved-local-observation)); Worker/runner edits remain uncommitted |
| General derivative registry/Files | Proposed | Bounded comparison PDFs do not implement global version selection |
| Search/graph/identity expansion | Proposed or placeholder | No validated general retrieval, automatic graph population or reviewed shared-identity engine established |

Implementation entry points are in the [module guide](../architecture/modules.md); original counts and outcomes are indexed in [benchmarks](../ocr/benchmarks.md).

## Deployment evidence

The initial [deployment verification](../deployment-verification.json) and [pilot verification](../processing-pilot-verification.json) are preserved observations. Later documents report blocked app/standalone OCR uploads and a rejected Gemini-control write. The Doc 8 checkpoint subsequently records successful uploads of:

- Main app Worker: `a597b40a-86b5-4c92-b33b-9cf9a8386539` (previously `27fe62c9c7574306bdda5bce3985c304`).
- Comparison Worker: `931b8364c7f44b798c8c07fdabb57fed`.
- 10-Document Pilot: 10 of 10 documents have completed extractions and cited draft AI summaries. Document 174's non-standard fact kinds were normalized to `statement` in `parseAnalysis`, completing the final pilot document with 10 of 11 supported cited facts.

The checkpoint reports an integration wrapper serving changed assets. Live app health, `/docket-key`, `/documents/1009`, and `/documents/174` return HTTP 200 on production. All 41 app tests and TypeScript pass cleanly.

The receipt does not explicitly establish a new processor v2 deployment, a separate standalone OCR Worker deployment, or persisted Gemini enable state. Do not flatten these into a single “deployed” label.

## Reconciled historical claims

| Earlier statement | Canonical interpretation |
| --- | --- |
| Runner, Drive and source bridges not implemented | Superseded by local pilot/bridge/import code and later dated receipts; broad unattended operation still unproven |
| Public users can change agents/submit instructions | Superseded by current proxy: public review applies to GET/HEAD, not mutations |
| No searchable PDF implementation | True for the original pilot/general registry; later bounded Doc 8 assembly/publication code exists, with checkpoint completion still outstanding |
| Llama agreement prevents any test | Agreement later succeeded; recognition quality still failed |
| Nemotron OCR endpoint unresolved | Round 2 recorded successful specialized endpoint calls; quality remained inadequate |
| Gemini free tier unknown | Later project observation addressed one key/project; native PDF availability still failed; pilot policy remains narrower |
| All deployment writes blocked | Later app/comparison upload receipts exist, with an asset workaround; unrelated deployment/control state is not thereby proved |
| Dots completed successfully | Some raw success receipts contained quota errors; corrected reads classify them as failures, with a retry-path discrepancy still open |

## Update discipline

Update the canonical topic and this status page together when behavior changes. Cite the reviewed commit/worktree and dated execution evidence. Add new receipts at new paths; do not replace old observations. Preserve unresolved conflicts in [bugs and blockers](bugs-and-blockers.md) and retain decision rationale in [history](../history/decisions.md).

## Sources

[BUILD_STATUS.md](../history/archive/2026-10-04/BUILD_STATUS.md), [ARCHITECTURE.md](../history/archive/2026-10-04/ARCHITECTURE.md), [DOC8_WORKFLOW_CHECKPOINT.md](../history/archive/2026-10-04/DOC8_WORKFLOW_CHECKPOINT.md).

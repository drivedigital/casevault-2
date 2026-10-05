# Operational handoff

Resume ongoing work from a dated checkpoint without assuming it finished or repeating successful inference.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Baseline and active work](#baseline-and-active-work)
- [Last recorded comparison](#last-recorded-comparison)
- [Newer saved local observation](#newer-saved-local-observation)
- [Resume prerequisites](#resume-prerequisites)
- [Continuation sequence](#continuation-sequence)
- [Other open work](#other-open-work)
- [Sources](#sources)

## Baseline and active work

The documentation baseline is commit `dbed6304a7d5235feb8e55dc7d94096d34f4ac06` plus existing local changes to `comparison-worker/worker.mjs` and `scripts/run-document-comparison.mjs`, and untracked `tests/ocr-comparison.test.mjs`. Their hashes are preserved in the [baseline manifest](../history/baseline-2026-10-04.json). They are not claimed as deployed or tested by this overhaul.

The most recent supplied operational handoff is the **October 4 Doc 8 full-workflow comparison checkpoint**. Its instructions to run, publish, commit or push remain historical context. Documentation housekeeping did none of those operations. E2B setup was deferred, Gemini remained paused, and Dots3-Note was excluded from that comparison.

## Last recorded comparison

| Field | Checkpoint value |
| --- | --- |
| Document | 1008; 13 physical pages; original SHA-256 `9b7583985dfc3e190ff5b5eb7a6904f645c40eea1abb35032bfbc82880363cee` |
| Comparison | `bba21ba9-d383-4cde-bb67-c60d06db77b9` |
| Page receipts | 86 observed; later arrivals were possible |
| PDFs published | None at that observation |
| Coverage and failures | See per-candidate table below; no fresh readback performed |
| Remaining validation | Browser behavior, full PDF publication, AI analysis, comparison-specific verification and human quality review |

| Candidate | Usable / 13 | Failed | Missing |
| --- | ---: | ---: | ---: |
| Kimi | 5 | 5 | 3 |
| Qwen | 2 | 11 | 0 |
| Nano Omni | 2 | 2 | 9 |
| Gemma | 6 | 0 | 7 |
| Dots-OCR | 3 | 10 | 0 |
| DeepSeek-OCR-2 | 10 | 2 | 1 |
| Nemotron OCR v2 | 0 | 13 | 0 |
| Moondream | 0 | 12 | 1 |
| Llama 90B | 0 | 2 | 11 |
| DeepSeek Flash | 0 | 1 | 12 |

These are checkpoint counts, not the current state of the live run. Model outcomes and human annotation qualifications are in [benchmarks](../ocr/benchmarks.md).

## Newer saved local observation

The saved `.private/doc8-comparison/state.json` for the same comparison contains **114 effective page receipts: 40 complete and 74 failed**, with **0 artifacts and 0 analyses**. Its file modification timestamp is **2026-10-04T21:53:24.060832Z UTC**, corresponding to **2026-10-04 16:53:24.060832 CDT (America/Chicago, UTC−05:00)**. This is file metadata for a cached response, not an independently established server observation time or fresh live read. Its SHA-256 is `234ae604b65b933fab6ddad90057ae65132fb74683a7b8acf55465fd423351d4`. The earlier 86-receipt table remains a historical checkpoint; reconcile this cache with current server state before continuation. Raw individual page files can still differ from effective server classifications.

Use ISO 8601 UTC for receipts and show an explicit local timezone/offset when presenting handoff times. Date-only historical entries retain unknown time precision. See [approved cleanup and time convention](approved-cleanup.md#time-convention).

## Resume prerequisites

For an explicitly requested continuation, establish current server state before running the local runner. Locate the original PDF, approved page renders, private run manifest/receipts, model/agent snapshot, and credentials through the existing private mechanism. Compare their hashes to the approved manifest. Do not copy original text, images, credentials or generated PDFs into Git.

The runner uses `.private/doc8-comparison/run.json` if present; without it, it can create another comparison. It skips any existing local page receipt, including failures. Recover server receipts via GET before choosing what needs execution. Its three concurrent candidate workers process pages sequentially per candidate.

The corrected reader classifies historical Dots quota-text “complete” receipts as failures, but the page POST replay guard still returns raw `state=complete` receipts before considering explicit retry. This is a static code discrepancy: confirm and resolve it in a separate implementation task before expecting a retry to repair such a receipt. Do not delete or falsify historical evidence to bypass it.

## Continuation sequence

1. Reconcile current server manifests/page states with local receipts, distinguishing missing pages, failed attempts, partial output and already completed inference.
2. Under the current approved continuation scope, resume only necessary pages or bounded explicit retries. Preserve attempts and respect provider pauses/limits. Do not substitute paid endpoints or change the candidate manifest silently.
3. Assemble only candidates with all 13 receipts and at least one usable page. Validate original preservation, dimensions, coverage, search/copy and warnings; page-anchored text remains approximate.
4. Publish validated derivatives through the authenticated artifact endpoint, using exact server-effective coverage and the matching manifest/pages. Published artifacts require a new version for later improvements.
5. Generate draft analysis using the snapshotted agent and available pages. Comparison analysis permits visibly partial coverage; pilot analysis does not. Existing analysis receipts, including failure receipts, are returned on repeat POST rather than automatically rerun.
6. Inspect app/document/comparison views, public reads versus mutation rejection, downloads, physical-page citations and prompts. Record actual test and deployment results, then seek human quality review of the artifacts.

Exact historical commands and deployment IDs remain in the [unaltered checkpoint](../history/archive/2026-10-04/DOC8_WORKFLOW_CHECKPOINT.md). Its final commit/push instruction is not an action performed by this documentation update.

## Other open work

The pilot recorded document 174 with completed OCR but invalid AI output and no accepted run. General backlog expansion remains held. Processor v2 deployment, current provider settings, remote notebook status and standalone OCR Worker availability need separately scoped verification. The [blocker ledger](../status/bugs-and-blockers.md) identifies the local evidence and gaps.

## Sources

[DOC8_WORKFLOW_CHECKPOINT.md](../history/archive/2026-10-04/DOC8_WORKFLOW_CHECKPOINT.md), [PROCESSING_PILOT.md](../history/archive/2026-10-04/PROCESSING_PILOT.md).

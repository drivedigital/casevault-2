# Intake and processing

Follow original preservation, job execution and draft review across the separate processing paths.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Intake and original identity](#intake-and-original-identity)
- [Fixed database pilot](#fixed-database-pilot)
- [Body readability and OCR policy](#body-readability-and-ocr-policy)
- [AI and review](#ai-and-review)
- [Separate comparison path](#separate-comparison-path)
- [API map](#api-map)
- [Sources](#sources)

## Intake and original identity

Court manifests preserve every docket row, including restricted/deleted/metadata-only entries. Original bytes are hashed before storage and linked through stable source identities. [Bootstrap](../../src/app/api/intake/bootstrap/route.ts) and [object upload](../../src/app/api/objects/route.ts) use trusted machine access. Import replay reuses identities and idempotency keys; it is not an update mechanism for reviewed records.

Drive imports use actual metadata/downloaded bytes or native-document PDF exports. The [Drive adapter](../../src/lib/drive.ts) records source ID/version and exported artifact hash, with per-file outcomes. Distinct associations can share an original hash. The general **Queue extraction** action creates durable work; it does not itself invoke OCR or AI.

## Fixed database pilot

[Processing orchestration](../../src/lib/processing.ts) installs ten distinct originals with one Drive, three court and six upload records. Historical approved IDs were 1007; 1, 3, 4; and 152, 154, 158, 161, 167, 174. Approval rejects outside-pilot documents or changed originals and snapshots agent instructions, explicit model, document prompt, original identity and extraction version.

1. Save a request as `awaiting_approval`, then explicitly approve it to create a `pilot_process` job and run.
2. Claim one pilot document at a time with a ten-minute lease; renew during work. Expired claims remain subject to the three-attempt cap, and stale results cannot update the run.
3. Verify original hash/size and inspect PDF pages. Reuse only a compatible, validated complete receipt or previously usable OCR pages from the same policy.
4. Save content-addressed extraction JSON and a display copy of text. Partial extraction preserves usable pages and pauses AI.
5. Run bounded AI groups, retain raw responses and validated batches, and save a cited draft. Unknown pricing/entitlement, provider pauses, malformed output and unsupported passages remain visible.
6. Record human acceptance/rejection separately from extraction and AI success. The pilot does not automatically create claims, merge people, populate the graph or deliver to notebooks.

The [processor configuration](../../processor/wrangler.jsonc) schedules a five-minute tick; `ENABLED` gates scheduled ticks only. It is not a universal switch blocking direct app tick requests.

## Body readability and OCR policy

The local policy is `text-first-ocrspace-body-v2`, defined in [processing types](../../src/lib/processing-types.ts) and [PDF extraction](../../processor/pdf.ts). It excludes the top 12% and bottom 8% for body-readability assessment, applies the existing character/corruption heuristic, and retains margin text when body text passes. Header-only scans therefore need OCR. This heuristic does not establish complete coverage of handwriting or image regions on otherwise readable pages.

Local implementation limits: PDF originals up to 50 × 1024² bytes and 200 pages; single-page OCR derivatives at most 1,000,000 bytes; up to 30 new OCR calls per run. [OCR.space adapter](../../processor/worker.ts) requests Engine 3, orientation detection and table handling. These are code limits, not refreshed service-plan claims. Provider failures leave pages unavailable/partial; no paid OCR fallback is configured.

Historical v1 receipts remain readable. New approvals snapshot v2, and attempting to execute an old-policy snapshot is rejected with an instruction to create a new request. The separate cache prefix prevents silent reuse of false-complete v1 extractions.

## AI and review

The pilot limits each analysis group to 20,000 text characters and at most twelve groups. Completed batch receipts can be reused after interruption. Facts use target-page references and supporting quotes; unmatched passages are flagged. Source content remains untrusted input. Literal passage matching cannot validate an interpretation, and pilot observations included unsupported narrative additions.

[Free inference](../../src/lib/free-inference.ts) checks enabled provider state and the applicable model policy before new calls. The pilot's explicit NVIDIA model and OpenRouter free variant rules differ from the comparison candidate list. Provider credentials or catalog discovery alone do not establish eligibility.

## Separate comparison path

Doc 8 uses the [comparison Worker](../../comparison-worker/worker.mjs), its own approved manifest, five-minute page leases, bounded attempts and R2 receipts. It does not claim database pilot or backlog jobs. PDF assembly and partial draft analysis operate on this comparison's receipts. See [derivatives and versioning](derivatives-and-versioning.md) and [handoff](../operations/handoff.md).

## API map

| Interface | Responsibility |
| --- | --- |
| `/api/objects`, `/api/intake/*` | Original storage and source association |
| `/api/drive/*`, `/api/bridges/*` | Authenticated source workflows; bridge leases add machine authorization |
| GET/POST `/api/processing/pilot` | Read manifest/runs; trusted installation/migration |
| POST/PATCH `/api/processing-instructions` | Save request / explicit approval |
| GET `/api/processing/documents/:id` | Requests, runs and selected extraction for history |
| PATCH `/api/processing/runs/:id` | Retry or human decision |
| POST/PATCH `/api/processing/tick` | Machine claim/execution or lease renewal |
| `/api/ocr-comparisons/*` | App bridge to the separate comparison service |

Consult [route implementations](../../src/app/api/) for validation and authorization; this documentation adds no API changes.

## Sources

[PROCESSING_PILOT.md](../history/archive/2026-10-04/PROCESSING_PILOT.md), [DOCUMENT_PROCESSING_STRATEGY.md](../history/archive/2026-10-04/DOCUMENT_PROCESSING_STRATEGY.md), [QUEUES_AND_BRIDGES.md](../history/archive/2026-10-04/QUEUES_AND_BRIDGES.md).

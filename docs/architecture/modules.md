# Module guide

Find the implementation and tests responsible for each capability.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Application modules](#application-modules)
- [Experimental and operational modules](#experimental-and-operational-modules)
- [Verification boundaries](#verification-boundaries)
- [Sources](#sources)

## Application modules

| Module | Entry points | Responsibility and checks |
| --- | --- | --- |
| Identity and access | [proxy](../../src/proxy.ts), [Supabase auth](../../src/lib/supabase-auth.ts), [auth routes](../../src/app/auth/) | Owner/session boundary; [security tests](../../tests/security.test.ts) |
| Original intake | [intake routes](../../src/app/api/intake/), [objects](../../src/app/api/objects/route.ts), [import contract](../../src/lib/import-schema.ts) | Stable associations, hash-verified storage and queued work |
| Drive | [adapter](../../src/lib/drive.ts), [selector](../../src/components/DriveFileSelector.tsx) | Separate read-only grant, browse/export/import; [workflow settings tests](../../tests/workflow-settings.test.ts) |
| Source bridges | [cloud contracts](../../src/lib/bridges.ts), [local adapters](../../bridges/) | Claims, leases, source receipts, challenge/timeout recovery; [notebook tests](../../tests/notebook-bridge.test.ts), [court tests](../../bridges/test_nyscef.py) |
| Provider settings | [providers](../../src/lib/providers.ts), [controls](../../src/lib/provider-controls.ts), [settings UI](../../src/components/ProviderSettings.tsx) | Discovery, active models and enable state; [control tests](../../tests/provider-controls.test.ts) |
| Agents and pilot | [agent workspace](../../src/lib/agent-workspace.ts), [processing](../../src/lib/processing.ts), [free inference](../../src/lib/free-inference.ts) | Approved snapshots, claims, extraction/AI orchestration and review |
| Extraction | [PDF extraction](../../processor/pdf.ts), [processor](../../processor/worker.ts), [contracts](../../src/lib/processing-types.ts) | Body readability and bounded OCR; [processing tests](../../tests/processing.test.ts) |
| Document UX | [document page](../../src/app/documents/[id]/page.tsx), [viewer](../../src/components/DocumentViewer.tsx), [preview](../../src/components/FilePreview.tsx), [history](../../src/components/ProcessingHistory.tsx) | Original rendering, processing requests, draft facts and decisions |
| Review policy | [policy](../../src/lib/review-policy.ts) | Court routine-review bypass with explicit flag override; [tests](../../tests/review-policy.test.ts) |

## Experimental and operational modules

| Module | Source | Boundary |
| --- | --- | --- |
| Standalone Cloudflare OCR | [Worker](../../ocr-worker/worker.mjs), [tests](../../tests/ocr-worker.test.mjs) | Bounded image transcription, no searchable-PDF generation or backlog execution |
| Doc 8 comparison | [Worker](../../comparison-worker/worker.mjs), [app bridge](../../src/app/api/ocr-comparisons/[[...path]]/route.ts) | Fixed original, independent R2 ledger, public reads/authenticated writes |
| Comparison runner | [runner](../../scripts/run-document-comparison.mjs) | Resumes local page receipt gaps; submitting it can invoke hosted inference |
| PDF assembly | [assembler](../../scripts/assemble-comparison-pdfs.py) | Local preparation/validation from cloud receipts; no local OCR |
| Reconciliation and import | [preparation](../../scripts/prepare-corpus.py), [import](../../scripts/import-corpus.mjs), [verification](../../scripts/verify-deployment.mjs) | Operator workflows; some commands write fixed documentation receipt paths |
| Benchmark tools | [vision](../../scripts/benchmark-vision.mjs), [streaming](../../scripts/benchmark-vision-stream.mjs), [baseline](../../scripts/inspect-pdf-baseline.ts) | Opt-in experiments; raw outputs belong in ignored private storage |

## Verification boundaries

The baseline contains uncommitted changes to the comparison Worker and runner, plus an untracked [comparison test file](../../tests/ocr-comparison.test.mjs). Those bytes were preserved by the documentation overhaul. The test file covers write authentication, approved images, receipt reuse, leases and quota-error classification; its presence does not establish a passing run or published-artifact coverage.

[CI](../../.github/workflows/checks.yml) defines type checking, JavaScript/TypeScript tests, Python bridge tests, lint and Worker build. Those application checks were not run for this documentation-only change. See [documentation validation](../history/validation.md).

## Sources

[DEPENDENCIES.md](../history/archive/2026-10-04/DEPENDENCIES.md), [DOC8_WORKFLOW_CHECKPOINT.md](../history/archive/2026-10-04/DOC8_WORKFLOW_CHECKPOINT.md).

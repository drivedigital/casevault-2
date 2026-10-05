# Doc 8 full-workflow comparison — checkpoint 2026-10-04

## Operator instructions and scope

Run the entire 13-page Doc 8 through ten hosted candidates, retain separate searchable PDF outputs, and test the Document Processing workflow in CaseVault. Gemini remains paused; Dots3-Note is excluded. Cloudflare account operations must use the connected integration, not browser or Wrangler account requests. Do not check account billing allowances. The operator subsequently **deferred E2B setup**: no sandbox, model installation or E2B endpoint was provisioned.

The operator then requested a durable checkpoint before a potential ChatGPT usage limit. This document is a live handoff, not a claim that the comparison has finished.

## Source, app record and approved execution

- Repository: `/Users/dangeorge/Documents/GitHub/casevault-2`, branch `main`, private remote `drivedigital/casevault-2`.
- Source: `/Users/dangeorge/Downloads/8.pdf`, 629,519 bytes, 13 pages.
- SHA-256: `9b7583985dfc3e190ff5b5eb7a6904f645c40eea1abb35032bfbc82880363cee`.
- Uploaded through the existing authenticated CaseVault `/api/objects` endpoint, then registered through `/api/intake/bootstrap`. Document ID **1008**. Original R2 key: `casevault-2/originals/{sha256}`.
- [Doc 8 in the app](https://casevault-2.dan-2eb.workers.dev/documents/1008).
- Comparison ID: **bba21ba9-d383-4cde-bb67-c60d06db77b9**.
- [App comparison viewer](https://casevault-2.dan-2eb.workers.dev/api/ocr-comparisons/runs/bba21ba9-d383-4cde-bb67-c60d06db77b9/view).
- Dedicated hosted Worker: `casevault-2-ocr-comparison`; app service binding `OCR_COMPARISON` forwards public reads and authenticated writes.
- The original bytes and all page-image hashes were snapshotted at approval. Images are existing Poppler PNG renders at 130 DPI in ignored `.private/ocr-benchmark/page-01.png` through `page-13.png`. Local rendering is PDF preparation, **not local OCR**.
- AI analysis uses the existing explicitly bound **Document Processing · NVIDIA** agent, `nvidia/nemotron-3.5-lightning-30b-a3b`; agent instructions/model were copied into the approved comparison manifest. No silent agent binding changes.

## Hosted comparison candidates

These are ten previously tested/available candidates, a provisional operational shortlist rather than a measured accuracy top ten:

| Comparison ID | Hosted model |
| --- | --- |
| kimi | NVIDIA `moonshotai/kimi-k3` |
| qwen | OpenRouter `qwen/qwen3.8-27b:free` |
| nano | NVIDIA `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` |
| gemma | NVIDIA `google/gemma-4-31b-it` |
| dots | Hugging Face `MohamedRashad/Dots-OCR` |
| deepseekocr | Hugging Face `prithivMLmods/DeepSeek-OCR-2-Unlimited-OCR` |
| nemotronocr | NVIDIA specialized `nvidia/nemotron-ocr-v2` |
| moondream | Cloudflare `@cf/moondream/moondream3.1-9B-A2B` |
| llama90 | NVIDIA `meta/llama-3.2-90b-vision-instruct` |
| deepseekflash | NVIDIA `deepseek-ai/deepseek-v4.1-flash` |

NVIDIA calls require current documented free prototype evidence. OpenRouter requires zero-priced image inference and an explicit zero-price routing cap. Public Hugging Face Spaces do not provision paid hardware. Cloudflare is the owner-authorized existing Workers AI integration; it is **metered**, and this test does not claim all inference was zero-cost or verify remaining included allowance. No account billing/allowance inspection was performed.

## Current checkpoint observations (not final results)

Live API inspection found 86 page receipts at the checkpoint. New receipts can arrive after this document was written. No PDF artifacts had been published at that moment.

| Candidate | Usable receipts / 13 | Failed receipts | Still missing at checkpoint |
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

Qwen's upstream shared pool returned HTTP 429 after two pages. Dots returned ZeroGPU quota text inside an `event: complete` response; the initial adapter mislabeled those as complete. The corrected reader/assembler classifies these as failures and preserves the raw historical receipt. DeepSeek-OCR-2 also returned SSE service errors. Kimi returned some empty content; long NVIDIA requests returned HTTP 500/524. A first runner connection broke with Node 26 HTTP/2 session errors. The runner now explicitly imports Undici fetch with HTTP/2 disabled; resume missing pages rather than discarding saved outputs.

Two adapter corrections were made after early failures: Nemotron OCR v2's Build page says “Using free API for development” rather than the chat pages' “Free Endpoint Available”; the entitlement matcher now recognizes the exact current declaration. Moondream response handling now accepts a wrapped result and records a bounded response-shape diagnostic for empty output. These changes require retries of failed pages; earlier failures are not automatically successes.

## Durable storage and workflow boundary

Workspace: `b37e40d6-4746-490c-9b73-ea46e15e2b01`. R2 bucket: `legal-evidence-arena`.

Comparison namespace:

`casevault-2/workspaces/{workspaceId}/ocr-comparisons/{comparisonId}/`

- `manifest.json`: immutable approved source, models, page hashes, renderer, prompt and agent snapshot.
- `pages/{modelId}/{page}.json`: latest page lookup (updated only for explicit retry).
- `attempts/{modelId}/{page}/{leaseToken}.json`: immutable attempt receipt for calls made by the revised adapter; first-version receipts predate this addition.
- `leases/{modelId}/{page}.json`: conditional R2 claim with a five-minute lease; stale-token completions rejected. Maximum three explicit attempts per page.
- `models/{modelId}/{pdfSha256}.pdf`: immutable searchable derivative.
- `models/{modelId}/pages.json`: page transcripts, warnings, source image hashes and receipt references.
- `models/{modelId}/artifact.json`: immutable coverage, geometry, PDF hash/size, structural validation and review state.
- `models/{modelId}/analysis.json`: snapshotted agent's draft summary/facts, passage-match results, raw AI response and errors.

Supabase stores the imported document association/provenance. This comparison ledger is currently **R2-backed**, not a new Supabase processing-run registry. It does not consume or expand the original fixed pilot or backlog. General document workflows remain on the existing database ledger; this bounded comparison is separate. No legal-record edits, accepted facts, Knowledge Graph population or NotebookLM deliveries occur automatically.

The comparison API restricts mutations to the trusted credential. The app proxy additionally permits the authenticated owner and substitutes the server-held machine credential through the service binding. Public visitors can view results and derivatives. The dedicated Worker requires its machine credential directly. Do not copy keys into documentation, browser code, shell arguments or Git.

## Searchable PDF behavior and remaining validation

`scripts/assemble-comparison-pdfs.py` uses PyMuPDF **only to assemble/validate PDF derivatives**; no local OCR engine is invoked. Originals remain unchanged. Each derivative retains all 13 original physical pages. Successful pages get invisible text; failed pages retain the source image without a newly added OCR layer.

- Nemotron OCR uses returned word coordinates, clamped to page bounds; alignment is still unreviewed.
- Transcript-only models use a **page-anchored** invisible text layer. Search resolves to the right page, but selection/highlight placement is approximate. This is a labeled draft, not a word-aligned OCR PDF.
- Partial outputs identify the exact coverage. Zero successful pages produce an actionable failure, **not a misleading searchable PDF**.
- Structural validation compares original/derivative raster pixels for every page, page dimensions/count and presence of added searchable text. Human accuracy and word alignment remain separate, unverified decisions.
- Output directory: `output/pdf/doc8-comparison/`. It must stay out of Git because it contains case material.
- Local private receipts, raw results and scripts' state: `.private/doc8-comparison/`.

Operator-corrected ground truth: physical page 12 paragraph 2 starts “ORDERED AND ADJUDGED that, pursuant to MHL § 81.16(c)(4), immediately after the event...”. The operator says the crossed-out text is invalidated; statutory transcription under the strokes is a fidelity issue, not the sole substantive pass/fail criterion. Check both crossed-out paragraphs, checkbox state and handwritten additions separately.

## Code and deployment receipts

- `comparison-worker/worker.mjs`, `comparison-worker/wrangler.jsonc`: bounded hosted model execution, durable receipts, PDF publication, draft analysis and comparison viewer.
- `src/app/api/ocr-comparisons/[[...path]]/route.ts`: authenticated app/service bridge and public reads.
- `src/app/documents/[id]/page.tsx`: comparison links on Doc 8's document page.
- `wrangler.jsonc`, `cloudflare-env.d.ts`: service binding configuration/types.
- `scripts/run-document-comparison.mjs`: resumable page runner (three candidate documents in flight; sequential pages per candidate).
- `scripts/assemble-comparison-pdfs.py`: PDF assembly, hashes, all-page visual preservation and text validation.
- `scripts/prepare-integration-deployment.mjs`: offline Worker/static-asset payload preparation.

Cloudflare integration uploads succeeded:

- Initial fail-closed comparison Worker probe: `49876ed77ce14afc9274ae7da8373f27`.
- Latest comparison Worker at checkpoint: **931b8364c7f44b798c8c07fdabb57fed**.
- Main CaseVault Worker: **27fe62c9c7574306bdda5bce3985c304**, startup 26 ms.

The connector's direct asset-upload request with the returned upload JWT received HTTP 401. To preserve integration-only deployment, existing static assets were retained; the three changed assets were uploaded to R2 through the integration and served by a small entry wrapper. Their keys use `casevault-2/static/{assetHash}/{fileName}`. No fallback browser or Wrangler account deployment was used. The build artifact `.open-next/integration-worker.js` contains the static override map and is ignored; preserve/recreate it for an integration redeploy. Normal future deployments must either upload assets correctly or reproduce this wrapper, not silently keep stale assets.

TypeScript passed; the OpenNext production build completed; 36 existing app tests passed before final comparison-specific verification. Live app health and the new app comparison API returned HTTP 200. Browser inspection, complete PDF publishing, AI analysis and comparison-specific tests are **still outstanding at this checkpoint**.

## Exact resume sequence

1. Read this document and the newest runner log/state. Do not provision E2B; the operator deferred it.
2. From `/Users/dangeorge/Documents/GitHub/casevault-2`, run `node scripts/run-document-comparison.mjs`. It reuses `.private/doc8-comparison/run.json`, skips existing page receipts, and resumes missing ones. Credentials come from ignored `.env.local` through `scripts/runtime-credentials.mjs`.
3. Explicit page retry: authenticated POST `/api/ocr-comparisons/runs/{id}/pages/{modelId}/{physicalPage}` with `Content-Type: image/png`, the approved image bytes, and `X-OCR-Retry: true`. Refresh the corresponding private receipt. Retry is limited to three attempts; do not switch to paid endpoints or retry quota failures in a tight loop.
4. Verify current server page states. Existing local Dots receipts may retain the earlier `complete` label, but quota text must be treated as failure by the assembler and current server reader.
5. Assemble when all 13 receipts exist for a candidate: `.private/pdf-env/bin/python scripts/assemble-comparison-pdfs.py`. The local environment has PyMuPDF 1.28.2; this is PDF assembly, not OCR. Inspect representative rendered PDFs before publication.
6. Publish each derivative using authenticated multipart POST `/api/ocr-comparisons/runs/{id}/artifacts/{modelId}` with fields `pdf` (application/pdf file), `pages` (JSON string), `manifest` (JSON string from the model's private artifact.json). Coverage must exactly match effective successful server receipts. All 13 pages need receipts; zero usable pages cannot publish. Artifacts are immutable; a later improved version requires a new comparison/version.
7. Run authenticated POST `/api/ocr-comparisons/runs/{id}/analysis/{modelId}`. Partial extraction may produce an explicitly partial draft with only available pages. Unsupported passages stay flagged; no human acceptance is implied.
8. Inspect [Doc 8](https://casevault-2.dan-2eb.workers.dev/documents/1008) and the comparison viewer, verify public read versus mutation denial, PDF downloads, page citations, warnings and saved prompts. Run tests/typecheck/lint; document specific failures and actual coverage.
9. Update this checkpoint and a final result table, deployment receipts and validation evidence; commit and push to the existing remote. Do not commit private transcripts, PDFs or credentials.

If interrupted, server receipts survive, so recover those via GET rather than repeating successful inference. The operator's request is not complete until artifacts and usable results/actionable failures are presented for review.

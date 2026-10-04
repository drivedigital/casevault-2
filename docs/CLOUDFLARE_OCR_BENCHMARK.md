# Cloudflare OCR evaluation — 2026-10-04

## Method and integration

All Cloudflare account operations and inference calls in this evaluation used the connected Cloudflare integration (`mcp__codex_apps__cloudflare_execute`). No browser or Wrangler account requests were used after the operator specified integration-only access. No billing or allowance checks were performed.

The source was the operator-supplied `8.pdf`, SHA-256 `9b7583985dfc3e190ff5b5eb7a6904f645c40eea1abb35032bfbc82880363cee`. Existing page images rendered at 130 DPI were reused, with PDF page numbers 1, 12 and 13. Results were compared visually against the page images. These are bounded evaluation calls, separate from the production pilot and extraction receipts.

## Moondream results

The integration confirmed the catalog model ID `@cf/moondream/moondream3.1-9B-A2B`. Three sequential direct Workers AI API calls used `task: query`, PNG data URIs, `reasoning: false`, `temperature: 0`, `max_tokens: 4096` and `stream: false`. Prompts explicitly requested transcription, separation of handwriting, and preservation of checkbox or strikeout state. All returned HTTP 200 and `finish_reason: stop`; a successful response does not establish transcription completeness.

| PDF page | Runtime | Visual comparison |
| --- | ---: | --- |
| 13 | 4.415 s | Captured the three handwritten additions with errors, including “an interested” for “all interested”; misread MHL as MFL/MIL; omitted filing header and marginal initials. Typed judge text was presented as handwriting. |
| 12 | 4.198 s | Transcribed paragraph bodies but failed to identify both large diagonally crossed-out paragraphs despite the explicit prompt. Misread the affected statutory subsection and several words. |
| 1 | 0.798 s | Returned only three checkbox labels, omitted most of the form, and incorrectly presented the checked incapacity box as unchecked. |

Moondream is an experimental option, not a validated replacement OCR engine for this mixed scanned document. No outputs were accepted as facts or inserted into legal records. Full draft responses and integration failures are retained locally under ignored `.private/cloudflare-ocr-test/`. Sanitized call status is in `cloudflare-ocr-verification.json`.

## Llama result

One direct call to `@cf/meta/llama-3.2-11b-vision-instruct` on page 13 returned Cloudflare error 5016: model agreement required. No OCR output was obtained. The integration requires a separate `agree` prompt accepting Meta's Community License/AUP and representing EU eligibility. Acceptance was not submitted; the operator was asked explicitly. The new Worker intentionally exposes no automatic agreement endpoint or implicit model fallback.

## Worker implementation and deployment status

`ocr-worker/worker.mjs` adapts the operator's docket-key scaffold with explicit Llama/Moondream selection, fail-closed shared-secret authentication, bounded page-image input, bounded output, visible truncation, and unverified review status. It rejects empty responses and malformed structured transcription schemas. Credentials remain in secret bindings, not source. PDF inputs require proper page rendering; the endpoint does not generate a searchable PDF, vectorize text, or write to AI Search.

Six new mocked tests cover authentication, input/model limits, Moondream payload shape, empty/schema-invalid responses, truncation and provider failure without automatic license acceptance. Run them through `npm test`.

Deployment was attempted through the integration twice, including a fail-closed upload without a secret binding to distinguish secret installation from upload access. Both uploads returned “No access to the specified resource.” No successful deployment or live Worker endpoint is claimed. The connector can list existing Workers and run Workers AI, but the upload failed; the precise permission or integration restriction remains unresolved. Direct connector `fetch` to the hosted CaseVault app also returned a destination-not-allowed 403.

The original docket-key Python client's `--page` argument does not select a PDF page in its `sips` conversion, so it can repeatedly test page 1. This evaluation used separately rendered images and avoided that bug. The original repository's user changes were not modified.

## Gemini pause and reactivation

Gemini inference testing is paused; credentials and model catalog remain retained. A settings pause was attempted by uploading `{ "provider": "gemini", "models": [] }` to the existing active-model R2 object through the integration. Cloudflare returned error 10000 (authentication error). A subsequent object listing retained the earlier modification timestamp and a different size/hash from the attempted payload. Therefore the app's active-model pause is **not confirmed or applied by this evaluation**. The hosted app mutation endpoint cannot be reached through connector fetch because that destination is blocked.

After connector write access is corrected, preserve the current selections, clear Gemini's active models, verify the empty selection through the app, and leave installed keys/catalog intact. Reactivation requires a working key and explicit active-model selection. Existing approved snapshots must remain unchanged.

Do not expand the production pilot from these tests. Its separately documented scanned-body detection defect still needs correction; filing-header text alone must not establish extraction completeness. Embedded text should continue to be used where the document body is genuinely available, with OCR limited to pages needing it.

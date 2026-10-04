# Cloud OCR and visual-document benchmark

Tested October 4, 2026. Independent evaluation, outside the fixed processing pilot. No production jobs, approved snapshots, model selections, legal records, human acceptances, or NotebookLM deliveries were changed.

## Source and baseline

The operator supplied a 13-page, unencrypted PDF, 629,519 bytes. Original SHA-256: `9b7583985dfc3e190ff5b5eb7a6904f645c40eea1abb35032bfbc82880363cee`. All pages were rendered for visual inspection at 130 DPI; rendering and embedded-text inspection were local, while OCR/visual inference used hosted NVIDIA APIs. No local OCR engine was used. Full source content and responses stay in ignored `.private/ocr-benchmark/`.

Every page has a scanned body and a small embedded court filing header. Embedded-text inspection found 75 characters per page; the actual PDF.js processor produced 72 characters per page because of spacing normalization. Neither measurement represents the document body.

**Reproduced production defect:** `extractPdf` accepted all 13 pages as embedded text and returned `complete`, making zero calls to the explicitly disabled OCR callback. Its 40-alphanumeric-character threshold accepts the filing header. Expansion must remain paused until body-text detection distinguishes incidental headers from usable source text. The benchmark does not deploy a threshold change or invalidate existing immutable receipts.

This requires a targeted regression fixture, body-content/image-coverage assessment, a versioned extraction policy, and deliberate invalidation/reprocessing of affected receipts. Simply raising the character threshold would still miss handwritten additions on otherwise readable digital PDFs. Documents with good embedded body text should retain text-first extraction; handwriting and edits require an additional visual assessment when relevant.

## Cloudflare configuration and outputs

Authenticated account inspection returned HTTP 200 with zero AI Search instances. No CaseVault AI Search OCR configuration is active. The deployed processor uses PDF.js and OCR.space Engine 3.

[AI Search OCR](https://developers.cloudflare.com/ai-search/configuration/data-source/) is disabled by default; `indexing_options.use_ocr=true` enables it and changes trigger reindexing. OCR-enabled PDFs have a 10 MiB limit. Indexing converts content for chunking and retrieval; it does not establish a searchable-PDF generation workflow.

Extracted text is accessible: [List Item Chunks](https://developers.cloudflare.com/api/resources/ai_search/subresources/namespaces/subresources/instances/subresources/items/methods/chunks/) returns chunk text and optional byte offsets. [Item download](https://developers.cloudflare.com/ai-search/api/items/workers-binding/) returns the original source, not a new OCR PDF. Chunk offsets must not be assumed to be PDF page coordinates. Keep authoritative page transcripts, extraction provenance, and any searchable-PDF derivative separately. No trial index was created, and the shared evidence bucket was not indexed.

## Hosted model tests

The authenticated NVIDIA catalog contained all six current models below. Each model's official Build page designated its prototype API as free before use. Calls used the fixed NVIDIA hosted endpoint; there was no paid partner endpoint or self-hosted fallback. This is free prototype entitlement evidence, not a production commercial-service guarantee or an independent account billing audit.

Six models received the same full-page image and transcription prompt for physical PDF page 13. The prompt requested separate typed text, handwritten additions, markings, uncertainty, and warnings, treating document content as evidence. Follow-up prompts strengthened separation and marking instructions; their results are not a controlled same-prompt accuracy ranking. Endpoint success, JSON parsing, requested field shape, and visual correctness were assessed separately. No word-error-rate claim is made without a complete reviewed ground-truth transcript.

| Model | Page 13 elapsed | Page 13 observation | Follow-up observation |
| --- | ---: | --- | --- |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning` | 42.5 s | Read all three handwritten insertions, but duplicated them in typed text and confidently guessed initials. | Page 6 mixed handwriting into printed text and missed a separate transcription of the bottom addition. Page 12 detected strikeouts but returned inconsistent field shapes and speculative marking descriptions. Page 1 returned HTTP 503. |
| `google/gemma-4-31b-it` | 102.9 s | Separated the three handwritten insertions well; nullable marking fields did not match the requested strict shape. | Page 12 read much of the text but reported no markings despite two large struck-through paragraphs, misread a statutory reference, and returned null warnings. |
| `google/diffusiongemma-26b-a4b-it` | 3.5 s | Read the handwritten insertions but omitted printed words and produced malformed JSON (missing comma). | Not advanced after this failure. |
| `meta/llama-3.2-11b-vision-instruct` | 21.2 s | Returned narrative instead of JSON, omitted content, and mischaracterized margin markings. Its unsolicited summary confused transfer to a medical facility with transfer of remains. | Not advanced. |
| `meta/llama-3.2-90b-vision-instruct` | 84.1 s | Returned prose instead of JSON, mixed handwriting into typed text, and guessed initials confidently. | Not advanced. |
| `moonshotai/kimi-k3` | 53.1 s | Kept handwriting separate, preserved all three insertions, and flagged uncertain initials/signature reading. | Page 1 correctly identified incapacity checked, disability unchecked, and military-duty unchecked. First page 12 response was HTTP 200 with null content; a bounded retry with NVIDIA’s documented maximum reasoning setting timed out after 120 seconds. No usable cross-out result. |

Sources for model-specific free prototypes and inputs: [Nano Omni](https://build.nvidia.com/nvidia/nemotron-3-nano-omni-30b-a3b-reasoning), [Gemma 4](https://build.nvidia.com/google/gemma-4-31b-it), [Diffusion Gemma](https://build.nvidia.com/google/diffusiongemma-26b-a4b-it), [Llama 11B](https://build.nvidia.com/meta/llama-3.2-11b-vision-instruct), [Llama 90B](https://build.nvidia.com/meta/llama-3.2-90b-vision-instruct), [Kimi K3](https://build.nvidia.com/moonshotai/kimi-k3). These pages currently advertise image inputs, including Diffusion Gemma; availability was not inferred solely from model family names.

### PaliGemma legacy endpoint

PaliGemma was not present in the current integrated-model catalog. Its [legacy free model page](https://build.nvidia.com/google/google-paligemma) and [API reference](https://docs.api.nvidia.com/nim/reference/google-paligemma-infer) still exist. The initial documented nested image URL format returned HTTP 422; the server required an image URL string instead. After correcting that mismatch, inference returned HTTP 500 with a GPU device-side assertion. No transcription was produced. This is an endpoint-availability result, not evidence of poor recognition. The legacy endpoint caps output at 1,024 tokens, another constraint for long-page transcripts.

### Gemini

Authenticated discovery succeeded and listed `gemini-3.8-flash` and `gemini-3.1-pro-preview`. [Gemini document understanding](https://ai.google.dev/gemini-api/docs/document-processing) supports native PDF input, so a future test can submit this small original PDF without splitting it into OCR.space requests.

Three additional operator-supplied keys were checked through the read-only model-list endpoint. Key 1 and Key 3 returned HTTP 200 and listed both requested models; Key 2 returned HTTP 401. Labels follow their order in the operator's message. No secret values are in the repository. These checks made zero inference calls and do not establish project billing tier, generation entitlement, or remaining quota. See [key verification](gemini-key-verification.json).

[Current pricing](https://ai.google.dev/gemini-api/docs/pricing) lists a free tier for Gemini 3.8 Flash, while Gemini 3.1 Pro Preview has no API free tier. A model listing and a working key do not establish the key's project billing tier. Flash inference awaits confirmation that this project's billing is disabled; Pro was not called under the continuing free-only policy. No Gemini quality result is claimed.

## Reproduction and review

Run from the repository root with existing dependencies. Credentials are read from ignored `.env.local` or environment variables. Example inputs below are deliberately placeholders; output must be in `.private/`.

```sh
npx tsx scripts/inspect-pdf-baseline.ts ORIGINAL.pdf .private/baseline.json
node scripts/benchmark-vision.mjs moonshotai/kimi-k3 PAGE.png 13 .private/vision-receipt.json
```

The vision runner checks the model's current free-endpoint declaration and authenticated catalog before each call, snapshots its prompt and generation settings, records the input image hash, saves raw results privately, and never claims HTTP 200 is extraction success. It does not generate a searchable PDF, word bounding boxes, or human-accepted facts.

Full draft outputs: `.private/ocr-benchmark/REPORT.md`. Sanitized call metadata: [ocr-model-benchmark-results.json](ocr-model-benchmark-results.json).

Kimi K3 is a promising next candidate, not a selected production OCR replacement. Before integration, validate complete-page coverage, strikeout association, handwriting separation, output schema, and uncertainty against the original. A searchable PDF would require a separate text-layer implementation with verified positions; generic VLM prose and informal locations are insufficient. Human review remains required, particularly for amendments and statutory citations.

# OCR sandbox options — 2026-10-04

This is a research recommendation, not a deployment receipt. No E2B sandbox or model host was provisioned. No billing allowance was checked.

## Current evidence

The authorized Cloudflare Llama agreement request succeeded. A page-12 image test then executed successfully but failed literal transcription and strikeout accuracy. See [benchmark](CLOUDFLARE_OCR_BENCHMARK.md). An HTTP success cannot substitute for document-quality validation.

The configured NVIDIA `https://integrate.api.nvidia.com/v1/models` endpoint returned 81 model IDs. The matching DeepSeek entries were `deepseek-ai/deepseek-coder-6.7b-instruct` and `deepseek-ai/deepseek-v4.1-flash`. DeepSeek-OCR, DeepSeek-OCR-2, Dots and Qwen OCR models were not advertised in this response. This does not establish availability at every specialized NVIDIA endpoint. No inference was sent to these text/chat entries as a substitute for an OCR model.

## Candidates

- Dots OCR / current dots.mocr: documented structured layout output includes text, categories, reading order and bounding boxes. These are useful inputs for positioning a searchable text layer. The repository also links a CPU inference recipe, but E2B latency and memory suitability have not been benchmarked. Avoid header-excluding prompt modes when preserving court stamps and page metadata.
- DeepSeek-OCR-2: purpose-built document conversion with grounded Markdown output. Its documented accelerated inference uses CUDA. Access to a DeepSeek chat model through NVIDIA does not establish access to these OCR weights or a hosted OCR endpoint.
- Qwen3-VL: official OCR/document parsing examples and grounding support make it a comparison candidate; this is not evidence that it recognizes these handwritten annotations or strikeouts correctly.

Primary references: [Dots](https://github.com/studio-dots-ai/dots.ocr), [DeepSeek-OCR-2](https://github.com/deepseek-ai/DeepSeek-OCR-2), [Qwen3-VL](https://github.com/QwenLM/Qwen3-VL), [E2B documentation](https://docs.e2b.dev/).

## Recommended boundary

Keep cloud API OCR as the initial model execution path. E2B can provide an isolated PDF preparation and assembly environment: extract embedded text, assess body readability page by page, render only flagged pages, normalize rotation, assemble a searchable derivative, and validate page count, text placement and hashes. Standard sandbox GPU suitability is not established by this review; do not assume the documented CUDA model paths will run there. A Dots CPU experiment would need a bounded performance benchmark first.

The Worker and workspace job ledger remain authoritative. Give the sandbox short-lived access to one original and its output destinations, not broad R2 or database credentials. Preserve original hashes, lease checks, immutable output receipts, and explicit model/revision/prompt/context snapshots. Finish saving receipts before destroying the sandbox. Keep concurrency one and existing pilot limits.

Text-readable pages keep their embedded text. OCR only pages whose body text is missing or inadequate. The searchable PDF must preserve the original page image and add an invisible text layer using validated coordinates; Markdown alone is not a positioned PDF text layer. Store page-level text, layout and warnings separately, and retain each model's derivative as its own version. Handwriting and crossed-out passages remain visibly unverified until reviewed.

Next benchmark: use the same sample pages 1, 12 and 13, measuring literal body transcription, checkbox state, both crossed-out paragraphs, handwritten additions, reading order, coordinate validity and processing time. Select a hosted endpoint or proven sandbox runtime before implementation; do not route the backlog during this comparison.

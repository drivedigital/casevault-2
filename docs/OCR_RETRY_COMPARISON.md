# Streaming retry comparison — 2026-10-04

The operator requested retries of NVIDIA DeepSeek 4.1 Flash, NVIDIA Kimi K3 and OpenRouter Qwen3.8 free, and removed Dots3-Note from future comparisons. Historical Dots3-Note receipts remain intact; no new calls are made to it. Dots-OCR remains a separate candidate.

The opt-in `scripts/benchmark-vision-stream.mjs` preserves streamed content/reasoning and timing in ignored private receipts, with a five-minute limit. It does not consume production jobs. Kimi uses documented low reasoning effort instead of the previous max setting. All requests use the same literal-transcription prompt and physical page 12. This is not a controlled CER benchmark or a proof of complete transcription fidelity.

- Qwen3.8 free at 130 DPI returned HTTP 200, a complete stop response in 13,030 ms and provider-reported cost zero. It identified the correct two crossed-out paragraphs and the two margin annotations. It changed the second paragraph's MHL §81.16(c)(4) to §81.16(e)(2). The 300-DPI follow-up returned HTTP 429 in 644 ms; no higher-resolution recognition result is available.
- Kimi K3 at 130 DPI returned HTTP 200 and a complete stop response in 65,500 ms. It identified both crossed-out paragraphs, retained their text and correctly marked the stylized signatures illegible above J.S.C. It changed MHL §81.16(c)(4) to §81.16(c)(5). No verified text coordinates were returned.

These are the strongest tested annotation-aware drafts so far, but neither is accepted as a complete accurate extraction. The first unstruck paragraph cites §81.16(e); the second crossed-out paragraph cites §81.16(c)(4). Do not conflate those references. Physical PDF page 12 is printed page 10. Comparing the image against each response, rather than interpreting the underlying law, establishes the mismatch.

## Operator review and materiality

The operator confirmed the second paragraph begins: “ORDERED AND ADJUDGED that, pursuant to MHL § 81.16(c)(4), immediately after the event...” The operator stated this paragraph is invalidated by the strikeout, and its precise citation is not critical to the substantive use of the document. This is a recorded human interpretation, not an autonomous determination of legal effect.

Revise the assessment accordingly: Qwen and Kimi pass identification of the correct two struck-through paragraphs on this page. Their numeric transcription errors remain fidelity warnings, not sole grounds to fail the page's substantive annotation review. This partial human review does not certify every word or every page. Preserve original images, raw output and struck text for traceability; do not present operator-invalidated passages as operative provisions in summaries or accepted facts. Keep literal transcription fidelity, annotation detection and operative-text review as separate evaluation criteria.

The original full-resolution PDF is the operator's `8.pdf`. The private 300-DPI page rendering is provided for visual inspection; no image enhancement changes the evidence. Future review should separately score paragraph recovery, exact numeric/statutory text, annotation coverage and uncertainty reporting.

DeepSeek 4.1 Flash streaming retry reached the five-minute limit (300,022 ms) without response headers or streamed events. No transcription is available; this is an endpoint/availability failure for this request, not an OCR-quality verdict. Full private receipts and the tracked [sanitized verification](ocr-stream-retry-verification.json) retain the outcome.

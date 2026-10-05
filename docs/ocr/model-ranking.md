# Hosted OCR comparison: accuracy first, speed second

Updated October 4, 2026, America/Chicago. Current full-document progress was read from the live CaseVault comparison API at 2026-10-05T02:12:34Z (October 4, 7:12 p.m. Central). Source: all 13 physical pages of Doc 8; see [progress receipt](full-doc8-progress.json) and [benchmark methodology](benchmarks.md).

## Provisional selection order

This is a practical order for advancing the ten candidates in our current hosted comparison, based on reviewed sample pages. It is not a measured accuracy leaderboard: no full, reviewed ground-truth transcription exists, prompts/settings differed between older experiments, and successful API completion does not certify text accuracy. Prioritize printed-text fidelity, handwriting separation, checkbox/strikeout association, numeric fidelity and appropriate uncertainty. Use speed only after these accuracy considerations.

| Order | Candidate | Reviewed accuracy evidence | Full Doc 8 returned transcripts / 13 | Median successful-page elapsed time |
| --- | --- | --- | ---: | ---: |
| 1 | NVIDIA Kimi K3 | Strongest breadth of reviewed annotation handling: separated page-13 additions, identified page-1 checkbox states and both page-12 strikeouts. Numeric error beneath a strikeout remains a fidelity warning. | 5 | 28.1 s |
| 2 | OpenRouter Qwen3.8 27B free | Both page-12 strikeouts and margin annotations found. Statutory reference misread beneath the crossed-out paragraph. Less reviewed evidence on the other difficult pages than Kimi. | 2 | 17.7 s |
| 3 | NVIDIA Nemotron 3 Nano Omni | Recovered three handwritten additions and detected page-12 strikeouts, but mixed handwriting into typed text, guessed initials and had output-shape inconsistencies. | 2 | 38.4 s |
| 4 | NVIDIA Gemma 4 31B | Good separation of page-13 handwriting; missed both page-12 strikeouts and had reference/shape errors. | 10 | 76.0 s |
| 5 | HF DeepSeek-OCR-2 | Recovered five page-12 paragraphs with grounded block output; missed strikeout annotations and page-1 checkbox state. Useful text/layout draft requiring an annotation review pass. | 10 | 24.2 s |
| 6 | HF Dots-OCR | Recovered five page-12 paragraphs with layout boxes; missed strikeout/handwriting annotations and misread the subsection. Anonymous demo quota limits availability. | 3 | 24.7 s |
| 7 | NVIDIA Llama 3.2 Vision 90B | Substantial text returned, but earlier tests mixed handwriting, guessed initials and mischaracterized strikeouts as checkmarks. | 8 | 102.4 s |
| 8 | NVIDIA Nemotron OCR v2 | Word polygons/confidence returned in the targeted test, but text was substantially corrupted under pen strokes; ordinary text also had errors. | 0 | No current successful page; targeted page-12 test 0.9–1.1 s |
| 9 | Cloudflare Moondream 3.1 | Earlier successful tests changed checkbox state, missed strikeouts and omitted content. Current full-run adapter returned empty-output failures. | 0 | No current successful page; earlier sample tests 0.8–4.4 s |
| Unranked for accuracy (tenth candidate) | NVIDIA DeepSeek 4.1 Flash | No usable transcription in targeted or full-run requests. Timeouts/availability failures do not establish OCR quality. | 0 | No completed transcription; earlier stream attempt timed out at 300 s |

Positions 3–9 are especially tentative; the available qualitative evidence does not establish a statistically reliable order between them. The median elapsed times are from successful pages in the current full run, include provider/queue/network time and cover different page subsets. They are not same-page throughput measurements. Earlier page-12 same-image timings were Qwen 13.0 s, Kimi 65.5 s, Dots 17.6 s, DeepSeek-OCR-2 16.5 s, and Nemotron OCR v2 0.9–1.1 s; prompts and output requirements differed.

## Coverage and failures

Full-run returned transcripts are machine-success receipts, **not human-accepted accurate pages**. Effective quota/error text is excluded from the counts. The live checkpoint contains 114 page receipts: 40 returned transcripts and 74 failures; 16 page receipts remain missing. There are zero published searchable-PDF artifacts and zero saved AI analyses at this checkpoint.

| Candidate | Returned text | Failed | Missing receipts |
| --- | ---: | ---: | ---: |
| Kimi | 5 | 5 | 3 |
| Qwen | 2 | 11 | 0 |
| Nano Omni | 2 | 2 | 9 |
| Gemma | 10 | 1 | 2 |
| Dots-OCR | 3 | 10 | 0 |
| DeepSeek-OCR-2 | 10 | 2 | 1 |
| Nemotron OCR v2 | 0 | 13 | 0 |
| Moondream | 0 | 12 | 1 |
| Llama 90B | 8 | 5 | 0 |
| DeepSeek Flash | 0 | 13 | 0 |

Qwen hit HTTP 429 in its shared upstream pool. HF Spaces hit quota/SSE errors. Kimi had empty responses and connection interruptions. Long NVIDIA requests encountered HTTP 500/524. Nemotron OCR's early full-run pages were blocked by the initial entitlement matcher, so those zero-result receipts must not be interpreted as fresh recognition failures. Moondream's zero-result receipts are adapter/service-output failures. Some DeepSeek Flash pages were deliberately not submitted after repeated availability failures; their receipts explicitly record that pause.

[Open Doc 8 in CaseVault](https://casevault-2.dan-2eb.workers.dev/documents/1008). [Inspect live comparison receipts and eventual PDF versions](https://casevault-2.dan-2eb.workers.dev/api/ocr-comparisons/runs/bba21ba9-d383-4cde-bb67-c60d06db77b9/view).

## Interpretation and exclusions

Kimi and Qwen are our leading candidates for this document's handwritten edits and strikeouts. DeepSeek-OCR-2 is a promising faster text/layout candidate, but its tested checkbox and strikeout omissions need separate review. No candidate is promoted to a validated production OCR replacement by this ranking.

The operator confirmed MHL §81.16(c)(4) in the second crossed-out paragraph and said that text is invalidated by the strikeout. Its numeric mismatch is recorded as a fidelity issue, not the sole substantive reason to fail the page. Preserve strikeout status rather than treating deleted text as an active directive.

OCR.space scored 29/31 selected fields in an earlier narrow experiment (Nemotron 26/31, Kimi 23/31), but those were selected fields on a different limited experiment, not a full-document accuracy percentage or controlled ranking. OCR.space is excluded from this standalone full-document shortlist because the operator rejected its low limits and workaround. Gemini is paused. Dots3-Note is excluded and is distinct from Dots-OCR.

Evidence: [targeted round 2](../history/archive/2026-10-04/OCR_COMPARISON_ROUND_2.md), [streaming retries and operator review](../history/archive/2026-10-04/OCR_RETRY_COMPARISON.md), [NVIDIA sample tests](../history/archive/2026-10-04/OCR_MODEL_BENCHMARK.md), [Cloudflare sample tests](../history/archive/2026-10-04/CLOUDFLARE_OCR_BENCHMARK.md), [full-run progress](full-doc8-progress.json).

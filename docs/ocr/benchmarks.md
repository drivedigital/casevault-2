# OCR benchmarks

Compare dated experiments without confusing connectivity, recognition quality and human review.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Reading the evidence](#reading-the-evidence)
- [Experiment index](#experiment-index)
- [Recognition findings](#recognition-findings)
- [Human review and methodology](#human-review-and-methodology)
- [Preserved research](#preserved-research)
- [Sources](#sources)

## Reading the evidence

All observations below are from October 3–4, 2026. No benchmark was rerun during this overhaul. Original experiment prose is archived verbatim; sanitized JSON remains at its original path. Private images, transcripts and raw responses were not copied into the wiki.

The principal mixed-scan test used a 13-page, 629,519-byte PDF with SHA-256 `9b7583985dfc3e190ff5b5eb7a6904f645c40eea1abb35032bfbc82880363cee`. Pages had embedded filing headers but scanned bodies. Physical page 12 is printed page 10. Initial images were 130 DPI; selected comparisons used 300 DPI. Changed prompts/settings, service queues and absent complete reviewed ground truth prevent treating these observations as a controlled accuracy ranking.

## Experiment index

| Experiment | Result and interpretation | Evidence |
| --- | --- | --- |
| Earlier targeted routing | Ten pages/31 selected fields: OCR.space 29/31, Nemotron 26/31, Kimi 23/31 | [Workflow history](../history/archive/2026-10-04/WORKFLOWS.md); small field experiment, not general accuracy |
| Synthetic connector audit | OCR.space recovered test text; initial Gemini credential failed, later provider checks succeeded | [Initial audit](../connector-audit.json), [later providers](../provider-verification.json); no case-quality conclusion |
| Fixed pilot | Ten originals/29 pages, 28 embedded and one OCR; nine drafts, document 174 failed AI schema | [Pilot receipt](../processing-pilot-verification.json); no human-accepted run recorded |
| Header-only baseline | v1 accepted 13 scanned-body pages as complete from header text; v2 diagnostic accepted zero body pages with OCR disabled | [Benchmark](../history/archive/2026-10-04/OCR_MODEL_BENCHMARK.md), [control verification](../provider-controls-verification.json) |
| NVIDIA multimodal/legacy | No candidate passed all handwriting, marking and structured-output checks | [Sanitized results](../ocr-model-benchmark-results.json) |
| Gemini native PDF | Six requests returned 503/high demand; no transcription | [Key checks](../gemini-key-verification.json), [PDF tests](../gemini-ocr-verification.json); availability failure, not recognition failure |
| Workers AI | Moondream produced output but failed checkbox/strikeout/text checks; authorized Llama follow-up executed but invented structure | [Cloudflare](../cloudflare-ocr-verification.json), [Llama follow-up](../llama-agreement-followup.json) |
| NVIDIA/OpenRouter follow-up | Llama outputs failed markings/structure; Dots3-Note truncated; Qwen initially rate-limited | [Follow-up](../vision-followup-verification.json) |
| Specialized OCR and HF round 2 | Geometry available, but recognition/marking errors remained; some demo calls quota/service blocked | [Round 2](../ocr-round-2-verification.json) |
| Streaming retries | Qwen/Kimi completed and found both strikeouts, with numeric errors; DeepSeek returned no events within five minutes | [Streaming receipt](../ocr-stream-retry-verification.json) |
| Full Doc 8 workflow | Ten candidates, incomplete page coverage; 86 page receipts and no published PDFs at checkpoint | [Checkpoint](../history/archive/2026-10-04/DOC8_WORKFLOW_CHECKPOINT.md), [resume context](../operations/handoff.md) |

## Recognition findings

| Candidate or group | Observed result | Qualification |
| --- | --- | --- |
| Nano Omni | Read three handwritten additions on page 13; mixed handwriting/typed text and guessed initials | Page 6/12 structure and marking problems; page 1 service failure |
| Gemma 4 | Separated page 13 additions well | Page 12 missed two strikeouts; nullable/incorrect output fields |
| Diffusion Gemma | Fast page 13 output included handwriting | Printed words omitted and malformed JSON; not advanced |
| NVIDIA Llama 11B/90B | Produced prose or substantial body text | Incorrect markings, references, invented interpretation and output-shape failures |
| Kimi K3 | Page 13 separated handwriting; page 1 identified checkbox states | Later streaming page 12 found both strikeouts but changed a numeric citation; no validated coordinates |
| PaliGemma legacy | Corrected request shape advanced from 422 to a 500 device assertion | No transcription; endpoint failure rather than poor OCR |
| Moondream | Three HTTP-200 outputs | Missed strikeouts, changed checked box state, omitted form content and misclassified handwriting |
| Cloudflare Llama 11B | Agreement follow-up enabled execution | Invented ten sections instead of five paragraphs; rejected OCR output |
| Nemotron OCR v2 | 317 word detections at 130 DPI and 299 at 300 DPI, with geometry/confidence | Higher resolution did not fix struck-text corruption; ordinary errors and out-of-range coordinates observed |
| Dots-OCR | Five body paragraphs and layout boxes | Missing markings/handwriting; some pages blocked by embedded quota errors |
| DeepSeek-OCR-2 | Five paragraphs with grounded blocks; form body on page 1 | Omitted strikeout/checkbox states; page 13 SSE failure |
| Qwen3.8 free | Streaming page 12 found both crossed-out paragraphs and margin annotations | Numeric citation error; higher-resolution follow-up 429 |
| DeepSeek 4.1 Flash | Standard and streaming attempts timed out | No usable transcription; no quality score |
| Dots3-Note | Incomplete final answer with `finish_reason=length` | Distinct from Dots-OCR; removed from later candidate list in historical instructions |

## Human review and methodology

The operator confirmed the second struck-through paragraph's reference as MHL §81.16(c)(4) and described that paragraph as invalidated. Qwen and Kimi passed identification of the two correct strikeouts on that page; their numeric errors remain fidelity warnings. This limited human interpretation does not certify all words/pages or independently establish legal effect.

Score literal text, numeric fidelity, handwriting separation, checkbox state, strikeout association, uncertainty, coordinate validity and complete-page coverage separately. An HTTP success, parseable response, or geometry array is not a passing OCR evaluation. Service timeouts/quota failures must remain distinct from quality failures. The available evidence promotes no model to general production/backlog OCR.

## Preserved research

The BHL license survey covered 16 historical-print OCR entries and is indexed in [providers and endpoints](providers-and-endpoints.md#licensing-and-research). Its rankings do not establish performance on handwritten court edits. AI Search chunk export, Browser Run, and sandbox assembly research are proposals, not successful CaseVault execution receipts.

## Sources

[OCR_MODEL_BENCHMARK.md](../history/archive/2026-10-04/OCR_MODEL_BENCHMARK.md), [CLOUDFLARE_OCR_BENCHMARK.md](../history/archive/2026-10-04/CLOUDFLARE_OCR_BENCHMARK.md), [OCR_COMPARISON_ROUND_2.md](../history/archive/2026-10-04/OCR_COMPARISON_ROUND_2.md), [OCR_RETRY_COMPARISON.md](../history/archive/2026-10-04/OCR_RETRY_COMPARISON.md).

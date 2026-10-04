# OCR comparison round 2 — 2026-10-04

Bounded cloud API tests on physical page 12 of the operator's `8.pdf`; original SHA-256 `9b7583985dfc3e190ff5b5eb7a6904f645c40eea1abb35032bfbc82880363cee`. Images use 130 DPI unless specified. This is an exploratory comparison, not a measured character-error-rate benchmark: no full human ground-truth transcription has been created. Models/prompts differ, and runtime includes service/queue time. No production jobs, database mutations, searchable PDFs or automatic fallback were involved.

| Candidate | Result | Quality / limitation |
| --- | --- | --- |
| NVIDIA Nemotron OCR v2, 130 DPI | HTTP 200, 923 ms, 317 word detections | Word polygons and confidence returned. Substantial corruption in struck-through paragraphs; unusable as a clean extraction. |
| NVIDIA Nemotron OCR v2, 300 DPI | HTTP 200, 1,065 ms, 299 word detections | Higher resolution did not solve corruption. Ordinary text also contains recognition errors. |
| NVIDIA DeepSeek 4.1 Flash | Client timeout at 120,002 ms | No completed response available; not a quality verdict. |
| NVIDIA Kimi K3 | Client timeout at 120,005 ms | No completed response available; not a quality verdict. |
| HF MohamedRashad/Dots-OCR | Completed in 17,605 ms | Five body paragraphs and pixel layout boxes returned. Misread statutory reference as (5), omitted handwriting/strikeout annotations. Unreviewed text/layout candidate only. |
| HF prithivMLmods/DeepSeek-OCR-2-Unlimited-OCR | Completed in 16,516 ms | Five paragraphs and grounded block coordinates returned. Reference and word errors; crossed-out passages presented without strikeout annotations. |
| HF DeepSeek-OCR-2, page 1 | Completed in 22,793 ms | Transcribed the form body but omitted checkbox states, including the checked incapacity box. |

The checked reference in the second paragraph is MHL §81.16(c)(4). Both that paragraph and the third are diagonally crossed out. Recovering printed text beneath a stroke is not sufficient: the annotation must be retained separately rather than turning deleted passages into ordinary unqualified text.

Nemotron uses the hosted specialized endpoint `https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v2`, with `{input:[{type:"image_url",url:"data:image/png;base64,..."}],merge_levels:["word"]}`. Output is `data[].text_detections[]`, containing `text_prediction` and `bounding_box.points`. Raw coordinates require finite/range validation before PDF placement; small out-of-page header coordinates were observed. The hosted path comes from NVIDIA's retriever support matrix, and the payload/output are documented in its Image OCR API. This supersedes the earlier unresolved endpoint note.

The public HF API schemas were inspected before upload. Dots used `process_document` with 8,192 tokens and the demo's pixel limits; DeepSeek used `process_image`, model DeepSeek-OCR-2, Default resolution, Markdown task. Only rendered test pages were sent. Dots attempts on pages 1 and 13 returned an embedded error reporting insufficient anonymous ZeroGPU quota. DeepSeek page 13 returned an SSE error without details, while page 1 completed but omitted checkbox states. HTTP/upload success alone must not mark these tests successful. The handwriting-page recognition remains blocked, not passed.

Private original model outputs, image hashes, parameters, timestamps and service events are in ignored `.private/ocr-benchmark/` receipts. Tracked results omit document text and uploaded demo file URLs.

## Decision

No model is promoted to the production pilot. Dots and DeepSeek OCR 2 demonstrate the layout output needed for a PDF assembly experiment, while Nemotron provides word geometry but currently poor recognition on this page. Separate literal text recovery from visual marking interpretation. Next work should use reviewed transcription of these three pages, then score text fidelity, checkboxes, handwriting and both strikeouts separately. Use an authenticated demo endpoint or a verified hosted OCR API before repeating the blocked HF tests; do not substitute paid services silently. For DeepSeek/Kimi, a bounded streaming/reasoning-control test can distinguish long generation from an unavailable endpoint.

Primary sources: [NVIDIA hosted path](https://docs.nvidia.com/nemo/retriever/latest/extraction/prerequisites/index.html), [OCR payload and coordinates](https://docs.nvidia.com/nim/ingestion/image-ocr/latest/use-the-api.html), [Dots demo](https://huggingface.co/spaces/MohamedRashad/Dots-OCR), [DeepSeek demo](https://huggingface.co/spaces/prithivMLmods/DeepSeek-OCR-2-Unlimited-OCR).

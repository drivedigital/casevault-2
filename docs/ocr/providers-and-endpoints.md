# Providers and endpoints

Locate implemented adapters and dated endpoint research without treating historical availability as current entitlement.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Settings and execution controls](#settings-and-execution-controls)
- [Adapter conventions](#adapter-conventions)
- [Candidate roles and availability](#candidate-roles-and-availability)
- [Licensing and research](#licensing-and-research)
- [Sources](#sources)

## Settings and execution controls

[Provider code](../../src/lib/providers.ts) and [controls](../../src/lib/provider-controls.ts) separate installed secrets, cached discovery, active models and enabled state. Each remote provider can retain multiple selected models; an agent binds one explicitly for pilot approval. Legacy single-model selection remains supported. Off providers retain credentials/catalog/selections, are skipped on refresh, and cannot start new calls through guarded adapters. A submitted upstream request cannot be recalled by the switch.

Controls use separate R2 objects per provider. Missing Gemini control defaults off; other providers default on; invalid control records fail closed in the app/processor helper. The separate comparison Worker has its own narrower checks for NVIDIA/OpenRouter, so do not assume every experimental provider inherits all Settings behavior.

`GET /api/settings/providers` reads sanitized state; POST refreshes enabled providers using synthetic probes/discovery; PATCH changes models or `{provider, enabled}`. Refresh is an external operation even though it does not process case evidence. This overhaul did not invoke it.

## Adapter conventions

These paths describe checked-in adapters and the October 4 research; they are not newly verified external API contracts.

| Provider | Stored secret name | Endpoint and payload convention |
| --- | --- | --- |
| OCR.space | `OCR_SPACE_API_KEY` | `https://api.ocr.space/parse/image`; pilot submits isolated PDF pages, Engine 3; no requested searchable PDF/overlay |
| OpenRouter | `OPEN_ROUTER_KEY` | `https://openrouter.ai/api/v1`; settings uses key/account-filtered discovery; benchmarks use image-capable free model checks and zero-price routing cap |
| NVIDIA chat | `NVIDIA_KEY` | Fixed `https://integrate.api.nvidia.com/v1/`; chat/completions uses text and `image_url` message parts; output `choices[0].message.content` |
| NVIDIA specialized OCR | `NVIDIA_KEY` | `https://ai.api.nvidia.com/v1/cv/nvidia/nemotron-ocr-v2`; image input array and `merge_levels: [word]`; word detections/polygons |
| Gemini | `GEMINI_API_KEY` | `https://generativelanguage.googleapis.com/v1beta/models`; generation-capable discovery; historical native PDF tests had service failures |
| Workers AI | `AI` binding; standalone inbound `OCR_SECRET_KEY` | Cloudflare `@cf/` model IDs; Llama multimodal data-URI messages; Moondream query/image payload; REST wraps binding output in `result` |
| Hugging Face demos | Public Space adapters | Gradio upload/call/event flow for Dots-OCR and DeepSeek-OCR-2; quota text inside completed events must be rejected |

Cloudflare's account-specific Llama agreement request is not an NVIDIA chat body and does not transfer entitlement between providers. Historical agreement succeeded on October 4; it neither fixed Worker upload permissions nor made Llama output accurate.

## Candidate roles and availability

The [comparison allowlist](../../comparison-worker/worker.mjs) contains Kimi K3, Qwen3.8 27B free, Nano Omni, Gemma 4, Dots-OCR, DeepSeek-OCR-2, Nemotron OCR v2, Moondream 3.1, Llama 90B and DeepSeek 4.1 Flash. These were a provisional shortlist, not a measured top ten. Exact model IDs and approved page images belong in the execution manifest.

DeepSeek Flash and DeepSeek-OCR-2 are different models/services. Dots3-Note and Dots-OCR are also distinct; removing the former from comparisons did not remove the latter. The earlier NVIDIA catalog omission of specialized OCR did not prove absence: round 2 resolved the specialized Nemotron endpoint. Historical text-input research on Nemotron Ultra/Super and GLM-5-3 does not establish image OCR support.

The pilot's free-only OpenRouter/NVIDIA inference checks do not establish that the entire platform is zero cost. The Doc 8 comparison explicitly included metered Workers AI. Gemini key discovery, project free-tier observation and successful generation are separate facts: later PDF requests produced no transcripts despite a verified free-tier project. No current quotas, prices, availability or account allowances were checked here.

## Licensing and research

The [unaltered BHL inventory](../history/archive/2026-10-04/BHL_OCR_LICENSES.md) retains all 16 model entries and primary-source links. Recorded qualifications include Dots supplemental agreements despite MIT metadata, and inconsistent SmolDocling metadata/body license statements. Downloadable weights, permissive code licenses, free hosted execution and complete reproducible training sources are different claims. These observations are dated research, not a legal determination or current licensing check.

[Cloudflare research](../history/archive/2026-10-04/CLOUDFLARE_EVALUATION.md) retains exact historical limits/prices and its original links for future re-verification. October 4 account inspection found no AI Search instances. AI Search chunk offsets were not demonstrated to be PDF coordinates, and original-item download was not a generated searchable PDF. Browser Run court access remained untested.

[Sandbox research](../history/archive/2026-10-04/OCR_SANDBOX_OPTIONS.md) considered hosted OCR with isolated preparation/assembly, not assumed CPU/GPU suitability. E2B was subsequently deferred. Preserve the application ledger and receipts across any future ephemeral execution.

## Sources

[SETTINGS_AND_PROVIDERS.md](../history/archive/2026-10-04/SETTINGS_AND_PROVIDERS.md), [NVIDIA_VISION_ENDPOINTS.md](../history/archive/2026-10-04/NVIDIA_VISION_ENDPOINTS.md), [WORKERS_AI_ENDPOINTS.md](../history/archive/2026-10-04/WORKERS_AI_ENDPOINTS.md), [BHL_OCR_LICENSES.md](../history/archive/2026-10-04/BHL_OCR_LICENSES.md).

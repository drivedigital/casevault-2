# Settings and provider connections

The private `/settings` page shows the court review policy, Knowledge Graph placeholder, credential installation state, latest connection check, and searchable live model catalogs. Only the authorized Google user or trusted machine credential can access the page/API. Credentials never appear in client props, model receipts, or browser responses.

## Credentials and endpoints

| Connection | Worker secret | Endpoint / discovery |
| --- | --- | --- |
| OCR.space | `OCR_SPACE_API_KEY` | `https://api.ocr.space/parse/image`; Engine 3 synthetic image probe |
| OpenRouter | `OPEN_ROUTER_KEY` | `https://openrouter.ai/api/v1/key` authenticates; `/models/user` discovers account-filtered text models |
| NVIDIA | `NVIDIA_KEY` | `https://integrate.api.nvidia.com/v1/models`; OpenAI-compatible chat endpoint verifies the credential with a short synthetic probe |
| Google Gemini | `GEMINI_API_KEY` | `https://generativelanguage.googleapis.com/v1beta/models`; paginated, filtered to `generateContent` models |

`NVIDIA_ENDPOINT` is a deployment variable set to `https://integrate.api.nvidia.com/v1/`. The server restricts it to that exact endpoint. The four credentials are installed as Cloudflare Worker secrets. Local copies are in ignored, permission-restricted files; source control contains names only. Google workspace OAuth remains separate from these inference credentials.

Use `wrangler secret put <NAME>` to replace an individual credential, or a private JSON file with `wrangler secret bulk <file>`. Refresh Settings after replacement. Refresh never processes lawsuit evidence. OCR checks use a generated image; AI smoke tests use a trivial synthetic prompt. Catalog discovery does not establish that every listed model supports chat or that an account has inference credits.

`GET /api/settings/providers` returns sanitized cached connection receipts. `POST` refreshes the providers concurrently and persists a credential-free receipt at `casevault-2/settings/provider-catalog-v1.json` in private R2. The existing evidence objects and legacy KV inventory are untouched. Cookie mutations require the same app origin. Failed provider requests are reported without returning provider response bodies or credentials.

## Review policy

Court documents (`sourceType=docket_filing`) bypass routine human document review. Explicit `isFlagged` or `status=flagged` overrides the bypass and brings a filing back into the review queue. Drive, upload, and email documents retain the normal review policy. This source-based policy applies to existing and future court imports and is shared by the queue, dashboard count, and document detail. Docket Viewer and direct document URLs keep all originals accessible.

Review bypass does not mark a document OCR-complete, indexed, verified, or legally approved. Stored processing states and the extraction jobs remain intact. There are 102 court documents and 404 other document associations in the initial corpus.

## Processing scope

The server provider module supplies model discovery and a text inference adapter for OpenRouter, NVIDIA, and Gemini. Callers must explicitly choose an installed provider and a model from its latest catalog. No automatic fallback sends evidence to another provider. OCR credentials and connection checks are available; the leased OCR/extraction runner remains future work. The document action is labeled **Queue extraction**, and reports queued work accurately.

Knowledge Graph renders a static placeholder and does not call the graph API.

## Primary references

- [OpenRouter account-filtered model discovery](https://openrouter.ai/docs/api/api-reference/models/list-models-filtered-by-user-provider-preferences-privacy-settings-and-guardrails)
- [OpenRouter current-key authentication](https://openrouter.ai/docs/api/api-reference/api-keys/get-current-api-key)
- [NVIDIA LLM API reference](https://docs.api.nvidia.com/nim/reference/llm-apis)
- [Gemini model discovery](https://ai.google.dev/api/models)
- [Gemini content generation](https://ai.google.dev/api/generate-content)

## Model selection and source controls

Settings now includes persistent active-model pills for each cloud inference provider and a real Google Drive file selector. The source bridge controls are under **Court & NotebookLM**. See `QUEUES_AND_BRIDGES.md` for authorization, queue semantics, adapter execution and limits.

Model filters appear inside each inference provider card. Filters independently match model names and IDs, ignore case and surrounding whitespace, show matching counts, and can be cleared. Filtering does not change the saved active model.

Multiple active models: each provider stores a `models` array. Model pills toggle independently; Clear all deselects every model. Existing single-model settings load as a one-element array without changing saved choices. Filters do not affect selections. API PATCH accepts `{provider, models}`; legacy `{provider, model}` requests remain compatible. All selected IDs must belong to the provider's available text catalog and duplicates are rejected. Inference can explicitly choose any selected model; calls without an explicit model use the first selected model. Enabling multiple models does not automatically send duplicate inference requests.

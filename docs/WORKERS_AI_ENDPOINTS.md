# Workers AI endpoint/configuration review — 2026-10-04

The Cloudflare plugin documentation and account-specific live model schema were checked through the integration. The previous Llama request reached the model and returned error 5016 (model agreement), rather than a model-not-found or authentication error. Configuration is substantially correct; the required agreement remains pending, and the image payload used a supported but deprecated representation.

## Correct configuration

- Model ID: `@cf/meta/llama-3.2-11b-vision-instruct`. The `@cf/` prefix belongs in Cloudflare calls.
- Worker binding: `"ai": { "binding": "AI" }`, then `env.AI.run(modelId, input)`. No upstream Meta API key is needed for this binding.
- Direct Workers AI REST endpoint: `POST https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.2-11b-vision-instruct`, using Cloudflare bearer authentication and a JSON input body. This existing endpoint remains supported; AI Gateway routing is not required for the direct endpoint.
- Current image request: a user message with content parts `{type:"text",text:prompt}` and `{type:"image_url",image_url:{url:"data:image/png;base64,..."}}`.
- The live model schema says HTTP image URLs are not accepted in this message format; embed the page bytes as a data URI. Send a rendered page image, not PDF bytes disguised as an image.
- Set `max_tokens` explicitly for transcription; the documented default is 256. Our adapter uses 4096 by default, with `temperature:0` and `stream:false`.
- Binding output text is `response`; the REST response wraps the model output in `result`. Our binding adapter reads `response` and rejects empty output.

The schema still allows top-level `prompt` plus image bytes as an array, but marks top-level image inputs deprecated. The CaseVault OCR Worker now uses the message/data-URI form, with a focused mocked test. The operator's separate docket-key repository was not modified. Its speculative `{type:'image',image:[...]}` fallback does not match the current documented message content fields.

## Agreement and remaining limits

Cloudflare requires an initial `{ "prompt": "agree" }` request to this exact model before normal use. This accepts Meta's Community License and Acceptable Use Policy; the actual account error additionally requires representing EU eligibility. No acceptance request has been sent without the operator's explicit authorization. Agreement and Worker deployment permissions are separate: error 5016 does not explain the earlier Worker upload or R2 write failures.

An accepted agreement would allow a proper OCR quality test; it would not establish transcription accuracy or create a searchable PDF. The adapter changes are tested locally and are not a claim of successful live Llama OCR or a deployed OCR Worker.

## Sources

- [Cloudflare Llama model documentation](https://developers.cloudflare.com/workers-ai/models/llama-3.2-11b-vision-instruct/)
- [Cloudflare Llama Vision tutorial](https://developers.cloudflare.com/workers-ai/guides/tutorials/llama-vision-tutorial/)
- [Direct Workers AI REST setup](https://developers.cloudflare.com/workers-ai/get-started/rest-api/)
- [Existing REST path remains supported](https://developers.cloudflare.com/changelog/post/2026-05-21-rest-api/)
- Live schema: `GET /accounts/{account_id}/ai/models/schema?model=@cf/meta/llama-3.2-11b-vision-instruct`, retrieved through the Cloudflare plugin integration.

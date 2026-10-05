# OCR and AI connector check — initial audit

Provider probes used a generated image containing `OCR CONNECTOR TEST 12345` and a model-list request. No lawsuit content was transmitted. See `connector-audit.json` for the machine-readable receipt.

| Layer | Result |
| --- | --- |
| OCR.space local credential, Engine 3 | HTTP 200, exit code 1, expected synthetic text recovered |
| Gemini local credential | HTTP 401 / UNAUTHENTICATED; configured credential is not accepted |
| Deployed Worker OCR/AI secrets | Neither `OCR_SPACE_API_KEY` nor `GEMINI_API_KEY` is installed |
| OCR/AI provider invocation in app | Not implemented |
| Processing runner | Not implemented; 506 jobs remain queued |
| Persisted extracted text / AI summaries | 0 / 0 |

The analysis endpoint inserts an idempotent extraction request and returns 202. It does not invoke OCR or AI. At the time of this initial audit, the prototype button said “Run OCR + AI Analysis” and briefly showed “Analyzing…”, but its action only queues work and refreshes the page. Provider credentials existing in a local file do not establish a connected production pipeline.

R2 and Supabase are connected. NYSCEF, NotebookLM and Google Drive delivery adapters remain disconnected. Google workspace sign-in is separate from Drive authorization and AI API credentials.

To activate processing, install the verified OCR credential in the processor's secret store, obtain a working AI credential, implement the leased runner and provider adapters, persist original-to-derivative receipts and quality states, and verify a small controlled batch before running the corpus. A successful synthetic OCR probe proves connectivity, not accuracy across legal scans. This check did not activate a runner or start processing the evidence backlog.

## Follow-up — 2026-10-04

The requested OCR and AI credentials are now installed as Worker secrets, Settings and live model discovery have been added, and the new Gemini credential passed a generation test. The queue action has been renamed **Queue extraction**. See `SETTINGS_AND_PROVIDERS.md` and `provider-verification.json` for current results. The earlier table is a historical snapshot; a processing runner remains pending.

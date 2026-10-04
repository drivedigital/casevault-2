# Dependency ledger

The lockfile is the exact JavaScript dependency receipt. Core versions at initial deployment: Next.js 16.3.8, React/React DOM 19.2.6, OpenNext Cloudflare 1.20.8, Wrangler 4.147.0, Drizzle ORM 0.45.2, node-postgres 8.20.0, Zod 4.3.6, TypeScript 5.9.3. Use Node 22 or 24 LTS; the successful import used bundled Node 24.19.0. Initial production dependency audit reported zero known vulnerabilities. Development dependencies require separate ongoing maintenance.

| Task | Execution dependencies | State ownership | Current availability |
| --- | --- | --- | --- |
| NYSCEF scrape | Existing court browser session, supervised acquisition bridge, local download access, manifest writer, PyMuPDF | Court session locally; receipts and originals in private storage | Prior successful artifacts imported; fresh bridge disconnected |
| Original ingest | Node, multipart authenticated API, SHA-256, R2 binding, Hyperdrive/Postgres role | R2 objects, Supabase source associations, private replay checkpoint | Connected and exercised |
| PDF inspection | Python and PyMuPDF (`fitz`) | Actual byte/hash/page inspection receipts | Completed for initial corpus |
| OCR/extraction | Processor deployment, engine credentials, routing and quality policy, lease/retry worker | Original-to-derivative mapping and job receipts | Queue populated; runner pending |
| NotebookLM update | Authenticated local consumer-session adapter, source-list and upload access, poll/reconcile logic | Remote source IDs plus local/database sync receipt | Prior successful mappings imported; live adapter disconnected |
| Drive delivery | Google OAuth/connected adapter, selected folder, artifact and version mapping | Drive file IDs and delivery receipts | Pending configuration |
| Notion seed | Read access to lawsuit/party/lawyer sources and source page relations | Notion raw observations and stable imported IDs | Read-only initial copy completed |
| Private portal | Cloudflare Worker, OpenNext runtime, signed session secrets, database and bucket bindings | Server-only secrets; HttpOnly session | Deployed |

The prior browser and NotebookLM tooling is retained in the recent-work folder and chats. It is an external acquisition/delivery dependency, not vendored into the new Worker. Copying consumer authentication into browser code or GitHub would not wire up a safe cloud adapter. Record adapter version and session owner when reconnecting it.

Supabase migrations include the private schema, grants, policies, indexes and job constraints. Role password generation is provisioning state, not a source-code dependency. `wrangler.jsonc` defines exact Cloudflare resource bindings; `.env.local` and macOS Keychain hold only private local operator state.

## Provider connections — 2026-10-04

OCR.space Engine 3, OpenRouter, NVIDIA, and Gemini credentials are installed as Worker secrets. Discovery uses server-side HTTP requests with bounded timeouts, fixed provider endpoints and Zod response validation. Sanitized model catalog receipts live in private R2; the Settings UI uses the authenticated app API. No additional provider SDK dependency was added. A server text inference adapter is available for the future processor; installation and model discovery do not complete corpus extraction. See `SETTINGS_AND_PROVIDERS.md`.

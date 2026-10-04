# CaseVault 2

Private evidence workspace built from the supplied CaseVault prototype, with actual NYSCEF originals, Notion source records, and a durable ingestion queue.

- Repository: https://github.com/drivedigital/casevault-2 (private)
- Application: https://casevault-2.dan-2eb.workers.dev (sign-in required)
- [Workflow methodologies and dependencies](docs/WORKFLOWS.md)
- [Queues, Drive file selection, NYSCEF and NotebookLM bridges](docs/QUEUES_AND_BRIDGES.md)
- [Settings, OCR and cloud AI providers](docs/SETTINGS_AND_PROVIDERS.md)
- [Document previews](docs/DOCUMENT_PREVIEWS.md)
- [Google sign-in](docs/GOOGLE_SIGN_IN.md)
- [Dependency ledger](docs/DEPENDENCIES.md)
- [Infrastructure, credentials and setup](docs/SETUP.md)
- [Architecture and build scope](docs/ARCHITECTURE.md)
- [Initial corpus reconciliation](docs/corpus-reconciliation.json)
- [Import receipt](docs/initial-import-report.json)
- [Recent work source catalog](docs/provenance/recent-work-catalog.json)

This is the beginning of the 2.0 build. Original files and metadata are real; queued extraction is not completed OCR, indexing, or legal verification. Synthetic analysis endpoints from the prototype have been disabled. Existing production services and notebooks were preserved.

## Development

Use Node 22 or 24 LTS and `npm ci`. Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build:worker`; deploy with `npm run deploy` after Cloudflare login. Runtime bindings are defined in `wrangler.jsonc`. Local Cloudflare/Hyperdrive development needs an explicitly configured local database; `next dev` alone does not provision production bindings.

Credentials belong in Cloudflare secrets, Hyperdrive, and ignored local files. Never commit `.env.local`, `.private`, or original evidence. Read SETUP before replaying imports.

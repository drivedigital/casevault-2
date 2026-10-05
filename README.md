# CaseVault 2

Private evidence workspace built from the supplied CaseVault prototype, with actual NYSCEF originals, Notion source records, and a durable ingestion queue.

- Repository: [drivedigital/casevault-2](https://github.com/drivedigital/casevault-2) (private)
- Application: [CaseVault 2](https://casevault-2.dan-2eb.workers.dev) (public viewing; authenticated processing controls)
- [Technical wiki and reading paths](docs/README.md)
- [Current implementation and deployment evidence](docs/status/current-state.md)
- [Setup and dependencies](docs/operations/setup.md)
- [Operational handoff](docs/operations/handoff.md)
- [Bugs and blockers](docs/status/bugs-and-blockers.md)
- [Feature inventory for prioritization](docs/product/feature-inventory.md)
- [Original documentation and evidence source map](docs/history/source-map.md)

The application has original-file intake, source bridges, a fixed document-processing pilot, and a separate Doc 8 OCR comparison. Queued extraction is not completed OCR, indexing, or human verification. The wiki distinguishes local implementation from dated deployment observations and proposed work; existing services, originals and historical receipts remain preserved.

## Development

Use Node 22 or 24 LTS and `npm ci`. Run `npm run typecheck`, `npm test`, `npm run lint`, and `npm run build:worker`. Follow the [deployment runbook](docs/operations/runbooks.md#deployment-and-verification) for deployment methods and the recorded static-asset workaround. Runtime bindings are defined in `wrangler.jsonc`. Local Cloudflare/Hyperdrive development needs an explicitly configured local database; `next dev` alone does not provision production bindings.

Credentials belong in Cloudflare secrets, Hyperdrive, and ignored local files. Never commit `.env.local`, `.private`, or original evidence. Read the [operational runbooks](docs/operations/runbooks.md) before replaying imports; the original receipt paths are preserved historical evidence.

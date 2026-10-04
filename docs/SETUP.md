# Infrastructure and private access

## Resources

| Resource | Configuration |
| --- | --- |
| GitHub | `drivedigital/casevault-2`, private, branch `main` |
| Worker | `casevault-2`, https://casevault-2.dan-2eb.workers.dev |
| Cloudflare account | `2eb39046954b68cb7fb92ce98a6679b4` |
| R2 | `legal-evidence-arena`, private prefix `casevault-2/originals/` |
| Hyperdrive | `casevault-2-postgres`, ID `114ab4665b034d38be31666f435c0ce8` |
| Supabase | Existing `casevault`, reference `lrollxodgqswpylzulpu` |
| Database isolation | `casevault2` schema, restricted login `casevault2_app` |
| Workspace | `b37e40d6-4746-490c-9b73-ea46e15e2b01` |

Existing `casevault`, `casevault-worker`, `docket-key`, notebooks and Notion records were preserved. No additional Supabase project was provisioned. Hyperdrive caching is disabled for mutable evidence metadata. Its origin holds the restricted database password, and the Worker receives its bound connection string.

## Secrets and sign-in

The machine credential is `CASEVAULT_API_TOKEN`; `SESSION_SECRET` signs browser sessions. Both are Cloudflare Worker secrets. The restricted database password is configured in the Hyperdrive origin. Supabase's publishable key and URL are public configuration, not administrative credentials; runtime SQL does not use a Supabase service-role key.

On the initial workstation, secrets are also saved in macOS Keychain under `casevault-2/CASEVAULT_API_TOKEN`, `casevault-2/SESSION_SECRET`, and `casevault-2/DB_PASSWORD`. Open Keychain Access and retrieve the machine token to sign in at the new application. Ignored `.env.local` provides the same machine token for operator scripts; do not attach or copy this file into source control. No secret value is printed in these documents.

Machine requests send `Authorization: Bearer <CASEVAULT_API_TOKEN>`. Browser sign-in exchanges that token for an eight-hour signed cookie. Bootstrap imports additionally require the machine credential; a browser cookie alone cannot import batches.

If a future processor needs access, install the same machine token as a secret on that trusted endpoint, or introduce scoped per-service credentials before broadening access. No nonexistent processor endpoint has been configured. Optional local OCR-provider keys are private staging configuration and are not activated by this foundation.

## Repeatable deployment

1. Use Node 22 or 24 LTS, `npm ci`, and Cloudflare login for the account above.
2. Provision the database role with a generated password through a private administrative connection. Apply the SQL migrations in `supabase/migrations` and set that password on the Hyperdrive origin. The secret-bearing role creation is intentionally not committed in migrations.
3. Set `CASEVAULT_API_TOKEN` and `SESSION_SECRET` with Wrangler's secret mechanism; configure the bindings in `wrangler.jsonc` for the target environment. Generate fresh credentials for a new environment.
4. Run type checking, security/import validation tests, lint, and `npm run build:worker`; deploy with `npm run deploy`.
5. Confirm public health, private-route rejection, authenticated metadata and original-file retrieval. Never use disabling TLS verification as a database workaround.

SQL migrations are authoritative for database policies, workspace defaults and manually managed indexes. The prototype Drizzle model omits some database administration details; review generated migrations rather than using an automatic schema push against production.

The checked-in local Hyperdrive connection is a localhost placeholder for development tooling, not production database access. Configure a local database explicitly for local runs.

## Corpus replay

Stage the two prior docket manifests and PDFs, the legacy inventory/original files, and the read-only Notion export in the ignored `.private` directory. `scripts/prepare-corpus.py` records source path defaults for this workstation, validates originals and produces `.private/corpus.json`. Use the prior experiment Python environment with PyMuPDF installed, or a dedicated environment with that dependency.

Run `node scripts/import-corpus.mjs` with the private `.env.local` machine token and optional `CASEVAULT_ENDPOINT`. The script resumes object uploads using `.private/object-checkpoint.json`, retains stable source identities, and queues only absent idempotency keys. A replay is not an update API: changed records must use an explicitly reviewed update path. Keep the checkpoint, source receipts and input snapshots in private evidence storage; GitHub holds code and sanitized aggregate reports only.

The import client retries transient failures with backoff. Node 26's experimental HTTP/2 fetch encountered TLS/session errors during this initial run; use Node 22 or 24 LTS. Never disable TLS validation to bypass those failures.

# Setup and dependencies

Prepare a local environment and identify configuration without exposing credentials.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Local development](#local-development)
- [Configuration ownership](#configuration-ownership)
- [Google sign-in and Drive](#google-sign-in-and-drive)
- [Optional operator dependencies](#optional-operator-dependencies)
- [Validation commands](#validation-commands)
- [Sources](#sources)

## Local development

The repository's documented runtime is Node 22 or 24 LTS; [CI](../../.github/workflows/checks.yml) uses Node 24. The initial import recorded Node 26 HTTP/2 session failures, so its recommendation remains to use the LTS environment. The comparison runner now explicitly uses Undici with HTTP/2 disabled; that is a local implementation observation, not a new deployment claim.

From the repository root:

```sh
npm ci
npm run dev
```

Development/build prepares same-origin PDF.js assets through the predev/prebuild hook. The checked-in Hyperdrive local connection is a localhost placeholder: `next dev` does not provision a database or production bindings. Configure the intended local database and secrets before exercising data-dependent routes. The exact JavaScript dependency receipt is [package-lock.json](../../package-lock.json).

## Configuration ownership

| Configuration | Source of truth or location |
| --- | --- |
| App name, service bindings, R2/Hyperdrive, workspace and public-review setting | [App configuration](../../wrangler.jsonc) |
| Processor cron, enable flag, app/R2 bindings | [Processor configuration](../../processor/wrangler.jsonc) |
| Comparison bindings and variables | [Comparison configuration](../../comparison-worker/wrangler.jsonc) |
| Database schema, grants, indexes and policies | [SQL migrations](../../supabase/migrations/), together with application schema |
| Machine credential | `CASEVAULT_API_TOKEN`, server secret; operator scripts read ignored private environment |
| Drive encryption | `SESSION_SECRET`; rotation requires reconnecting the grant |
| AI/OCR credentials | Provider-specific server secret names in [endpoint guide](../ocr/providers-and-endpoints.md) |
| Google OAuth client secret | Supabase Google provider configuration, not Worker vars or browser source |

Existing resources belong to the `casevault-2` app inside the original Supabase project. The historical resource table, account IDs and provisioning details remain in the [setup archive](../history/archive/2026-10-04/SETUP.md). New environments require their own reviewed credentials and resource configuration; do not automatically replay production provisioning.

## Google sign-in and Drive

The checked-in app expects the configured Google owner's confirmed email and Google identity. Google Cloud's OAuth redirect goes to the Supabase project's `/auth/v1/callback`; Supabase's allowed app redirect is the CaseVault `/auth/callback`. Preserve other applications' allowed redirects in the shared project. Workspace sign-in uses `openid email profile`; Drive browsing requires a separate `drive.readonly` grant and enabled Drive API.

The callback verifies owner identity before retaining the Drive token. Grants remain encrypted server-side and are not returned to the browser. Automatic Drive refresh is not configured. `/api/session` is retired; a machine token does not create a browser session. See [auth code](../../src/lib/supabase-auth.ts), [callback](../../src/app/auth/callback/route.ts), and [historical sign-in receipt](../google-auth-verification.json).

## Optional operator dependencies

| Workflow | Additional dependency |
| --- | --- |
| Court bridge | Python 3; PyMuPDF for actual PDF page counts; supervised browser tab for capture fallback |
| NotebookLM bridge | Existing authenticated consumer `nlm` CLI; historical version 0.15.1 |
| Corpus preparation | PyMuPDF and the original private manifests/files; workstation defaults require deliberate restaging elsewhere |
| Doc 8 rendering and assembly | Existing rendered PNGs, original PDF and private receipts; assembler uses PyMuPDF, historically 1.28.2 |
| Pilot extraction | Cloud service bindings and OCR secret; PDF.js/pdf-lib/DOMMatrix dependencies from the lockfile |

The pilot has no local OCR engine or Container dependency. Local PDF rendering/assembly is distinct from OCR recognition. No dependencies were installed during documentation housekeeping.

## Validation commands

The application check sequence is `npm run typecheck`, `npm test`, Python bridge unit tests, `npm run lint`, and `npm run build:worker`, as defined by CI. They are listed for future code work, not reported as run in this overhaul. For documentation-only changes use the [integrity procedure](../history/validation.md).

## Sources

[SETUP.md](../history/archive/2026-10-04/SETUP.md), [GOOGLE_SIGN_IN.md](../history/archive/2026-10-04/GOOGLE_SIGN_IN.md), [DEPENDENCIES.md](../history/archive/2026-10-04/DEPENDENCIES.md).

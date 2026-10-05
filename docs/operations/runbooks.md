# Operational runbooks

Use evidence-preserving recovery procedures within the operator-approved scope.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Before an operational action](#before-an-operational-action)
- [Deployment and verification](#deployment-and-verification)
- [Pilot pause and recovery](#pilot-pause-and-recovery)
- [Source bridge recovery](#source-bridge-recovery)
- [Corpus replay and receipt handling](#corpus-replay-and-receipt-handling)
- [Troubleshooting map](#troubleshooting-map)
- [Sources](#sources)

## Before an operational action

Resolve the target environment, selected original/run, expected side effects and existing receipts first. Historical operator instructions are context, not standing authorization to execute unrelated work. Do not run every command in this page as an onboarding checklist. Read [current state](../status/current-state.md) and [handoff](handoff.md), then choose the relevant procedure.

## Deployment and verification

1. Review the local diff, configuration and applicable migrations against the intended environment. Generated schema changes require review; the Drizzle model alone omits administration details.
2. Run the application validation sequence in [setup](setup.md#validation-commands), then build the Worker.
3. Select the deployment method consistent with the current task authorization. The package supplies `npm run deploy`; the latest historical Doc 8 operation required the connected Cloudflare integration instead. These are different operational contexts, not interchangeable instructions.
4. Account for the checkpoint's static-asset workaround: an integration entry wrapper served three changed assets from R2 after normal asset upload returned 401. A future deployment must either upload the assets correctly or deliberately reproduce that wrapper; a normal build alone does not establish identical asset delivery.
5. Record deployed revision IDs and verify health, expected public reads, rejected anonymous mutations, owner/machine access and original hash readback. Record what was actually checked; do not copy an earlier successful test claim into a new release.

The historical app/comparison deployment receipt does not prove the separate standalone OCR Worker or processor v2 was deployed. See [deployment evidence](../status/current-state.md#deployment-evidence).

## Pilot pause and recovery

Inspect the run snapshot, extraction policy, stage error, receipt key and job attempts. Preserve partial extraction and raw provider results. Retry only a retryable `needs_human` run under its existing snapshot and attempt cap. A changed model, instructions or extraction policy requires a new request/approval; an old v1 approval cannot silently adopt v2.

Provider switches block guarded new calls while retaining keys and choices. Processor `ENABLED=false` stops its scheduled ticks after deployment, but does not disable all manually invoked processing paths. Changing a switch cannot cancel an already submitted upstream call. Confirm the intended scope of any operational pause.

The pilot's partial extraction prevents AI execution; malformed AI leaves extraction intact. Quote support does not establish a justified interpretation. Human acceptance must remain a separate decision.

## Source bridge recovery

The local runner claims only `nyscef_refresh` and `notebooklm_sync`. Leases last ten minutes and renew during transfers; three abandoned attempts pause for human attention. [Cloud bridge contracts](../../src/lib/bridges.ts) reject stale completion and mismatched source results.

For a court gate, capture every observed docket page and downloaded original into a dated private bundle. Supply the real observation time and observed URL; never reconstruct opaque court identifiers or convert a blocked page into zero rows. The archive retains the full supervised-capture recipe.

For NotebookLM timeouts, reconcile the remote source list and private upload journal before retrying. A filename/title candidate is not a verified hash association. Preserve pending/failed readiness separately from upload acknowledgment.

```sh
# Read-only remote notebook planning; requires the existing authorized session.
node bridges/runner.mjs --plan-notebook=2

# These execute queued source work; use only for the chosen operational task.
npm run bridge:once
npm run bridge:watch
```

Use explicit `CASEVAULT_URL`, `CASEVAULT_API_TOKEN` and, when needed, `CASEVAULT_PYTHON`. The court-manifest and snapshot commands remain in the [original queue guide](../history/archive/2026-10-04/QUEUES_AND_BRIDGES.md#running-locally).

## Corpus replay and receipt handling

Preparation reads staged originals/manifests and writes reconciliation outputs. Import uploads originals and applies stable source identities; it is not a general update API. Keep private checkpoints and input snapshots so replay can resume without inventing receipts.

**Do not overwrite the preserved documentation receipts when using old scripts.** [Deployment verification](../../scripts/verify-deployment.mjs), [corpus import](../../scripts/import-corpus.mjs) and [preparation](../../scripts/prepare-corpus.py) write fixed paths in `docs/`. Their paths were retained for compatibility, but these files are historical evidence. For a future run, use an isolated checkout with copies of the preserved baseline, collect newly produced reports under a new dated receipt path, and restore the baseline files before integrating documentation changes. A future code task may add explicit output-path arguments; this overhaul does not change scripts.

## Troubleshooting map

| Symptom | First distinction and next evidence |
| --- | --- |
| Blank preview | Inspect original response and PDF.js assets; old native iframe failure is historical |
| Drive expiry | Reconnect the separate grant; workspace login alone does not refresh it |
| OCR looks complete but body is missing | Check extraction policy and page warnings; preserve v1 receipt and request v2 explicitly |
| Provider HTTP 200 with empty/error text | Validate actual transcript/schema/finish state; HF quota text can masquerade as completion |
| 429, timeout or 5xx | Availability failure, not a recognition score; reconcile before retrying |
| Deployment denied | Preserve exact operation/error; Worker upload, model agreement and R2 write permissions are separate |
| Old draft shows newer text | Known latest-extraction history limitation; inspect the run's own immutable key |
| Doc 8 resume skips a failed page | Local receipt existence prevents automatic resubmission; inspect server and raw state before explicit retry |

Detailed evidence and unresolved conditions are indexed in [bugs and blockers](../status/bugs-and-blockers.md).

## Sources

[SETUP.md](../history/archive/2026-10-04/SETUP.md), [QUEUES_AND_BRIDGES.md](../history/archive/2026-10-04/QUEUES_AND_BRIDGES.md), [DOC8_WORKFLOW_CHECKPOINT.md](../history/archive/2026-10-04/DOC8_WORKFLOW_CHECKPOINT.md).

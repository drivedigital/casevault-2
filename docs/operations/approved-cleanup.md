# Approved repository cleanup

Record the user's October 4 approvals without implying implementation or live verification has occurred.

[Wiki home](../README.md) · [Feature inventory](../product/feature-inventory.md) · [Handoff](handoff.md)

Recorded **2026-10-05 UTC / 2026-10-04 America/Chicago**. Source: the user's response to the repository-wide handoff review in this conversation.

## Contents

- [Approved work](#approved-work)
- [Time convention](#time-convention)
- [Execution status](#execution-status)

## Approved work

| Review item | Approval and intended work | Status at recording |
| --- | --- | --- |
| 1 | Commit the documentation separately from unfinished worker/runner/test work | Authorized for this documentation commit |
| 2 | Label/rework historical import and verification procedures so they use explicit targets and dated evidence outputs | Approved; implementation pending |
| 3 | Make the recorded integration deployment wrapper/bundle reproducible from tracked source and clarify artifact names | Approved; implementation pending |
| 4 | Reconcile migration/provisioning procedure and test ingestion workflows; existing application data can be disregarded/reset for testing | Approved; no data reset or live tests performed here |
| 5 | Index the newer saved comparison observation and define UTC/local timestamps | Documented in handoff/current state; no server query |
| 6 | Align prototype UI promises/actions/error feedback with actual capability | Approved; implementation pending |
| 7 | Label the historical prototype seed clearly while preserving original bytes | Approved; adjacent notice added |
| 8 | Reconcile operational endpoint variables/defaults and document target selection | Approved; implementation pending |

The feature inventory is for prioritization, not approval to implement every inherited proposal. Reset permission concerns existing application data for ingestion testing. It does not require deleting originals, secrets, provider grants, archived Markdown or historical receipts. Previously approved work remains authorized; execution should establish the concrete target and record results.

## Time convention

Use ISO 8601 UTC (`Z`) for stored observations and receipts. Human-facing operational notes should include the UTC instant and the corresponding `America/Chicago` time with numeric offset. On October 4, 2026 Chicago uses CDT (`UTC−05:00`); daylight-saving changes mean a permanent five-hour subtraction is incorrect. A date-only historical statement has unknown precision and must not be assigned an invented time. File modification time is labeled as metadata, not proof of the remote observation time.

## Execution status

This pass builds the priority inventory and commits documentation. Application changes, schema resets, ingestion tests, live provider calls, deployment and comparison continuation remain separate execution work. The [migration integrity checker](../history/check-documentation.py) preserves the original code baseline; later authorized implementation changes need separate review rather than rewriting that baseline.

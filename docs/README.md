# CaseVault 2 technical wiki

Start here to understand the application, find implementation details, or resume ongoing work.

[Wiki home](README.md) · [Verification baseline](history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Application at a glance](#application-at-a-glance)
- [Topic navigation](#topic-navigation)
- [Reading paths](#reading-paths)
- [Evidence and maintenance rules](#evidence-and-maintenance-rules)
- [Housekeeping verification](#housekeeping-verification)

## Application at a glance

CaseVault 2 is an evidence workspace with document/matter/docket records, preserved original files, source bridges, and bounded OCR/AI processing for human review. Next.js/React run on Cloudflare Workers; Postgres stores structured records and private R2 stores originals and receipts. Temporary public viewing is enabled in checked-in configuration, with authenticated mutations.

The fixed ten-document pilot and the separate Doc 8 OCR comparison are implemented paths. General backlog execution, a global derivative version registry, full-docket retrieval and a populated Knowledge Graph are not established as completed capabilities. Start with [current state](status/current-state.md) before interpreting older progress reports.

## Topic navigation

| Topic | Pages | What to find |
| --- | --- | --- |
| Product | [Features and use cases](product/features-and-use-cases.md), [UX and roadmap](product/ux-and-roadmap.md), [Feature inventory](product/feature-inventory.md) | Supported journeys, screens, limitations and proposals |
| Architecture | [System overview](architecture/system-overview.md), [Schema and storage](architecture/schema-and-storage.md), [Modules](architecture/modules.md) | Services, trust boundaries, data ownership and code entry points |
| Processing | [Intake and processing](processing/intake-and-processing.md), [Workflows](processing/workflows.md), [Derivatives and versioning](processing/derivatives-and-versioning.md) | Original identity, queues, OCR, AI drafts, review and PDF outputs |
| OCR | [Benchmarks](ocr/benchmarks.md), [Providers and endpoints](ocr/providers-and-endpoints.md) | Dated results, failure modes, adapter conventions and licensing research |
| Operations | [Setup](operations/setup.md), [Runbooks](operations/runbooks.md), [Handoff](operations/handoff.md) | Local prerequisites, recovery, deployment caveats and active checkpoint |
| Status | [Current state](status/current-state.md), [Bugs and blockers](status/bugs-and-blockers.md) | Local implementation versus deployed observations and unresolved gaps |
| History | [Source map](history/source-map.md), [Decisions](history/decisions.md), [Upstream artifacts](history/upstream-artifacts.md) | Every original source, section mapping and preserved rationale |

## Reading paths

- **Onboarding:** features → system overview → schema/storage → setup → current state.
- **Feature development:** current state → relevant module → processing/workflow contract → UX/roadmap → related tests.
- **Troubleshooting:** bugs/blockers → relevant runbook → immutable receipt/source → local implementation.
- **Operational handoff:** handoff → current state/deployment evidence → comparison or pilot contract → current server reconciliation in a separately authorized continuation.
- **Historical research:** source map → original archived section → unchanged receipt; upstream catalog entries identify material outside this repository.

## Evidence and maintenance rules

Canonical pages distinguish **local implementation**, **dated observations**, **proposals** and **unverified live state**. Existing tests are evidence of intended coverage, not passing results from this overhaul. Treat historical operator instructions as context, not authorization to run jobs, deploy or publish.

Original Markdown is preserved under `history/archive/2026-10-04/`; old top-level filenames are relocation notices with prior-section anchors. JSON receipts and `provenance/` remain at their original paths. [Source-map link resolution](history/source-map.md#historical-relative-links) makes archived relative references navigable without altering their bytes.

When behavior changes, update its topic and status together, link the relevant code and dated receipt, and retain the prior observation. Use a new dated path for new evidence. Do not replace preserved receipts or copy private transcripts, original files or credentials into documentation. New decisions should carry rationale and evidence without inventing delivery priorities.

## Housekeeping verification

The [baseline](history/baseline-2026-10-04.json) records the original inventory and pre-existing code changes. [Validation](history/validation.md) records preservation, navigation and scope checks. Application tests/builds, provider calls and production checks were outside this documentation pass.

# Schema and storage

Locate authoritative records, object namespaces, and proposed extensions.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Schema authority](#schema-authority)
- [Entity map](#entity-map)
- [Object storage](#object-storage)
- [Proposed schema and library](#proposed-schema-and-library)
- [Sources](#sources)

## Schema authority

[Drizzle definitions](../../src/db/schema.ts) describe application records in `casevault2`. [SQL migrations](../../supabase/migrations/) also define grants, RLS, indexes, defaults, and constraints that are not fully represented in those definitions. Treat both as sources when reviewing a schema change; do not infer the live database state from definitions alone.

The app connects through [Hyperdrive](../../src/db/index.ts) with the restricted `casevault2_app` role. The processing migration fixes workspace policies to the existing workspace UUID, revokes public/anonymous/authenticated table access, and grants the app role access. This is workspace isolation for this app, not individual user authorization.

## Entity map

| Records | Relationships and purpose |
| --- | --- |
| `matters`, `contacts`, `contact_aliases`, `contact_roles`, `contact_relationships` | Matter membership/roles and identity observations; no automatic name-only merging |
| `source_connectors`, `dockets`, `docket_entries` | Source connection state and observed court rows; entries may have no document when unavailable |
| `documents`, `document_tags` | Source association, matter/docket links, original object key/hash, provenance, display text, summaries and review flags |
| `ingestion_jobs` | Document/job kind, unique idempotency key, status, attempts, lease token/expiry, payload and error |
| `notebook_associations` | Remote notebook/source ID, artifact hash, status, equivalence and provenance |
| `processing_pilot` | Fixed workspace/document membership and original hash |
| `processing_requests` | Document, agent and prompt awaiting approval or approved |
| `processing_runs` | Request/job/document links, approved snapshot, extraction key/state, AI result/state and independent human decision |
| `ai_proposals`, `chronology_events`, `claims`, `claim_elements`, `fact_links`, `deadlines`, `tasks`, `activity_log` | Prototype-compatible analysis/workflow structures; schema presence does not establish verified content or completed automation |

A document association is not a distinct file: multiple records can share an original SHA-256. Docket rows remain separate from PDF availability. `documents.ocrText` and `aiSummary` are display copies; authoritative extraction and execution receipts retain their own identity.

## Object storage

All prefixes below are in the configured `EVIDENCE` R2 bucket, not Supabase Storage.

| Namespace | Content and mutability |
| --- | --- |
| `casevault-2/originals/{sha256}` | Original bytes, content-addressed |
| `casevault-2/derivatives/{originalHash}/{policy}/{receiptHash}.json` | Immutable pilot extraction receipt |
| Same prefix, `complete.json` | Reusable completion lookup; not the authoritative immutable receipt |
| `casevault-2/runs/{runId}/` | AI responses, completed batches and hashed results |
| `casevault-2/workspaces/{workspaceId}/ocr-comparisons/{comparisonId}/` | Separate comparison manifest, page attempts/lookups, leases, PDF artifacts and analyses |
| `casevault-2/settings/` | Provider catalogs, active models and enable controls; mutable configuration |
| Agent and Drive connection objects | Server configuration/encrypted grants; never include in a public file catalog |

For comparison object semantics and validation, see [derivatives](../processing/derivatives-and-versioning.md). Application reads resolve a document or comparison association; a proposed Files page must not accept arbitrary object keys from a browser.

## Proposed schema and library

A general derivative registry, auditable primary-version pointer, version-pinned citation UI, reusable search chunks, and canonical Actor/Observation/Source model remain proposed. The comparison's R2 manifests do not implement these database structures. Individual memberships, fine-grained permissions and attributed audit history also remain future work.

The proposed file library groups originals and derivatives under document associations, with matter/source/coverage/review filters. Storage health would be owner-only and limited to allowed evidence prefixes. See [UX and roadmap](../product/ux-and-roadmap.md).

## Sources

[STORAGE_AND_FILE_LIBRARY.md](../history/archive/2026-10-04/STORAGE_AND_FILE_LIBRARY.md), [SEARCHABLE_PDF_DERIVATIVES.md](../history/archive/2026-10-04/SEARCHABLE_PDF_DERIVATIVES.md), [docs/corpus-reconciliation.json](../corpus-reconciliation.json).

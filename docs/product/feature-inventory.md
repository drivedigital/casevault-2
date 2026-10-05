# Feature inventory for prioritization

Choose scope and priority using stable IDs; no delivery order or dates are assigned here.

[Wiki home](../README.md) · [Current state](../status/current-state.md) · [Approved cleanup](../operations/approved-cleanup.md)

Reviewed on **2026-10-05 UTC / 2026-10-04 America/Chicago**, against local source at `dbed6304a7d5` plus recorded working changes. No live state was rechecked. This inventory consolidates the active wiki, archived designs and seven October 3 upstream integration plans; older plans are proposals, not current architecture requirements. Existing baseline capabilities are omitted unless a completion gap remains.

## Contents

- [Work already underway](#work-already-underway)
- [Processing beyond the pilot](#processing-beyond-the-pilot)
- [Files, derivatives and review](#files-derivatives-and-review)
- [Search and contextual analysis](#search-and-contextual-analysis)
- [Identity, communications and intelligence](#identity-communications-and-intelligence)
- [Acquisition and downstream delivery](#acquisition-and-downstream-delivery)
- [Access and shared platform](#access-and-shared-platform)
- [Status and scope](#status-and-scope)
- [Deferred research](#deferred-research)
- [Sources](#sources)

## Work already underway

| ID | Feature | Status | Remaining outcome | Dependencies |
| --- | --- | --- | --- | --- |
| I01 | Repeatable ingestion testing | Authorized | Reconcile migration/bootstrap setup and exercise upload, source association, deduplication, replay, invalid input and partial failure. Existing application data may be discarded for these tests. | Migration/provisioning procedure; explicit target |
| I02 | Complete and review the processing pilot | Partial | Resolve malformed AI output, inspect supported citations, and record human acceptance/rejection independently of extraction success. | I03; schema-valid AI; human review |
| I03 | Verify body-readability v2 rollout | Partial | Verify the processor deployment and approved new-policy runs; prove filing headers do not cause scanned bodies to bypass OCR. | Processor deployment; fresh approved fixtures |
| I04 | Finish Doc 8 OCR comparison | Partial | Reconcile receipts, finish required coverage, assemble/publish validated PDFs, generate draft analyses, and verify browser behavior and quality. | I05; D02; provider eligibility |
| I05 | Reliable comparison recovery and retries | Partial | Fix raw-success quota receipt replay, distinguish resume from retry, preserve attempts, and define recovery/new versions for failed analysis. | Server/local receipt reconciliation |
| I06 | Provider controls and OCR adapter readiness | Partial/unverified | Verify persisted enable controls and relevant deployments, retain explicit model selection and paused providers, and reconcile endpoint failures separately from OCR quality. | Targeted deployment/control evidence; no automatic provider calls |
| I07 | Authenticated court browser acquisition | Partial | Complete supported browser download orchestration, checkpoint challenge pauses, and resume with supervised capture. | Existing court bridge; approved browser/session |
| I08 | Drive authorization refresh | Partial | Refresh expiring grants automatically so the existing read-only selector/import flow does not require repeated reconnection. | Owner-bound encrypted connection |
| I09 | NotebookLM failure recovery | Partial | Reconcile remote readiness and the historically failed source before selective retry; preserve timeout/upload journals. | Current remote listing; original/derivative mapping |
| I10 | Truthful controls and action feedback | Partial | Replace prototype promises for simulation, fuzzy merge and live sync; expose actual errors and distinguish queueing from completed processing. | Actual endpoint behavior |

## Processing beyond the pilot

| ID | Feature | Status | Remaining outcome | Dependencies |
| --- | --- | --- | --- | --- |
| P01 | General document-backlog processing | Proposed | Extend approved extraction/OCR/AI processing beyond fixed pilot membership with measured rollout gates. | I01–I03; P04–P06 |
| P02 | Durable orchestration and job operations | Partial/proposed | Generalize leases/checkpoints and bounded retries; add cancellation, dead-letter/operator recovery, outbox coordination and observable failure states. | Canonical job contracts; P06 |
| P03 | Multi-format intake and extraction | Partial/proposed | Extend the existing original storage/preview path to validated images, Office documents, text and selected communication exports; classify corrupt/encrypted/unsupported inputs. | I01; format-specific adapters |
| P04 | Page coverage and selective OCR routing | Partial/proposed | Measure scanned regions, missing blocks, tables, handwriting and markings; allow per-page override and route difficult pages to measured adapters. | I03; P05 |
| P05 | Reviewed OCR quality benchmark | Partial/proposed | Create reference transcriptions and independent scores for text, names/dates/numbers, handwriting, checkboxes, strikeouts, tables, geometry and uncertainty. | Approved fixtures; human annotation |
| P06 | Execution budgets and provider policy | Partial/proposed | Extend current bounded execution/free-only checks to general processing with explicit page/token/cost budgets, usage receipts, quota handling and eligibility checks. | Selected providers and approved rollout scope |

## Files, derivatives and review

| ID | Feature | Status | Remaining outcome | Dependencies |
| --- | --- | --- | --- | --- |
| D01 | General derivative-version registry | Proposed | Track immutable originals, recipes, extraction/PDF/AI versions, coverage and separate review states; keep an audited primary-version pointer. | Stable original/page identity |
| D02 | Reliable searchable PDFs | Partial | Generalize bounded comparison assembly; verify text-layer alignment, Unicode, reading order, rotation and search/copy while preserving original visuals. | P04/P05; provider geometry or supported PDF output |
| D03 | Files catalog | Proposed | Browse originals and grouped derivatives; filter by matter/source/processing/review; preview/download and later support upload/association. | D01; permitted document/version lookup |
| D04 | Redo, compare and select OCR versions | Proposed | Choose model/pages/hints, request a fresh approved version, compare outputs and explicitly use a version for future reading/processing. | D01; P04; D07 |
| D05 | Version-pinned historical reader | Known gap | Open the extraction used by each historical draft rather than the latest extraction; preserve old citations after reprocessing. | Run/extraction references; D01 for general selection |
| D06 | Page-level quality review and annotations | Proposed | Show original and extracted text side by side; flag regions/spans, categorize errors, retain unresolved readings and enable bulk triage. | Stable page/region locators |
| D07 | Audited transcription corrections | Proposed | Record before/after text, author, reason, time and review state without rewriting raw extraction; distinguish assistant readings from human decisions. | D06; versioned correction records |
| D08 | Storage-health dashboard | Proposed | Owner-only missing/orphan/duplicate/failed-upload reconciliation, restricted to evidence prefixes and separate association/object counts. | I01; D01; authorized prefix inventory |

## Search and contextual analysis

| ID | Feature | Status | Remaining outcome | Dependencies |
| --- | --- | --- | --- | --- |
| R01 | Reusable evidence chunks | Proposed | Create passages with document/version/page/span locators, hashes, table associations and communication-turn provenance. | D01; usable selected extraction |
| R02 | Full-text and semantic search | Proposed | Add citation-backed hybrid retrieval with access filtering; current simple document filtering is not a hybrid index. | R01; retrieval benchmark; selected embedding model |
| R03 | Version-aware indexing and freshness | Proposed | Reindex changed chunks/primary selections; track model/dimensions/index version and stale status while excluding superseded versions from default search. | R01/R02; D04/D07 |
| R04 | Recognition hints and name annotations | Proposed | Snapshot a sourced matter lexicon for supporting adapters; assess hinted versus unhinted output and keep normalization separate from raw transcription. | Reviewed identities; P05 |
| R05 | Docket-aware document summaries | Proposed | Combine target text, a dated docket overview and selected related filings in a bounded preserved context packet. | R01/R02; R06 |
| R06 | Multi-document citations and validation | Proposed | Carry supporting document/version/page/passage references and distinguish target statements, context, allegations, arguments and orders. | Citation schema/UI; D05 |

## Identity, communications and intelligence

| ID | Feature | Status | Remaining outcome | Dependencies |
| --- | --- | --- | --- | --- |
| K01 | Canonical actor and observation model | Inherited proposal | Replace prototype-compatible identity assumptions with scoped actors, raw observations, aliases, dated contact assignments and matter-specific roles. | Shared schema/contracts; reviewed mappings |
| K02 | Explainable identity candidates | Inherited proposal | Rank candidates using multiple signals while preserving Unicode, suffixes, shared/reassigned handles, ambiguity and remembered negative matches. | K01; representative conflict fixtures |
| K03 | Reviewed and reversible identity resolution | Inherited proposal | Separate mention linking, alias acceptance, actor creation and actor merge; retain decisions, redirects and reversal history. | K01/K02; audit history |
| K04 | Selected communication and attachment import | Inherited proposal | Export chosen threads into evidence with native message IDs, participant handles, timestamps/timezones, attachment identity and original export artifacts. | Converge adapter; P03; K01 |
| K05 | Device/contact import preview and recovery | Inherited proposal | Preview scoped observations and conflicts from local device stores; preserve native/account IDs, undo and offline/lost-device recovery. | Local read-only acquisition bridge; K01/K03 |
| K06 | Reviewed facts, events and evidence links | Inherited proposal | Create sourced assertion/event proposals and supporting/contradicting/mention links, preserving disagreements and separate acceptance states. | R06; K01/K03; human review |
| K07 | Evidence-backed knowledge graph | Placeholder/proposed | Build actor/matter, evidence/claim and cross-matter views with bounded expansion, evidence drill-down, filters, saved layouts, accessible tables and scoped exports. | K06; authorized graph projections |
| K08 | Sourced chronology and procedural tracking | Prototype/proposed | Distinguish filing/document/event/service dates, uncertain ranges and timezones; link events to evidence and treat legal deadlines as reviewed determinations. | K06; reviewed procedural rules |
| K09 | Claim research and drafting workspace | Prototype/proposed | Support theories, jurisdiction-specific elements, evidence gaps, viability, defenses, procedural gates, remedies, claim compatibility and reviewed pleading drafts. | Reviewed sources; K06/R06; human strategy/completeness review |

## Acquisition and downstream delivery

| ID | Feature | Status | Remaining outcome | Dependencies |
| --- | --- | --- | --- | --- |
| A01 | Court discovery, snapshots and filing versions | Partial/inherited proposal | Discover/register cases, capture complete dated docket snapshots, distinguish court cases from research matters, and track changed/replaced filings. | I07; canonical court/source identity |
| A02 | Federal ECF/PACER adapter | Inherited proposal | Provide a separate gated federal-court acquisition adapter, including authentication and charging behavior. | Account/source-policy evaluation; no prior automated test |
| A03 | Hosted acquisition and bridge operation | Research/proposed | Evaluate cloud execution for eligible court/consumer tasks while retaining local fallback for session/device constraints. | Measured cloud/session feasibility; I07/I09 |
| A04 | Version-aware NotebookLM derivative delivery | Partial/proposed | Select original or corrected derivative, preserve artifact/source-ID mapping and remote readiness, and avoid default stale/current duplicates. | D01/D07; I09 |
| A05 | Drive delivery and optional ongoing sync | Proposed | Deliver explicitly selected artifacts to a destination with durable remote IDs/version receipts; any ongoing sync needs its own defined contract. | Write authorization/destination; I08; D01 |

## Access and shared platform

| ID | Feature | Status | Remaining outcome | Dependencies |
| --- | --- | --- | --- | --- |
| S01 | Membership and matter permissions | Proposed | Extend single-owner access to individual membership, tenant/matter grants and consistent authorized reads/mutations. | Canonical workspace/source access model |
| S02 | Reviewed restrictions and privilege | Inherited proposal | Record scoped restriction decisions and apply them consistently to documents, communication excerpts, search, graph counts and exports. | S01; reviewed restriction provenance |
| S03 | Shared contracts and attributed audit | Partial/inherited proposal | Version integration contracts, external IDs and optimistic revisions; record who imported, approved, corrected or resolved data without competing mutation owners. | K01; agreed service boundaries |
| S04 | Recovery, restore and broader-access hardening | Partial/proposed | Test database/object recovery and index rebuild; document rollback and add production abuse controls before broadening access. | S01; P02; reproducible deployment |

## Status and scope

**Partial** means some supporting local implementation exists; it does not prove live completion. **Known gap** identifies an inspected correctness problem. **Proposed** identifies documented design. **Inherited proposal** comes from the older cross-application integration plans and needs a scope decision for casevault-2. **Research** is an unvalidated option. **Authorized** records newly approved enabling work, not a completed test or feature. “Prototype” and “placeholder” do not mean verified automation.

Dependency entries describe technical ordering, not user priority. Features can be split into smaller milestones. Changing existing application data for ingestion testing is authorized; originals, credentials and historical documentation evidence are not erased merely to prepare this list. Cloud Run, Workflows, local/container OCR and older backend migration ideas are alternatives inherited from earlier plans, not an instruction to replace the current Worker implementation. Cloud OCR selection remains unresolved.

## Deferred research

- E2B/sandbox provisioning for bounded processing experiments: explicitly deferred in the Doc 8 checkpoint.
- Cloud Run/container processing and Cloudflare Workflows: earlier proposals; choose only if current implementation limits justify them.
- AI Search/Vectorize versus Postgres hybrid retrieval; embedding model/dimensions: measure before choosing an index.
- Alternative OCR providers, including structured-document adapters: benchmark and verify eligibility before selection; no provider choice is committed here.
- Dedicated graph databases, GraphRAG, alternative renderers and cloud NotebookLM sessions: deferred until concrete needs/feasibility justify them.

## Sources

Repository sources: [UX and roadmap](ux-and-roadmap.md), [bugs and blockers](../status/bugs-and-blockers.md), [processing](../processing/intake-and-processing.md), [workflows](../processing/workflows.md), [derivatives](../processing/derivatives-and-versioning.md), [schema](../architecture/schema-and-storage.md), [archived processing strategy](../history/archive/2026-10-04/DOCUMENT_PROCESSING_STRATEGY.md), [archived Files proposal](../history/archive/2026-10-04/STORAGE_AND_FILE_LIBRARY.md).

Upstream sources: the seven `AGENT_HANDOFF_2026-10-03/` plans under the staging root recorded in the [upstream index](../history/upstream-artifacts.md), and `/Users/dangeorge/Downloads/Causes of Action Workflow.md`. These planning texts were read for this inventory; the earlier hash-only verification record remains unchanged. Older pinned code/remote claims inside them were not freshly verified. No private case transcripts or credential values are reproduced. Catalog identities are retained in the [original provenance](../provenance/recent-work-catalog.json).

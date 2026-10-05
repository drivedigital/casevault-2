# Workflows

Follow source-specific journeys and preserve what each receipt actually proves.

[Wiki home](../README.md) · [Verification baseline](../history/baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Court acquisition](#court-acquisition)
- [Drive import](#drive-import)
- [NotebookLM reconciliation and delivery](#notebooklm-reconciliation-and-delivery)
- [Processing and human review](#processing-and-human-review)
- [Notion and future claim workflows](#notion-and-future-claim-workflows)
- [Sources](#sources)

## Court acquisition

Start with the observed NYSCEF DocumentList URL and its opaque docket ID. Preserve all observed pagination and row metadata, then retrieve available original PDFs. The [HTTP adapter](../../bridges/nyscef.py) pauses on court challenges, unexpected empty pages and uncertain pagination. A challenge is never a successful empty docket.

Use the supervised [DOM capture adapter](../../bridges/browser-capture.mjs) when needed; it receives a supported browser tab and captures visible docket data rather than copying authentication stores. Preserve observation timestamps and staged originals. Full authenticated browser download orchestration remains incomplete. Cloud completion validates stored object hash/size before linking filings and enqueueing extraction; existing reviewed document values are preserved.

Historical acquisition: Nasca had 84 rows/70 PDFs/480 pages; LT had 33 rows/32 PDFs/277 pages. Nasca's recorded 21.61 seconds measured active downloads only. LT required human recovery for filings 2–4 and retained deleted entry 28. These are October 3 observations, not current docket totals.

## Drive import

Workspace sign-in and Drive authorization are distinct. Choose Drive files from Settings, Review or Connectors; connect the owner using the separate read-only grant. Browse folders, search filenames, paginate and select up to five files. Native Docs/Sheets/Slides are exported as PDFs; shortcuts and unsupported native types need their target/another supported route.

The server validates selections, fetches metadata/bytes, hashes originals and transactionally records source association plus extraction work. Selecting the same source version reuses its association/job. Partial batches report each file separately. Imports enter normal human review. The short-lived encrypted token requires reconnection on expiry; automatic refresh and outbound Drive delivery remain unimplemented.

## NotebookLM reconciliation and delivery

The local [NotebookLM adapter](../../bridges/notebooklm.mjs) uses the authenticated consumer `nlm` CLI. List remote sources before uploads; preserve known IDs and distinguish title candidates from hash-verified associations. Verify downloaded original bytes, write a private upload journal first, then reconcile the remote list after both success and timeout. An unconfirmed pending upload pauses rather than blindly duplicating the source. Upload acknowledgment and remote readiness are separate outcomes.

Historical LT reconciliation observed 32 ready sources with zero new uploads. Nasca retained 50 originals and added 35 in earlier work: 84 ready and document 56 failed. Imported receipts include an older failed attempt. None of those counts proves present remote state. The adapter never deletes or replaces sources automatically.

## Processing and human review

From a document, save instructions against an active, explicitly bound agent. Pilot eligibility and approval precede execution. Inspect the original, page warnings and draft facts; accept/reject only after interpretation review. Court routine-review bypass does not imply accepted AI output. General queued extraction, approved pilot jobs, and Doc 8 comparison page attempts remain separate.

Notebook delivery is not an automatic consequence of accepted or completed pilot analysis. Derivative delivery needs an explicit original/derivative mapping, hash, engine/version, coverage and review state. Likewise, a Drive delivery proposal needs an explicit destination and durable remote ID/version receipt; the current read-only Drive grant does not provide that workflow.

## Notion and future claim workflows

The initial Notion copy retains source page IDs, URLs, raw fields and observed roles. Name similarity or a global lawyer/client link does not prove a matter-specific identity/representation relationship. No Notion records were edited by that import.

The upstream causes-of-action document is a requirements reference: future research, element-to-evidence mapping, defenses, procedure, remedies and drafting need cited sources and review states. It is not an instruction to infer claim viability or legal deadlines during intake.

## Sources

[WORKFLOWS.md](../history/archive/2026-10-04/WORKFLOWS.md), [QUEUES_AND_BRIDGES.md](../history/archive/2026-10-04/QUEUES_AND_BRIDGES.md), [docs/workflow-verification.json](../workflow-verification.json).

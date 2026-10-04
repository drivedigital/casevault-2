# Supabase, R2 and the proposed Files page

Recorded 2026-10-04 from the CaseVault schema and storage adapters. No database schema or file-library UI was deployed by this review.

## Supabase database

The `casevault2` schema stores structured application records: matters, contacts, aliases, roles and relationships; dockets and entries; document metadata, source provenance, original R2 bucket/key/hash, text display copies and summary/concept fields; tags; proposals; chronology, claim/fact, deadline/task structures; activity; NotebookLM source associations and reconciliation receipts; ingestion jobs; approved pilot membership; processing instructions, immutable approved snapshots, extraction receipt references, AI draft facts/results and separate human review decisions.

Schema support does not imply every legal-analysis table is populated or that its contents are verified. This pilot does not automatically populate claims, identities or a Knowledge Graph. Supabase Auth provides owner Google authentication even while public viewing is allowed. This review inspected definitions, not fresh live row counts.

Original PDF bytes and authoritative extraction JSON are stored in R2, not Supabase Storage. Supabase records describe files and link them to matters, dockets, jobs and review. R2 also currently stores agent configurations, model catalogs/selections and provider enable controls; these are configuration objects, not evidence documents. Provider secrets stay server-side. A searchable-PDF registry and primary-version pointer are proposed in [derivative design](SEARCHABLE_PDF_DERIVATIVES.md), not present in the existing schema.

## Recommended front end

Add Files inside CaseVault, using the document catalog as the main index. Include filename/title, matter/docket/source, original availability, page count, processing state, derivative count and review state. Filters should cover matter, source, text-ready/OCR-needed, failed, unreviewed and files with a searchable copy. Group original and derivative versions under one document rather than showing every technical object as a separate file.

From each row, open the existing document viewer, download the original or a validated searchable version, inspect receipts and processing history, and request reprocessing through the existing authorized workflow. Show document association counts separately from distinct original counts; one original can be associated with multiple records.

Create a separate owner-only storage-health view for missing originals, orphaned evidence files, duplicate hashes and failed uploads. It may reconcile explicitly allowed evidence prefixes against the database, with pagination. It must exclude provider settings, credentials and operational objects. Do not list the whole R2 bucket to public visitors or make the bucket publicly writable. File operations should resolve a permitted document/version through the server rather than accepting arbitrary object keys.

Start with read-only catalog browsing, preview and download. Add uploads/association and derivative selection after their registry/workflow is implemented. Avoid introducing destructive delete/move tools as part of the first file-library milestone.

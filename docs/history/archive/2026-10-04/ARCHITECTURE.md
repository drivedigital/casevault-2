# Architecture and build scope

The supplied ZIP is the UI starting point. Next.js 16 / React 19 run on Cloudflare Workers through OpenNext. Supabase Postgres stores structured records through Hyperdrive; private R2 stores original bytes. An authenticated document route joins a database receipt to its R2 object. A separate ingestion queue records pending extraction.

## Implemented foundation

- Dedicated private GitHub repository and Worker, preserving the old prototype.
- Isolated database schema, restricted role, private-workspace RLS, unique import identities and queue keys, foreign-key indexes.
- Separate machine API credential and Supabase Google sign-in with an authorized-account check. Server-managed HttpOnly/Secure cookies; cookie mutations check Origin. Public health exposes no corpus data.
- Real Notion seed records, two complete docket snapshots, inspected original files, notebook source receipts and the 510W42 extraction backlog.
- Original-file viewing and actual ingestion queue status.
- Manifest validation; repeat-safe imports; content-addressed R2 storage.
- Fake docket/sync/analysis responses and irreversible automatic contact merges disabled.

## Current limitations and next build

This is a single private workspace using Google identity for the authorized operator and a separate machine credential. Individual memberships, audit attribution, multiple tenants, fine-grained access, and production abuse controls remain work before broader access. The database's fixed workspace policy is not a complete multi-tenant design.

The application records jobs but does not yet run OCR, extraction, embeddings or downstream delivery automatically. Build a leased runner with attempt limits, retry/dead-letter state, artifact receipts, and quality review. The recent plans place heavy processing in a cloud processor such as Cloud Run; local work should be reserved for exceptional court/consumer sessions. Existing optional OCR API credentials are not evidence of a live processing pipeline.

NYSCEF and NotebookLM bridges must be reconnected through the documented supervised/session-based methods. Google Drive OAuth and destination selection remain pending. R2 and Supabase are connected now.

The supplied UI tables are not yet the complete canonical Actor/Observation/Source shared model. Preserve raw provenance while implementing reviewed entity resolution; the earlier Converge work normalized contact fields in TypeScript and did not establish a Python fuzzy matching engine. No name-only automatic merge is enabled.

Claims, relationships, chronology, search quality, extraction confidence and document quality remain to be built against actual artifacts. Legacy OCR placeholders are deliberately not ingested as extracted text. Some prototype navigation and editing flows still require product hardening. This deployment is a private development foundation, not a claim of finished CaseVault 2.

## Source review

The source catalog records 49 recent Markdown artifacts with paths and hashes. The working brief, acquisition manifests, NotebookLM sync receipts, OCR reports, latest handoff plans and shared-schema proposal informed this foundation. Prototype seed sources are retained under `docs/provenance/prototype-seed` solely for provenance and are excluded from TypeScript compilation and production seeding.

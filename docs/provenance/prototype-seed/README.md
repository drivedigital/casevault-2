# Historical synthetic seed — provenance only

This directory preserves an earlier prototype fixture. It is not the current setup or ingestion procedure.

Reviewed **2026-10-05 UTC / 2026-10-04 America/Chicago**. [Wiki home](../../README.md) · [Setup](../../operations/setup.md) · [Source map](../../history/source-map.md)

The original [seed.ts](seed.ts) remains byte-for-byte preserved. It begins by truncating application tables with `restart identity cascade` and then inserts synthetic records. Do not execute or adapt that reset against evidence-bearing data as a setup shortcut. It expects historical database exports and is excluded from normal compilation; this notice does not claim it currently runs successfully.

For newly authorized ingestion testing, use the current migration/provisioning procedure and explicitly selected test/reset target. Synthetic records must remain distinguishable from observed case evidence. The user's reset permission is recorded in [approved cleanup](../../operations/approved-cleanup.md); it does not turn this legacy fixture into a supported bootstrap.

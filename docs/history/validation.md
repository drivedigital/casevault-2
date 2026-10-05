# Documentation validation

Record exactly what the documentation overhaul checked and what remains outside its scope.

[Wiki home](../README.md) · [Verification baseline](baseline-2026-10-04.json)

Reviewed against local files on **2026-10-04 (America/Chicago)** at `dbed6304a7d5` plus the recorded working changes. This is static review; deployed state and external availability were not rechecked.

## Contents

- [Verification procedure](#verification-procedure)
- [Results](#results)
- [Manual review](#manual-review)
- [Limits](#limits)

## Verification procedure

From the repository root, run the documentation-only checker:

```sh
python3 docs/history/check-documentation.py
```

It reads the baseline manifest, verifies original Markdown archives and preserved artifacts, checks protected application-file hashes, validates active local Markdown links/anchors and inventories source-map coverage. It excludes immutable archived Markdown from active-link checks because their original relative links resolve through the source map. External URLs are dated references and are not fetched.

This is a migration-baseline check, not a permanent application-code freeze. Later deliberate code changes may trigger protected-file drift; review that drift separately rather than editing the historical baseline to hide it.

## Results

| Check | Outcome |
| --- | --- |
| Original Markdown archives | 24 of 24 match original SHA-256 |
| Existing receipts and provenance | 21 of 21 unchanged at original paths |
| Baseline inventory | All 46 files accounted for, including removed Finder metadata |
| Historical sections | All 136 mapped |
| Protected non-documentation files | All 145 match, including pre-existing uncommitted work |
| Upstream references | All 49 catalog entries and both starting artifacts found with matching hashes; contents not substantively reviewed |
| Active local links and anchors | All resolve; exact count in the result record |
| Diff whitespace check | Passed |

Final results are recorded in [validation-results.json](validation-results.json). The recorded run covers the generated wiki, compatibility notices and root README. All 24 Markdown originals and 21 preserved artifacts must match the baseline; removed Finder metadata is accounted for separately.

## Manual review

The wiki separates pilot, standalone OCR and Doc 8 comparison behavior; local implementation and historical deployment; structural PDF validation and human quality review. Existing uncommitted Worker/runner/test bytes are protected by hashes. Canonical summaries were reviewed against local code and source documents, and no original evidence or private transcript was newly copied into the wiki.

## Limits

Application tests, builds, live service status, external links, model availability, pricing, licensing changes, remote notebook contents and current comparison outputs were not reverified. Historical test/deployment claims retain their source dates. Upstream file hash checks do not constitute a substantive content review.

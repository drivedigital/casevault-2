# Cloudflare OCR, search, and docket browser research

Reviewed October 4, 2026. These are planning findings; no AI Search index or Browser Run acquisition was created.

## AI Search

AI Search can index R2 PDFs and use OCR for scanned PDFs when `indexing_options.use_ocr=true`. OCR is off by default; changing that option initiates reindexing. PDF limits are 10 MiB with OCR and 4 MiB without OCR. The current CaseVault pilot permits originals up to 50 MB, so this cannot replace the whole extraction path.

AI Search is suitable for a later search layer. The reviewed Items API does not establish a supported export of complete, page-numbered extraction receipts with engine and quality metadata. Search citations/chunks do not by themselves meet the pilot's authoritative page receipt requirement. Extract embedded text first and call cloud OCR only for pages needing it.

Billing begins November 1, 2026. The documented account allowance includes 5 million ingestion tokens monthly, shared by text and image processing. Text ingestion above that allowance costs $0.75/million tokens; image processing adds $0.50/million. Query rewriting and answer generation have separate Workers AI usage. Account entitlement and remaining usage must be checked before adoption; availability during the current free period is not a permanent free guarantee.

Use an isolated derivative prefix or bucket with correct Content-Type metadata. Do not index the existing whole evidence bucket: it also contains private configuration and connector credentials. Originals currently use hash-only object keys.

Sources: [Data source and OCR](https://developers.cloudflare.com/ai-search/configuration/data-source/), [R2 source configuration](https://developers.cloudflare.com/ai-search/configuration/data-source/r2/), [Limits and pricing](https://developers.cloudflare.com/ai-search/platform/limits-pricing/), [Items API](https://developers.cloudflare.com/ai-search/api/items/rest-api/).

## Browser Run for NYSCEF

Browser Run is a candidate for a bounded hosted docket acquisition experiment. It supports remote Playwright/Puppeteer sessions and Live View, where the operator can complete a login or challenge before automation resumes. Live View human interaction is beta. Browser Run identifies its traffic as automated; it offers no IP rotation. NYSCEF acceptance therefore remains unverified. A challenge must pause the job rather than produce an empty successful docket.

The first experiment should use one known, previously captured docket: navigate its observed live URL, hand over on a court gate, capture all observed pagination, and retrieve the original filing PDF responses. The `/pdf` endpoint renders a web page; that output is not the filed original and must not substitute for it. Preserve original hashes, filing identities, capture timestamps, and unresolved access restrictions.

The free allowance is 10 browser minutes/day. Paid accounts include 10 browser hours/month before $0.09/browser hour, with separate concurrency considerations. Default session idle timeout is 60 seconds and can be extended to 10 minutes. Live View links default to five minutes, up to one hour. Browser sessions are not a durable job ledger; persist progress in CaseVault and pause safely when a session expires. Verify this account's actual allowance before an experiment.

This remains a future scraper experiment. The existing supervised capture and local source bridge remain the documented recovery paths. It does not change this document-processing pilot or deliver anything to NotebookLM.

Sources: [Human in the loop](https://developers.cloudflare.com/browser-run/features/human-in-the-loop/), [FAQ](https://developers.cloudflare.com/browser-run/faq/), [Limits](https://developers.cloudflare.com/browser-run/limits/), [Pricing](https://developers.cloudflare.com/browser-run/pricing/).

type ReviewDocument = { sourceType: string; status: string; isFlagged?: boolean };

// Court provenance bypasses routine intake review, never extraction or an explicit flag.
export function bypassesDocumentReview(document: ReviewDocument): boolean {
  return document.sourceType === "docket_filing" && !document.isFlagged && document.status !== "flagged";
}
export function belongsInReviewQueue(document: ReviewDocument): boolean {
  return !bypassesDocumentReview(document);
}

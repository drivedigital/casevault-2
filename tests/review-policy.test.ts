import test from 'node:test';
import assert from 'node:assert/strict';
import { belongsInReviewQueue, bypassesDocumentReview } from '../src/lib/review-policy';

test('court filings bypass routine review without changing their processing status', () => {
  const filing = { sourceType: 'docket_filing', status: 'pending_review', isFlagged: false };
  assert.equal(bypassesDocumentReview(filing), true);
  assert.equal(belongsInReviewQueue(filing), false);
  assert.equal(filing.status, 'pending_review');
  for (const sourceType of ['drive', 'upload', 'email']) assert.equal(belongsInReviewQueue({ ...filing, sourceType }), true);
});
test('explicitly flagged court filings remain in the review queue', () => {
  assert.equal(belongsInReviewQueue({ sourceType: 'docket_filing', status: 'flagged' }), true);
  assert.equal(belongsInReviewQueue({ sourceType: 'docket_filing', status: 'pending_review', isFlagged: true }), true);
});

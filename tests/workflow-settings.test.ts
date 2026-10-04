import test from 'node:test';
import assert from 'node:assert/strict';
import { modelSelectionSchema, validActiveModel, type ProviderView } from '../src/lib/provider-types';
import { driveSearchQuery, driveImportSchema } from '../src/lib/drive-schema';
import { bridgeCompletionSchema, validCourtUrl } from '../src/lib/bridge-schema';

test('active model selection rejects unknown and non-text models or unavailable credentials', () => {
  const provider: ProviderView = { id: 'openrouter', configured: true, status: 'ready', checkedAt: '', message: '', models: [{ id: 'synthetic-text', name: 'Synthetic text', output: ['text'] }, { id: 'synthetic-image', name: 'Synthetic image', output: ['image'] }], activeModel: null };
  assert.equal(validActiveModel(provider, 'synthetic-text'), true);
  assert.equal(validActiveModel(provider, 'synthetic-image'), false);
  assert.equal(validActiveModel(provider, 'another-provider/model'), false);
  assert.equal(validActiveModel({ ...provider, configured: false }, 'synthetic-text'), false);
  assert.equal(validActiveModel(provider, null), true);
  assert.equal(modelSelectionSchema.safeParse({ provider: 'ocr', model: 'engine3' }).success, false);
});
test('Drive search treats quotes as filename text, and import batches are bounded', () => {
  assert.equal(driveSearchQuery('root', "client's \\ files"), "trashed = false and name contains 'client\\'s \\\\ files'");
  assert.equal(driveSearchQuery('root', ''), "trashed = false and 'root' in parents");
  assert.equal(driveImportSchema.safeParse({ fileIds: ['../../../etc/passwd'] }).success, false);
  assert.equal(driveImportSchema.safeParse({ fileIds: Array(6).fill('synthetic-file-id') }).success, false);
});
test('bridge receipts reject fabricated completion, duplicate filings, and mismatched hashes', () => {
  assert.equal(validCourtUrl('https://iapps.courts.state.ny.us/nyscef/DocumentList?docketId=synthetic'), true);
  assert.equal(validCourtUrl('https://iapps.courts.state.ny.us.evil.example/nyscef/DocumentList'), false);
  const envelope = { leaseToken: 'd0d1e2f3-1111-4111-8111-111111111111', result: { status: 'succeeded', message: 'Synthetic', observedAt: '2026-10-04T00:00:00Z' } };
  assert.equal(bridgeCompletionSchema.safeParse(envelope).success, false);
  const entry = { number: 1, docType: 'Synthetic filing', description: '', sourceStatus: 'Deleted', filedDate: null, sourceUrl: null, availability: 'deleted' };
  assert.equal(bridgeCompletionSchema.safeParse({ ...envelope, result: { ...envelope.result, entries: [entry] } }).success, true);
  assert.equal(bridgeCompletionSchema.safeParse({ ...envelope, result: { ...envelope.result, entries: [entry, entry] } }).success, false);
  assert.equal(bridgeCompletionSchema.safeParse({ ...envelope, result: { ...envelope.result, entries: [{ ...entry, original: { sha256: 'a'.repeat(64), objectKey: 'casevault-2/originals/' + 'b'.repeat(64), filename: 'synthetic.pdf', bytes: 10, pageCount: 1 } }] } }).success, false);
});

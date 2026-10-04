import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { models } from '../ocr-worker/worker.mjs';

function request(input = {}, token = 'test-secret') {
  return new Request('https://ocr.example/ocr', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ image: 'AQID', model: 'moondream', ...input }) });
}
test('missing and incorrect credentials never reach inference', async () => {
  let calls = 0;
  const AI = { run: async () => { calls++; } };
  assert.equal((await worker.fetch(request(), { AI })).status, 401);
  assert.equal((await worker.fetch(request({}, 'wrong'), { AI, OCR_SECRET_KEY: 'test-secret' })).status, 401);
  assert.equal(calls, 0);
});
test('Moondream uses query schema and results remain unverified', async () => {
  let payload;
  const response = await worker.fetch(request(), { OCR_SECRET_KEY: 'test-secret', AI: { run: async (model, input) => { assert.equal(model, models.moondream); payload = input; return { answer: 'handwritten amendment', finish_reason: 'stop' }; } } });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.reviewStatus, 'unverified');
  assert.equal(payload.task, 'query');
  assert.equal(payload.image, 'data:image/png;base64,AQID');
  assert.equal(payload.reasoning, false);
});
test('Llama uses the current multimodal message schema with an embedded data URI', async () => {
  let payload;
  const response = await worker.fetch(request({ model: 'llama', prompt: 'Transcribe the page' }), { OCR_SECRET_KEY: 'test-secret', AI: { run: async (model, input) => { assert.equal(model, models.llama); payload = input; return { response: 'draft transcription' }; } } });
  assert.equal(response.status, 200);
  assert.deepEqual(payload.messages, [{ role: 'user', content: [{ type: 'text', text: 'Transcribe the page' }, { type: 'image_url', image_url: { url: 'data:image/png;base64,AQID' } }] }]);
  assert.equal(Object.hasOwn(payload, 'image'), false);
  assert.equal(payload.stream, false);
  assert.equal((await response.json()).reviewStatus, 'unverified');
});
test('invalid inputs and arbitrary models are rejected before inference', async () => {
  let calls = 0;
  const env = { OCR_SECRET_KEY: 'test-secret', AI: { run: async () => { calls++; } } };
  for (const input of [{ model: 'arbitrary' }, { image: '' }, { image: 'https://example.com/image.png' }, { max_tokens: 99999 }]) {
    assert.equal((await worker.fetch(request(input), env)).status, 400);
  }
  assert.equal(calls, 0);
});
test('empty answers and malformed structured output are explicit failures', async () => {
  for (const input of [{ answer: '' }, { answer: 'not JSON' }, { answer: '{"irrelevant":true}' }]) {
    const response = await worker.fetch(request({ mode: 'structured' }), { OCR_SECRET_KEY: 'test-secret', AI: { run: async () => input } });
    assert.equal(response.status, 502);
    assert.equal((await response.json()).success, false);
  }
});
test('truncation is visible independently of unverified review status', async () => {
  const response = await worker.fetch(request(), { OCR_SECRET_KEY: 'test-secret', AI: { run: async () => ({ answer: 'partial text', finish_reason: 'length' }) } });
  const result = await response.json();
  assert.equal(result.partial, true);
  assert.equal(result.reviewStatus, 'unverified');
  assert.equal(result.warnings.length, 1);
});
test('provider errors are reported without accepting a license or retrying', async () => {
  let calls = 0;
  const response = await worker.fetch(request({ model: 'llama' }), { OCR_SECRET_KEY: 'test-secret', AI: { run: async () => { calls++; throw new Error('license required test-secret'); } } });
  assert.equal(response.status, 502);
  assert.equal(calls, 1);
  assert.equal((await response.json()).error, 'license required [redacted]');
});

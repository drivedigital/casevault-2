import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultProviderPriority,
  providerControlKey,
  readCustomProviders,
  readProviderEnabled,
  readProviderPriority,
  requireProviderEnabled,
  writeCustomProviders,
  writeProviderControl,
  writeProviderPriority,
} from '../src/lib/provider-controls';

function store() {
  const objects = new Map<string, string>();
  return { objects, get: async (key: string) => objects.has(key) ? { json: async () => JSON.parse(objects.get(key)!) } : null, put: async (key: string, value: string) => { objects.set(key, value); } };
}
test('Gemini starts off without changing existing providers', async () => {
  const bucket = store();
  assert.equal(await readProviderEnabled(bucket, 'gemini'), false);
  assert.equal(await readProviderEnabled(bucket, 'nvidia'), true);
  assert.equal(await readProviderEnabled(bucket, 'openrouter'), true);
  assert.equal(await readProviderEnabled(bucket, 'ocr'), true);
});
test('toggle round trips preserve keys, models, agent configuration and another provider', async () => {
  const bucket = store();
  bucket.objects.set('casevault-2/settings/active-models/gemini.json', '{"provider":"gemini","models":["model-a","model-b"]}');
  bucket.objects.set('credential-fixture', 'synthetic-key');
  bucket.objects.set('casevault-2/agents/synthetic.json', '{"provider":"gemini","modelId":"model-a"}');
  const original = new Map(bucket.objects);
  await writeProviderControl(bucket, { provider: 'gemini', enabled: true });
  assert.equal(await readProviderEnabled(bucket, 'gemini'), true);
  await writeProviderControl(bucket, { provider: 'gemini', enabled: false });
  await assert.rejects(requireProviderEnabled(bucket, 'gemini'), /is off/);
  for (const [key, value] of original) assert.equal(bucket.objects.get(key), value);
  assert.equal(await readProviderEnabled(bucket, 'nvidia'), true);
});
test('malformed and mismatched control records fail closed', async () => {
  const bucket = store();
  for (const value of ['invalid JSON', '{"provider":"nvidia","enabled":true}', '{"provider":"openrouter","enabled":"false"}']) {
    bucket.objects.set(providerControlKey('openrouter'), value);
    assert.equal(await readProviderEnabled(bucket, 'openrouter'), false);
    await assert.rejects(requireProviderEnabled(bucket, 'openrouter'), /is off/);
  }
});
test('control updates reject combined selection mutations and unknown providers', async () => {
  const bucket = store();
  await assert.rejects(writeProviderControl(bucket, { provider: 'gemini', enabled: false, models: [] }));
  await assert.rejects(writeProviderControl(bucket, { provider: 'unknown', enabled: true }));
  await assert.rejects(writeProviderControl(bucket, { provider: 'nvidia', enabled: 'false' }));
  assert.equal(bucket.objects.size, 0);
});
test('provider priority defaults to NVIDIA ahead of OpenRouter and round-trips updates', async () => {
  const bucket = store();
  const initial = await readProviderPriority(bucket);
  assert.deepEqual(initial, defaultProviderPriority);
  assert.ok(initial.indexOf('nvidia') < initial.indexOf('openrouter'), 'NVIDIA must precede OpenRouter by default');

  const reordered = ['openrouter', 'nvidia', 'gemini', 'ollama', 'opencode', 'e2b', 'ocr'];
  await writeProviderPriority(bucket as any, reordered);
  const updated = await readProviderPriority(bucket);
  assert.deepEqual(updated, reordered);

  // Corrupted priority payload falls back cleanly to default
  bucket.objects.set('casevault-2/settings/provider-priority.json', 'not-json');
  assert.deepEqual(await readProviderPriority(bucket), defaultProviderPriority);
});
test('custom provider records round-trip and support persistence', async () => {
  const bucket = store();
  assert.deepEqual(await readCustomProviders(bucket), []);

  const customList = [
    {
      id: 'ollama',
      name: 'Ollama Cloud',
      endpoint: 'https://ollama.com/api',
      models: [{ id: 'nemotron-3-nano:30b', name: 'nemotron-3-nano:30b' }],
      type: 'ollama',
      enabled: true,
    },
  ];
  await writeCustomProviders(bucket as any, customList);
  const saved = await readCustomProviders(bucket);
  assert.deepEqual(saved, customList);
});


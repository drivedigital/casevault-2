import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Portable bridge implementation is intentionally plain Node.js.
import { planNotebook } from '../bridges/notebooklm.mjs';
test('NotebookLM planning preserves existing source IDs and separates upload candidates', () => {
  const manifest = { docket: { notebookId: 'synthetic-notebook' }, documents: [
    { id: 1, sha256: 'a'.repeat(64), objectKey: 'original1', associations: [{ notebookId: 'synthetic-notebook', sourceId: 'existing', artifactHash: null, equivalence: 'title_candidate' }] },
    { id: 2, sha256: 'b'.repeat(64), objectKey: 'original2', associations: [] },
    { id: 3, sha256: null, objectKey: null, associations: [] },
  ] };
  const plan = planNotebook(manifest, [{ id: 'existing', title: 'Synthetic remote', status: 2 }]);
  assert.deepEqual(plan.map((p: { action: string }) => p.action), ['reconcile', 'upload', 'missing_original']);
  assert.equal(plan[0].known.association.equivalence, 'title_candidate');
  assert.equal(planNotebook(manifest, [{ id: 'recovered', title: `CaseVault2 2 ${'b'.repeat(64)}`, status: 2 }])[1].action, 'reconcile');
});

// @ts-expect-error Portable DOM capture adapter is intentionally plain Node.js.
import { captureBrowserDocket } from '../bridges/browser-capture.mjs';
test('supervised browser capture follows observed pagination without constructing court IDs', async () => {
  const first = 'https://iapps.courts.state.ny.us/nyscef/DocumentList?docketId=synthetic';
  const second = first + '&resultsPageNum=2';
  let current = first;
  const tab = { goto: async (url: string) => { current = url; }, playwright: { evaluate: async () => ({ url: current, html: '<table>synthetic</table>', pagination: [first, second] }) } };
  const capture = await captureBrowserDocket(tab);
  assert.deepEqual(capture.pages.map((p: { url: string }) => p.url), [first, second]);
  assert.equal(capture.sourceUrl, first);
});

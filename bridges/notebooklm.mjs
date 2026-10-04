import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
const execute = promisify(execFile);
export async function listSources(notebookId) {
  const { stdout } = await execute('nlm', ['source', 'list', notebookId, '--json'], { timeout: 60000, maxBuffer: 5 * 1024 * 1024 });
  const sources = JSON.parse(stdout);
  if (!Array.isArray(sources) || sources.some(source => !source.id || typeof source.title !== 'string')) throw new Error('Invalid NotebookLM source inventory');
  return sources;
}
export function planNotebook(manifest, sources) {
  return manifest.documents.map(document => {
    const known = document.associations.filter(a => a.notebookId === manifest.docket.notebookId).map(a => ({ association: a, source: sources.find(s => s.id === a.sourceId) })).filter(a => a.source).sort((a,b) => Number(b.source.status === 2) - Number(a.source.status === 2))[0];
    const title = `CaseVault2 ${document.id} ${document.sha256}`;
    const fingerprintCandidate = sources.find(source => source.title === title);
    return { document, title, known, fingerprintCandidate, action: known || fingerprintCandidate ? 'reconcile' : document.sha256 && document.objectKey ? 'upload' : 'missing_original' };
  });
}
function status(value) { return value === 2 ? 'ready' : value === 3 ? 'failed' : 'processing'; }
async function checkpoint(filename, journal) { const temp = filename + '.tmp'; await fs.writeFile(temp, JSON.stringify(journal, null, 2), { mode: 0o600 }); await fs.rename(temp, filename); }
export async function syncNotebook(manifest, directory, api, renew = async () => {}) {
  const notebookId = manifest.docket.notebookId;
  if (!notebookId) return { status: 'needs_human', message: 'Choose a NotebookLM destination first.', observedAt: new Date().toISOString() };
  await fs.mkdir(directory, { recursive: true, mode: 0o700 });
  const journalPath = path.join(directory, `notebook-${notebookId}.json`);
  let journal; try { journal = JSON.parse(await fs.readFile(journalPath, 'utf8')); } catch { journal = {}; }
  let sources;
  try { sources = await listSources(notebookId); } catch { return { status: 'needs_human', message: 'NotebookLM needs a local session refresh. Sign in with the local adapter and resume.', observedAt: new Date().toISOString() }; }
  const receipts = []; let pause = false;
  for (const item of planNotebook(manifest, sources)) {
    await renew();
    const { document, title, known, fingerprintCandidate } = item;
    let source = known?.source ?? fingerprintCandidate;
    let artifactHash = known?.association.artifactHash ?? null;
    let equivalence = known?.association.equivalence ?? 'title_candidate';
    const journalKey = `${document.id}:${document.sha256}`;
    if (!source) {
      if (item.action === 'missing_original') { pause = true; continue; }
      // A pending attempt with no remote match is ambiguous. Never blindly upload it again.
      if (journal[journalKey]?.pending) { pause = true; break; }
      const response = await api(`/api/documents/${document.id}/file`, { raw: true });
      const bytes = Buffer.from(await response.arrayBuffer());
      if (createHash('sha256').update(bytes).digest('hex') !== document.sha256) throw new Error('Original hash does not match the notebook artifact');
      const file = path.join(directory, `${document.id}-${document.sha256}.pdf`);
      await fs.writeFile(file, bytes, { mode: 0o600 });
      journal[journalKey] = { pending: true, title, artifactHash: document.sha256, startedAt: new Date().toISOString() }; await checkpoint(journalPath, journal);
      try {
        const { stdout } = await execute('nlm', ['source', 'add', notebookId, '--file', file, '--title', title, '--wait', '--wait-timeout', '90', '--json'], { timeout: 120000, maxBuffer: 5 * 1024 * 1024 });
        const uploaded = JSON.parse(stdout); if (uploaded.source_id) journal[journalKey].sourceId = uploaded.source_id;
      } catch { /* Reconcile after timeouts before deciding whether another attempt is safe. */ }
      try { sources = await listSources(notebookId); } catch { pause = true; break; }
      source = sources.find(s => s.id === journal[journalKey].sourceId) ?? sources.find(s => s.title === title);
      if (!source) { pause = true; break; }
      artifactHash = document.sha256; equivalence = 'uploaded_hash';
      journal[journalKey] = { ...journal[journalKey], pending: false, sourceId: source.id, observedAt: new Date().toISOString() }; await checkpoint(journalPath, journal);
    } else if (journal[journalKey]?.artifactHash === document.sha256 && (journal[journalKey].sourceId === source.id || journal[journalKey].pending)) {
      artifactHash = document.sha256; equivalence = 'uploaded_hash';
      journal[journalKey] = { ...journal[journalKey], pending: false, sourceId: source.id }; await checkpoint(journalPath, journal);
    }
    receipts.push({ documentId: document.id, notebookId, sourceId: source.id, artifactHash, equivalence: ['uploaded_hash','unverified','title_candidate'].includes(equivalence) ? equivalence : 'unverified', status: status(source.status), remoteStatus: Number(source.status) });
  }
  const incomplete = receipts.some(receipt => receipt.status !== 'ready');
  return { status: pause ? 'needs_human' : incomplete ? 'partial' : 'succeeded', message: pause ? 'An upload or session needs reconciliation. Existing sources were preserved; no ambiguous upload was repeated.' : `${receipts.length} remote source associations reconciled; ${receipts.filter(r => r.status === 'ready').length} ready.`, observedAt: new Date().toISOString(), ...(receipts.length ? { receipts } : {}) };
}

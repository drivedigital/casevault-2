import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { listSources, planNotebook, syncNotebook } from './notebooklm.mjs';
const execute = promisify(execFile);
const local = dotenv.parse(await fs.readFile('.env.local').catch(() => Buffer.from('')));
const token = process.env.CASEVAULT_API_TOKEN || local.CASEVAULT_API_TOKEN;
const origin = process.env.CASEVAULT_URL || 'https://casevault-2.dan-2eb.workers.dev';
const base = new URL(origin);
if (!token || (base.protocol !== 'https:' && base.hostname !== '127.0.0.1')) throw new Error('A private machine credential and secure CaseVault URL are required');
const privateRoot = path.resolve('.private/bridges'); await fs.mkdir(privateRoot, { recursive: true, mode: 0o700 });
async function api(route, { method = 'GET', body, raw = false } = {}) {
  const headers = { Authorization: `Bearer ${token}` };
  if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const response = await fetch(new URL(route, base), { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined, redirect: 'manual', signal: AbortSignal.timeout(120000) });
  if (!response.ok) throw new Error(`CaseVault bridge request rejected (${response.status})`);
  return raw ? response : response.json();
}
async function runOnce() {
  const { job } = await api('/api/bridges/lease', { method: 'POST' });
  if (!job) { console.log('No court or NotebookLM work queued.'); return; }
  let result;
  try {
    const manifest = await api(`/api/bridges/manifest?docketId=${job.payload.docketId}`);
    const renew = () => api(`/api/bridges/jobs/${job.id}`, { method: 'PATCH', body: { leaseToken: job.leaseToken } });
    if (job.kind === 'notebooklm_sync') result = await syncNotebook(manifest, privateRoot, api, renew);
    else {
      const directory = path.join(privateRoot, `nyscef-${job.id}`);
      const resume = process.argv.find(arg => arg.startsWith('--court-manifest='))?.slice('--court-manifest='.length);
      if (!resume) await execute(process.env.CASEVAULT_PYTHON || 'python3', ['bridges/nyscef.py', '--url', manifest.docket.sourceUrl, '--output', directory], { timeout: 7 * 60000, maxBuffer: 1024 * 1024 });
      const acquisition = JSON.parse(await fs.readFile(resume || path.join(directory, 'manifest.json'), 'utf8'));
      if (new URL(acquisition.sourceUrl).searchParams.get('docketId') !== new URL(manifest.docket.sourceUrl).searchParams.get('docketId')) throw new Error('The supplied manifest belongs to a different docket');
      await renew();
      for (const original of acquisition.files) {
        await renew();
        const form = new FormData(); form.set('file', new Blob([await fs.readFile(original.path)], { type: 'application/pdf' }), original.filename);
        const receipt = await api('/api/objects', { method: 'POST', body: form });
        if (receipt.sha256 !== original.sha256 || receipt.size !== original.bytes) throw new Error('Court original hash/size verification failed');
        const entry = acquisition.entries.find(e => e.number === original.number);
        entry.original = { sha256: original.sha256, objectKey: receipt.key, filename: original.filename, bytes: original.bytes, pageCount: original.pageCount };
      }
      result = { status: acquisition.status, message: acquisition.message, observedAt: acquisition.observedAt, ...(acquisition.entries.length ? { entries: acquisition.entries } : {}) };
    }
  } catch { result = { status: 'needs_human', message: 'The local adapter needs attention. Verify the source session and private bridge receipts before resuming.', observedAt: new Date().toISOString() }; }
  await api(`/api/bridges/jobs/${job.id}`, { method: 'POST', body: { leaseToken: job.leaseToken, result } });
  console.log(JSON.stringify({ jobId: job.id, kind: job.kind, status: result.status, message: result.message }));
}
const planArg = process.argv.find(arg => arg.startsWith('--plan-notebook='));
if (planArg) {
  const id = Number(planArg.split('=')[1]); if (!Number.isSafeInteger(id) || id < 1) throw new Error('Provide a valid docket ID');
  const manifest = await api(`/api/bridges/manifest?docketId=${id}`);
  const sources = await listSources(manifest.docket.notebookId);
  const plan = planNotebook(manifest, sources);
  await fs.writeFile(path.join(privateRoot, `notebook-plan-${id}.json`), JSON.stringify(plan, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ docketId: id, remoteSources: sources.length, documents: plan.length, reconcile: plan.filter(p => p.action === 'reconcile').length, upload: plan.filter(p => p.action === 'upload').length, missingOriginal: plan.filter(p => p.action === 'missing_original').length }));
} else if (process.argv.includes('--watch')) {
  while (true) { try { await runOnce(); } catch { console.log('Bridge connection unavailable. Retrying later.'); } await new Promise(resolve => setTimeout(resolve, 15000)); }
} else await runOnce();

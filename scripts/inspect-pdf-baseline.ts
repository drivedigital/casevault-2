// Inspect the current processor's classification without permitting external OCR.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { extractPdf } from '../processor/pdf';

async function main() {
  const [input, output] = process.argv.slice(2);
  if (!input || !output?.startsWith('.private/')) {
    throw new Error('Usage: tsx scripts/inspect-pdf-baseline.ts ORIGINAL.pdf .private/BASELINE.json');
  }
  const bytes = new Uint8Array(readFileSync(input));
  let ocrCalls = 0;
  const receipt = await extractPdf(bytes, createHash('sha256').update(bytes).digest('hex'), async () => {
    ocrCalls++;
    throw new Error('Baseline inspection disables external OCR; this page requires cloud extraction');
  });
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, JSON.stringify({ ocrCalls, receipt }, null, 2), { mode: 0o600 });
  console.log(JSON.stringify({ pages: receipt.pageCount, ocrCalls, status: receipt.status,
    methods: receipt.pages.map(p => p.method), textLengths: receipt.pages.map(p => p.text.length) }));
}
main().catch(error => { console.error(error instanceof Error ? error.message : 'Inspection failed'); process.exitCode = 1; });

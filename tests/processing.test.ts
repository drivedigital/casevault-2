import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, degrees, PDFDict } from 'pdf-lib';
import { extractPdf, inspectPdf } from '../processor/pdf';
import { analysisSchema, citedFacts, isFreePricing, liveLease, usableText, extractionSchema, parseAnalysis,hasNvidiaFreeEntitlement,validateOriginalSize } from '../src/lib/processing-types';
const hash = '0'.repeat(64);
async function digitalPdf() { const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); pdf.addPage().drawText('On January 10, 2024, Alice signed the contract in New York. This is source evidence.', { font, size: 12, x: 60, y: 600 }); return pdf; }
test('digital PDF text extraction never calls OCR', async () => { const pdf = await digitalPdf(); let calls = 0; const result = await extractPdf(await pdf.save(), hash, async () => { calls++; return ''; }); assert.equal(calls, 0); assert.equal(result.pages[0].method, 'embedded'); assert.equal(result.status, 'complete'); });
test('a court filing header alone never establishes searchable body text', async () => {
    const pdf = await PDFDocument.create();
    const page = pdf.addPage();
    page.drawText('Case 1-26-44227-jmm Doc 8 Filed 09/16/26 Entered 09/16/26 10:05:05', { x: 35, y: page.getHeight() - 15, size: 12 });
    let calls = 0;
    const result = await extractPdf(await pdf.save(), hash, async () => { calls++; throw new Error('OCR is paused'); });
    assert.equal(calls, 1);
    assert.equal(result.status, 'partial');
    assert.equal(result.pages[0].method, 'unavailable');
    assert.match(result.pages[0].warnings.join(' '), /page-body/);
    assert.equal(result.version, 'text-first-ocrspace-body-v2');
});
test('body validation also accepts genuinely embedded text on rotated pages', async () => {
    const pdf = await digitalPdf(); pdf.getPage(0).setRotation(degrees(90));
    let calls = 0;
    const result = await extractPdf(await pdf.save(), hash, async () => { calls++; return ''; });
    assert.equal(calls, 0); assert.equal(result.status, 'complete');
});
test('historical v1 receipts remain readable without becoming current cache receipts', () => {
    const old = { version: 'text-first-ocrspace-v1', originalHash: hash, pageCount: 1, pages: [{ page: 1, text: 'Historical extraction text', method: 'embedded', warnings: [] }], status: 'complete', engines: {} };
    assert.equal(extractionSchema.parse(old).version, 'text-first-ocrspace-v1');
});
test('mixed PDF retains embedded pages and sends only a one-page derivative for OCR', async () => { const pdf = await digitalPdf(); pdf.addPage().setRotation(degrees(90)); let calls = 0; const result = await extractPdf(await pdf.save(), hash, async (bytes) => { calls++; assert.equal((await PDFDocument.load(bytes)).getPageCount(), 1); return 'This scanned page contains enough readable source text for the processing pilot.'; }); assert.equal(calls, 1); assert.deepEqual(result.pages.map(p => p.method), ['embedded', 'ocrspace']); assert.equal(result.status, 'complete'); });
test('OCR failures preserve good pages and mark extraction partial', async () => { const pdf = await digitalPdf(); pdf.addPage(); const result = await extractPdf(await pdf.save(), hash, async () => { throw new Error('Quota exhausted'); }); assert.equal(result.status, 'partial'); assert.equal(result.pages[0].method, 'embedded'); assert.equal(result.pages[1].method, 'unavailable'); assert.match(result.pages[1].warnings.join(' '), /Quota/); });
test('corrupt, encrypted and oversized page-count PDFs fail without OCR', async () => { await assert.rejects(inspectPdf(new TextEncoder().encode('not a PDF'))); const large = await PDFDocument.create(); for (let i = 0; i < 201; i++)
    large.addPage(); await assert.rejects(inspectPdf(await large.save()), /200-page/); const encrypted = await digitalPdf(); encrypted.context.trailerInfo.Encrypt = encrypted.context.register(PDFDict.withContext(encrypted.context)); await assert.rejects(inspectPdf(await encrypted.save()), /encrypted/i); });
test('free-only pricing fails closed for missing, paid and undeclared free variants', () => { assert.equal(isFreePricing({ id: 'test:free', pricing: { prompt: '0', completion: '0', request: '0' } }), true); assert.equal(isFreePricing({ id: 'test:free' }), false); assert.equal(isFreePricing({ id: 'test', pricing: { prompt: '0', completion: '0' } }), false); assert.equal(isFreePricing({ id: 'test:free', pricing: { prompt: '0', completion: '.001' } }), false); assert.equal(isFreePricing({ id: 'test:free', pricing: { prompt: '0', completion: '0', image: '1' } }), false); });
test('facts require a supporting quote on the cited source page', () => { const analysis = analysisSchema.parse({ summary: 'Draft', facts: [{ kind: 'event', text: 'Alice signed', page: 1, quote: 'Alice signed the contract' }, { kind: 'event', text: 'Unsupported', page: 2, quote: 'Alice signed the contract' }] }); const facts = citedFacts(analysis, [{ page: 1, method: 'embedded', text: 'Alice signed the contract in New York.', warnings: [] }]); assert.deepEqual(facts.map(f => f.supported), [true, false]); });
test('expired, stale and non-running leases cannot complete or renew', () => { assert.equal(liveLease({ status: 'running', leaseToken: 'a', leaseUntil: new Date(200) }, 'a', 100), true); assert.equal(liveLease({ status: 'running', leaseToken: 'a', leaseUntil: new Date(100) }, 'a', 100), false); assert.equal(liveLease({ status: 'running', leaseToken: 'a', leaseUntil: new Date(200) }, 'b', 100), false); assert.equal(liveLease({ status: 'queued', leaseToken: 'a', leaseUntil: new Date(200) }, 'a', 100), false); });
test('quality checks reject sparse and corrupted text and incomplete page receipts', () => { assert.equal(usableText('a'), false); assert.equal(usableText('\uFFFD'.repeat(50)), false); assert.equal(extractionSchema.safeParse({ version: 'text-first-ocrspace-v1', originalHash: hash, pageCount: 2, pages: [{ page: 1, text: '', method: 'unavailable', warnings: [] }], status: 'complete', engines: {} }).success, false); });
test('model JSON envelopes remain schema validated', () => { const value = { summary: 'Draft', facts: [] }; assert.deepEqual(parseAnalysis('Here is the draft: ```json\n' + JSON.stringify(value) + '\n```'), value); assert.throws(() => parseAnalysis('Here is a narrative without structured facts')); assert.throws(() => parseAnalysis('{"summary":"Draft","facts":[{"page":1}]}')); });

test('NVIDIA free evidence is model scoped and ignores embedded metadata',()=>{const model='nvidia/nemotron-3.5-lightning-30b-a3b';assert.equal(hasNvidiaFreeEntitlement(model,'<p>free API endpoint</p><dt>Free Endpoint</dt><dd>Available</dd>'),true);assert.equal(hasNvidiaFreeEntitlement('other','free API endpoint Free Endpoint Available'),false);assert.equal(hasNvidiaFreeEntitlement(model,'<script>free API endpoint Free Endpoint Available</script>'),false);assert.equal(hasNvidiaFreeEntitlement(model,'free API endpoint Free Endpoint Unavailable'),false);});
test('original byte limit pauses oversized documents',()=>{assert.doesNotThrow(()=>validateOriginalSize(50*1024*1024));assert.throws(()=>validateOriginalSize(50*1024*1024+1),/50 MB/);});

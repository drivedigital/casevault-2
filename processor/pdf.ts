import DOMMatrix from '@thednp/dommatrix';
import { PDFDocument } from 'pdf-lib';
import { extractionVersion, usableText, type Extraction } from '../src/lib/processing-types';
// Pure-JS geometry shim: extraction never renders pixels or uses a canvas.
Object.assign(globalThis, { DOMMatrix });
// PDF.js fake worker runs in this isolate; it does not start browser workers.
const pdfReady = Promise.all([import('pdfjs-dist/legacy/build/pdf.mjs'), import('pdfjs-dist/legacy/build/pdf.worker.mjs')]).then(([pdf, worker]) => { Object.assign(globalThis, { pdfjsWorker: worker }); return pdf; });
export async function inspectPdf(bytes: Uint8Array) { const pdf = await PDFDocument.load(bytes, { updateMetadata: false }); if (pdf.isEncrypted)
    throw new Error('Encrypted PDF requires an unlocked original'); if (pdf.getPageCount() > 200)
    throw new Error('PDF exceeds the 200-page pilot limit'); return pdf; }
export async function extractPdf(bytes: Uint8Array, hash: string, ocr: (bytes: Uint8Array, page: number) => Promise<string>, progress?: () => Promise<void>): Promise<Extraction> {
    const source = await inspectPdf(bytes);
    const pdfjs = await pdfReady;
    const task = pdfjs.getDocument({ data: bytes.slice(), disableFontFace: true, useSystemFonts: true, isOffscreenCanvasSupported: false, isImageDecoderSupported: false, stopAtErrors: true });
    const pdf = await task.promise;
    const pages: Extraction['pages'] = [];
    try {
        for (let number = 1; number <= pdf.numPages; number++) {
            await progress?.();
            const page = await pdf.getPage(number);
            const content = await page.getTextContent();
            const text = content.items.map(item => 'str' in item ? item.str + ('hasEOL' in item && item.hasEOL ? '\n' : ' ') : '').join('').trim();
            if (usableText(text)) {
                pages.push({ page: number, text, method: 'embedded', warnings: [] });
                continue;
            }
            try {
                const single = await PDFDocument.create();
                const [copy] = await single.copyPages(source, [number - 1]);
                single.addPage(copy);
                const isolated = await single.save();
                if (isolated.length > 1000000)
                    throw new Error('This page exceeds the OCR.space free 1 MB limit');
                const result = await ocr(isolated, number);
                if (!usableText(result))
                    throw new Error('OCR returned insufficient usable text; inspect this page');
                pages.push({ page: number, text: result, method: 'ocrspace', warnings: ['OCR text requires quality review'] });
            }
            catch (error) {
                pages.push({ page: number, text, method: 'unavailable', warnings: [error instanceof Error ? error.message : 'OCR failed'] });
            }
        }
    }
    finally {
        await task.destroy();
    }
    return { version: extractionVersion, originalHash: hash, pageCount: source.getPageCount(), pages, status: pages.some(p => p.method === 'unavailable') ? 'partial' : 'complete', engines: { embedded: `PDF.js ${pdfjs.version}`, split: 'pdf-lib 1.17.1', ocr: 'OCR.space Engine 3 cloud API' } };
}

import { extractPdf } from './pdf';
import { z } from 'zod';
import { extractionSchema, extractionVersion, usableText,validateOriginalSize } from '../src/lib/processing-types';
import { equalSecret } from '../src/lib/auth';
import { requireProviderEnabled } from '../src/lib/provider-controls';
interface Env {
    EVIDENCE: R2Bucket;
    CASEVAULT: Fetcher;
    CASEVAULT_API_TOKEN: string;
    OCR_SPACE_API_KEY: string;
    ENABLED: string;
}
export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        if (!await equalSecret(request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '', env.CASEVAULT_API_TOKEN))
            return Response.json({ error: 'Authentication required' }, { status: 401 });
        if (request.method !== 'POST' || new URL(request.url).pathname !== '/extract')
            return Response.json({ error: 'Not found' }, { status: 404 });
        try {
            const input = z.object({ objectKey: z.string().regex(/^casevault-2\/originals\/[a-f0-9]{64}$/), sha256: z.string().regex(/^[a-f0-9]{64}$/), jobId: z.number().int().positive(), leaseToken: z.uuid(), previousExtractionKey: z.string().nullable().optional() }).parse(await request.json());
            if (input.objectKey !== `casevault-2/originals/${input.sha256}`)
                throw new Error('Original identity mismatch');
            const object = await env.EVIDENCE.get(input.objectKey);
            if (!object)
                throw new Error('Original object missing');
            validateOriginalSize(object.size);
            const bytes = new Uint8Array(await object.arrayBuffer());
            const digest = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))).map(b => b.toString(16).padStart(2, '0')).join('');
            if (digest !== input.sha256)
                throw new Error('Original hash mismatch');
            if (new TextDecoder().decode(bytes.slice(0, 5)) !== '%PDF-')
                throw new Error('Pilot supports PDF originals only');
            const progress = async () => { const response = await env.CASEVAULT.fetch('https://casevault.internal/api/processing/tick', { method: 'PATCH', headers: { Authorization: `Bearer ${env.CASEVAULT_API_TOKEN}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: input.jobId, leaseToken: input.leaseToken }) }); if (!response.ok)
                throw new Error('Processing lease expired'); };
            let previous = null;
            if (input.previousExtractionKey) {
                if (!input.previousExtractionKey.startsWith(`casevault-2/derivatives/${digest}/${extractionVersion}/`))
                    throw new Error('Previous receipt identity mismatch');
                const saved = await env.EVIDENCE.get(input.previousExtractionKey);
                if (saved) {
                    previous = extractionSchema.parse(await saved.json());
                    if (previous.originalHash !== digest || previous.version !== extractionVersion)
                        throw new Error('Previous receipt hash mismatch');
                }
            }
            let calls = 0;
            const result = await extractPdf(bytes, digest, async (isolated, page) => {
                const saved = previous?.pages.find(p => p.page === page && p.method === 'ocrspace' && usableText(p.text));
                if (saved)
                    return saved.text;
                await requireProviderEnabled(env.EVIDENCE, 'ocr');
                if (++calls > 30)
                    throw new Error('Pilot OCR request cap reached (30 pages per run)');
                if (!env.OCR_SPACE_API_KEY)
                    throw new Error('OCR credential not installed');
                const form = new FormData();
                form.set('file', new Blob([isolated.slice().buffer], { type: 'application/pdf' }), 'page.pdf');
                form.set('filetype', 'PDF');
                form.set('OCREngine', '3');
                form.set('language', 'eng');
                form.set('detectOrientation', 'true');
                form.set('isTable', 'true');
                const response = await fetch('https://api.ocr.space/parse/image', { method: 'POST', headers: { apikey: env.OCR_SPACE_API_KEY }, body: form, redirect: 'manual', signal: AbortSignal.timeout(45000) });
                if (!response.ok) {
                    await response.body?.cancel();
                    throw new Error(`OCR service returned HTTP ${response.status}`);
                }
                const data = z.object({ IsErroredOnProcessing: z.boolean(), OCRExitCode: z.number(), ParsedResults: z.array(z.object({ ParsedText: z.string(), FileParseExitCode: z.number() })).optional() }).parse(await response.json());
                if (data.IsErroredOnProcessing || data.OCRExitCode !== 1 || data.ParsedResults?.length !== 1 || data.ParsedResults[0].FileParseExitCode !== 1)
                    throw new Error('OCR did not completely process this single page');
                return data.ParsedResults[0].ParsedText;
            }, progress);
            return Response.json(result);
        }
        catch (error) {
            return Response.json({ error: error instanceof Error ? error.message : 'Extraction failed' }, { status: 422 });
        }
    },
    async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) { if (env.ENABLED !== 'true')
        return; ctx.waitUntil((async () => { const response = await env.CASEVAULT.fetch('https://casevault.internal/api/processing/tick', { method: 'POST', headers: { Authorization: `Bearer ${env.CASEVAULT_API_TOKEN}` } }); console.log(JSON.stringify({ event: 'pilot_tick', status: response.status })); await response.body?.cancel(); })()); }
} satisfies ExportedHandler<Env>;

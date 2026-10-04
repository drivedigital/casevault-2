import { z } from 'zod';
export const extractionVersion = 'text-first-ocrspace-v1';
export const pageSchema = z.object({ page: z.number().int().positive(), text: z.string().max(250000), method: z.enum(['embedded', 'ocrspace', 'unavailable']), warnings: z.array(z.string()) });
export const extractionSchema = z.object({ version: z.literal(extractionVersion), originalHash: z.string().regex(/^[a-f0-9]{64}$/), pageCount: z.number().int().positive().max(200), pages: z.array(pageSchema).max(200), status: z.enum(['complete', 'partial']), engines: z.record(z.string(), z.string()) }).superRefine((value, ctx) => { if (value.pages.length !== value.pageCount || value.pages.some((p, i) => p.page !== i + 1))
    ctx.addIssue({ code: 'custom', message: 'Incomplete or unordered page receipt' }); if (value.status === 'complete' && value.pages.some(p => p.method === 'unavailable'))
    ctx.addIssue({ code: 'custom', message: 'Unavailable pages cannot be complete' }); });
export type Extraction = z.infer<typeof extractionSchema>;
export const analysisSchema = z.object({ summary: z.string().min(1).max(12000), facts: z.array(z.object({ kind: z.enum(['person', 'date', 'event', 'statement']), text: z.string().min(1).max(2000), page: z.number().int().positive(), quote: z.string().min(12).max(2000) })).max(100) });
export type Analysis = z.infer<typeof analysisSchema>;
export function usableText(text: string) { const chars = text.match(/[\p{L}\p{N}]/gu)?.length ?? 0; return chars >= 40 && (text.match(/\uFFFD/g)?.length ?? 0) < Math.max(3, text.length * .02); }
const normalize = (text: string) => text.normalize('NFKC').replace(/\s+/g, ' ').trim().toLowerCase();
export function citedFacts(analysis: Analysis, pages: Extraction['pages']) { return analysis.facts.map(f => ({ ...f, supported: !!pages.find(p => p.page === f.page && p.method !== 'unavailable' && normalize(p.text).includes(normalize(f.quote))) })); }
export function isFreePricing(model: {
    id: string;
    pricing?: Record<string, string | number>;
}) { if (!model.id.endsWith(':free') || !model.pricing)
    return false; const p = model.pricing; return ['prompt', 'completion'].every(k => p[k] !== undefined && Number(p[k]) === 0) && Object.values(p).every(v => Number.isFinite(Number(v)) && Number(v) === 0); }
export function liveLease(job: {
    status: string;
    leaseToken: string | null;
    leaseUntil: Date | null;
}, token: string, now = Date.now()) { return job.status === 'running' && job.leaseToken === token && !!job.leaseUntil && job.leaseUntil.getTime() > now; }
export function parseAnalysis(text: string) { const trimmed = text.trim(); const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]; const start = trimmed.indexOf('{'), end = trimmed.lastIndexOf('}'); const candidates = [trimmed, fenced, start >= 0 && end > start ? trimmed.slice(start, end + 1) : undefined]; for (const candidate of candidates) {
    if (!candidate)
        continue;
    try {
        return analysisSchema.parse(JSON.parse(candidate));
    }
    catch { /* Try only bounded JSON candidates; every result still passes the schema. */ }
} throw new Error('Model response has no valid summary/facts JSON; inspect the saved response receipt or retry.'); }
export function hasNvidiaFreeEntitlement(model:string,html:string){if(model!=='nvidia/nemotron-3.5-lightning-30b-a3b')return false;const visible=html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ');return /Free Endpoint\s+Available/.test(visible)&&visible.includes('free API endpoint');}
export function validateOriginalSize(bytes:number){if(bytes>50*1024*1024)throw new Error('Original exceeds 50 MB pilot limit');}

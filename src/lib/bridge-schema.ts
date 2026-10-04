import { z } from "zod";
export const bridgeKinds = ["nyscef_refresh", "notebooklm_sync"] as const;
export const bridgeRequestSchema = z.object({ kind: z.enum(bridgeKinds), docketId: z.number().int().positive(), requestId: z.uuid() }).strict();
export function validCourtUrl(value: string) {
  try { const url = new URL(value); return url.origin === "https://iapps.courts.state.ny.us" && /^\/nyscef\/(DocumentList|ViewDocument)$/.test(url.pathname) && !url.username && !url.password; } catch { return false; }
}
export const courtUrlSchema = z.string().max(2000).refine(validCourtUrl);
const filingSchema = z.object({
  number: z.number().int().positive(), docType: z.string().min(1).max(256), description: z.string().max(20000), sourceStatus: z.string().max(2000),
  filedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(), sourceUrl: courtUrlSchema.nullable(),
  availability: z.enum(["public_pdf", "deleted", "restricted", "metadata_only"]),
  original: z.object({ sha256: z.string().regex(/^[a-f0-9]{64}$/), objectKey: z.string().regex(/^casevault-2\/originals\/[a-f0-9]{64}$/), filename: z.string().min(1).max(512), bytes: z.number().int().positive().max(50 * 1024 * 1024), pageCount: z.number().int().positive().nullable() }).strict().optional(),
}).strict().refine(entry => !entry.original || entry.original.objectKey === `casevault-2/originals/${entry.original.sha256}`);
const notebookReceiptSchema = z.object({ documentId: z.number().int().positive(), notebookId: z.uuid(), sourceId: z.uuid(), artifactHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(), status: z.enum(["ready", "processing", "failed"]), equivalence: z.enum(["uploaded_hash", "title_candidate", "unverified"]), remoteStatus: z.number().int() }).strict().refine(receipt => receipt.equivalence !== "uploaded_hash" || receipt.artifactHash !== null);
export const bridgeResultSchema = z.object({
  status: z.enum(["succeeded", "partial", "needs_human", "failed"]), message: z.string().max(2000),
  observedAt: z.iso.datetime(), entries: z.array(filingSchema).max(10000).optional(), receipts: z.array(notebookReceiptSchema).max(1000).optional(),
}).strict().superRefine((result, ctx) => {
  if (result.entries && new Set(result.entries.map(e => e.number)).size !== result.entries.length) ctx.addIssue({ code: "custom", message: "Duplicate filing numbers" });
  if (["succeeded", "partial"].includes(result.status) && !result.entries?.length && !result.receipts?.length) ctx.addIssue({ code: "custom", message: "Successful work requires source observations" });
});
export const bridgeCompletionSchema = z.object({ leaseToken: z.uuid(), result: bridgeResultSchema }).strict();
export const bridgeStateSchema = z.object({
  heartbeat: z.object({ seenAt: z.string(), adapterVersion: z.string() }).nullable(),
  dockets: z.array(z.object({ id: z.number(), caption: z.string(), indexNumber: z.string(), notebookId: z.string().nullable() })),
  jobs: z.array(z.object({ id: z.number(), kind: z.string(), status: z.string(), error: z.string().nullable(), createdAt: z.string() })),
});
export type BridgeState = z.infer<typeof bridgeStateSchema>;

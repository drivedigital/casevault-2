import "server-only";
import { db } from "@/db";
import { dockets, documents, docketEntries, ingestionJobs, notebookAssociations } from "@/db/schema";
import { and, asc, desc, eq, inArray, lt, or, sql } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { bridgeKinds, bridgeResultSchema, type BridgeState } from "./bridge-schema";

const heartbeatKey = "casevault-2/bridges/heartbeat.json";
export async function bridgeState(): Promise<BridgeState> {
  const heartbeatObject = await getCloudflareContext().env.EVIDENCE.get(heartbeatKey);
  const heartbeat = heartbeatObject ? await heartbeatObject.json<{ seenAt: string; adapterVersion: string }>() : null;
  const [cases, jobs] = await Promise.all([
    db.select({ id: dockets.id, caption: dockets.caption, indexNumber: dockets.indexNumber, notebookId: dockets.notebookId }).from(dockets),
    db.select({ id: ingestionJobs.id, kind: ingestionJobs.kind, status: ingestionJobs.status, error: ingestionJobs.error, createdAt: ingestionJobs.createdAt }).from(ingestionJobs).where(inArray(ingestionJobs.kind, [...bridgeKinds])).orderBy(desc(ingestionJobs.id)).limit(20),
  ]);
  return { heartbeat, dockets: cases, jobs: jobs.map(job => ({ ...job, createdAt: job.createdAt.toISOString() })) };
}
export async function docketManifest(id: number) {
  const [docket] = await db.select().from(dockets).where(eq(dockets.id, id));
  if (!docket) return null;
  const [entries, docs] = await Promise.all([db.select().from(docketEntries).where(eq(docketEntries.docketId, id)).orderBy(asc(docketEntries.sequenceNumber)), db.select().from(documents).where(eq(documents.docketId, id))]);
  const associations = docs.length ? await db.select().from(notebookAssociations).where(inArray(notebookAssociations.documentId, docs.map(doc => doc.id))) : [];
  return { docket, entries, documents: docs.map(doc => ({ id: doc.id, externalId: doc.externalId, title: doc.title, fileName: doc.fileName, objectKey: doc.objectKey, sha256: doc.sha256, associations: associations.filter(a => a.documentId === doc.id) })) };
}
export async function leaseBridgeJob() {
  await getCloudflareContext().env.EVIDENCE.put(heartbeatKey, JSON.stringify({ seenAt: new Date().toISOString(), adapterVersion: "1.0.0" }));
  return db.transaction(async tx => {
    const now = new Date();
    const [job] = await tx.select().from(ingestionJobs).where(and(inArray(ingestionJobs.kind, [...bridgeKinds]), or(eq(ingestionJobs.status, "queued"), and(eq(ingestionJobs.status, "running"), lt(ingestionJobs.leaseUntil, now))))).orderBy(asc(ingestionJobs.id)).limit(1).for("update", { skipLocked: true });
    if (!job) return null;
    if (job.attempts >= 3) { await tx.update(ingestionJobs).set({ status: "needs_human", error: "Bridge recovery attempts exhausted. Reconcile the last attempt before requesting another update.", leaseToken: null, leaseUntil: null, updatedAt: now }).where(eq(ingestionJobs.id, job.id)); return null; }
    const [leased] = await tx.update(ingestionJobs).set({ status: "running", leaseToken: crypto.randomUUID(), leaseUntil: new Date(Date.now() + 10 * 60000), attempts: job.attempts + 1, updatedAt: now }).where(eq(ingestionJobs.id, job.id)).returning();
    return leased;
  });
}
export async function completeBridgeJob(id: number, leaseToken: string, input: unknown) {
  const result = bridgeResultSchema.parse(input);
  return db.transaction(async tx => {
    const [job] = await tx.select().from(ingestionJobs).where(eq(ingestionJobs.id, id)).for("update");
    if (!job || !bridgeKinds.includes(job.kind as (typeof bridgeKinds)[number]) || job.status !== "running" || job.leaseToken !== leaseToken || !job.leaseUntil || job.leaseUntil.getTime() <= Date.now()) throw new Error("Lease is no longer valid");
    const [docket] = await tx.select().from(dockets).where(eq(dockets.id, Number(job.payload.docketId)));
    if (!docket) throw new Error("Docket not found");
    if (result.entries && job.kind !== "nyscef_refresh") throw new Error("Result type does not match job");
    if (result.receipts && job.kind !== "notebooklm_sync") throw new Error("Result type does not match job");
    for (const entry of result.entries ?? []) {
      let documentId: number | undefined;
      if (entry.original) {
        const original = entry.original;
        const head = await getCloudflareContext().env.EVIDENCE.head(original.objectKey);
        if (!head || head.size !== original.bytes || head.customMetadata?.sha256 !== original.sha256) throw new Error("Original object receipt does not match");
        const externalId = `${docket.externalId ?? `nyscef:docket:${docket.id}`}:${entry.number}:${original.sha256}`;
        await tx.insert(documents).values({ externalId, matterId: docket.matterId, docketId: docket.id, title: entry.docType, fileName: original.filename, sourceType: "docket_filing", sourceSystem: "nyscef", status: "pending_review", sha256: original.sha256, objectKey: original.objectKey, objectBucket: "legal-evidence-arena", pageCount: original.pageCount, filedDate: entry.filedDate, provenance: { sourceUrl: entry.sourceUrl, observedAt: result.observedAt, acquisition: "local NYSCEF bridge", bytes: original.bytes } }).onConflictDoNothing({ target: documents.externalId });
        const [document] = await tx.select().from(documents).where(eq(documents.externalId, externalId)); documentId = document.id;
        await tx.insert(ingestionJobs).values({ idempotencyKey: `extract:${externalId}:${original.sha256}:v1`, documentId, kind: "extract", payload: { objectKey: original.objectKey, sha256: original.sha256, source: "nyscef", quality: "unassessed" } }).onConflictDoNothing({ target: ingestionJobs.idempotencyKey });
      }
      const externalId = `${docket.externalId ?? `nyscef:docket:${docket.id}`}:entry:${entry.number}`;
      const observed = { filedDate: entry.filedDate, docType: entry.docType, description: entry.description, sourceStatus: entry.sourceStatus, sourceUrl: entry.sourceUrl, availability: entry.availability, provenance: { observedAt: result.observedAt, acquisition: "local NYSCEF bridge" }, ...(documentId ? { documentId } : {}) };
      await tx.insert(docketEntries).values({ externalId, docketId: docket.id, sequenceNumber: entry.number, ...observed }).onConflictDoUpdate({ target: docketEntries.externalId, set: { ...observed, provenance: sql`coalesce(${docketEntries.provenance}, '{}'::jsonb) || ${JSON.stringify({ latestObservation: { ...observed.provenance, bridgeJobId: id } })}::jsonb` } });
    }
    for (const receipt of result.receipts ?? []) {
      const [document] = await tx.select().from(documents).where(and(eq(documents.id, receipt.documentId), eq(documents.docketId, docket.id)));
      if (!document || receipt.notebookId !== docket.notebookId || (receipt.artifactHash && receipt.artifactHash !== document.sha256)) throw new Error("Notebook receipt does not match the document");
      const record = { externalId: `notebook:${receipt.notebookId}:${receipt.sourceId}`, documentId: receipt.documentId, notebookId: receipt.notebookId, sourceId: receipt.sourceId, artifactHash: receipt.artifactHash, status: receipt.status, equivalence: receipt.equivalence, provenance: { observedAt: result.observedAt, observationKind: "fresh local adapter source reconciliation", remoteStatus: receipt.remoteStatus } };
      await tx.insert(notebookAssociations).values(record).onConflictDoUpdate({ target: notebookAssociations.externalId, set: { status: receipt.status, provenance: sql`coalesce(${notebookAssociations.provenance}, '{}'::jsonb) || ${JSON.stringify({ latestObservation: { ...record.provenance, bridgeJobId: id } })}::jsonb` } });
    }
    await getCloudflareContext().env.EVIDENCE.put(`casevault-2/bridges/receipts/${id}/${leaseToken}.json`, JSON.stringify(result), { httpMetadata: { contentType: "application/json" } });
    const [completed] = await tx.update(ingestionJobs).set({ status: result.status, error: result.status === "succeeded" ? null : result.message, leaseToken: null, leaseUntil: null, updatedAt: new Date(), payload: { ...job.payload, resultSummary: result.message, observedAt: result.observedAt } }).where(eq(ingestionJobs.id, id)).returning();
    return completed;
  });
}

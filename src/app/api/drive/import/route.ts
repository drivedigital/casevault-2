import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { db } from "@/db";
import { documents, ingestionJobs, matters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { driveImportSchema } from "@/lib/drive-schema";
import { getDriveFile, downloadDriveFile } from "@/lib/drive";
export async function POST(request: Request) {
  const parsed = driveImportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Select up to five valid Drive files." }, { status: 400 });
  if (parsed.data.matterId && !(await db.select({ id: matters.id }).from(matters).where(eq(matters.id, parsed.data.matterId)))[0]) return NextResponse.json({ error: "Matter not found." }, { status: 404 });
  const results: { fileId: string; documentId?: number; error?: string }[] = [];
  for (const id of [...new Set(parsed.data.fileIds)]) {
    try {
      const file = await getDriveFile(id); const original = await downloadDriveFile(file);
      const afterDownload = await getDriveFile(id);
      if (file.modifiedTime !== afterDownload.modifiedTime) throw new Error("The Drive source changed during download.");
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", original.bytes))).map(b => b.toString(16).padStart(2, "0")).join("");
      const objectKey = `casevault-2/originals/${hash}`; const bucket = getCloudflareContext().env.EVIDENCE;
      if (!await bucket.head(objectKey)) await bucket.put(objectKey, original.bytes, { httpMetadata: { contentType: original.mimeType }, customMetadata: { sha256: hash, filename: original.filename } });
      const externalId = `drive:${id}:${file.modifiedTime ?? hash}`;
      const doc = await db.transaction(async tx => {
        await tx.insert(documents).values({ externalId, title: file.name, fileName: original.filename, matterId: parsed.data.matterId ?? null, sourceType: "drive", sourceSystem: "google_drive", status: "pending_review", sha256: hash, objectKey, objectBucket: "legal-evidence-arena", pageCount: null, provenance: { source: "google_drive", sourceFileId: id, sourceMetadata: file, retrievedAt: new Date().toISOString(), exportMimeType: original.mimeType, bytes: original.bytes.byteLength } }).onConflictDoNothing({ target: documents.externalId });
        const [record] = await tx.select().from(documents).where(eq(documents.externalId, externalId));
        await tx.insert(ingestionJobs).values({ idempotencyKey: `extract:${record.externalId}:${record.sha256}:v1`, documentId: record.id, kind: "extract", payload: { objectKey: record.objectKey, sha256: record.sha256, source: "google_drive", quality: "unassessed" } }).onConflictDoNothing({ target: ingestionJobs.idempotencyKey });
        return record;
      });
      results.push({ fileId: id, documentId: doc.id });
    } catch { results.push({ fileId: id, error: "Import failed. Reconnect Drive or check the file format and 20 MB limit." }); }
  }
  return NextResponse.json({ results }, { status: results.some(r => r.error) ? 207 : 201 });
}

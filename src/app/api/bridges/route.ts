import { NextResponse } from "next/server";
import { bridgeState } from "@/lib/bridges";
import { bridgeRequestSchema, validCourtUrl } from "@/lib/bridge-schema";
import { db } from "@/db";
import { dockets, ingestionJobs } from "@/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
export async function GET() { return NextResponse.json(await bridgeState()); }
export async function POST(request: Request) {
  const parsed = bridgeRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid bridge request." }, { status: 400 });
  const { kind, docketId, requestId } = parsed.data;
  const [docket] = await db.select().from(dockets).where(eq(dockets.id, docketId));
  if (!docket) return NextResponse.json({ error: "Docket not found." }, { status: 404 });
  if (kind === "nyscef_refresh" && (!docket.sourceUrl || !validCourtUrl(docket.sourceUrl))) return NextResponse.json({ error: "This docket needs a valid NYSCEF source URL." }, { status: 409 });
  if (kind === "notebooklm_sync" && !docket.notebookId) return NextResponse.json({ error: "Select a NotebookLM destination for this docket first." }, { status: 409 });
  const job = await db.transaction(async tx => {
    // Lock this docket while checking/enqueuing so concurrent clicks cannot create two active jobs.
    await tx.select({ id: dockets.id }).from(dockets).where(eq(dockets.id, docketId)).for("update");
    const [pending] = await tx.select().from(ingestionJobs).where(and(eq(ingestionJobs.kind, kind), inArray(ingestionJobs.status, ["queued", "running"]), sql`${ingestionJobs.payload}->>'docketId' = ${String(docketId)}`));
    if (pending) return pending;
    const [inserted] = await tx.insert(ingestionJobs).values({ idempotencyKey: `${kind}:${docketId}:${requestId}`, kind, payload: { docketId, sourceUrl: docket.sourceUrl, notebookId: docket.notebookId } }).onConflictDoNothing({ target: ingestionJobs.idempotencyKey }).returning();
    return inserted ?? null;
  });
  return NextResponse.json({ job, message: "Update queued for the local bridge." }, { status: 202 });
}

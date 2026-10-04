import { z } from "zod";
import { db } from "@/db";
import { ingestionJobs } from "@/db/schema";
import { and, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { completeBridgeJob } from "@/lib/bridges";
import { bridgeCompletionSchema } from "@/lib/bridge-schema";
import { machineAuthorized } from "@/lib/machine-auth";
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await machineAuthorized(request)) return NextResponse.json({ error: "Machine credential required." }, { status: 403 });
  const id = Number((await context.params).id); const parsed = bridgeCompletionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || !Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid bridge receipt." }, { status: 400 });
  try { return NextResponse.json({ job: await completeBridgeJob(id, parsed.data.leaseToken, parsed.data.result) }); }
  catch { return NextResponse.json({ error: "Receipt rejected. Check the lease and original/source mappings." }, { status: 409 }); }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!await machineAuthorized(request)) return NextResponse.json({ error: "Machine credential required." }, { status: 403 });
  const parsed = z.object({ leaseToken: z.uuid() }).strict().safeParse(await request.json().catch(() => null));
  const id = Number((await context.params).id);
  if (!parsed.success || !Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid lease." }, { status: 400 });
  const [job] = await db.update(ingestionJobs).set({ leaseUntil: new Date(Date.now() + 10 * 60000), updatedAt: new Date() }).where(and(eq(ingestionJobs.id, id), eq(ingestionJobs.status, "running"), eq(ingestionJobs.leaseToken, parsed.data.leaseToken), gt(ingestionJobs.leaseUntil, new Date()))).returning({ id: ingestionJobs.id });
  return NextResponse.json(job ? { renewed: true } : { error: "Lease is no longer valid." }, { status: job ? 200 : 409 });
}

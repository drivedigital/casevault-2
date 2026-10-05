import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { matters, activityLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const matterId = Number(id);
  if (isNaN(matterId)) {
    return NextResponse.json({ error: "Invalid matter ID" }, { status: 400 });
  }

  const [matter] = await db.select().from(matters).where(eq(matters.id, matterId));
  if (!matter) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  return NextResponse.json({ matter });
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const matterId = Number(id);
  if (isNaN(matterId)) {
    return NextResponse.json({ error: "Invalid matter ID" }, { status: 400 });
  }

  const schema = z.object({
    name: z.string().trim().min(1).optional(),
    caseNumber: z.string().trim().nullable().optional(),
    court: z.string().trim().nullable().optional(),
    description: z.string().trim().nullable().optional(),
    status: z.string().trim().optional(),
  });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const [existing] = await db.select().from(matters).where(eq(matters.id, matterId));
  if (!existing) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  const updates: Partial<typeof matters.$inferInsert> = {};
  const data = parsed.data;

  if (data.name !== undefined) updates.name = data.name;
  if (data.caseNumber !== undefined) updates.caseNumber = data.caseNumber;
  if (data.court !== undefined) updates.court = data.court;
  if (data.description !== undefined) updates.description = data.description;
  if (data.status !== undefined) updates.status = data.status;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No update fields supplied" }, { status: 400 });
  }

  const [updated] = await db
    .update(matters)
    .set(updates)
    .where(eq(matters.id, matterId))
    .returning();

  let activityMessage = `Updated matter "${updated.name}".`;
  if (data.status !== undefined && data.status !== existing.status) {
    if (data.status === "hidden") {
      activityMessage = `Matter "${updated.name}" was hidden.`;
    } else if (existing.status === "hidden") {
      activityMessage = `Matter "${updated.name}" was unhidden.`;
    } else {
      activityMessage = `Matter "${updated.name}" status changed to ${data.status}.`;
    }
  }

  await db.insert(activityLog).values({
    message: activityMessage,
    category: "core",
  });

  return NextResponse.json({ matter: updated });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const matterId = Number(id);
  if (isNaN(matterId)) {
    return NextResponse.json({ error: "Invalid matter ID" }, { status: 400 });
  }

  const [existing] = await db.select().from(matters).where(eq(matters.id, matterId));
  if (!existing) {
    return NextResponse.json({ error: "Matter not found" }, { status: 404 });
  }

  await db.delete(matters).where(eq(matters.id, matterId));

  await db.insert(activityLog).values({
    message: `Deleted matter "${existing.name}".`,
    category: "core",
  });

  return NextResponse.json({ success: true, deletedId: matterId });
}

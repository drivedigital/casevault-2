import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, activityLog } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const documentId = Number(id);
  const parsed = z.object({status:z.enum(["pending_review","processing","indexed","verified","flagged"]).optional(),isFlagged:z.boolean().optional(),flagReason:z.string().nullable().optional(),aiSummary:z.string().nullable().optional()}).safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid request"},{status:400});
  const body = parsed.data;

  const updates: Partial<typeof documents.$inferInsert> = {};
  if (body.status) updates.status = body.status;
  if (typeof body.isFlagged === "boolean") updates.isFlagged = body.isFlagged;
  if (body.flagReason !== undefined) updates.flagReason = body.flagReason;
  if (body.aiSummary !== undefined) updates.aiSummary = body.aiSummary;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields supplied." }, { status: 400 });
  }

  const [updated] = await db
    .update(documents)
    .set(updates)
    .where(eq(documents.id, documentId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  if (body.status) {
    await db.insert(activityLog).values({
      message: `Document "${updated.title}" marked as ${String(body.status).replace("_", " ")}.`,
      category: "review",
    });
  }

  return NextResponse.json({ document: updated });
}

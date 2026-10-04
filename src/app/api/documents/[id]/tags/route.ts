import { z } from "zod";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { documentTags, activityLog } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const documentId = Number(id);
  const parsed = z.object({tagType:z.enum(["matter","party","concept"]),tagValue:z.string().min(1),contactId:z.number().int().positive().optional(),matterId:z.number().int().positive().optional()}).safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid request"},{status:400});
  const body = parsed.data;

  if (!body.tagType || !body.tagValue) {
    return NextResponse.json({ error: "tagType and tagValue are required." }, { status: 400 });
  }

  const [tag] = await db
    .insert(documentTags)
    .values({
      documentId,
      tagType: body.tagType,
      tagValue: body.tagValue,
      contactId: body.contactId ?? null,
      matterId: body.matterId ?? null,
    })
    .returning();

  await db.insert(activityLog).values({
    message: `Tagged document #${documentId} with ${body.tagType}: "${body.tagValue}".`,
    category: "review",
  });

  return NextResponse.json({ tag });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const tagId = Number(searchParams.get("tagId"));
  if (!tagId) {
    return NextResponse.json({ error: "tagId is required." }, { status: 400 });
  }
  await db.delete(documentTags).where(and(eq(documentTags.id, tagId)));
  return NextResponse.json({ ok: true });
}

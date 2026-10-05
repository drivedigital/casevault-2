import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { factLinks } from "@/db/schema";
import { updateLinkSchema } from "@/lib/claims-matrix";
import { badRequest, linkWithMatter, logClaims, notFound, parseId, readJson } from "@/lib/claims-matrix-db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (!id) return badRequest("Invalid link ID");
  const parsed = updateLinkSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request", parsed.error.issues);
  if (!Object.keys(parsed.data).length) return badRequest("No update fields supplied");
  const owner = await linkWithMatter(id);
  if (!owner) return notFound("Evidence link");
  const [link] = await db.update(factLinks).set(parsed.data).where(eq(factLinks.id, id)).returning();
  if (parsed.data.reviewState && parsed.data.reviewState !== owner.link.reviewState) {
    await logClaims(`Evidence link on "${owner.elementTitle}" marked ${parsed.data.reviewState}.`);
  }
  return NextResponse.json({ link });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (!id) return badRequest("Invalid link ID");
  const owner = await linkWithMatter(id);
  if (!owner) return notFound("Evidence link");
  await db.delete(factLinks).where(eq(factLinks.id, id));
  await logClaims(`Removed evidence link from "${owner.elementTitle}".`);
  return NextResponse.json({ success: true, deletedId: id });
}

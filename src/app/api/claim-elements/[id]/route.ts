import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { claimElements } from "@/db/schema";
import { updateElementSchema } from "@/lib/claims-matrix";
import { badRequest, logClaims, notFound, parseId, readJson } from "@/lib/claims-matrix-db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (!id) return badRequest("Invalid element ID");
  const parsed = updateElementSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request", parsed.error.issues);
  if (!Object.keys(parsed.data).length) return badRequest("No update fields supplied");
  const [element] = await db
    .update(claimElements)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(claimElements.id, id))
    .returning();
  if (!element) return notFound("Element");
  const changes = [
    parsed.data.proofStrength && `strength → ${parsed.data.proofStrength}`,
    parsed.data.status && `status → ${parsed.data.status}`,
  ].filter(Boolean);
  await logClaims(`Updated element "${element.title}"${changes.length ? ` (${changes.join(", ")})` : ""}.`);
  return NextResponse.json({ element });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (!id) return badRequest("Invalid element ID");
  const [deleted] = await db.delete(claimElements).where(eq(claimElements.id, id)).returning();
  if (!deleted) return notFound("Element");
  await logClaims(`Deleted element "${deleted.title}".`);
  return NextResponse.json({ success: true, deletedId: id });
}

import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { claims } from "@/db/schema";
import { updateClaimSchema } from "@/lib/claims-matrix";
import { badRequest, logClaims, notFound, parseId, readJson } from "@/lib/claims-matrix-db";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (!id) return badRequest("Invalid claim ID");
  const parsed = updateClaimSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request", parsed.error.issues);
  if (!Object.keys(parsed.data).length) return badRequest("No update fields supplied");
  const [updated] = await db
    .update(claims)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(claims.id, id))
    .returning();
  if (!updated) return notFound("Claim");
  await logClaims(`Updated claim "${updated.title}".`);
  return NextResponse.json({ claim: updated });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const id = parseId((await ctx.params).id);
  if (!id) return badRequest("Invalid claim ID");
  const [deleted] = await db.delete(claims).where(eq(claims.id, id)).returning();
  if (!deleted) return notFound("Claim");
  await logClaims(`Deleted claim "${deleted.title}".`);
  return NextResponse.json({ success: true, deletedId: id });
}

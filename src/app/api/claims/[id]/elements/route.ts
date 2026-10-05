import { NextResponse } from "next/server";
import { and, eq, inArray, max } from "drizzle-orm";
import { db } from "@/db";
import { claimElements, claims } from "@/db/schema";
import { createElementSchema, reorderElementsSchema } from "@/lib/claims-matrix";
import { badRequest, logClaims, notFound, parseId, readJson } from "@/lib/claims-matrix-db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const claimId = parseId((await ctx.params).id);
  if (!claimId) return badRequest("Invalid claim ID");
  const parsed = createElementSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request", parsed.error.issues);
  const [claim] = await db.select().from(claims).where(eq(claims.id, claimId));
  if (!claim) return notFound("Claim");
  const [{ value: maxPos }] = await db
    .select({ value: max(claimElements.position) })
    .from(claimElements)
    .where(eq(claimElements.claimId, claimId));
  const [element] = await db
    .insert(claimElements)
    .values({
      claimId,
      position: (maxPos ?? 0) + 1,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      authorityCitation: parsed.data.authorityCitation ?? null,
    })
    .returning();
  await logClaims(`Added element "${element.title}" to claim "${claim.title}".`);
  return NextResponse.json({ element }, { status: 201 });
}

/** Reorder: body { order: [elementId, ...] } — every id must belong to this claim. */
export async function PATCH(req: Request, ctx: Ctx) {
  const claimId = parseId((await ctx.params).id);
  if (!claimId) return badRequest("Invalid claim ID");
  const parsed = reorderElementsSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request", parsed.error.issues);
  const order = parsed.data.order;
  const owned = await db
    .select({ id: claimElements.id })
    .from(claimElements)
    .where(and(eq(claimElements.claimId, claimId), inArray(claimElements.id, order)));
  if (owned.length !== new Set(order).size) return badRequest("Elements do not belong to this claim");
  await db.transaction(async (tx) => {
    for (const [i, id] of order.entries()) {
      await tx.update(claimElements).set({ position: i + 1 }).where(eq(claimElements.id, id));
    }
  });
  return NextResponse.json({ success: true });
}

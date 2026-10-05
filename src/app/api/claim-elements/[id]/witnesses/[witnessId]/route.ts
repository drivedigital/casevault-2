import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { claimElementWitnesses } from "@/db/schema";
import { badRequest, logClaims, notFound, parseId } from "@/lib/claims-matrix-db";

type Ctx = { params: Promise<{ id: string; witnessId: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const p = await ctx.params;
  const elementId = parseId(p.id);
  const witnessId = parseId(p.witnessId);
  if (!elementId || !witnessId) return badRequest("Invalid ID");
  const [deleted] = await db
    .delete(claimElementWitnesses)
    .where(and(eq(claimElementWitnesses.id, witnessId), eq(claimElementWitnesses.claimElementId, elementId)))
    .returning();
  if (!deleted) return notFound("Witness tag");
  await logClaims(`Removed witness tag from element #${elementId}.`);
  return NextResponse.json({ success: true, deletedId: witnessId });
}

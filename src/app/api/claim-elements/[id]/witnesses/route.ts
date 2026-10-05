import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { claimElementWitnesses, contacts } from "@/db/schema";
import { addWitnessSchema } from "@/lib/claims-matrix";
import { badRequest, elementWithMatter, logClaims, notFound, parseId, readJson } from "@/lib/claims-matrix-db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const elementId = parseId((await ctx.params).id);
  if (!elementId) return badRequest("Invalid element ID");
  const parsed = addWitnessSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request", parsed.error.issues);
  const owner = await elementWithMatter(elementId);
  if (!owner) return notFound("Element");
  const [contact] = await db.select({ name: contacts.displayName }).from(contacts).where(eq(contacts.id, parsed.data.contactId));
  if (!contact) return notFound("Contact");
  const [witness] = await db
    .insert(claimElementWitnesses)
    .values({ claimElementId: elementId, ...parsed.data, notes: parsed.data.notes ?? null })
    .onConflictDoUpdate({
      target: [claimElementWitnesses.claimElementId, claimElementWitnesses.contactId],
      set: { witnessType: parsed.data.witnessType, notes: parsed.data.notes ?? null },
    })
    .returning();
  await logClaims(`Tagged ${contact.name} (${parsed.data.witnessType} witness) on "${owner.element.title}".`);
  return NextResponse.json({ witness }, { status: 201 });
}

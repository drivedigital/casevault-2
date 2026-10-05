import { NextResponse } from "next/server";
import { eq, max } from "drizzle-orm";
import { db } from "@/db";
import { claimElements, claims, matters } from "@/db/schema";
import { findClaimTemplate } from "@/lib/claim-templates";
import { createClaimSchema } from "@/lib/claims-matrix";
import { badRequest, getMatrix, logClaims, notFound, parseId, readJson } from "@/lib/claims-matrix-db";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const matterId = parseId((await ctx.params).id);
  if (!matterId) return badRequest("Invalid matter ID");
  return NextResponse.json({ claims: await getMatrix(matterId) });
}

export async function POST(req: Request, ctx: Ctx) {
  const matterId = parseId((await ctx.params).id);
  if (!matterId) return badRequest("Invalid matter ID");
  const parsed = createClaimSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request", parsed.error.issues);

  const [matter] = await db.select({ id: matters.id, name: matters.name }).from(matters).where(eq(matters.id, matterId));
  if (!matter) return notFound("Matter");

  const [{ value: maxPos }] = await db.select({ value: max(claims.position) }).from(claims).where(eq(claims.matterId, matterId));
  const position = (maxPos ?? 0) + 1;
  const data = parsed.data;

  if ("templateSlug" in data) {
    const tpl = findClaimTemplate(data.templateSlug);
    if (!tpl) return notFound("Template");
    const claim = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(claims)
        .values({
          matterId,
          title: tpl.title,
          statute: tpl.statute ?? null,
          description: tpl.description,
          causeOfAction: tpl.causeOfAction,
          jurisdiction: tpl.jurisdiction,
          burdenOfProof: tpl.burdenOfProof,
          chartType: "civil-element",
          templateSlug: tpl.slug,
          position,
        })
        .returning();
      if (tpl.elements.length) {
        await tx.insert(claimElements).values(
          tpl.elements.map((el, i) => ({
            claimId: created.id,
            position: i + 1,
            title: el.title,
            description: el.description ?? null,
            authorityCitation: el.authority ?? null,
            citationStatus: "verify",
            notes: el.notes ?? null,
          })),
        );
      }
      return created;
    });
    await logClaims(`Added claim "${claim.title}" from template to matter "${matter.name}".`);
    return NextResponse.json({ claim }, { status: 201 });
  }

  const [claim] = await db
    .insert(claims)
    .values({
      matterId,
      title: data.title,
      statute: data.statute ?? null,
      description: data.description ?? null,
      causeOfAction: data.causeOfAction ?? null,
      jurisdiction: data.jurisdiction ?? null,
      burdenOfProof: data.burdenOfProof ?? "preponderance",
      position,
    })
    .returning();
  await logClaims(`Added claim "${claim.title}" to matter "${matter.name}".`);
  return NextResponse.json({ claim }, { status: 201 });
}

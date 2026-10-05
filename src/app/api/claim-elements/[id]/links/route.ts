import { NextResponse } from "next/server";
import { db } from "@/db";
import { factLinks } from "@/db/schema";
import { createLinkSchema } from "@/lib/claims-matrix";
import {
  badRequest,
  chronologyInMatter,
  documentInMatter,
  elementWithMatter,
  logClaims,
  notFound,
  parseId,
  readJson,
} from "@/lib/claims-matrix-db";

type Ctx = { params: Promise<{ id: string }> };

/** Manual evidence links are created as accepted (AI-suggested links use "proposed"). */
export async function POST(req: Request, ctx: Ctx) {
  const elementId = parseId((await ctx.params).id);
  if (!elementId) return badRequest("Invalid element ID");
  const parsed = createLinkSchema.safeParse(await readJson(req));
  if (!parsed.success) return badRequest("Invalid request", parsed.error.issues);
  const owner = await elementWithMatter(elementId);
  if (!owner) return notFound("Element");
  const d = parsed.data;
  if (d.documentId && !(await documentInMatter(d.documentId, owner.matterId))) {
    return badRequest("Document does not belong to this matter");
  }
  if (d.chronologyEventId && !(await chronologyInMatter(d.chronologyEventId, owner.matterId))) {
    return badRequest("Chronology event does not belong to this matter");
  }
  const [link] = await db
    .insert(factLinks)
    .values({
      claimElementId: elementId,
      kind: d.kind,
      polarity: d.polarity,
      documentId: d.documentId ?? null,
      chronologyEventId: d.chronologyEventId ?? null,
      contactId: d.contactId ?? null,
      pageCite: d.pageCite ?? null,
      quote: d.quote ?? null,
      exhibitLabel: d.exhibitLabel ?? null,
      notes: d.notes ?? null,
      reviewState: "accepted",
    })
    .returning();
  await logClaims(`Mapped ${d.kind} evidence (${d.polarity}) to element "${owner.element.title}".`);
  return NextResponse.json({ link }, { status: 201 });
}

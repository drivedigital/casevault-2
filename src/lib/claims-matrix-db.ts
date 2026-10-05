import "server-only";
import { NextResponse } from "next/server";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  activityLog,
  chronologyEvents,
  claimElementWitnesses,
  claimElements,
  claims,
  contacts,
  documents,
  factLinks,
} from "@/db/schema";
import type { MatrixClaim, MatrixElement, MatrixLink, MatrixWitness } from "@/lib/claims-matrix";

export async function getMatrix(matterId: number): Promise<MatrixClaim[]> {
  const claimRows = await db
    .select()
    .from(claims)
    .where(eq(claims.matterId, matterId))
    .orderBy(asc(claims.position), asc(claims.id));
  if (!claimRows.length) return [];

  const elementRows = await db
    .select()
    .from(claimElements)
    .where(inArray(claimElements.claimId, claimRows.map((c) => c.id)))
    .orderBy(asc(claimElements.position), asc(claimElements.id));
  const elementIds = elementRows.map((e) => e.id);

  const [linkRows, witnessRows] = elementIds.length
    ? await Promise.all([
        db
          .select({
            link: factLinks,
            documentTitle: documents.title,
            chronologyTitle: chronologyEvents.title,
            contactName: contacts.displayName,
          })
          .from(factLinks)
          .leftJoin(documents, eq(factLinks.documentId, documents.id))
          .leftJoin(chronologyEvents, eq(factLinks.chronologyEventId, chronologyEvents.id))
          .leftJoin(contacts, eq(factLinks.contactId, contacts.id))
          .where(inArray(factLinks.claimElementId, elementIds))
          .orderBy(asc(factLinks.id)),
        db
          .select({ w: claimElementWitnesses, displayName: contacts.displayName })
          .from(claimElementWitnesses)
          .innerJoin(contacts, eq(claimElementWitnesses.contactId, contacts.id))
          .where(inArray(claimElementWitnesses.claimElementId, elementIds))
          .orderBy(asc(claimElementWitnesses.id)),
      ])
    : [[], []];

  const linksByEl = new Map<number, MatrixLink[]>();
  for (const r of linkRows) {
    const l = r.link;
    const arr = linksByEl.get(l.claimElementId) ?? [];
    arr.push({
      id: l.id,
      kind: l.kind,
      polarity: l.polarity,
      reviewState: l.reviewState,
      documentId: l.documentId,
      documentTitle: r.documentTitle,
      chronologyEventId: l.chronologyEventId,
      chronologyTitle: r.chronologyTitle,
      contactId: l.contactId,
      contactName: r.contactName,
      pageCite: l.pageCite,
      quote: l.quote,
      exhibitLabel: l.exhibitLabel,
      notes: l.notes,
    });
    linksByEl.set(l.claimElementId, arr);
  }

  const witnessesByEl = new Map<number, MatrixWitness[]>();
  for (const r of witnessRows) {
    const arr = witnessesByEl.get(r.w.claimElementId) ?? [];
    arr.push({
      id: r.w.id,
      contactId: r.w.contactId,
      displayName: r.displayName,
      witnessType: r.w.witnessType,
      notes: r.w.notes,
    });
    witnessesByEl.set(r.w.claimElementId, arr);
  }

  const elementsByClaim = new Map<number, MatrixElement[]>();
  for (const e of elementRows) {
    const arr = elementsByClaim.get(e.claimId) ?? [];
    arr.push({
      id: e.id,
      claimId: e.claimId,
      position: e.position,
      title: e.title,
      description: e.description,
      proofStrength: e.proofStrength,
      status: e.status,
      authorityCitation: e.authorityCitation,
      citationStatus: e.citationStatus,
      notes: e.notes,
      links: linksByEl.get(e.id) ?? [],
      witnesses: witnessesByEl.get(e.id) ?? [],
    });
    elementsByClaim.set(e.claimId, arr);
  }

  return claimRows.map((c) => ({
    id: c.id,
    matterId: c.matterId,
    title: c.title,
    statute: c.statute,
    description: c.description,
    causeOfAction: c.causeOfAction,
    jurisdiction: c.jurisdiction,
    burdenOfProof: c.burdenOfProof,
    templateSlug: c.templateSlug,
    position: c.position,
    elements: elementsByClaim.get(c.id) ?? [],
  }));
}

/** Resolve the matter that owns a claim element (for cross-matter validation). */
export async function elementWithMatter(elementId: number) {
  const [row] = await db
    .select({ element: claimElements, matterId: claims.matterId, claimTitle: claims.title })
    .from(claimElements)
    .innerJoin(claims, eq(claimElements.claimId, claims.id))
    .where(eq(claimElements.id, elementId));
  return row ?? null;
}

export async function linkWithMatter(linkId: number) {
  const [row] = await db
    .select({ link: factLinks, matterId: claims.matterId, elementTitle: claimElements.title })
    .from(factLinks)
    .innerJoin(claimElements, eq(factLinks.claimElementId, claimElements.id))
    .innerJoin(claims, eq(claimElements.claimId, claims.id))
    .where(eq(factLinks.id, linkId));
  return row ?? null;
}

export async function documentInMatter(documentId: number, matterId: number) {
  const [row] = await db
    .select({ id: documents.id })
    .from(documents)
    .where(and(eq(documents.id, documentId), eq(documents.matterId, matterId)));
  return Boolean(row);
}

export async function chronologyInMatter(eventId: number, matterId: number) {
  const [row] = await db
    .select({ id: chronologyEvents.id })
    .from(chronologyEvents)
    .where(and(eq(chronologyEvents.id, eventId), eq(chronologyEvents.matterId, matterId)));
  return Boolean(row);
}

export async function logClaims(message: string) {
  await db.insert(activityLog).values({ message, category: "claims" });
}

export function parseId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function badRequest(error: string, issues?: unknown) {
  return NextResponse.json({ error, ...(issues ? { issues } : {}) }, { status: 400 });
}

export function notFound(what: string) {
  return NextResponse.json({ error: `${what} not found` }, { status: 404 });
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

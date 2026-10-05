import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { ChevronLeft } from "lucide-react";
import { db } from "@/db";
import { chronologyEvents, contactRoles, contacts, documents, matters } from "@/db/schema";
import { CLAIM_TEMPLATES } from "@/lib/claim-templates";
import { getMatrix } from "@/lib/claims-matrix-db";
import { ClaimsMatrix } from "@/components/claims/ClaimsMatrix";

export const dynamic = "force-dynamic";

export default async function MatterMatrixPage({ params }: { params: Promise<{ matterId: string }> }) {
  const matterId = Number((await params).matterId);
  if (!Number.isInteger(matterId)) notFound();
  const [matter] = await db.select().from(matters).where(eq(matters.id, matterId));
  if (!matter) notFound();

  const [matrix, docRows, roleRows, allContacts, events] = await Promise.all([
    getMatrix(matterId),
    db.select({ id: documents.id, title: documents.title }).from(documents).where(eq(documents.matterId, matterId)).orderBy(asc(documents.title)),
    db
      .select({ id: contacts.id, name: contacts.displayName, role: contactRoles.roleLabel })
      .from(contactRoles)
      .innerJoin(contacts, eq(contactRoles.contactId, contacts.id))
      .where(eq(contactRoles.matterId, matterId)),
    db.select({ id: contacts.id, name: contacts.displayName }).from(contacts).where(eq(contacts.isCanonical, true)).orderBy(asc(contacts.displayName)),
    db
      .select({ id: chronologyEvents.id, title: chronologyEvents.title, date: chronologyEvents.eventDate })
      .from(chronologyEvents)
      .where(eq(chronologyEvents.matterId, matterId))
      .orderBy(asc(chronologyEvents.eventDate)),
  ]);

  // Matter participants first, then all other canonical contacts.
  const seen = new Set<number>();
  const contactOptions = [
    ...roleRows.map((r) => ({ id: r.id, label: `${r.name}${r.role ? ` (${r.role})` : ""}` })),
    ...allContacts.map((c) => ({ id: c.id, label: c.name })),
  ].filter((c) => (seen.has(c.id) ? false : (seen.add(c.id), true)));

  return (
    <div className="space-y-5">
      <Link href={`/matters/${matterId}`} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft size={14} /> Back to {matter.name}
      </Link>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {[matter.caseNumber, matter.court].filter(Boolean).join(" · ") || "Matter"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">Claims &amp; Evidence Matrix</h1>
        <p className="mt-1 text-sm text-slate-500">
          Break each cause of action into elements and map vault documents, testimony, chronology events and witnesses to each one.
        </p>
      </div>
      <ClaimsMatrix
        matterId={matterId}
        claims={matrix}
        documents={docRows.map((d) => ({ id: d.id, label: d.title }))}
        contacts={contactOptions}
        chronology={events.map((e) => ({ id: e.id, label: `${e.date ? String(e.date) : "undated"} — ${e.title}` }))}
        templates={CLAIM_TEMPLATES.map((t) => ({ slug: t.slug, title: t.title, jurisdiction: t.jurisdiction, elementCount: t.elements.length }))}
      />
    </div>
  );
}

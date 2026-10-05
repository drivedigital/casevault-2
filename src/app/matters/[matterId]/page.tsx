import { notFound } from "next/navigation";
import { getAllData } from "@/lib/data";
import { MatterDetailView, type MatterDetailData } from "@/components/MatterDetailView";

export const dynamic = "force-dynamic";

export default async function MatterDetailPage({
  params,
}: {
  params: Promise<{ matterId: string }>;
}) {
  const { matterId } = await params;
  const data = await getAllData();
  const matter = data.matters.find((m) => m.id === Number(matterId));
  if (!matter) notFound();

  const contactsById = new Map(data.contacts.map((c) => [c.id, c]));
  const docsById = new Map(data.documents.map((d) => [d.id, d]));

  const roles = data.roles
    .filter((r) => r.matterId === matter.id)
    .map((r) => {
      const contact = contactsById.get(r.contactId);
      return {
        id: r.id,
        contactId: r.contactId,
        capacity: r.capacity,
        roleLabel: r.roleLabel,
        side: r.side,
        contact: contact
          ? {
              id: contact.id,
              displayName: contact.displayName,
              primaryEmail: contact.primaryEmail,
              avatarColor: contact.avatarColor,
            }
          : undefined,
      };
    });

  const claims = data.claims
    .filter((c) => c.matterId === matter.id)
    .map((claim) => {
      const elements = data.claimElements
        .filter((ce) => ce.claimId === claim.id)
        .map((el) => {
          const links = data.factLinks
            .filter((fl) => fl.claimElementId === el.id)
            .map((fl) => {
              const doc = fl.documentId ? docsById.get(fl.documentId) : null;
              return {
                id: fl.id,
                polarity: fl.polarity as "supporting" | "adverse" | "context",
                notes: fl.notes,
                document: doc ? { id: doc.id, title: doc.title } : null,
              };
            });
          return {
            id: el.id,
            title: el.title,
            description: el.description,
            links,
          };
        });
      return {
        id: claim.id,
        title: claim.title,
        statute: claim.statute,
        description: claim.description,
        elements,
      };
    });

  const events = data.chronology
    .filter((e) => e.matterId === matter.id)
    .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""))
    .map((e) => {
      const doc = e.documentId ? docsById.get(e.documentId) : null;
      return {
        id: e.id,
        eventDate: e.eventDate ? String(e.eventDate) : null,
        precision: e.precision,
        title: e.title,
        description: e.description,
        pageCite: e.pageCite,
        document: doc ? { id: doc.id, title: doc.title } : null,
      };
    });

  const deadlines = data.deadlines
    .filter((d) => d.matterId === matter.id)
    .map((d) => ({
      id: d.id,
      title: d.title,
      dueDate: String(d.dueDate),
      type: d.type,
      status: d.status as "upcoming" | "completed" | "missed",
      notes: d.notes,
    }));

  const tasks = data.tasks
    .filter((t) => t.matterId === matter.id)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status as "open" | "in_progress" | "done",
      dueDate: t.dueDate ? String(t.dueDate) : null,
    }));

  const docs = data.documents
    .filter((d) => d.matterId === matter.id)
    .map((d) => ({
      id: d.id,
      title: d.title,
      status: d.status,
      sourceType: d.sourceType,
      filedDate: d.filedDate ? String(d.filedDate) : null,
    }));

  const detailData: MatterDetailData = {
    matter: {
      id: matter.id,
      name: matter.name,
      caseNumber: matter.caseNumber,
      court: matter.court,
      status: matter.status,
      description: matter.description,
    },
    roles,
    claims,
    events,
    deadlines,
    tasks,
    docs,
  };

  return <MatterDetailView data={detailData} />;
}

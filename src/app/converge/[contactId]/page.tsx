import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllData } from "@/lib/data";
import { Avatar, Badge, Card, EmptyState, SectionHeading } from "@/components/ui";
import { contactTypeLabels, documentStatusStyles } from "@/lib/constants";
import { ChevronLeft, FileText, Users2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ contactId: string }>;
}) {
  const { contactId } = await params;
  const data = await getAllData();
  const contact = data.contacts.find((c) => c.id === Number(contactId));
  if (!contact) notFound();

  const aliases = data.aliases.filter((a) => a.contactId === contact.id);
  const roles = data.roles.filter((r) => r.contactId === contact.id);
  const relationshipsOut = data.relationships.filter((r) => r.fromContactId === contact.id);
  const relationshipsIn = data.relationships.filter((r) => r.toContactId === contact.id);
  const mergedDuplicates = data.contacts.filter((c) => c.mergedIntoId === contact.id);
  const taggedDocs = data.tags.filter((t) => t.contactId === contact.id);
  const documents = taggedDocs
    .map((t) => data.documents.find((d) => d.id === t.documentId))
    .filter((d): d is NonNullable<typeof d> => Boolean(d));
  const uniqueDocs = Array.from(new Map(documents.map((d) => [d.id, d])).values());

  return (
    <div className="space-y-6">
      <Link href="/converge" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft size={14} /> Back to Contact Directory
      </Link>

      <div className="flex items-center gap-4">
        <Avatar name={contact.displayName} color={contact.avatarColor ?? undefined} size={56} />
        <div>
          <SectionHeading eyebrow={contactTypeLabels[contact.type]} title={contact.displayName} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-800">Contact details</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Email</dt>
              <dd className="text-slate-700">{contact.primaryEmail ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Phone</dt>
              <dd className="text-slate-700">{contact.primaryPhone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Notes</dt>
              <dd className="text-slate-600">{contact.notes ?? "—"}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-800">Known aliases (fuzzy match resolution)</h2>
          <div className="mt-3 space-y-2">
            {aliases.length === 0 ? (
              <EmptyState message="No aliases recorded." />
            ) : (
              aliases.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-700">&ldquo;{a.aliasName}&rdquo;</p>
                    <p className="text-xs text-slate-400">{a.source}</p>
                  </div>
                  <Badge className={a.resolved ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200"}>
                    {Math.round(a.confidence * 100)}% {a.resolved ? "resolved" : "pending"}
                  </Badge>
                </div>
              ))
            )}
            {mergedDuplicates.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2 text-sm">
                <p className="font-medium text-violet-700">&ldquo;{d.displayName}&rdquo; (merged contact)</p>
                <Badge className="bg-violet-100 text-violet-700 ring-violet-200">merged</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Users2 size={14} className="text-slate-500" /> Relationships
          </h2>
          <div className="mt-3 space-y-2 text-sm">
            {[...relationshipsOut, ...relationshipsIn].length === 0 ? (
              <EmptyState message="No relationships recorded." />
            ) : (
              <>
                {relationshipsOut.map((r) => {
                  const to = data.contacts.find((c) => c.id === r.toContactId);
                  return (
                    <p key={r.id} className="text-slate-600">
                      <span className="font-medium text-slate-800">{contact.displayName}</span> is{" "}
                      <span className="italic">{r.relationshipType.toLowerCase()}</span>{" "}
                      <Link href={`/converge/${to?.id}`} className="text-indigo-600 hover:underline">
                        {to?.displayName}
                      </Link>
                    </p>
                  );
                })}
                {relationshipsIn.map((r) => {
                  const from = data.contacts.find((c) => c.id === r.fromContactId);
                  return (
                    <p key={r.id} className="text-slate-600">
                      <Link href={`/converge/${from?.id}`} className="text-indigo-600 hover:underline">
                        {from?.displayName}
                      </Link>{" "}
                      is <span className="italic">{r.relationshipType.toLowerCase()}</span>{" "}
                      <span className="font-medium text-slate-800">{contact.displayName}</span>
                    </p>
                  );
                })}
              </>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-800">Legal capacity by matter</h2>
        <p className="mt-1 text-xs text-slate-400">
          Converge keeps each capacity — individual vs. representative — separate so pleadings and claims map correctly.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {roles.length === 0 ? (
            <EmptyState message="No matter roles assigned yet." />
          ) : (
            roles.map((r) => {
              const matter = data.matters.find((m) => m.id === r.matterId);
              return (
                <div key={r.id} className="rounded-xl border border-slate-100 p-3">
                  <p className="text-sm font-medium text-slate-800">{r.capacity}</p>
                  <p className="text-xs text-slate-500">{r.roleLabel}</p>
                  {matter ? (
                    <Link href={`/matters/${matter.id}`} className="mt-1 inline-block text-xs text-indigo-600 hover:underline">
                      {matter.name}
                    </Link>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FileText size={14} className="text-slate-500" /> Mentioned in documents
        </h2>
        <div className="mt-3 divide-y divide-slate-100">
          {uniqueDocs.length === 0 ? (
            <EmptyState message="Not yet tagged in any documents." />
          ) : (
            uniqueDocs.map((d) => (
              <Link key={d.id} href={`/documents/${d.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
                <span className="text-sm text-slate-700">{d.title}</span>
                <Badge className={documentStatusStyles[d.status]}>{d.status.replace("_", " ")}</Badge>
              </Link>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

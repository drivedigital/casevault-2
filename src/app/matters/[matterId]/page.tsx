import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllData } from "@/lib/data";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  documentStatusStyles,
  polarityStyles,
  deadlineStatusStyles,
  taskStatusStyles,
} from "@/lib/constants";
import { ChevronLeft, Scale, Clock, CalendarClock, FileText, Users, EyeOff } from "lucide-react";
import { MatterDetailActions } from "@/components/actions/MatterActions";

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

  const roles = data.roles.filter((r) => r.matterId === matter.id);
  const claims = data.claims.filter((c) => c.matterId === matter.id);
  const events = data.chronology
    .filter((e) => e.matterId === matter.id)
    .sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));
  const docs = data.documents.filter((d) => d.matterId === matter.id);
  const matterDeadlines = data.deadlines.filter((d) => d.matterId === matter.id);
  const matterTasks = data.tasks.filter((t) => t.matterId === matter.id);

  return (
    <div className="space-y-6">
      <Link href="/matters" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft size={14} /> Back to Matters
      </Link>

      <SectionHeading
        eyebrow={`${matter.caseNumber || "No case #"} · ${matter.court || "No court specified"}`}
        title={matter.name}
        description={matter.description ?? undefined}
        action={<MatterDetailActions matter={matter} />}
      />

      {matter.status === "hidden" ? (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800">
          <div className="flex items-center gap-2">
            <EyeOff size={16} className="text-amber-600 flex-shrink-0" />
            <span>This matter is currently hidden from the default active matters list.</span>
          </div>
        </div>
      ) : null}

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Users size={15} className="text-slate-500" /> Parties & capacities
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roles.map((r) => {
            const contact = data.contacts.find((c) => c.id === r.contactId);
            return (
              <Link
                key={r.id}
                href={`/converge/${contact?.id}`}
                className="rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/30"
              >
                <p className="text-sm font-semibold text-slate-800">{contact?.displayName}</p>
                <p className="text-xs text-slate-500">{r.capacity}</p>
                <Badge className="mt-2 bg-slate-100 text-slate-600 ring-slate-200">{r.roleLabel}</Badge>
              </Link>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Scale size={15} className="text-slate-500" /> Claims matrix
        </h2>
        <div className="mt-4 space-y-5">
          {claims.length === 0 ? (
            <EmptyState message="No claims mapped for this matter yet." />
          ) : (
            claims.map((claim) => {
              const elements = data.claimElements.filter((ce) => ce.claimId === claim.id);
              return (
                <div key={claim.id} className="rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{claim.title}</p>
                      <p className="text-xs text-slate-400">{claim.statute}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{claim.description}</p>
                  <div className="mt-3 space-y-2.5">
                    {elements.map((el) => {
                      const links = data.factLinks.filter((fl) => fl.claimElementId === el.id);
                      return (
                        <div key={el.id} className="rounded-lg bg-slate-50 p-3">
                          <p className="text-xs font-semibold text-slate-700">{el.title}</p>
                          <p className="text-xs text-slate-400">{el.description}</p>
                          {links.length > 0 ? (
                            <div className="mt-2 space-y-1.5">
                              {links.map((link) => {
                                const linkedDoc = data.documents.find((d) => d.id === link.documentId);
                                return (
                                  <div key={link.id} className="flex items-center justify-between gap-2 text-xs">
                                    <span className="flex items-center gap-1.5 text-slate-600">
                                      <Badge className={polarityStyles[link.polarity]}>{link.polarity}</Badge>
                                      {linkedDoc ? (
                                        <Link href={`/documents/${linkedDoc.id}`} className="text-indigo-600 hover:underline">
                                          {linkedDoc.title}
                                        </Link>
                                      ) : null}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Clock size={15} className="text-slate-500" /> Chronology
        </h2>
        <div className="mt-4 space-y-0">
          {events.length === 0 ? (
            <EmptyState message="No chronology events yet." />
          ) : (
            events.map((e, i) => {
              const linkedDoc = data.documents.find((d) => d.id === e.documentId);
              return (
                <div key={e.id} className="relative flex gap-4 pb-6 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500" />
                    {i < events.length - 1 ? <span className="w-px flex-1 bg-slate-200" /> : null}
                  </div>
                  <div className="-mt-1 flex-1 pb-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-slate-500">{formatDate(e.eventDate)}</p>
                      <Badge className="bg-slate-100 text-slate-500 ring-slate-200">{e.precision}</Badge>
                    </div>
                    <p className="mt-0.5 text-sm font-medium text-slate-800">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.description}</p>
                    {linkedDoc ? (
                      <Link href={`/documents/${linkedDoc.id}`} className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <FileText size={11} /> {linkedDoc.title} {e.pageCite}
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <CalendarClock size={15} className="text-slate-500" /> Deadlines
          </h2>
          <div className="mt-3 space-y-2">
            {matterDeadlines.length === 0 ? (
              <EmptyState message="No deadlines tracked." />
            ) : (
              matterDeadlines.map((d) => (
                <div key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-700">{d.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(d.dueDate)} · {d.type.replace("_", " ")}</p>
                  </div>
                  <Badge className={deadlineStatusStyles[d.status]}>{d.status}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-800">Tasks</h2>
          <div className="mt-3 space-y-2">
            {matterTasks.length === 0 ? (
              <EmptyState message="No open tasks." />
            ) : (
              matterTasks.map((t) => (
                <div key={t.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                  <div>
                    <p className="text-sm text-slate-700">{t.title}</p>
                    <p className="text-xs text-slate-400">{formatDate(t.dueDate)}</p>
                  </div>
                  <Badge className={taskStatusStyles[t.status]}>{t.status.replace("_", " ")}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <FileText size={15} className="text-slate-500" /> Evidence
        </h2>
        <div className="mt-3 divide-y divide-slate-100">
          {docs.map((doc) => (
            <Link key={doc.id} href={`/documents/${doc.id}`} className="flex items-center justify-between gap-3 py-2.5 hover:bg-slate-50">
              <span className="text-sm text-slate-700">{doc.title}</span>
              <Badge className={documentStatusStyles[doc.status]}>{doc.status.replace("_", " ")}</Badge>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}

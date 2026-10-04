import { belongsInReviewQueue } from "@/lib/review-policy";
import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading, StatCard } from "@/components/ui";
import { formatDate, timeAgo } from "@/lib/format";
import {
  documentStatusStyles,
  severityStyles,
  deadlineStatusStyles,
  sourceTypeLabels,
} from "@/lib/constants";
import {
  Inbox,
  Sparkles,
  GitMerge,
  CalendarClock,
  FileWarning,
  ArrowUpRight,
  Gavel,
  Users,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const data = await getAllData();

  const pendingReview = data.documents.filter((d) => d.status === "pending_review" && belongsInReviewQueue(d)).length;
  const flagged = data.documents.filter((d) => d.isFlagged).length;
  const proposalsPending = data.proposals.filter((p) => p.status === "proposed").length;
  const unresolvedAliases = data.aliases.filter((a) => !a.resolved).length;
  const upcomingDeadlines = data.deadlines
    .filter((d) => d.status === "upcoming")
    .slice(0, 5);
  const missedDeadlines = data.deadlines.filter((d) => d.status === "missed").length;

  const contactsById = new Map(data.contacts.map((c) => [c.id, c]));

  const recentDocuments = data.documents.slice(0, 6);
  const topProposals = data.proposals.filter((p) => p.status === "proposed").slice(0, 5);

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Overview"
        title="Welcome back to CaseVault"
        description="Live snapshot of ingestion, review queues, identity resolution, and AI flags across all matters."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Active Matters" value={data.matters.length} tone="indigo" hint="Across Supreme & Housing Court" />
        <StatCard label="Documents" value={data.documents.length} tone="slate" hint={`${data.dockets.length} dockets tracked`} />
        <StatCard label="Pending Review" value={pendingReview} tone="amber" hint="Awaiting document review" />
        <StatCard label="Flagged for Review" value={flagged} tone="rose" hint="AI-flagged documents" />
        <StatCard label="AI Proposals Open" value={proposalsPending} tone="amber" hint="Facts, aliases, summaries" />
        <StatCard label="Unresolved Aliases" value={unresolvedAliases} tone="indigo" hint="Fuzzy match candidates" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Inbox size={16} className="text-sky-600" /> Recently Ingested Documents
            </h2>
            <Link href="/documents" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
              View queue <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {recentDocuments.map((doc) => (
              <Link
                key={doc.id}
                href={`/documents/${doc.id}`}
                className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{doc.title}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {sourceTypeLabels[doc.sourceType]} · {formatDate(doc.filedDate ?? doc.uploadedAt)}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-2">
                  {doc.isFlagged ? (
                    <Badge className="bg-rose-50 text-rose-700 ring-rose-200">
                      <FileWarning size={12} /> Flagged
                    </Badge>
                  ) : null}
                  <Badge className={documentStatusStyles[doc.status]}>
                    {doc.status.replace("_", " ")}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Sparkles size={16} className="text-amber-600" /> AI Proposals Awaiting You
            </h2>
            <Link href="/intelligence" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Review <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-3">
            {topProposals.length === 0 ? (
              <p className="text-sm text-slate-400">All caught up — no open proposals.</p>
            ) : (
              topProposals.map((p) => (
                <div key={p.id} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">{p.title}</p>
                    <Badge className={severityStyles[p.severity]}>{p.severity}</Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">{p.description}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <CalendarClock size={16} className="text-emerald-600" /> Upcoming Deadlines
            </h2>
            <Link href="/matters/deadlines" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
              All deadlines <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {upcomingDeadlines.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-700">{d.title}</p>
                  <p className="text-xs text-slate-400">{formatDate(d.dueDate)}</p>
                </div>
                <Badge className={deadlineStatusStyles[d.status]}>{d.status}</Badge>
              </div>
            ))}
            {missedDeadlines > 0 ? (
              <p className="pt-1 text-xs font-medium text-rose-600">{missedDeadlines} missed deadline(s) need attention.</p>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Gavel size={16} className="text-sky-600" />
            <h2 className="text-sm font-semibold text-slate-800">Dockets</h2>
          </div>
          <div className="space-y-3">
            {data.dockets.map((docket) => {
              const matter = data.matters.find((m) => m.id === docket.matterId);
              const entryCount = data.docketEntries.filter((e) => e.docketId === docket.id).length;
              return (
                <Link
                  key={docket.id}
                  href={`/docket-key/${docket.id}`}
                  className="block rounded-xl border border-slate-100 p-3 transition hover:border-sky-200 hover:bg-sky-50/40"
                >
                  <p className="text-sm font-semibold text-slate-800">{docket.indexNumber}</p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{matter?.name}</p>
                  <p className="mt-1 text-xs text-slate-400">{entryCount} docket entries</p>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <GitMerge size={16} className="text-violet-600" /> Identity Resolution
            </h2>
            <Link href="/converge/resolution" className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
              Resolve <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="space-y-2.5">
            {data.aliases
              .filter((a) => !a.resolved)
              .map((alias) => {
                const contact = contactsById.get(alias.contactId);
                return (
                  <div key={alias.id} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium">&ldquo;{alias.aliasName}&rdquo;</span> → {contact?.displayName}
                    </p>
                    <p className="text-xs text-slate-400">
                      {Math.round(alias.confidence * 100)}% confidence · {alias.source}
                    </p>
                  </div>
                );
              })}
            {data.aliases.filter((a) => !a.resolved).length === 0 ? (
              <p className="text-sm text-slate-400">No pending alias conflicts.</p>
            ) : null}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">Live Activity Feed</h2>
        </div>
        <ul className="space-y-3">
          {data.activity.slice(0, 8).map((item) => (
            <li key={item.id} className="flex items-start gap-3 text-sm">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400" />
              <div className="min-w-0">
                <p className="text-slate-700">{item.message}</p>
                <p className="text-xs text-slate-400">{timeAgo(item.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

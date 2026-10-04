import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Badge, Card, EmptyState, SectionHeading, StatCard } from "@/components/ui";
import { ProposalActionButtons } from "@/components/actions/ProposalActions";
import { severityStyles, proposalStatusStyles } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Sparkles, FileText, Share2 } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  review_flag: "Human Review Flag",
  entity_suggestion: "Entity Suggestion",
  summary: "Summarization",
  duplicate: "Duplicate Detection",
  alias_merge: "Alias Merge",
  concept_map: "Concept Mapping",
};

export default async function IntelligencePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "proposed";
  const type = params.type ?? "all";

  const data = await getAllData();
  let proposals = data.proposals;
  if (status !== "all") proposals = proposals.filter((p) => p.status === status);
  if (type !== "all") proposals = proposals.filter((p) => p.type === type);

  const counts = {
    proposed: data.proposals.filter((p) => p.status === "proposed").length,
    accepted: data.proposals.filter((p) => p.status === "accepted").length,
    rejected: data.proposals.filter((p) => p.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Intelligence"
        title="AI Proposals"
        description="Every automated suggestion — review flags, entity tags, alias merges, concept maps, and summaries — awaiting your confirmation."
        action={
          <Link
            href="/intelligence/graph"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            <Share2 size={14} /> Open Knowledge Graph
          </Link>
        }
      />

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Open proposals" value={counts.proposed} tone="amber" />
        <StatCard label="Accepted" value={counts.accepted} tone="emerald" />
        <StatCard label="Dismissed" value={counts.rejected} tone="slate" />
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-400">Status:</span>
          {["proposed", "accepted", "rejected", "all"].map((s) => (
            <Link
              key={s}
              href={`/intelligence?status=${s}&type=${type}`}
              className={`rounded-full px-2.5 py-1 font-medium ring-1 ring-inset ${
                status === s ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {s}
            </Link>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-400">Type:</span>
          {["all", ...Object.keys(TYPE_LABELS)].map((t) => (
            <Link
              key={t}
              href={`/intelligence?status=${status}&type=${t}`}
              className={`rounded-full px-2.5 py-1 font-medium ring-1 ring-inset ${
                type === t ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {t === "all" ? "all" : TYPE_LABELS[t]}
            </Link>
          ))}
        </div>
      </Card>

      <div className="space-y-3">
        {proposals.length === 0 ? (
          <EmptyState message="No proposals match these filters." />
        ) : (
          proposals.map((p) => {
            const doc = data.documents.find((d) => d.id === p.documentId);
            const contact = data.contacts.find((c) => c.id === p.contactId);
            return (
              <Card key={p.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Sparkles size={14} className="text-amber-500" />
                      <Badge className="bg-slate-100 text-slate-600 ring-slate-200">{TYPE_LABELS[p.type]}</Badge>
                      <Badge className={severityStyles[p.severity]}>{p.severity}</Badge>
                      <Badge className={proposalStatusStyles[p.status]}>{p.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-semibold text-slate-800">{p.title}</p>
                    <p className="mt-1 max-w-3xl text-sm text-slate-500">{p.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span>{formatDateTime(p.createdAt)}</span>
                      {doc ? (
                        <Link href={`/documents/${doc.id}`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                          <FileText size={11} /> {doc.title}
                        </Link>
                      ) : null}
                      {contact ? (
                        <Link href={`/converge/${contact.id}`} className="text-indigo-600 hover:underline">
                          {contact.displayName}
                        </Link>
                      ) : null}
                    </div>
                  </div>
                  {p.status === "proposed" ? <ProposalActionButtons proposalId={p.id} /> : null}
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

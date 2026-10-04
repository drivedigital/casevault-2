import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { FileText, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChronologyPage() {
  const data = await getAllData();
  const events = [...data.chronology].sort((a, b) => (a.eventDate ?? "").localeCompare(b.eventDate ?? ""));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CaseVault Core"
        title="Chronology Timeline"
        description="Cross-matter fact timeline with precision levels and source pin-cites, assembled from every ingested document."
      />

      <Card className="p-6">
        {events.length === 0 ? (
          <EmptyState message="No chronology events recorded." />
        ) : (
          <div className="space-y-0">
            {events.map((e, i) => {
              const matter = data.matters.find((m) => m.id === e.matterId);
              const linkedDoc = data.documents.find((d) => d.id === e.documentId);
              return (
                <div key={e.id} className="relative flex gap-4 pb-7 last:pb-0">
                  <div className="flex flex-col items-center">
                    <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                      <Clock size={13} />
                    </span>
                    {i < events.length - 1 ? <span className="w-px flex-1 bg-slate-200" /> : null}
                  </div>
                  <div className="-mt-0.5 flex-1 pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-xs font-semibold text-slate-500">{formatDate(e.eventDate)}</p>
                      <Badge className="bg-slate-100 text-slate-500 ring-slate-200">{e.precision}</Badge>
                      {matter ? (
                        <Link href={`/matters/${matter.id}`} className="text-xs text-emerald-700 hover:underline">
                          {matter.name}
                        </Link>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-sm font-semibold text-slate-800">{e.title}</p>
                    <p className="text-xs text-slate-500">{e.description}</p>
                    {linkedDoc ? (
                      <Link href={`/documents/${linkedDoc.id}`} className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                        <FileText size={11} /> {linkedDoc.title} {e.pageCite}
                      </Link>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

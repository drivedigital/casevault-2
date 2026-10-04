import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Card, SectionHeading } from "@/components/ui";
import { KnowledgeGraph } from "@/components/KnowledgeGraph";
import { ChevronLeft } from "lucide-react";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function GraphPage({
  searchParams,
}: {
  searchParams: Promise<{ matterId?: string }>;
}) {
  const params = await searchParams;
  const data = await getAllData();
  const selectedMatterId = params.matterId ? Number(params.matterId) : undefined;

  return (
    <div className="space-y-5">
      <Link href="/intelligence" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft size={14} /> Back to AI Proposals
      </Link>

      <SectionHeading
        eyebrow="Intelligence"
        title="Knowledge Graph"
        description="Interactive node canvas connecting Matter → Claims → Facts → Evidence → People & Orgs. Drag nodes to explore connections."
      />

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-400">Scope:</span>
          <Link
            href="/intelligence/graph"
            className={clsx(
              "rounded-full px-2.5 py-1 font-medium ring-1 ring-inset",
              !selectedMatterId ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
            )}
          >
            All matters
          </Link>
          {data.matters.map((m) => (
            <Link
              key={m.id}
              href={`/intelligence/graph?matterId=${m.id}`}
              className={clsx(
                "rounded-full px-2.5 py-1 font-medium ring-1 ring-inset",
                selectedMatterId === m.id ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {m.name}
            </Link>
          ))}
        </div>
      </Card>

      <KnowledgeGraph matterId={selectedMatterId} key={selectedMatterId ?? "all"} />
    </div>
  );
}

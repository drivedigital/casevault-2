import { Share2 } from "lucide-react";

export function KnowledgeGraph() {
  return (
    <div className="flex min-h-[340px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
      <div className="rounded-2xl bg-amber-50 p-4"><Share2 size={32} className="text-amber-500" /></div>
      <h2 className="mt-5 text-lg font-semibold text-slate-800">Knowledge Graph</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">Coming later. This space will connect matters, people, claims, facts, and supporting evidence.</p>
      <span className="mt-4 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">Placeholder</span>
    </div>
  );
}

import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Badge, Card, EmptyState, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { deadlineStatusStyles, taskStatusStyles } from "@/lib/constants";
import { CalendarClock, ListChecks, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DeadlinesPage() {
  const data = await getAllData();
  const deadlines = [...data.deadlines].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const tasks = [...data.tasks].sort((a, b) => (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999"));

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CaseVault Core"
        title="Deadlines & Tasks"
        description="Court dates, statute of limitations clocks, and action items across every matter in the vault."
      />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <CalendarClock size={15} className="text-emerald-600" />
          <h2 className="text-sm font-semibold text-slate-800">Deadlines</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-medium">Due</th>
              <th className="px-5 py-2.5 font-medium">Title</th>
              <th className="px-5 py-2.5 font-medium">Matter</th>
              <th className="px-5 py-2.5 font-medium">Type</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deadlines.map((d) => {
              const matter = data.matters.find((m) => m.id === d.matterId);
              return (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatDate(d.dueDate)}</td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{d.title}</p>
                    <p className="text-xs text-slate-400">{d.notes}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {matter ? <Link href={`/matters/${matter.id}`} className="text-indigo-600 hover:underline">{matter.name}</Link> : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-500">{d.type.replace("_", " ")}</td>
                  <td className="px-5 py-3">
                    <Badge className={deadlineStatusStyles[d.status]}>{d.status}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {deadlines.length === 0 ? <EmptyState message="No deadlines tracked." /> : null}
      </Card>

      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
          <ListChecks size={15} className="text-sky-600" />
          <h2 className="text-sm font-semibold text-slate-800">Tasks</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-2.5 font-medium">Due</th>
              <th className="px-5 py-2.5 font-medium">Title</th>
              <th className="px-5 py-2.5 font-medium">Matter</th>
              <th className="px-5 py-2.5 font-medium">Linked document</th>
              <th className="px-5 py-2.5 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((t) => {
              const matter = data.matters.find((m) => m.id === t.matterId);
              const doc = data.documents.find((d) => d.id === t.linkedDocumentId);
              return (
                <tr key={t.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 whitespace-nowrap text-slate-600">{formatDate(t.dueDate)}</td>
                  <td className="px-5 py-3 font-medium text-slate-800">{t.title}</td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {matter ? <Link href={`/matters/${matter.id}`} className="text-indigo-600 hover:underline">{matter.name}</Link> : "—"}
                  </td>
                  <td className="px-5 py-3 text-xs">
                    {doc ? (
                      <Link href={`/documents/${doc.id}`} className="inline-flex items-center gap-1 text-indigo-600 hover:underline">
                        <FileText size={11} /> {doc.title}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <Badge className={taskStatusStyles[t.status]}>{t.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {tasks.length === 0 ? <EmptyState message="No tasks tracked." /> : null}
      </Card>
    </div>
  );
}

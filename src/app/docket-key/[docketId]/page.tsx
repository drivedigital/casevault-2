import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { docketEntryStatusStyles, documentStatusStyles } from "@/lib/constants";
import { FileText, ArrowUpRight, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocketDetailPage({
  params,
}: {
  params: Promise<{ docketId: string }>;
}) {
  const { docketId } = await params;
  const data = await getAllData();
  const docket = data.dockets.find((d) => d.id === Number(docketId));
  if (!docket) notFound();

  const matter = data.matters.find((m) => m.id === docket.matterId);
  const entries = data.docketEntries
    .filter((e) => e.docketId === docket.id)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  return (
    <div className="space-y-6">
      <Link href="/docket-key" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft size={14} /> Back to Docket Viewer
      </Link>

      <SectionHeading
        eyebrow={docket.court}
        title={docket.indexNumber}
        description={docket.caption}
        action={matter ? <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">{matter.name}</Badge> : undefined}
      />

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Filed</th>
              <th className="px-4 py-3 font-medium">Motion / Doc Type</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="px-4 py-3 font-medium">Entry Status</th>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const document = data.documents.find((d) => d.id === entry.documentId);
              return (
                <tr key={entry.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 text-slate-500">{entry.sequenceNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDate(entry.filedDate)}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{entry.docType}</td>
                  <td className="px-4 py-3 max-w-xs text-slate-500">{entry.description}</td>
                  <td className="px-4 py-3">
                    <Badge className={docketEntryStatusStyles[entry.status]}>{entry.status.replace("_", " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    {document ? (
                      <Badge className={documentStatusStyles[document.status]}>{document.status.replace("_", " ")}</Badge>
                    ) : (
                      <span className="text-xs text-slate-300">Not yet attached</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {document ? (
                      <Link
                        href={`/documents/${document.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        <FileText size={12} /> View <ArrowUpRight size={10} />
                      </Link>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {entries.length === 0 ? <EmptyState message="No docket entries yet." /> : null}
      </Card>
    </div>
  );
}

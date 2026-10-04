import Link from "next/link";
import { belongsInReviewQueue } from "@/lib/review-policy";
import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { documentStatusStyles, sourceTypeLabels, tagTypeStyles } from "@/lib/constants";
import { IngestButton } from "@/components/actions/IngestButton";
import { FileWarning, Webhook, HardDriveUpload, FileText } from "lucide-react";
import clsx from "clsx";

export const dynamic = "force-dynamic";

const STATUS_FILTERS = ["all", "pending_review", "processing", "indexed", "verified", "flagged"];
const SOURCE_FILTERS = ["all", "drive", "upload", "email"];

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; q?: string }>;
}) {
  const params = await searchParams;
  const status = params.status ?? "all";
  const source = params.source ?? "all";
  const q = (params.q ?? "").toLowerCase().trim();

  const data = await getAllData();

  let docs = data.documents.filter(belongsInReviewQueue);
  if (status !== "all") docs = docs.filter((d) => d.status === status);
  if (source !== "all") docs = docs.filter((d) => d.sourceType === source);
  if (q) docs = docs.filter((d) => d.title.toLowerCase().includes(q) || (d.ocrText ?? "").toLowerCase().includes(q));

  const buildHref = (next: Record<string, string>) => {
    const sp = new URLSearchParams({ status, source, q });
    Object.entries(next).forEach(([k, v]) => sp.set(k, v));
    return `/documents?${sp.toString()}`;
  };

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Docket-Key"
        title="Document Review Queue"
        description="Review Drive, uploaded, and email documents. Court docket imports bypass routine review; explicitly flagged filings return here."
        action={
          <div className="flex gap-2">
            <IngestButton endpoint="/api/drive/sync" label="Sync Google Drive" icon="drive" variant="secondary" />
            <IngestButton endpoint="/api/intake/court-filing" label="Ingest Court Filing" icon="webhook" />
          </div>
        }
      />

      <p className="text-sm text-slate-500">Court filings remain available in the <Link href="/docket-key" className="font-medium text-indigo-600 hover:underline">Docket Viewer</Link> and still await extraction.</p>
      <Card className="p-4">
        <form className="flex flex-wrap items-center gap-3" action="/documents">
          <input
            type="text"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search title or OCR text…"
            className="w-64 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
          />
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="source" value={source} />
          <button className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white">Search</button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-400">Status:</span>
          {STATUS_FILTERS.map((s) => (
            <Link
              key={s}
              href={buildHref({ status: s })}
              className={clsx(
                "rounded-full px-2.5 py-1 font-medium ring-1 ring-inset",
                status === s ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {s.replace("_", " ")}
            </Link>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="font-medium text-slate-400">Source:</span>
          {SOURCE_FILTERS.map((s) => (
            <Link
              key={s}
              href={buildHref({ source: s })}
              className={clsx(
                "rounded-full px-2.5 py-1 font-medium ring-1 ring-inset",
                source === s ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:bg-slate-50",
              )}
            >
              {s === "all" ? "all" : sourceTypeLabels[s]}
            </Link>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Matter</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Filed</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {docs.map((doc) => {
              const matter = data.matters.find((m) => m.id === doc.matterId);
              const tags = data.tags.filter((t) => t.documentId === doc.id).slice(0, 3);
              return (
                <tr key={doc.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/documents/${doc.id}`} className="flex items-start gap-2">
                      <FileText size={15} className="mt-0.5 flex-shrink-0 text-slate-400" />
                      <span>
                        <span className="block font-medium text-slate-800">{doc.title}</span>
                        <span className="block text-xs text-slate-400">{doc.fileName}</span>
                      </span>
                      {doc.isFlagged ? <FileWarning size={14} className="mt-0.5 flex-shrink-0 text-rose-500" /> : null}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{sourceTypeLabels[doc.sourceType]}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{matter?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tags.map((t) => (
                        <Badge key={t.id} className={tagTypeStyles[t.tagType]}>
                          {t.tagValue}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{formatDate(doc.filedDate)}</td>
                  <td className="px-4 py-3">
                    <Badge className={documentStatusStyles[doc.status]}>{doc.status.replace("_", " ")}</Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {docs.length === 0 ? <EmptyState message="No documents match these filters." /> : null}
      </Card>
    </div>
  );
}

import { liveCourtLink } from "@/lib/docket-links";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading, EmptyState, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { docketEntryStatusStyles, documentStatusStyles } from "@/lib/constants";
import {
  FileText,
  ArrowUpRight,
  ChevronLeft,
  Calendar,
  Building2,
  ExternalLink,
  Download,
  Gavel,
  ShieldCheck,
  Clock,
} from "lucide-react";

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

  const courtLink = liveCourtLink(docket.sourceUrl);
  const matter = data.matters.find((m) => m.id === docket.matterId);
  const entries = data.docketEntries
    .filter((e) => e.docketId === docket.id)
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  const attachedDocs = data.documents.filter((d) => d.docketId === docket.id);
  const deadlines = docket.matterId
    ? data.deadlines.filter((dl) => dl.matterId === docket.matterId)
    : [];

  const isFederal =
    docket.court.toLowerCase().includes("u.s.") ||
    docket.court.toLowerCase().includes("bankruptcy") ||
    docket.indexNumber.includes("bk") ||
    docket.indexNumber.includes("cv");

  const earliestDate = entries[0]?.filedDate;
  const latestDate = entries[entries.length - 1]?.filedDate;

  return (
    <div className="space-y-8">
      {/* Top Bar: Back Link */}
      <div className="flex items-center justify-between">
        <Link
          href="/docket-key"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <ChevronLeft size={16} />
          <span>Back to All Court Dockets</span>
        </Link>

        <span
          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide uppercase ${
            isFederal
              ? "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200"
              : "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
          }`}
        >
          <Building2 size={13} />
          {isFederal ? "Federal ECF / PACER" : "State NYSCEF"}
        </span>
      </div>

      {/* Main Section Header */}
      <SectionHeading
        eyebrow={docket.court}
        title={docket.indexNumber}
        description={
          courtLink ? (
            <a
              href={courtLink.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`Open official court page for ${docket.indexNumber} in a new tab`}
              className="group inline-flex items-center gap-1.5 font-medium text-slate-800 transition hover:text-sky-700"
            >
              <span className="group-hover:underline">{docket.caption}</span>
              <ExternalLink size={13} className="text-sky-600 flex-shrink-0" />
            </a>
          ) : (
            docket.caption
          )
        }
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            {matter ? (
              <Link
                href={`/matters/${matter.id}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
              >
                <span>Matter:</span>
                <span className="font-semibold">{matter.name}</span>
              </Link>
            ) : null}

            {courtLink ? (
              <a
                href={courtLink.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500"
              >
                <span>{courtLink.label}</span>
                <ExternalLink size={13} />
              </a>
            ) : null}
          </div>
        }
      />

      {/* Docket Metrics Overview */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Filings"
          value={entries.length}
          hint="Sequenced Docket Rows"
          tone="indigo"
        />
        <StatCard
          label="Verified PDFs"
          value={attachedDocs.length}
          hint="Stored in Cloudflare R2"
          tone="emerald"
        />
        <StatCard
          label="Date Range"
          value={
            earliestDate && latestDate
              ? `${formatDate(earliestDate).slice(0, 6)} – ${formatDate(latestDate).slice(0, 6)}`
              : "Active"
          }
          hint={`${formatDate(earliestDate)} to ${formatDate(latestDate)}`}
          tone="slate"
        />
        <StatCard
          label="Hearings & Deadlines"
          value={deadlines.length}
          hint={isFederal ? "CM/ECF Scheduled Dates" : "Court Calendar Items"}
          tone="amber"
        />
      </div>

      {/* Scheduled Hearings & Deadlines (if any) */}
      {deadlines.length > 0 ? (
        <Card className="overflow-hidden border-amber-200/80 bg-amber-50/20">
          <div className="border-b border-amber-100 bg-amber-50/60 px-5 py-3.5">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-amber-700" />
              <h2 className="text-sm font-bold text-amber-900">
                Scheduled Court Hearings &amp; Filing Deadlines ({deadlines.length})
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-amber-700/80">
              Extracted from official CM/ECF schedule query (SchedQry.pl) for this proceeding.
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-amber-100/60 sm:grid-cols-2 sm:divide-y-0 sm:divide-x lg:grid-cols-3">
            {deadlines.map((dl) => (
              <div key={dl.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-xs text-slate-800">{dl.title}</span>
                  <Badge className="bg-amber-100 text-amber-800 ring-amber-300 text-[10px]">
                    {dl.status}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-900">
                  <Clock size={12} className="text-amber-600" />
                  <span>Due: {formatDate(dl.dueDate)}</span>
                </div>
                {dl.notes ? (
                  <p className="mt-1 text-[11px] text-slate-500 truncate">{dl.notes}</p>
                ) : null}
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* Master Docket Table */}
      <Card className="overflow-hidden shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Official Docket Sheet ({entries.length} Entries)
            </h2>
            <p className="text-xs text-slate-500">
              Chronologically ordered filings synchronized from court source records.
            </p>
          </div>
          <Badge className="bg-slate-100 text-slate-700 font-medium">
            {attachedDocs.length} PDFs attached
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200/80">
              <tr>
                <th className="px-4 py-3 w-14">#</th>
                <th className="px-4 py-3 whitespace-nowrap w-28">Filed Date</th>
                <th className="px-4 py-3 min-w-[220px]">Motion / Document Title</th>
                <th className="px-4 py-3 min-w-[260px]">Filer &amp; Description</th>
                <th className="px-4 py-3 w-28">Status</th>
                <th className="px-4 py-3 min-w-[200px]">PDF Evidence (R2)</th>
                <th className="px-4 py-3 text-right w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => {
                const document = data.documents.find((d) => d.id === entry.documentId);
                return (
                  <tr key={entry.id} className="transition hover:bg-slate-50/80">
                    {/* Sequence Number */}
                    <td className="px-4 py-3 font-semibold text-slate-500 text-xs">
                      #{entry.sequenceNumber}
                    </td>

                    {/* Filed Date */}
                    <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-slate-600">
                      {formatDate(entry.filedDate)}
                    </td>

                    {/* Motion / Document Type */}
                    <td className="px-4 py-3 font-semibold text-slate-900 text-xs">
                      {entry.docType}
                    </td>

                    {/* Description / Filer */}
                    <td className="px-4 py-3 text-xs text-slate-600 leading-relaxed max-w-md">
                      {entry.description}
                    </td>

                    {/* Entry Status */}
                    <td className="px-4 py-3">
                      <Badge className={docketEntryStatusStyles[entry.status]}>
                        {entry.status.replace("_", " ")}
                      </Badge>
                    </td>

                    {/* Document Attached in R2 */}
                    <td className="px-4 py-3">
                      {document ? (
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/documents/${document.id}`}
                            className="inline-flex items-center gap-1.5 font-medium text-slate-800 hover:text-sky-600 text-xs truncate max-w-[200px]"
                            title={document.fileName || document.title}
                          >
                            <FileText size={14} className="text-sky-500 flex-shrink-0" />
                            <span className="truncate">{document.fileName || document.title}</span>
                          </Link>
                          {document.pageCount ? (
                            <span className="flex-shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                              {document.pageCount}p
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Metadata only</span>
                      )}
                    </td>

                    {/* Action Link */}
                    <td className="px-4 py-3 text-right">
                      {document ? (
                        <Link
                          href={`/documents/${document.id}`}
                          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                        >
                          <span>View</span>
                          <ArrowUpRight size={11} />
                        </Link>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {entries.length === 0 ? <EmptyState message="No docket entries synchronized yet." /> : null}
      </Card>
    </div>
  );
}

import { liveCourtLink } from "@/lib/docket-links";
import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { docketEntryStatusStyles } from "@/lib/constants";
import {
  PullCourtDocketButton,
  UpdateDocketButton,
} from "@/components/actions/PullCourtDocketModal";
import {
  Gavel,
  ArrowRight,
  Layers,
  ExternalLink,
  ShieldCheck,
  Building2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocketKeyPage() {
  const data = await getAllData();

  const totalDockets = data.dockets.length;
  const totalEntries = data.docketEntries.length;
  const totalAttachedDocs = data.documents.filter((d) => d.docketId !== null).length;
  const totalDeadlines = data.deadlines.length;

  const docketOptions = data.dockets.map((d) => ({
    id: d.id,
    indexNumber: d.indexNumber,
    court: d.court,
    caption: d.caption,
  }));

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Docket-Key"
        title="Court Docket Viewer"
        description="Multi-jurisdiction litigation dockets across State (NYSCEF) and Federal (PACER / NextGen CM/ECF) systems — synchronized filings, verified original PDFs in R2, and hearing calendars."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <PullCourtDocketButton dockets={docketOptions} />
            <Link
              href="/docket-key/connectors"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Layers size={14} className="text-slate-500" />
              Source Connectors
            </Link>
            <Link
              href="/docket-key/bridges"
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              <ShieldCheck size={14} className="text-sky-400" />
              Bridge Status
            </Link>
          </div>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active Dockets"
          value={totalDockets}
          hint="State & Federal Jurisdictions"
          tone="indigo"
        />
        <StatCard
          label="Docket Entries"
          value={totalEntries}
          hint="Synchronized Court Filings"
          tone="slate"
        />
        <StatCard
          label="Court PDFs in R2"
          value={totalAttachedDocs}
          hint="SHA-256 Verified Originals"
          tone="emerald"
        />
        <StatCard
          label="Court Deadlines"
          value={totalDeadlines}
          hint="Hearings & Bar Dates"
          tone="amber"
        />
      </div>

      {/* Dockets Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {data.dockets.map((docket) => {
          const courtLink = liveCourtLink(docket.sourceUrl);
          const matter = data.matters.find((m) => m.id === docket.matterId);
          const entries = data.docketEntries
            .filter((e) => e.docketId === docket.id)
            .sort((a, b) => b.sequenceNumber - a.sequenceNumber);
          const attachedDocsCount = data.documents.filter(
            (d) => d.docketId === docket.id,
          ).length;

          const isFederal =
            docket.court.toLowerCase().includes("u.s.") ||
            docket.court.toLowerCase().includes("bankruptcy") ||
            docket.indexNumber.includes("bk") ||
            docket.indexNumber.includes("cv");

          return (
            <Card
              key={docket.id}
              className="flex flex-col justify-between overflow-hidden border-slate-200/90 shadow-sm transition hover:shadow-md"
            >
              <div className="p-5">
                {/* Header Badge & Jurisdiction */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide uppercase ${
                        isFederal
                          ? "bg-purple-50 text-purple-700 ring-1 ring-inset ring-purple-200"
                          : "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200"
                      }`}
                    >
                      <Building2 size={12} />
                      {isFederal ? "Federal ECF / PACER" : "State NYSCEF"}
                    </span>
                    <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">
                      {docket.status}
                    </Badge>
                  </div>

                  <span className="text-xs font-semibold text-slate-500">
                    {entries.length} filings
                  </span>
                </div>

                {/* Case Title & Index */}
                <div className="mt-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Gavel size={16} className="text-sky-600 flex-shrink-0" />
                      <h2 className="text-base font-bold text-slate-900 tracking-tight">
                        {docket.indexNumber}
                      </h2>
                    </div>
                    {/* Per-card Update Button */}
                    <UpdateDocketButton docketId={docket.id} indexNumber={docket.indexNumber} />
                  </div>

                  <p className="mt-0.5 text-xs font-medium text-slate-500">
                    {docket.court}
                  </p>

                  {/* Case Caption with direct live court link */}
                  {courtLink ? (
                    <a
                      href={courtLink.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`Open official court page for ${docket.indexNumber} in a new tab`}
                      className="group mt-2 block rounded-md py-0.5 transition hover:bg-slate-50/80"
                    >
                      <p className="line-clamp-2 text-sm font-medium leading-relaxed text-slate-800 group-hover:text-sky-700 group-hover:underline">
                        {docket.caption}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 group-hover:text-sky-800">
                        <span>{courtLink.label}</span>
                        <ExternalLink size={11} />
                      </span>
                    </a>
                  ) : (
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-700">
                      {docket.caption}
                    </p>
                  )}
                </div>

                {/* Matter Association (dockets are independent; only shown if linked) */}
                {matter ? (
                  <div className="mt-3.5 flex items-center gap-2 border-t border-slate-100 pt-3">
                    <span className="text-xs text-slate-400">Associated Matter:</span>
                    <Link
                      href={`/matters/${matter.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      {matter.name}
                    </Link>
                  </div>
                ) : null}

                {/* Recent Filings Preview */}
                <div className="mt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Latest Filings ({entries.length} Total)
                  </p>
                  <div className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/50 px-3">
                    {entries.slice(0, 4).map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-3 py-2 text-xs"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-slate-800">
                            <span className="text-slate-400">#{entry.sequenceNumber}</span>{" "}
                            {entry.docType}
                          </p>
                          <p className="truncate text-[11px] text-slate-400">
                            {formatDate(entry.filedDate)}
                          </p>
                        </div>
                        <Badge
                          className={`text-[10px] ${docketEntryStatusStyles[entry.status]}`}
                        >
                          {entry.status.replace("_", " ")}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card Footer Button */}
              <div className="border-t border-slate-100 bg-slate-50/70 p-3">
                <Link
                  href={`/docket-key/${docket.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  <span>Open Complete Docket Sheet</span>
                  <span className="text-slate-400">({entries.length} items · {attachedDocsCount} PDFs)</span>
                  <ArrowRight size={14} className="text-slate-400" />
                </Link>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

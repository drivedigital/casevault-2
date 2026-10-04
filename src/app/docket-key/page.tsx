import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { docketEntryStatusStyles } from "@/lib/constants";
import { IngestButton } from "@/components/actions/IngestButton";
import { Gavel, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocketKeyPage() {
  const data = await getAllData();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Docket-Key"
        title="Docket Viewer"
        description="NYSCEF and Housing Court dockets ingested via the desktop runner webhook — filings, dates, motion types, and status at a glance."
        action={
          <div className="flex gap-2">
            <IngestButton endpoint="/api/intake/docket-snapshot" label="Simulate Docket Snapshot" icon="webhook" />
            <IngestButton endpoint="/api/intake/court-filing" label="Simulate Court Filing" icon="fileUp" variant="secondary" />
          </div>
        }
      />

      <Card className="p-4">
        <p className="text-xs leading-relaxed text-slate-500">
          <span className="font-semibold text-slate-700">How this works:</span> a local desktop runner
          authenticates against NYSCEF with your Chrome session, scrapes the docket table &amp; PDF bytes, then
          POSTs to <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">/api/intake/docket-snapshot</code>{" "}
          and <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">/api/intake/court-filing</code>. Use the
          buttons above to simulate a webhook push and watch a new filing land in the queue below.
        </p>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {data.dockets.map((docket) => {
          const matter = data.matters.find((m) => m.id === docket.matterId);
          const entries = data.docketEntries
            .filter((e) => e.docketId === docket.id)
            .sort((a, b) => b.sequenceNumber - a.sequenceNumber);

          return (
            <Card key={docket.id} className="flex flex-col p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Gavel size={15} className="text-sky-600" />
                    <p className="text-sm font-semibold text-slate-800">{docket.indexNumber}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{docket.court}</p>
                  <p className="mt-1 text-sm text-slate-700">{docket.caption}</p>
                </div>
                <Badge className="bg-sky-50 text-sky-700 ring-sky-200">{docket.status}</Badge>
              </div>

              {matter ? (
                <Link href={`/matters/${matter.id}`} className="mt-2 text-xs font-medium text-indigo-600 hover:underline">
                  {matter.name}
                </Link>
              ) : null}

              <div className="mt-4 flex-1 divide-y divide-slate-100 border-t border-slate-100">
                {entries.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-slate-700">
                        <span className="font-medium">#{entry.sequenceNumber}</span> {entry.docType}
                      </p>
                      <p className="truncate text-xs text-slate-400">{formatDate(entry.filedDate)}</p>
                    </div>
                    <Badge className={docketEntryStatusStyles[entry.status]}>{entry.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>

              <Link
                href={`/docket-key/${docket.id}`}
                className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                Open full docket <ArrowUpRight size={12} />
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { Scale, FileText, Clock, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MattersPage() {
  const data = await getAllData();

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CaseVault Core"
        title="Matters & Claims"
        description="Every matter in the vault with its claims, documents, parties, and chronology, all in one place."
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {data.matters.map((matter) => {
          const docs = data.documents.filter((d) => d.matterId === matter.id);
          const claims = data.claims.filter((c) => c.matterId === matter.id);
          const roles = data.roles.filter((r) => r.matterId === matter.id);
          const events = data.chronology.filter((e) => e.matterId === matter.id);

          return (
            <Link key={matter.id} href={`/matters/${matter.id}`}>
              <Card className="h-full p-6 transition hover:border-emerald-200 hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scale size={16} className="text-emerald-600" />
                      <p className="text-sm font-semibold text-slate-800">{matter.caseNumber}</p>
                    </div>
                    <h2 className="mt-1 text-lg font-semibold text-slate-900">{matter.name}</h2>
                    <p className="text-xs text-slate-400">{matter.court}</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">{matter.status}</Badge>
                </div>
                <p className="mt-3 text-sm text-slate-500">{matter.description}</p>
                <div className="mt-5 grid grid-cols-4 gap-2 text-center text-xs text-slate-500">
                  <div className="rounded-lg bg-slate-50 py-2">
                    <FileText size={14} className="mx-auto mb-1 text-slate-400" />
                    {docs.length} docs
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <Scale size={14} className="mx-auto mb-1 text-slate-400" />
                    {claims.length} claims
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <Users size={14} className="mx-auto mb-1 text-slate-400" />
                    {roles.length} parties
                  </div>
                  <div className="rounded-lg bg-slate-50 py-2">
                    <Clock size={14} className="mx-auto mb-1 text-slate-400" />
                    {events.length} events
                  </div>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

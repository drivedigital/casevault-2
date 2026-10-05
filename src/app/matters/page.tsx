import Link from "next/link";
import { getAllData } from "@/lib/data";
import { SectionHeading, StatCard } from "@/components/ui";
import { NewMatterButton, MattersList } from "@/components/actions/MatterActions";
import { Clock, CalendarClock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MattersPage() {
  const data = await getAllData();

  const totalMatters = data.matters.length;
  const activeMatters = data.matters.filter((m) => m.status !== "hidden").length;
  const totalClaims = data.claims.length;
  const totalRoles = data.roles.length;
  const totalDocs = data.documents.filter((d) => d.matterId !== null).length;
  const upcomingDeadlines = data.deadlines.filter((d) => d.status === "upcoming").length;

  const matterSummaries = data.matters.map((matter) => {
    const docs = data.documents.filter((d) => d.matterId === matter.id);
    const claims = data.claims.filter((c) => c.matterId === matter.id);
    const roles = data.roles.filter((r) => r.matterId === matter.id);
    const events = data.chronology.filter((e) => e.matterId === matter.id);

    return {
      id: matter.id,
      name: matter.name,
      caseNumber: matter.caseNumber,
      court: matter.court,
      status: matter.status,
      description: matter.description,
      docsCount: docs.length,
      claimsCount: claims.length,
      rolesCount: roles.length,
      eventsCount: events.length,
      createdAt: matter.createdAt,
    };
  });

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="CaseVault Core"
        title="Matters & Claims"
        description="Centralized litigation matters, claim elements, party capacities, and court chronologies across all active proceedings."
        action={
          <div className="flex flex-wrap items-center gap-2.5">
            <NewMatterButton />
            <Link
              href="/matters/chronology"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <Clock size={14} className="text-slate-500" />
              <span>Chronology Timeline</span>
            </Link>
            <Link
              href="/matters/deadlines"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900"
            >
              <CalendarClock size={14} className="text-slate-500" />
              <span>Deadlines & Tasks</span>
            </Link>
          </div>
        }
      />

      {/* Top Overview Metrics */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="Active Matters"
          value={activeMatters}
          hint={`${totalMatters} total registered`}
          tone="emerald"
        />
        <StatCard
          label="Mapped Claims"
          value={totalClaims}
          hint="Across all matrices"
          tone="indigo"
        />
        <StatCard
          label="Tracked Parties"
          value={totalRoles}
          hint="Entities & Capacities"
          tone="slate"
        />
        <StatCard
          label="Linked Filings"
          value={totalDocs}
          hint="Evidence in Vault"
          tone="slate"
        />
        <StatCard
          label="Upcoming Deadlines"
          value={upcomingDeadlines}
          hint="Court Clocks & Orders"
          tone="amber"
        />
      </div>

      {/* Filterable Matters Grid */}
      <MattersList matters={matterSummaries} />
    </div>
  );
}

import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Avatar, Badge, Card, SectionHeading } from "@/components/ui";
import { contactTypeLabels } from "@/lib/constants";
import { Users, GitMerge, ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ConvergePage() {
  const data = await getAllData();
  const canonicalContacts = data.contacts.filter((c) => c.isCanonical);
  const pendingMerges = data.contacts.filter((c) => !c.isCanonical && !c.mergedIntoId).length;
  const unresolvedAliases = data.aliases.filter((a) => !a.resolved).length;

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Converge"
        title="Contact Directory"
        description="Canonical registry of individuals, organizations, law firms, and courts, with legal capacity separated per matter."
        action={
          <Link
            href="/converge/resolution"
            className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3.5 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100"
          >
            <GitMerge size={14} /> Resolution queue ({pendingMerges + unresolvedAliases})
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {canonicalContacts.map((contact) => {
          const roles = data.roles.filter((r) => r.contactId === contact.id);
          const aliases = data.aliases.filter((a) => a.contactId === contact.id);
          const mentionCount = data.tags.filter((t) => t.contactId === contact.id).length;

          return (
            <Link key={contact.id} href={`/converge/${contact.id}`}>
              <Card className="h-full p-5 transition hover:border-violet-200 hover:shadow-md">
                <div className="flex items-center gap-3">
                  <Avatar name={contact.displayName} color={contact.avatarColor ?? undefined} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{contact.displayName}</p>
                    <p className="text-xs text-slate-400">{contactTypeLabels[contact.type]}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {roles.slice(0, 2).map((r) => (
                    <Badge key={r.id} className="bg-slate-100 text-slate-600 ring-slate-200">
                      {r.roleLabel}
                    </Badge>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>{aliases.length} alias(es)</span>
                  <span>{mentionCount} doc mention(s)</span>
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <h2 className="text-sm font-semibold text-slate-800">All contact records (including unresolved)</h2>
        </div>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-slate-400">
            <tr>
              <th className="py-2 font-medium">Name</th>
              <th className="py-2 font-medium">Type</th>
              <th className="py-2 font-medium">Canonical</th>
              <th className="py-2 font-medium"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.contacts.map((c) => {
              const canonical = data.contacts.find((x) => x.id === c.mergedIntoId);
              return (
                <tr key={c.id}>
                  <td className="py-2 font-medium text-slate-700">{c.displayName}</td>
                  <td className="py-2 text-xs text-slate-500">{contactTypeLabels[c.type]}</td>
                  <td className="py-2">
                    {c.isCanonical ? (
                      <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">Canonical</Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-700 ring-amber-200">
                        Merged → {canonical?.displayName ?? "pending"}
                      </Badge>
                    )}
                  </td>
                  <td className="py-2 text-right">
                    <Link href={`/converge/${c.isCanonical ? c.id : c.mergedIntoId ?? c.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline">
                      View <ArrowUpRight size={10} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

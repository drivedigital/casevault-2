import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Avatar, Badge, Card, EmptyState, SectionHeading } from "@/components/ui";
import { ResolveAliasButton, MergeContactButton } from "@/components/actions/MergeActions";
import { ProposalActionButtons } from "@/components/actions/ProposalActions";
import { severityStyles } from "@/lib/constants";
import { ChevronLeft, GitMerge } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ResolutionPage() {
  const data = await getAllData();
  const unresolvedAliases = data.aliases.filter((a) => !a.resolved);
  const duplicateContacts = data.contacts.filter((c) => !c.isCanonical && !c.mergedIntoId);
  const mergeProposals = data.proposals.filter((p) => p.type === "alias_merge" || p.type === "duplicate");

  return (
    <div className="space-y-6">
      <Link href="/converge" className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft size={14} /> Back to Contact Directory
      </Link>

      <SectionHeading
        eyebrow="Converge"
        title="Fuzzy / Alias Resolution"
        description="Postgres pg_trgm-style fuzzy matching surfaces likely name variants across filings. Confirm merges to keep the contact graph clean."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <GitMerge size={15} className="text-violet-600" /> Pending duplicate contacts
          </h2>
          <div className="mt-3 space-y-3">
            {duplicateContacts.length === 0 ? (
              <EmptyState message="No duplicate contacts awaiting review." />
            ) : (
              duplicateContacts.map((dup) => {
                const proposal = mergeProposals.find(
                  (p) => (p.payload as Record<string, unknown>)?.duplicateContactId === dup.id,
                );
                const canonicalId = proposal ? Number((proposal.payload as Record<string, unknown>).canonicalContactId) : null;
                const canonical = canonicalId ? data.contacts.find((c) => c.id === canonicalId) : null;
                return (
                  <div key={dup.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={dup.displayName} color={dup.avatarColor ?? undefined} size={36} />
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{dup.displayName}</p>
                          <p className="text-xs text-slate-400">{dup.notes}</p>
                        </div>
                      </div>
                    </div>
                    {canonical ? (
                      <div className="mt-3 flex items-center justify-between rounded-lg bg-violet-50 px-3 py-2">
                        <p className="text-xs text-violet-700">
                          Suggested match: <span className="font-semibold">{canonical.displayName}</span>
                        </p>
                        <MergeContactButton duplicateId={dup.id} canonicalId={canonical.id} />
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-400">No automatic suggestion — review manually in the directory.</p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-slate-800">Unresolved aliases</h2>
          <div className="mt-3 space-y-3">
            {unresolvedAliases.length === 0 ? (
              <EmptyState message="No unresolved aliases." />
            ) : (
              unresolvedAliases.map((alias) => {
                const contact = data.contacts.find((c) => c.id === alias.contactId);
                return (
                  <div key={alias.id} className="rounded-xl border border-slate-100 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm text-slate-700">
                          <span className="font-semibold">&ldquo;{alias.aliasName}&rdquo;</span> may refer to{" "}
                          <Link href={`/converge/${contact?.id}`} className="text-indigo-600 hover:underline">
                            {contact?.displayName}
                          </Link>
                        </p>
                        <p className="mt-0.5 text-xs text-slate-400">
                          Source: {alias.source} · {Math.round(alias.confidence * 100)}% confidence
                        </p>
                      </div>
                      <Badge className="bg-amber-50 text-amber-700 ring-amber-200">needs review</Badge>
                    </div>
                    <div className="mt-3">
                      <ResolveAliasButton aliasId={alias.id} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-800">AI merge proposals</h2>
        <div className="mt-3 space-y-3">
          {mergeProposals.filter((p) => p.status === "proposed").length === 0 ? (
            <EmptyState message="No open merge proposals." />
          ) : (
            mergeProposals
              .filter((p) => p.status === "proposed")
              .map((p) => (
                <div key={p.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-800">{p.title}</p>
                      <Badge className={severityStyles[p.severity]}>{p.severity}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                  </div>
                  <ProposalActionButtons proposalId={p.id} />
                </div>
              ))
          )}
        </div>
      </Card>
    </div>
  );
}

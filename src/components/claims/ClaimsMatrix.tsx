"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import {
  AlertTriangle,
  Check,
  FileText,
  Lightbulb,
  Plus,
  Quote,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import {
  ELEMENT_STATUSES,
  PROOF_STRENGTHS,
  WITNESS_TYPES,
  claimHealth,
  computeElementHint,
  filterElements,
  firstPage,
  isGap,
  needsReview,
  type EvidenceKind,
  type MatrixClaim,
  type MatrixElement,
  type MatrixFilter,
  type Polarity,
  type ProofStrength,
  type WitnessType,
} from "@/lib/claims-matrix";

export interface MatrixOption {
  id: number;
  label: string;
}

export interface TemplateOption {
  slug: string;
  title: string;
  jurisdiction: string;
  elementCount: number;
}

export const strengthStyles: Record<ProofStrength, string> = {
  strong: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  moderate: "bg-sky-50 text-sky-700 ring-sky-200",
  weak: "bg-amber-50 text-amber-700 ring-amber-200",
  gap: "bg-rose-50 text-rose-700 ring-rose-200",
};

const polarityStyles: Record<Polarity, string> = {
  supporting: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  adverse: "bg-rose-50 text-rose-700 ring-rose-200",
  context: "bg-slate-100 text-slate-600 ring-slate-200",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const btn =
  "inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50";
const btnSecondary =
  "inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50";

export function HealthBar({ value }: { value: number }) {
  const color = value >= 75 ? "bg-emerald-500" : value >= 45 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div className={clsx("h-full rounded-full", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="w-9 text-right text-[11px] font-semibold text-slate-600">{value}%</span>
    </div>
  );
}

async function api(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

export function ClaimsMatrix({
  matterId,
  claims,
  documents,
  contacts,
  chronology,
  templates,
}: {
  matterId: number;
  claims: MatrixClaim[];
  documents: MatrixOption[];
  contacts: MatrixOption[];
  chronology: MatrixOption[];
  templates: TemplateOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(claims[0]?.id ?? null);
  const [filter, setFilter] = useState<MatrixFilter>("all");
  const [witnessFilter, setWitnessFilter] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [openElementId, setOpenElementId] = useState<number | null>(null);
  const [showNewClaim, setShowNewClaim] = useState(false);
  const [newElementTitle, setNewElementTitle] = useState("");

  const claim = claims.find((c) => c.id === selectedClaimId) ?? claims[0] ?? null;
  const elements = useMemo(
    () => (claim ? filterElements(claim.elements, { filter, witnessContactId: witnessFilter, query }) : []),
    [claim, filter, witnessFilter, query],
  );
  const claimWitnesses = useMemo(() => {
    const map = new Map<number, string>();
    claim?.elements.forEach((e) => e.witnesses.forEach((w) => map.set(w.contactId, w.displayName)));
    return [...map.entries()];
  }, [claim]);
  const openElement = claim?.elements.find((e) => e.id === openElementId) ?? null;

  function run(fn: () => Promise<unknown>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[11px] text-amber-800">
        Working draft for attorney review. Template elements and authorities are marked <strong>[VERIFY]</strong>; strength
        ratings are attorney judgments — the computed hint is advisory only and is never saved.
      </div>
      {error ? (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700">
          {error}
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Claims list */}
        <div className="space-y-2">
          <button className={clsx(btn, "w-full justify-center")} onClick={() => setShowNewClaim(true)}>
            <Plus size={14} /> New claim
          </button>
          {claims.length === 0 ? <EmptyState message="No claims yet. Start from a template." /> : null}
          {claims.map((c) => {
            const gaps = c.elements.filter(isGap).length;
            return (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedClaimId(c.id);
                  setOpenElementId(null);
                  setWitnessFilter(null);
                }}
                className={clsx(
                  "w-full rounded-xl border p-3 text-left transition",
                  c.id === claim?.id ? "border-emerald-300 bg-emerald-50/50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50",
                )}
              >
                <p className="text-xs font-semibold text-slate-900">{c.title}</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {c.elements.length} elements{gaps ? ` · ${gaps} gap${gaps > 1 ? "s" : ""}` : ""}
                </p>
                <div className="mt-2">
                  <HealthBar value={claimHealth(c.elements)} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Element table */}
        {claim ? (
          <Card className="p-4">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-slate-900">{claim.title}</h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  {[claim.statute, claim.jurisdiction, `Burden: ${claim.burdenOfProof.replace(/-/g, " ")}`]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {claim.description ? <p className="mt-1.5 max-w-3xl text-xs text-slate-600">{claim.description}</p> : null}
              </div>
              <button
                className={btnSecondary}
                disabled={pending}
                onClick={() => {
                  if (confirm(`Delete claim "${claim.title}" and all its elements and evidence links?`)) {
                    run(() => api(`/api/claims/${claim.id}`, "DELETE"));
                  }
                }}
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {(["all", "gaps", "needs_review", "supported"] as MatrixFilter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={clsx(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset",
                    filter === f ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200",
                  )}
                >
                  {f === "all" ? "All" : f === "gaps" ? "Gaps" : f === "needs_review" ? "Needs review" : "Supported"}
                </button>
              ))}
              {claimWitnesses.length ? (
                <select
                  className={clsx(inputClass, "w-auto")}
                  value={witnessFilter ?? ""}
                  onChange={(e) => setWitnessFilter(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All witnesses</option>
                  {claimWitnesses.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              ) : null}
              <div className="relative ml-auto">
                <Search size={13} className="absolute left-2 top-2 text-slate-400" />
                <input
                  className={clsx(inputClass, "w-56 pl-7")}
                  placeholder="Search elements, quotes, docs…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] uppercase tracking-wider text-slate-400">
                  <tr className="border-b border-slate-100">
                    <th className="w-8 py-2">#</th>
                    <th className="py-2">Element</th>
                    <th className="py-2">Evidence</th>
                    <th className="py-2">Witnesses</th>
                    <th className="py-2">Strength</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {elements.map((el) => {
                    const hint = computeElementHint(el);
                    const accepted = el.links.filter((l) => l.reviewState === "accepted");
                    const proposed = el.links.filter((l) => l.reviewState === "proposed").length;
                    return (
                      <tr
                        key={el.id}
                        onClick={() => setOpenElementId(el.id)}
                        className={clsx(
                          "cursor-pointer border-b border-slate-50 align-top hover:bg-slate-50",
                          openElementId === el.id && "bg-emerald-50/40",
                        )}
                      >
                        <td className="py-2.5 font-semibold text-slate-400">{el.position}</td>
                        <td className="max-w-xs py-2.5 pr-3">
                          <p className="font-semibold text-slate-800">{el.title}</p>
                          {el.authorityCitation ? (
                            <p className="mt-0.5 truncate text-[10px] text-slate-400">{el.authorityCitation}</p>
                          ) : null}
                        </td>
                        <td className="py-2.5 pr-3">
                          <div className="flex flex-wrap gap-1">
                            {(["supporting", "adverse", "context"] as Polarity[]).map((p) => {
                              const n = accepted.filter((l) => l.polarity === p).length;
                              return n ? (
                                <Badge key={p} className={polarityStyles[p]}>
                                  {n} {p}
                                </Badge>
                              ) : null;
                            })}
                            {proposed ? <Badge className="bg-violet-50 text-violet-700 ring-violet-200">{proposed} proposed</Badge> : null}
                            {!el.links.length ? <span className="italic text-slate-400">none</span> : null}
                          </div>
                        </td>
                        <td className="py-2.5 pr-3 text-slate-600">
                          {el.witnesses.length ? el.witnesses.map((w) => w.displayName).join(", ") : <span className="text-slate-400">—</span>}
                        </td>
                        <td className="py-2.5 pr-3">
                          <Badge className={strengthStyles[el.proofStrength]}>{el.proofStrength}</Badge>
                          {hint.differsFromRating ? (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-slate-400" title={hint.reason}>
                              <Lightbulb size={10} /> hint: {hint.suggested}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-2.5 text-slate-600">
                          {el.status.replace("_", " ")}
                          {needsReview(el) ? <AlertTriangle size={11} className="ml-1 inline text-amber-500" /> : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {elements.length === 0 ? (
                <p className="py-6 text-center text-xs italic text-slate-400">No elements match the current filter.</p>
              ) : null}
            </div>

            <form
              className="mt-3 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (!newElementTitle.trim()) return;
                run(async () => {
                  await api(`/api/claims/${claim.id}/elements`, "POST", { title: newElementTitle });
                  setNewElementTitle("");
                });
              }}
            >
              <input
                className={inputClass}
                placeholder="Add an element…"
                value={newElementTitle}
                onChange={(e) => setNewElementTitle(e.target.value)}
              />
              <button className={btnSecondary} disabled={pending || !newElementTitle.trim()}>
                <Plus size={13} /> Add
              </button>
            </form>
          </Card>
        ) : null}
      </div>

      {openElement ? (
        <ElementDrawer
          key={openElement.id}
          element={openElement}
          documents={documents}
          contacts={contacts}
          chronology={chronology}
          pending={pending}
          run={run}
          onClose={() => setOpenElementId(null)}
        />
      ) : null}

      {showNewClaim ? (
        <NewClaimModal matterId={matterId} templates={templates} pending={pending} run={run} onClose={() => setShowNewClaim(false)} />
      ) : null}
    </div>
  );
}

function ElementDrawer({
  element,
  documents,
  contacts,
  chronology,
  pending,
  run,
  onClose,
}: {
  element: MatrixElement;
  documents: MatrixOption[];
  contacts: MatrixOption[];
  chronology: MatrixOption[];
  pending: boolean;
  run: (fn: () => Promise<unknown>) => void;
  onClose: () => void;
}) {
  const hint = computeElementHint(element);
  const [notes, setNotes] = useState(element.notes ?? "");
  const [authority, setAuthority] = useState(element.authorityCitation ?? "");
  const [showAddEvidence, setShowAddEvidence] = useState(false);
  const [witnessId, setWitnessId] = useState("");
  const [witnessType, setWitnessType] = useState<WitnessType>("fact");
  const patch = (body: object) => run(() => api(`/api/claim-elements/${element.id}`, "PATCH", body));

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-slate-900/20" onClick={onClose}>
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Element {element.position}</p>
            <h3 className="text-sm font-bold text-slate-900">{element.title}</h3>
            {element.description ? <p className="mt-1 text-xs text-slate-600">{element.description}</p> : null}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="text-[11px] font-medium text-slate-500">
            Proof strength (attorney)
            <select className={clsx(inputClass, "mt-1")} value={element.proofStrength} disabled={pending} onChange={(e) => patch({ proofStrength: e.target.value })}>
              {PROOF_STRENGTHS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="text-[11px] font-medium text-slate-500">
            Status
            <select className={clsx(inputClass, "mt-1")} value={element.status} disabled={pending} onChange={(e) => patch({ status: e.target.value })}>
              {ELEMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
          <Lightbulb size={12} className="text-amber-500" />
          <span>
            Hint: <Badge className={strengthStyles[hint.suggested]}>{hint.suggested}</Badge> — {hint.reason}
          </span>
          {hint.differsFromRating ? (
            <button className="ml-auto text-emerald-700 hover:underline" disabled={pending} onClick={() => patch({ proofStrength: hint.suggested })}>
              Apply
            </button>
          ) : null}
        </div>

        <div className="mt-4">
          <label className="text-[11px] font-medium text-slate-500">Authority for this element</label>
          <div className="mt-1 flex gap-2">
            <input className={inputClass} value={authority} onChange={(e) => setAuthority(e.target.value)} />
            <button
              className={clsx(
                "whitespace-nowrap rounded-lg px-2 text-[11px] font-semibold ring-1 ring-inset",
                element.citationStatus === "verified" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200",
              )}
              disabled={pending}
              onClick={() => patch({ citationStatus: element.citationStatus === "verified" ? "verify" : "verified" })}
              title="Toggle citation verification"
            >
              {element.citationStatus === "verified" ? "verified" : "verify"}
            </button>
          </div>
          <label className="mt-3 block text-[11px] font-medium text-slate-500">Attorney notes</label>
          <textarea className={clsx(inputClass, "mt-1 h-20")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          {notes !== (element.notes ?? "") || authority !== (element.authorityCitation ?? "") ? (
            <button className={clsx(btn, "mt-2")} disabled={pending} onClick={() => patch({ notes: notes || null, authorityCitation: authority || null })}>
              Save
            </button>
          ) : null}
        </div>

        {/* Evidence */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900">Evidence ({element.links.length})</h4>
            <button className={btnSecondary} onClick={() => setShowAddEvidence((v) => !v)}>
              <Plus size={13} /> Map evidence
            </button>
          </div>
          {showAddEvidence ? (
            <EvidenceForm
              documents={documents}
              contacts={contacts}
              chronology={chronology}
              pending={pending}
              onSubmit={(body) =>
                run(async () => {
                  await api(`/api/claim-elements/${element.id}/links`, "POST", body);
                  setShowAddEvidence(false);
                })
              }
            />
          ) : null}
          <div className="mt-3 space-y-2">
            {element.links.map((l) => {
              const page = firstPage(l.pageCite);
              return (
                <div
                  key={l.id}
                  className={clsx(
                    "rounded-lg border p-2.5 text-xs",
                    l.reviewState === "rejected" ? "border-slate-100 opacity-50" : l.reviewState === "proposed" ? "border-violet-200 bg-violet-50/40" : "border-slate-200",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge className={polarityStyles[l.polarity]}>{l.polarity}</Badge>
                    <Badge>{l.kind}</Badge>
                    {l.reviewState !== "accepted" ? <Badge className="bg-violet-50 text-violet-700 ring-violet-200">{l.reviewState}</Badge> : null}
                    {l.exhibitLabel ? <span className="font-semibold text-slate-700">{l.exhibitLabel}</span> : null}
                    {l.documentId ? (
                      <Link href={`/documents/${l.documentId}${page ? `?page=${page}` : ""}`} className="flex items-center gap-1 text-indigo-600 hover:underline">
                        <FileText size={11} /> {l.documentTitle ?? `Document #${l.documentId}`}
                        {l.pageCite ? ` at ${l.pageCite}` : ""}
                      </Link>
                    ) : null}
                    {l.chronologyTitle ? <span className="text-slate-600">Event: {l.chronologyTitle}</span> : null}
                    <span className="ml-auto flex gap-1">
                      {l.reviewState !== "accepted" ? (
                        <button title="Accept" disabled={pending} onClick={() => run(() => api(`/api/fact-links/${l.id}`, "PATCH", { reviewState: "accepted" }))} className="text-emerald-600">
                          <Check size={13} />
                        </button>
                      ) : null}
                      {l.reviewState !== "rejected" ? (
                        <button title="Reject" disabled={pending} onClick={() => run(() => api(`/api/fact-links/${l.id}`, "PATCH", { reviewState: "rejected" }))} className="text-slate-400 hover:text-rose-600">
                          <X size={13} />
                        </button>
                      ) : null}
                      <button
                        title="Delete"
                        disabled={pending}
                        onClick={() => confirm("Delete this evidence link?") && run(() => api(`/api/fact-links/${l.id}`, "DELETE"))}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 size={12} />
                      </button>
                    </span>
                  </div>
                  {l.quote ? (
                    <blockquote className="mt-2 flex gap-1.5 border-l-2 border-slate-300 pl-2 italic text-slate-700">
                      <Quote size={11} className="mt-0.5 shrink-0 text-slate-400" />
                      <span>
                        {l.quote}
                        {l.contactName ? <span className="not-italic text-slate-500"> — {l.contactName}</span> : null}
                      </span>
                    </blockquote>
                  ) : null}
                  {l.notes ? <p className="mt-1.5 text-slate-500">{l.notes}</p> : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* Witnesses */}
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold text-slate-900">Witnesses</h4>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {element.witnesses.map((w) => (
              <Badge key={w.id} className="bg-indigo-50 text-indigo-700 ring-indigo-200">
                <User size={10} /> {w.displayName} · {w.witnessType}
                <button
                  disabled={pending}
                  onClick={() => run(() => api(`/api/claim-elements/${element.id}/witnesses/${w.id}`, "DELETE"))}
                  className="ml-0.5 hover:text-rose-600"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))}
            {!element.witnesses.length ? <span className="text-xs italic text-slate-400">No witnesses tagged.</span> : null}
          </div>
          <div className="mt-2 flex gap-2">
            <select className={inputClass} value={witnessId} onChange={(e) => setWitnessId(e.target.value)}>
              <option value="">Choose a contact…</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            <select className={clsx(inputClass, "w-32")} value={witnessType} onChange={(e) => setWitnessType(e.target.value as WitnessType)}>
              {WITNESS_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <button
              className={btnSecondary}
              disabled={pending || !witnessId}
              onClick={() =>
                run(async () => {
                  await api(`/api/claim-elements/${element.id}/witnesses`, "POST", { contactId: Number(witnessId), witnessType });
                  setWitnessId("");
                })
              }
            >
              Tag
            </button>
          </div>
        </div>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <button
            className="text-[11px] text-rose-600 hover:underline"
            disabled={pending}
            onClick={() => {
              if (confirm(`Delete element "${element.title}"?`)) {
                run(() => api(`/api/claim-elements/${element.id}`, "DELETE"));
                onClose();
              }
            }}
          >
            Delete element
          </button>
        </div>
      </div>
    </div>
  );
}

export interface EvidencePayload {
  kind: EvidenceKind;
  polarity: Polarity;
  documentId?: number | null;
  chronologyEventId?: number | null;
  contactId?: number | null;
  pageCite?: string | null;
  quote?: string | null;
  exhibitLabel?: string | null;
  notes?: string | null;
}

export function EvidenceForm({
  documents,
  contacts,
  chronology,
  pending,
  onSubmit,
  initial,
  lockDocumentId,
}: {
  documents: MatrixOption[];
  contacts: MatrixOption[];
  chronology: MatrixOption[];
  pending: boolean;
  onSubmit: (body: EvidencePayload) => void;
  initial?: Partial<EvidencePayload>;
  lockDocumentId?: number;
}) {
  const [kind, setKind] = useState<EvidenceKind>(initial?.kind ?? "document");
  const [polarity, setPolarity] = useState<Polarity>(initial?.polarity ?? "supporting");
  const [documentId, setDocumentId] = useState<string>(String(lockDocumentId ?? initial?.documentId ?? ""));
  const [eventId, setEventId] = useState("");
  const [contactId, setContactId] = useState("");
  const [pageCite, setPageCite] = useState(initial?.pageCite ?? "");
  const [quote, setQuote] = useState(initial?.quote ?? "");
  const [exhibitLabel, setExhibitLabel] = useState("");
  const [notes, setNotes] = useState("");

  const needsDoc = kind === "document" || kind === "testimony";
  const valid = kind === "note" ? notes.trim() : kind === "chronology" ? eventId : documentId;

  return (
    <form
      className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({
          kind,
          polarity,
          documentId: needsDoc ? Number(documentId) : null,
          chronologyEventId: kind === "chronology" ? Number(eventId) : null,
          contactId: contactId ? Number(contactId) : null,
          pageCite: pageCite || null,
          quote: quote || null,
          exhibitLabel: exhibitLabel || null,
          notes: notes || null,
        });
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as EvidenceKind)}>
          <option value="document">Document / exhibit</option>
          <option value="testimony">Testimony (transcript)</option>
          <option value="chronology">Chronology event</option>
          <option value="note">Attorney note</option>
        </select>
        <select className={inputClass} value={polarity} onChange={(e) => setPolarity(e.target.value as Polarity)}>
          <option value="supporting">Supporting</option>
          <option value="adverse">Adverse</option>
          <option value="context">Context</option>
        </select>
      </div>
      {needsDoc && !lockDocumentId ? (
        <select className={inputClass} value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
          <option value="">Choose a matter document…</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      ) : null}
      {kind === "chronology" ? (
        <select className={inputClass} value={eventId} onChange={(e) => setEventId(e.target.value)}>
          <option value="">Choose a chronology event…</option>
          {chronology.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      ) : null}
      {kind !== "note" ? (
        <div className="grid grid-cols-2 gap-2">
          <input className={inputClass} placeholder="Page / line cite (e.g. 12:4-18)" value={pageCite} onChange={(e) => setPageCite(e.target.value)} />
          <input className={inputClass} placeholder="Exhibit / Bates label" value={exhibitLabel} onChange={(e) => setExhibitLabel(e.target.value)} />
        </div>
      ) : null}
      {kind !== "note" ? <textarea className={clsx(inputClass, "h-16")} placeholder="Verbatim quote" value={quote} onChange={(e) => setQuote(e.target.value)} /> : null}
      {kind === "testimony" ? (
        <select className={inputClass} value={contactId} onChange={(e) => setContactId(e.target.value)}>
          <option value="">Speaker (optional)…</option>
          {contacts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      ) : null}
      <textarea className={clsx(inputClass, "h-12")} placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      <button className={btn} disabled={pending || !valid}>
        Map evidence
      </button>
    </form>
  );
}

function NewClaimModal({
  matterId,
  templates,
  pending,
  run,
  onClose,
}: {
  matterId: number;
  templates: TemplateOption[];
  pending: boolean;
  run: (fn: () => Promise<unknown>) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"template" | "blank">("template");
  const [slug, setSlug] = useState(templates[0]?.slug ?? "");
  const [title, setTitle] = useState("");
  const [statute, setStatute] = useState("");
  const submit = () =>
    run(async () => {
      await api(`/api/matters/${matterId}/claims`, "POST", mode === "template" ? { templateSlug: slug } : { title, statute: statute || null });
      onClose();
    });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30" onClick={onClose}>
      <div className="w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
      <Card className="p-5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">New claim</h3>
          <div className="mt-3 flex gap-2">
            {(["template", "blank"] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} className={clsx(m === mode ? btn : btnSecondary)}>
                {m === "template" ? "From template" : "Blank"}
              </button>
            ))}
          </div>
          {mode === "template" ? (
            <div className="mt-3 max-h-80 space-y-1 overflow-y-auto">
              {templates.map((t) => (
                <label
                  key={t.slug}
                  className={clsx(
                    "flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs",
                    slug === t.slug ? "border-emerald-300 bg-emerald-50" : "border-slate-200 hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <input type="radio" checked={slug === t.slug} onChange={() => setSlug(t.slug)} />
                    <span className="font-medium text-slate-800">{t.title}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">{t.elementCount} elements</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              <input className={inputClass} placeholder="Claim title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className={inputClass} placeholder="Statute (optional)" value={statute} onChange={(e) => setStatute(e.target.value)} />
            </div>
          )}
          <div className="mt-4 flex justify-end gap-2">
            <button className={btnSecondary} onClick={onClose}>
              Cancel
            </button>
            <button className={btn} disabled={pending || (mode === "template" ? !slug : !title.trim())} onClick={submit}>
              Create
            </button>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
}

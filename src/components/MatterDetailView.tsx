"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Scale,
  Users,
  Clock,
  CalendarClock,
  FileText,
  EyeOff,
  ChevronLeft,
  Building2,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  Search,
  Filter,
} from "lucide-react";
import { Badge, Card, EmptyState, SectionHeading, StatCard, Avatar } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  documentStatusStyles,
  polarityStyles,
  deadlineStatusStyles,
  taskStatusStyles,
} from "@/lib/constants";
import { MatterDetailActions } from "@/components/actions/MatterActions";

export interface MatterDetailData {
  matter: {
    id: number;
    name: string;
    caseNumber: string | null;
    court: string | null;
    status: string;
    description: string | null;
  };
  roles: Array<{
    id: number;
    contactId: number;
    capacity: string;
    roleLabel: string;
    side: string | null;
    contact?: {
      id: number;
      displayName: string;
      primaryEmail?: string | null;
      avatarColor?: string | null;
    };
  }>;
  claims: Array<{
    id: number;
    title: string;
    statute: string | null;
    description: string | null;
    elements: Array<{
      id: number;
      title: string;
      description: string | null;
      links: Array<{
        id: number;
        polarity: "supporting" | "adverse" | "context";
        notes?: string | null;
        document?: {
          id: number;
          title: string;
        } | null;
      }>;
    }>;
  }>;
  events: Array<{
    id: number;
    eventDate: string | null;
    precision: string;
    title: string;
    description: string | null;
    pageCite: string | null;
    document?: {
      id: number;
      title: string;
    } | null;
  }>;
  deadlines: Array<{
    id: number;
    title: string;
    dueDate: string;
    type: string;
    status: "upcoming" | "completed" | "missed";
    notes: string | null;
  }>;
  tasks: Array<{
    id: number;
    title: string;
    status: "open" | "in_progress" | "done";
    dueDate: string | null;
  }>;
  docs: Array<{
    id: number;
    title: string;
    status: string;
    sourceType: string;
    filedDate: string | null;
  }>;
}

export function MatterDetailView({ data }: { data: MatterDetailData }) {
  const { matter, roles, claims, events, deadlines, tasks, docs } = data;
  const [activeTab, setActiveTab] = useState<
    "overview" | "claims" | "parties" | "chronology" | "deadlines" | "evidence"
  >("overview");
  const [searchFilter, setSearchFilter] = useState("");

  const isHidden = matter.status === "hidden";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/matters"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <ChevronLeft size={14} /> Back to Matters Directory
        </Link>
      </div>

      {/* Main Matter Header */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                <Building2 size={13} className="text-slate-500" />
                {matter.court || "Jurisdiction Unspecified"}
              </span>
              {matter.caseNumber ? (
                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Scale size={13} />
                  Case #{matter.caseNumber}
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {matter.name}
            </h1>

            {matter.description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-600">
                {matter.description}
              </p>
            ) : (
              <p className="text-xs italic text-slate-400">
                No description recorded for this matter.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-shrink-0 items-center">
            <MatterDetailActions matter={matter} />
          </div>
        </div>

        {/* Hidden Alert Banner */}
        {isHidden ? (
          <div className="mt-4 flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800">
            <EyeOff size={16} className="text-amber-600 flex-shrink-0" />
            <span className="font-medium">
              This matter is currently hidden. It will not appear in the default Active Matters list.
            </span>
          </div>
        ) : null}

        {/* Matter Core Stat Grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-100 pt-5 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Claims Matrix</span>
              <Scale size={14} className="text-emerald-600" />
            </div>
            <p className="mt-1 text-xl font-bold text-slate-800">{claims.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Parties Mapped</span>
              <Users size={14} className="text-violet-600" />
            </div>
            <p className="mt-1 text-xl font-bold text-slate-800">{roles.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Chronology Events</span>
              <Clock size={14} className="text-sky-600" />
            </div>
            <p className="mt-1 text-xl font-bold text-slate-800">{events.length}</p>
          </div>
          <div className="rounded-xl bg-slate-50/80 p-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Vault Evidence</span>
              <FileText size={14} className="text-amber-600" />
            </div>
            <p className="mt-1 text-xl font-bold text-slate-800">{docs.length}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 pb-px scrollbar-none">
        {[
          { id: "overview", label: "Overview", icon: Layers, count: null },
          { id: "claims", label: "Claims Matrix", icon: Scale, count: claims.length },
          { id: "parties", label: "Parties & Roles", icon: Users, count: roles.length },
          { id: "chronology", label: "Chronology Timeline", icon: Clock, count: events.length },
          { id: "deadlines", label: "Deadlines & Tasks", icon: CalendarClock, count: deadlines.length + tasks.length },
          { id: "evidence", label: "Evidence & Filings", icon: FileText, count: docs.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold transition ${
                isActive
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icon size={14} className={isActive ? "text-emerald-600" : "text-slate-400"} />
              <span>{tab.label}</span>
              {tab.count !== null ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === "overview" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Parties Section */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Users size={16} className="text-violet-600" /> Parties & Capacities
              </h2>
              <button
                onClick={() => setActiveTab("parties")}
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                View all ({roles.length})
              </button>
            </div>
            {roles.length === 0 ? (
              <EmptyState message="No parties recorded for this matter." />
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {roles.slice(0, 4).map((r) => (
                  <Link
                    key={r.id}
                    href={`/converge/${r.contact?.id}`}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-violet-200 hover:bg-violet-50/20"
                  >
                    <Avatar name={r.contact?.displayName ?? "?"} color={r.contact?.avatarColor ?? "#6366f1"} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-slate-800">{r.contact?.displayName}</p>
                      <p className="truncate text-[11px] text-slate-400">{r.capacity}</p>
                      <Badge className="mt-1 bg-slate-100 text-[10px] text-slate-600">{r.roleLabel}</Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Deadlines Section */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <CalendarClock size={16} className="text-amber-600" /> Upcoming Deadlines
              </h2>
              <button
                onClick={() => setActiveTab("deadlines")}
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                View all ({deadlines.length})
              </button>
            </div>
            {deadlines.length === 0 ? (
              <EmptyState message="No court deadlines recorded." />
            ) : (
              <div className="space-y-2">
                {deadlines.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{d.title}</p>
                      <p className="text-[11px] text-slate-400">{formatDate(d.dueDate)} · {d.type.replace("_", " ")}</p>
                    </div>
                    <Badge className={deadlineStatusStyles[d.status]}>{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Claims Overview */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Scale size={16} className="text-emerald-600" /> Claims Matrix
              </h2>
              <button
                onClick={() => setActiveTab("claims")}
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                View full matrix ({claims.length})
              </button>
            </div>
            {claims.length === 0 ? (
              <EmptyState message="No claims mapped for this matter yet." />
            ) : (
              <div className="space-y-3">
                {claims.slice(0, 3).map((claim) => (
                  <div key={claim.id} className="rounded-xl border border-slate-100 p-3.5">
                    <p className="text-xs font-semibold text-slate-800">{claim.title}</p>
                    {claim.statute ? (
                      <p className="mt-0.5 text-[11px] font-medium text-emerald-600">{claim.statute}</p>
                    ) : null}
                    <p className="mt-1 line-clamp-2 text-xs text-slate-500">{claim.description}</p>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      {claim.elements.length} Claim Elements
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Chronology */}
          <Card className="p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Clock size={16} className="text-sky-600" /> Chronology Highlights
              </h2>
              <button
                onClick={() => setActiveTab("chronology")}
                className="text-xs font-medium text-emerald-600 hover:underline"
              >
                View timeline ({events.length})
              </button>
            </div>
            {events.length === 0 ? (
              <EmptyState message="No chronology events mapped yet." />
            ) : (
              <div className="space-y-3">
                {events.slice(0, 4).map((e) => (
                  <div key={e.id} className="flex gap-3 text-xs">
                    <span className="font-semibold text-slate-500 whitespace-nowrap">
                      {formatDate(e.eventDate)}
                    </span>
                    <div>
                      <p className="font-medium text-slate-800">{e.title}</p>
                      <p className="text-slate-400 line-clamp-1">{e.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* TAB CONTENT: CLAIMS MATRIX */}
      {activeTab === "claims" ? (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <EmptyState message="No claims mapped for this matter yet." />
          ) : (
            claims.map((claim) => (
              <Card key={claim.id} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{claim.title}</h3>
                    {claim.statute ? (
                      <p className="mt-0.5 text-xs font-semibold text-emerald-700">{claim.statute}</p>
                    ) : null}
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 ring-emerald-200">
                    {claim.elements.length} elements
                  </Badge>
                </div>

                {claim.description ? (
                  <p className="mt-3 text-xs leading-relaxed text-slate-600">{claim.description}</p>
                ) : null}

                <div className="mt-4 space-y-3">
                  {claim.elements.map((el) => (
                    <div key={el.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                      <p className="text-xs font-semibold text-slate-800">{el.title}</p>
                      {el.description ? (
                        <p className="mt-1 text-xs text-slate-500">{el.description}</p>
                      ) : null}

                      {el.links.length > 0 ? (
                        <div className="mt-3 space-y-1.5 border-t border-slate-200/60 pt-2.5">
                          {el.links.map((link) => (
                            <div key={link.id} className="flex items-center justify-between text-xs">
                              <span className="flex items-center gap-2">
                                <Badge className={polarityStyles[link.polarity]}>{link.polarity}</Badge>
                                {link.document ? (
                                  <Link
                                    href={`/documents/${link.document.id}`}
                                    className="text-indigo-600 hover:underline"
                                  >
                                    {link.document.title}
                                  </Link>
                                ) : (
                                  <span className="text-slate-400">Document link</span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] italic text-slate-400">No evidentiary fact links attached.</p>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      ) : null}

      {/* TAB CONTENT: PARTIES & ROLES */}
      {activeTab === "parties" ? (
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Litigation Parties & Capacities</h2>
            <p className="text-xs text-slate-500">Every individual, organization, and counsel role assigned in this matter.</p>
          </div>

          {roles.length === 0 ? (
            <EmptyState message="No parties recorded for this matter." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {roles.map((r) => (
                <Link
                  key={r.id}
                  href={`/converge/${r.contact?.id}`}
                  className="flex items-start gap-3.5 rounded-2xl border border-slate-200/80 p-4 transition hover:border-violet-300 hover:bg-violet-50/20 hover:shadow-xs"
                >
                  <Avatar name={r.contact?.displayName ?? "?"} color={r.contact?.avatarColor ?? "#6366f1"} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{r.contact?.displayName}</p>
                    <p className="text-xs font-medium text-slate-500">{r.capacity}</p>
                    {r.side ? (
                      <p className="mt-1 text-[11px] text-slate-400">Side: {r.side}</p>
                    ) : null}
                    <Badge className="mt-2.5 bg-slate-100 text-slate-600 ring-slate-200">{r.roleLabel}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* TAB CONTENT: CHRONOLOGY TIMELINE */}
      {activeTab === "chronology" ? (
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-900">Chronological Event Stream</h2>
            <p className="text-xs text-slate-500">Temporal facts with cited evidence and precision levels.</p>
          </div>

          {events.length === 0 ? (
            <EmptyState message="No chronology events mapped yet." />
          ) : (
            <div className="relative border-l-2 border-slate-100 pl-6 ml-3 space-y-6">
              {events.map((e) => (
                <div key={e.id} className="relative group">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-2xs" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">{formatDate(e.eventDate)}</span>
                      <Badge className="bg-slate-100 text-[10px] text-slate-500 ring-slate-200">{e.precision}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{e.title}</p>
                    {e.description ? (
                      <p className="mt-1 text-xs leading-relaxed text-slate-600">{e.description}</p>
                    ) : null}
                    {e.document ? (
                      <Link
                        href={`/documents/${e.document.id}`}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:underline"
                      >
                        <FileText size={12} />
                        <span>{e.document.title} {e.pageCite ? `(p. ${e.pageCite})` : ""}</span>
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* TAB CONTENT: DEADLINES & TASKS */}
      {activeTab === "deadlines" ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Deadlines */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <CalendarClock size={16} className="text-amber-600" /> Court Deadlines
            </h2>
            {deadlines.length === 0 ? (
              <EmptyState message="No court deadlines recorded." />
            ) : (
              <div className="space-y-2.5">
                {deadlines.map((d) => (
                  <div key={d.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{d.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Due: {formatDate(d.dueDate)} · {d.type.replace("_", " ")}</p>
                      {d.notes ? <p className="mt-1 text-[11px] text-slate-500">{d.notes}</p> : null}
                    </div>
                    <Badge className={deadlineStatusStyles[d.status]}>{d.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Tasks */}
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-900">
              <CheckCircle2 size={16} className="text-emerald-600" /> Matter Action Items & Tasks
            </h2>
            {tasks.length === 0 ? (
              <EmptyState message="No tasks assigned." />
            ) : (
              <div className="space-y-2.5">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs">
                    <div>
                      <p className="font-semibold text-slate-800">{t.title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {t.dueDate ? `Due: ${formatDate(t.dueDate)}` : "No due date set"}
                      </p>
                    </div>
                    <Badge className={taskStatusStyles[t.status]}>{t.status.replace("_", " ")}</Badge>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      ) : null}

      {/* TAB CONTENT: EVIDENCE & FILINGS */}
      {activeTab === "evidence" ? (
        <Card className="p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Vault Evidence & Docket Filings</h2>
            <p className="text-xs text-slate-500">Verified court documents, uploads, and exhibits associated with this matter.</p>
          </div>

          {docs.length === 0 ? (
            <EmptyState message="No evidentiary documents attached to this matter yet." />
          ) : (
            <div className="divide-y divide-slate-100">
              {docs.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/documents/${doc.id}`}
                  className="flex items-center justify-between gap-3 py-3 transition hover:bg-slate-50/80 px-2 rounded-lg"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900 hover:text-emerald-600">
                      {doc.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {doc.sourceType.replace("_", " ")} · {formatDate(doc.filedDate)}
                    </p>
                  </div>
                  <Badge className={documentStatusStyles[doc.status]}>
                    {doc.status.replace("_", " ")}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>
      ) : null}
    </div>
  );
}

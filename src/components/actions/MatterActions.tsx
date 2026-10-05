"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  X,
  AlertTriangle,
  Scale,
  FileText,
  Clock,
  Users,
  Search,
} from "lucide-react";
import { Badge, Card, EmptyState } from "@/components/ui";
import { matterStatusStyles } from "@/lib/constants";

interface MatterSummary {
  id: number;
  name: string;
  caseNumber: string | null;
  court: string | null;
  status: string;
  description: string | null;
  docsCount: number;
  claimsCount: number;
  rolesCount: number;
  eventsCount: number;
}

// --------------------------------------------------------
// 1. NEW MATTER MODAL & BUTTON
// --------------------------------------------------------

export function NewMatterButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-500 active:bg-emerald-700"
      >
        <Plus size={15} />
        <span>New Matter</span>
      </button>

      {isOpen ? (
        <NewMatterModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
      ) : null}
    </>
  );
}

export function NewMatterModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [court, setCourt] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("active");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Matter name is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          caseNumber: caseNumber.trim() || null,
          court: court.trim() || null,
          description: description.trim() || null,
          status,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to create matter.");
      }

      const created = (await res.json()) as { matter: { id: number } };
      onClose();
      router.refresh();
      if (created?.matter?.id) {
        router.push(`/matters/${created.matter.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create matter");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-emerald-600" />
            <h3 className="text-base font-semibold text-slate-900">Create New Matter</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error ? (
            <div className="rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          ) : null}

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Matter Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. The City of New York v. 512 West 42nd Street Owner LLC"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Case / Index Number
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
                placeholder="e.g. 450551/2025 or 1:26-cv-44227"
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="closed">Closed</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Court / Jurisdiction
            </label>
            <input
              type="text"
              value={court}
              onChange={(e) => setCourt(e.target.value)}
              placeholder="e.g. Supreme Court of the State of New York, County of New York"
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of the litigation, primary claims, parties, or core objectives..."
              className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
              <span>{loading ? "Creating…" : "Create Matter"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// --------------------------------------------------------
// 2. DELETE MATTER MODAL
// --------------------------------------------------------

export function DeleteMatterModal({
  isOpen,
  onClose,
  matterId,
  matterName,
  onDeleted,
}: {
  isOpen: boolean;
  onClose: () => void;
  matterId: number;
  matterName: string;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  async function handleDelete() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/matters/${matterId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to delete matter.");
      }

      onClose();
      if (onDeleted) {
        onDeleted();
      } else {
        router.refresh();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete matter");
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
            <AlertTriangle size={20} />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900">Delete Matter</h3>
            <p className="mt-1 text-xs text-slate-500">
              Are you sure you want to permanently delete{" "}
              <strong className="text-slate-800">“{matterName}”</strong>?
            </p>
          </div>
        </div>

        <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50/60 p-3 text-xs text-rose-800">
          <p className="font-semibold">This action cannot be undone.</p>
          <p className="mt-1 text-[11px] text-rose-700">
            All associated claims, chronology events, deadlines, and tasks linked to this matter
            will be removed. Linked documents and court dockets will remain in the vault and be unlinked.
          </p>
        </div>

        {error ? (
          <p className="mt-2 text-xs font-medium text-rose-600">{error}</p>
        ) : null}

        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 active:bg-rose-700 disabled:opacity-50"
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
            <span>{loading ? "Deleting…" : "Delete Matter"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------------
// 3. MATTER CARD ACTIONS (HIDE / DELETE)
// --------------------------------------------------------

export function MatterCardActions({
  matter,
}: {
  matter: { id: number; name: string; status: string };
}) {
  const router = useRouter();
  const [hideLoading, setHideLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isHidden = matter.status === "hidden";

  async function handleToggleHide(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setHideLoading(true);

    try {
      const nextStatus = isHidden ? "active" : "hidden";
      const res = await fetch(`/api/matters/${matter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      // ignore
    } finally {
      setHideLoading(false);
    }
  }

  function handleOpenDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDeleteOpen(true);
  }

  return (
    <>
      <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={handleToggleHide}
          disabled={hideLoading}
          title={isHidden ? "Unhide matter" : "Hide matter"}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
            isHidden
              ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-800"
          }`}
        >
          {hideLoading ? (
            <Loader2 size={12} className="animate-spin text-slate-500" />
          ) : isHidden ? (
            <Eye size={12} className="text-amber-700" />
          ) : (
            <EyeOff size={12} className="text-slate-500" />
          )}
          <span>{isHidden ? "Unhide" : "Hide"}</span>
        </button>

        <button
          type="button"
          onClick={handleOpenDelete}
          title="Delete matter"
          className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={12} />
          <span>Delete</span>
        </button>
      </div>

      {isDeleteOpen ? (
        <DeleteMatterModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          matterId={matter.id}
          matterName={matter.name}
        />
      ) : null}
    </>
  );
}

// --------------------------------------------------------
// 4. MATTER DETAIL PAGE ACTIONS (HIDE / DELETE)
// --------------------------------------------------------

export function MatterDetailActions({
  matter,
}: {
  matter: { id: number; name: string; status: string };
}) {
  const router = useRouter();
  const [hideLoading, setHideLoading] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const isHidden = matter.status === "hidden";

  async function handleToggleHide() {
    setHideLoading(true);

    try {
      const nextStatus = isHidden ? "active" : "hidden";
      const res = await fetch(`/api/matters/${matter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      // ignore
    } finally {
      setHideLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge
        className={
          matterStatusStyles[matter.status] ??
          "bg-emerald-50 text-emerald-700 ring-emerald-200"
        }
      >
        {matter.status}
      </Badge>

      <button
        type="button"
        onClick={handleToggleHide}
        disabled={hideLoading}
        title={isHidden ? "Unhide matter" : "Hide matter"}
        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium shadow-2xs transition ${
          isHidden
            ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {hideLoading ? (
          <Loader2 size={13} className="animate-spin text-slate-500" />
        ) : isHidden ? (
          <Eye size={13} className="text-amber-700" />
        ) : (
          <EyeOff size={13} className="text-slate-500" />
        )}
        <span>{isHidden ? "Unhide Matter" : "Hide Matter"}</span>
      </button>

      <button
        type="button"
        onClick={() => setIsDeleteOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-2xs transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
      >
        <Trash2 size={13} />
        <span>Delete Matter</span>
      </button>

      {isDeleteOpen ? (
        <DeleteMatterModal
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          matterId={matter.id}
          matterName={matter.name}
          onDeleted={() => {
            router.push("/matters");
            router.refresh();
          }}
        />
      ) : null}
    </div>
  );
}

// --------------------------------------------------------
// 5. MATTERS LIST (WITH FILTER TABS, SEARCH, AND ACTION BUTTONS)
// --------------------------------------------------------

export function MattersList({ matters }: { matters: MatterSummary[] }) {
  const [filter, setFilter] = useState<"active" | "hidden" | "all">("active");
  const [searchQuery, setSearchQuery] = useState("");

  const activeCount = matters.filter((m) => m.status !== "hidden").length;
  const hiddenCount = matters.filter((m) => m.status === "hidden").length;
  const totalCount = matters.length;

  const filteredMatters = matters.filter((m) => {
    // 1. Status filter
    if (filter === "active" && m.status === "hidden") return false;
    if (filter === "hidden" && m.status !== "hidden") return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = m.name.toLowerCase().includes(q);
      const matchCase = m.caseNumber?.toLowerCase().includes(q);
      const matchCourt = m.court?.toLowerCase().includes(q);
      const matchDesc = m.description?.toLowerCase().includes(q);
      return matchName || matchCase || matchCourt || matchDesc;
    }

    return true;
  });

  return (
    <div className="space-y-5">
      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs">
          <button
            type="button"
            onClick={() => setFilter("active")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "active"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setFilter("hidden")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "hidden"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <EyeOff size={13} />
            <span>Hidden ({hiddenCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              filter === "all"
                ? "bg-slate-900 text-white shadow-2xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            All ({totalCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search matters by name, court, or case #"
            className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-xs text-slate-800 shadow-2xs placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={13} />
            </button>
          ) : null}
        </div>
      </div>

      {/* Matters Grid */}
      {filteredMatters.length === 0 ? (
        <EmptyState
          message={
            searchQuery
              ? `No matters found matching "${searchQuery}".`
              : filter === "hidden"
                ? "No hidden matters. You can hide any active matter using the Hide button on its card."
                : filter === "active"
                  ? "No active matters. Use the 'New Matter' button above to create one, or view hidden matters."
                  : "No matters found."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filteredMatters.map((matter) => {
            const isHidden = matter.status === "hidden";

            return (
              <Card
                key={matter.id}
                className={`group relative flex h-full flex-col justify-between p-6 transition hover:shadow-md ${
                  isHidden
                    ? "border-dashed border-amber-200 bg-amber-50/20 hover:border-amber-300"
                    : "hover:border-emerald-200"
                }`}
              >
                <div>
                  {/* Card Header: Case info + Actions */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      href={`/matters/${matter.id}`}
                      className="flex-1 transition group-hover:text-emerald-700"
                    >
                      <div className="flex items-center gap-2">
                        <Scale
                          size={16}
                          className={isHidden ? "text-amber-600" : "text-emerald-600"}
                        />
                        <p className="text-sm font-semibold text-slate-800">
                          {matter.caseNumber || "No case #"}
                        </p>
                      </div>
                      <h2 className="mt-1 text-lg font-semibold text-slate-900 group-hover:text-emerald-700">
                        {matter.name}
                      </h2>
                      <p className="text-xs text-slate-400">{matter.court || "No court specified"}</p>
                    </Link>

                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        className={
                          matterStatusStyles[matter.status] ??
                          "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        }
                      >
                        {matter.status}
                      </Badge>
                      <MatterCardActions matter={matter} />
                    </div>
                  </div>

                  <Link href={`/matters/${matter.id}`} className="block">
                    <p className="mt-3 line-clamp-2 text-sm text-slate-500">
                      {matter.description || "No description provided."}
                    </p>
                  </Link>
                </div>

                {/* Card Footer: Metric pills */}
                <Link href={`/matters/${matter.id}`} className="mt-5 block">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs text-slate-500">
                    <div className="rounded-lg bg-slate-50 py-2 transition group-hover:bg-slate-100/70">
                      <FileText size={14} className="mx-auto mb-1 text-slate-400" />
                      {matter.docsCount} docs
                    </div>
                    <div className="rounded-lg bg-slate-50 py-2 transition group-hover:bg-slate-100/70">
                      <Scale size={14} className="mx-auto mb-1 text-slate-400" />
                      {matter.claimsCount} claims
                    </div>
                    <div className="rounded-lg bg-slate-50 py-2 transition group-hover:bg-slate-100/70">
                      <Users size={14} className="mx-auto mb-1 text-slate-400" />
                      {matter.rolesCount} parties
                    </div>
                    <div className="rounded-lg bg-slate-50 py-2 transition group-hover:bg-slate-100/70">
                      <Clock size={14} className="mx-auto mb-1 text-slate-400" />
                      {matter.eventsCount} events
                    </div>
                  </div>
                </Link>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

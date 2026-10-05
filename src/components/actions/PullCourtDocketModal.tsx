"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, RefreshCw, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface PullCourtDocketModalProps {
  onClose: () => void;
  isOpen: boolean;
  dockets: Array<{ id: number; indexNumber: string; court: string; caption: string }>;
}

export function PullCourtDocketButton({
  dockets,
}: {
  dockets: Array<{ id: number; indexNumber: string; court: string; caption: string }>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-500 active:bg-sky-700"
      >
        <Download size={14} className="text-white" />
        <span>Pull Court Docket</span>
      </button>

      {isOpen ? (
        <PullCourtDocketModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          dockets={dockets}
        />
      ) : null}
    </>
  );
}

export function UpdateDocketButton({
  docketId,
  indexNumber,
}: {
  docketId: number;
  indexNumber: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleUpdate() {
    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/bridges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "nyscef_refresh",
          docketId,
          requestId: crypto.randomUUID(),
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error || "Failed to queue docket refresh.");
      }

      setStatus("success");
      setMessage("Update queued");
      router.refresh();
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 3500);
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Update failed");
      setTimeout(() => {
        setStatus("idle");
        setMessage("");
      }, 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        onClick={handleUpdate}
        disabled={loading}
        title={`Queue real court update for docket ${indexNumber}`}
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 active:bg-slate-100 disabled:opacity-50"
      >
        <RefreshCw size={11} className={loading ? "animate-spin text-sky-600" : "text-slate-500"} />
        <span>{loading ? "Updating…" : "Update"}</span>
      </button>
      {message ? (
        <span
          className={`text-[11px] font-medium ${
            status === "success" ? "text-emerald-600" : "text-amber-600"
          }`}
        >
          {message}
        </span>
      ) : null}
    </div>
  );
}

function PullCourtDocketModal({
  isOpen,
  onClose,
  dockets,
}: PullCourtDocketModalProps) {
  const router = useRouter();
  const [selectedDocketId, setSelectedDocketId] = useState<string>(
    dockets[0]?.id ? String(dockets[0].id) : "",
  );
  const [customCourt, setCustomCourt] = useState<"nyscef" | "pacer">("nyscef");
  const [indexNumber, setIndexNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );

  if (!isOpen) return null;

  async function handleQueueExisting(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDocketId) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/bridges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "nyscef_refresh",
          docketId: Number(selectedDocketId),
          requestId: crypto.randomUUID(),
        }),
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        throw new Error(data.error || "Unable to queue court update.");
      }

      setResult({
        type: "success",
        text: data.message || "Court update job enqueued successfully.",
      });
      router.refresh();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: unknown) {
      setResult({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to queue docket pull.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-sky-50 p-2 text-sky-600">
              <Download size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pull Court Docket</h3>
              <p className="text-xs text-slate-500">
                Trigger synchronized court retrieval from live source feeds
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleQueueExisting} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700">
              Select Tracked Docket to Pull / Refresh
            </label>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Re-scrapes court records, synchronizes latest filings, and downloads new verified PDF evidence into Cloudflare R2.
            </p>
            <select
              value={selectedDocketId}
              onChange={(e) => setSelectedDocketId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              {dockets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.indexNumber} — {d.court} ({d.caption.slice(0, 45)}…)
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Direct Ingestion Pipeline:</p>
            <ul className="mt-1.5 list-inside list-disc space-y-1 text-[11px] text-slate-500">
              <li>
                <strong>NYSCEF Browser Bridge:</strong> Puppeteer / Cloudflare Browser scrapes document tables &amp; streams verified PDFs directly into Cloudflare R2.
              </li>
              <li>
                <strong>PACER / ECF Bridge:</strong> Uses authenticated ECF tokens to pull dockets &amp; parse federal filings without manual exports.
              </li>
            </ul>
          </div>

          {result ? (
            <div
              className={`flex items-start gap-2 rounded-lg p-3 text-xs ${
                result.type === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-rose-50 text-rose-800"
              }`}
            >
              {result.type === "success" ? (
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
              )}
              <span className="leading-relaxed">{result.text}</span>
            </div>
          ) : null}

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
              disabled={loading || !selectedDocketId}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>{loading ? "Queueing Pull…" : "Pull Court Docket Now"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

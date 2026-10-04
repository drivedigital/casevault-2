"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

const STATUS_OPTIONS = ["pending_review", "processing", "indexed", "verified", "flagged"];

export function DocumentStatusSelect({
  documentId,
  currentStatus,
}: {
  documentId: number;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleChange(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={currentStatus}
      disabled={loading}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
    >
      {STATUS_OPTIONS.map((s) => (
        <option key={s} value={s}>
          {s.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}

export function AnalyzeButton({ documentId, hasAnalysis }: { documentId: number; hasAnalysis: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  async function handleClick() {
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/analyze`, { method: "POST" });
      if (!response.ok) throw new Error();
      setMessage("Extraction request queued. Processing service pending.");
      router.refresh();
    } catch {
      setMessage("Could not queue extraction. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="text-right"><button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition hover:opacity-90 disabled:opacity-60"
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
      {loading ? "Queuing…" : hasAnalysis ? "Queue re-extraction" : "Queue extraction"}
    </button>{message ? <p role="status" className="mt-2 max-w-xs text-xs text-slate-500">{message}</p> : null}</div>
  );
}

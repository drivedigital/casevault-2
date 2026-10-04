"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";

export function ProposalActionButtons({ proposalId }: { proposalId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  async function act(action: "accept" | "reject") {
    setLoading(action);
    try {
      await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => act("accept")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {loading === "accept" ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
        Accept
      </button>
      <button
        onClick={() => act("reject")}
        disabled={loading !== null}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
      >
        {loading === "reject" ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
        Dismiss
      </button>
    </div>
  );
}

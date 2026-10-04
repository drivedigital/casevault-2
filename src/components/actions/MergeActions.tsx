"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { GitMerge, Loader2, Check } from "lucide-react";

export function MergeContactButton({
  duplicateId,
  canonicalId,
  label = "Merge into canonical",
}: {
  duplicateId: number;
  canonicalId: number;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleMerge() {
    setLoading(true);
    try {
      await fetch(`/api/contacts/${duplicateId}/merge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ canonicalContactId: canonicalId }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleMerge}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <GitMerge size={12} />}
      {label}
    </button>
  );
}

export function ResolveAliasButton({ aliasId }: { aliasId: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleResolve() {
    setLoading(true);
    try {
      await fetch(`/api/aliases/${aliasId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolved: true }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleResolve}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
      Keep separate
    </button>
  );
}

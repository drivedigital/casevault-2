"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import clsx from "clsx";
import { Loader2, Webhook, FileUp, RefreshCcw, HardDriveUpload } from "lucide-react";

const ICONS = {
  webhook: Webhook,
  fileUp: FileUp,
  refresh: RefreshCcw,
  drive: HardDriveUpload,
} as const;

export type IngestIconName = keyof typeof ICONS;

export function IngestButton({
  endpoint,
  label,
  icon,
  variant = "primary",
}: {
  endpoint: string;
  label: string;
  icon?: IngestIconName;
  variant?: "primary" | "secondary";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const Icon = icon ? ICONS[icon] : null;

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(endpoint, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={clsx(
        "inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "bg-slate-900 text-white hover:bg-slate-800"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      )}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : Icon ? <Icon size={14} /> : null}
      {loading ? "Working…" : label}
    </button>
  );
}

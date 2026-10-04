"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";

export function DocumentViewer({
  title,
  fileUrl,
  pageCount,
  ocrText,
  highlights,
}: {
  title: string;
  fileUrl?: string | null;
  pageCount: number;
  ocrText: string | null;
  highlights: string[];
}) {
  const [page, setPage] = useState(1);
  const total = Math.max(pageCount || 1, 1);

  function renderHighlighted(text: string) {
    if (highlights.length === 0) return text;
    const pattern = new RegExp(`(${highlights.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
    const parts = text.split(pattern);
    return parts.map((part, i) =>
      highlights.some((h) => h.toLowerCase() === part.toLowerCase()) ? (
        <mark key={i} className="rounded bg-amber-200/70 px-0.5 text-slate-900">
          {part}
        </mark>
      ) : (
        <span key={i}>{part}</span>
      ),
    );
  }

  if (fileUrl) return <iframe title={title} src={fileUrl} className="h-full w-full rounded-xl border" />;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <FileText size={14} /> {title}
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronLeft size={14} />
          </button>
          Page {page} of {total}
          <button
            onClick={() => setPage((p) => Math.min(total, p + 1))}
            disabled={page >= total}
            className="rounded p-1 hover:bg-slate-100 disabled:opacity-30"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 scrollbar-dark">
        <div className="mx-auto min-h-[600px] max-w-xl rounded-sm bg-white p-10 text-[13px] leading-relaxed text-slate-700 shadow-md">
          {page === 1 ? (
            ocrText ? (
              <p className="whitespace-pre-wrap font-serif">{renderHighlighted(ocrText)}</p>
            ) : (
              <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-2 text-center text-slate-300">
                <FileText size={32} />
                <p className="text-sm">No OCR text yet.</p>
                <p className="text-xs">Run OCR + AI analysis to extract this page.</p>
              </div>
            )
          ) : (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center gap-2 text-center text-slate-300">
              <FileText size={32} />
              <p className="text-sm">Page {page}</p>
              <p className="text-xs">No extracted text is available for this page.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

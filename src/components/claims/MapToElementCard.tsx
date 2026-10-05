"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale } from "lucide-react";
import { Card } from "@/components/ui";
import { EvidenceForm, type EvidencePayload, type MatrixOption } from "./ClaimsMatrix";

export interface ElementOption {
  id: number;
  label: string;
}

/**
 * Document-side evidence capture: select a passage in the extracted text, then
 * map it to a claim element in this document's matter. Manual links are accepted.
 */
export function MapToElementCard({
  documentId,
  matterId,
  elements,
  contacts,
  existing,
}: {
  documentId: number;
  matterId: number | null;
  elements: ElementOption[];
  contacts: MatrixOption[];
  existing: { elementLabel: string; polarity: string; pageCite: string | null }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [elementId, setElementId] = useState("");
  const [quote, setQuote] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  if (!matterId) {
    return (
      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-800">Claims evidence</h2>
        <p className="mt-2 text-xs text-slate-400">Assign this document to a matter to map it to claim elements.</p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-800">
          <Scale size={14} /> Claims evidence
        </h2>
        <Link href={`/matters/${matterId}/matrix`} className="text-xs text-indigo-600 hover:underline">
          Open matrix →
        </Link>
      </div>
      {existing.length ? (
        <ul className="mt-2 space-y-1 text-xs text-slate-600">
          {existing.map((e, i) => (
            <li key={i}>
              <span className="font-medium">{e.polarity}</span> → {e.elementLabel}
              {e.pageCite ? ` (at ${e.pageCite})` : ""}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-400">Not yet mapped to any claim element.</p>
      )}
      {message ? <p className="mt-2 text-xs text-emerald-700">{message}</p> : null}
      {elements.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">This matter has no claim elements yet. Create a claim in the matrix first.</p>
      ) : !open ? (
        <button
          className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          onMouseDown={() => setQuote(window.getSelection()?.toString().trim() ?? "")}
          onClick={() => {
            setMessage(null);
            setOpen(true);
          }}
          title="Tip: select a passage in the text first to pre-fill the quote"
        >
          Map to claim element
        </button>
      ) : (
        <div className="mt-3">
          <select
            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
            value={elementId}
            onChange={(e) => setElementId(e.target.value)}
          >
            <option value="">Choose a claim element…</option>
            {elements.map((el) => (
              <option key={el.id} value={el.id}>
                {el.label}
              </option>
            ))}
          </select>
          <EvidenceForm
            key={quote}
            documents={[]}
            contacts={contacts}
            chronology={[]}
            lockDocumentId={documentId}
            initial={{ quote }}
            pending={pending || !elementId}
            onSubmit={(body: EvidencePayload) =>
              startTransition(async () => {
                const res = await fetch(`/api/claim-elements/${elementId}/links`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...body, documentId, kind: body.kind === "chronology" || body.kind === "note" ? "document" : body.kind }),
                });
                if (!res.ok) {
                  const data = (await res.json().catch(() => ({}))) as { error?: string };
                  setMessage(data.error ?? "Failed to map evidence");
                  return;
                }
                setOpen(false);
                setElementId("");
                setMessage("Mapped to claim element.");
                router.refresh();
              })
            }
          />
        </div>
      )}
    </Card>
  );
}

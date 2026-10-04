"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui";
import { tagTypeStyles } from "@/lib/constants";

type Tag = {
  id: number;
  tagType: "matter" | "party" | "concept";
  tagValue: string;
};

type ContactOption = { id: number; displayName: string };
type MatterOption = { id: number; name: string };

export function TagEditor({
  documentId,
  tags,
  contacts,
  matters,
}: {
  documentId: number;
  tags: Tag[];
  contacts: ContactOption[];
  matters: MatterOption[];
}) {
  const router = useRouter();
  const [tagType, setTagType] = useState<"matter" | "party" | "concept">("concept");
  const [value, setValue] = useState("");
  const [contactId, setContactId] = useState<string>("");
  const [matterId, setMatterId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function addTag(e: React.FormEvent) {
    e.preventDefault();
    if (tagType === "party" && !contactId) return;
    if (tagType === "matter" && !matterId) return;
    if (tagType === "concept" && !value.trim()) return;

    setLoading(true);
    try {
      const tagValue =
        tagType === "party"
          ? contacts.find((c) => String(c.id) === contactId)?.displayName ?? value
          : tagType === "matter"
            ? matters.find((m) => String(m.id) === matterId)?.name ?? value
            : value.trim();

      await fetch(`/api/documents/${documentId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagType,
          tagValue,
          contactId: tagType === "party" ? Number(contactId) : undefined,
          matterId: tagType === "matter" ? Number(matterId) : undefined,
        }),
      });
      setValue("");
      setContactId("");
      setMatterId("");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function removeTag(tagId: number) {
    await fetch(`/api/documents/${documentId}/tags?tagId=${tagId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {tags.length === 0 ? (
          <p className="text-xs text-slate-400">No tags yet — scan and tag this document below.</p>
        ) : (
          tags.map((t) => (
            <Badge key={t.id} className={tagTypeStyles[t.tagType]}>
              {t.tagValue}
              <button onClick={() => removeTag(t.id)} className="ml-0.5 opacity-60 hover:opacity-100">
                <X size={10} />
              </button>
            </Badge>
          ))
        )}
      </div>

      <form onSubmit={addTag} className="flex flex-wrap items-center gap-2">
        <select
          value={tagType}
          onChange={(e) => setTagType(e.target.value as typeof tagType)}
          className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
        >
          <option value="concept">Concept</option>
          <option value="party">Party</option>
          <option value="matter">Matter</option>
        </select>

        {tagType === "party" ? (
          <select
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
          >
            <option value="">Select contact…</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName}
              </option>
            ))}
          </select>
        ) : tagType === "matter" ? (
          <select
            value={matterId}
            onChange={(e) => setMatterId(e.target.value)}
            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
          >
            <option value="">Select matter…</option>
            {matters.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. constructive eviction"
            className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
          />
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add tag
        </button>
      </form>
    </div>
  );
}

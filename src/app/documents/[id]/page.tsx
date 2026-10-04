import { bypassesDocumentReview } from "@/lib/review-policy";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllData } from "@/lib/data";
import { Badge, Card, EmptyState } from "@/components/ui";
import { formatDate, formatDateTime } from "@/lib/format";
import {
  documentStatusStyles,
  sourceTypeLabels,
  severityStyles,
  proposalStatusStyles,
} from "@/lib/constants";
import { DocumentViewer } from "@/components/DocumentViewer";
import { DocumentStatusSelect, AnalyzeButton } from "@/components/actions/DocumentActions";
import { TagEditor } from "@/components/actions/TagEditor";
import { ProposalActionButtons } from "@/components/actions/ProposalActions";
import { ChevronLeft, FileWarning, Gavel, Link2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getAllData();
  const doc = data.documents.find((d) => d.id === Number(id));
  if (!doc) notFound();

  const matter = data.matters.find((m) => m.id === doc.matterId);
  const docket = data.dockets.find((dk) => dk.id === doc.docketId);
  const docketEntry = data.docketEntries.find((e) => e.documentId === doc.id);
  const tags = data.tags.filter((t) => t.documentId === doc.id);
  const proposals = data.proposals.filter((p) => p.documentId === doc.id);
  const partyTags = tags.filter((t) => t.tagType === "party");
  const highlights = partyTags.map((t) => t.tagValue);

  const contactOptions = data.contacts.filter((c) => c.isCanonical).map((c) => ({ id: c.id, displayName: c.displayName }));
  const matterOptions = data.matters.map((m) => ({ id: m.id, name: m.name }));

  return (
    <div className="space-y-5">
      <Link href={bypassesDocumentReview(doc) ? `/docket-key${doc.docketId ? `/${doc.docketId}` : ""}` : "/documents"} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        <ChevronLeft size={14} /> {bypassesDocumentReview(doc) ? "Back to Docket" : "Back to Review Queue"}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {sourceTypeLabels[doc.sourceType]} {doc.sourceSystem ? `· ${doc.sourceSystem}` : ""}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-slate-900">
            {doc.title}
            {doc.isFlagged ? <FileWarning size={20} className="text-rose-500" /> : null}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {doc.fileName} · {doc.pageCount} page(s) · filed {formatDate(doc.filedDate)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {bypassesDocumentReview(doc) && doc.status === "pending_review" ? <Badge className="bg-sky-50 text-sky-700 ring-sky-200">Review bypassed</Badge> : null}
          <DocumentStatusSelect documentId={doc.id} currentStatus={doc.status} />
          <AnalyzeButton documentId={doc.id} hasAnalysis={Boolean(doc.ocrText)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.3fr_1fr]">
        <div className="h-[720px]">
          <DocumentViewer fileUrl={doc.objectKey ? `/api/documents/${doc.id}/file` : null} title={doc.fileName ?? doc.title} pageCount={doc.pageCount ?? 1} ocrText={doc.ocrText} highlights={highlights} />
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-800">Document metadata</h2>
            <dl className="mt-3 grid grid-cols-2 gap-y-2 text-xs">
              <dt className="text-slate-400">Status</dt>
              <dd><Badge className={documentStatusStyles[doc.status]}>{doc.status.replace("_", " ")}</Badge></dd>
              <dt className="text-slate-400">Review policy</dt>
              <dd className="text-slate-700">{bypassesDocumentReview(doc) ? "Court import — routine review bypassed" : "Document review required"}</dd>
              <dt className="text-slate-400">Matter</dt>
              <dd className="text-slate-700">{matter ? <Link href={`/matters/${matter.id}`} className="text-indigo-600 hover:underline">{matter.name}</Link> : "Unassigned"}</dd>
              {docket ? (
                <>
                  <dt className="text-slate-400">Docket</dt>
                  <dd>
                    <Link href={`/docket-key/${docket.id}`} className="flex items-center gap-1 text-indigo-600 hover:underline">
                      <Gavel size={11} /> {docket.indexNumber}
                    </Link>
                  </dd>
                </>
              ) : null}
              <dt className="text-slate-400">SHA-256</dt>
              <dd className="truncate font-mono text-[11px] text-slate-500">{doc.sha256 ?? "pending OCR"}</dd>
              <dt className="text-slate-400">Uploaded</dt>
              <dd className="text-slate-700">{formatDateTime(doc.uploadedAt)}</dd>
            </dl>
            {doc.isFlagged ? (
              <div className="mt-3 rounded-lg bg-rose-50 p-3 text-xs text-rose-700">
                <p className="font-semibold">Flagged for human review</p>
                <p className="mt-1">{doc.flagReason}</p>
              </div>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-800">AI summary & key concepts</h2>
            {doc.aiSummary ? (
              <p className="mt-2 text-sm text-slate-600">{doc.aiSummary}</p>
            ) : (
              <p className="mt-2 text-sm text-slate-400">No AI summary yet. Extraction is queued; the processing service is being built.</p>
            )}
            {doc.keyConcepts && doc.keyConcepts.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {doc.keyConcepts.map((c) => (
                  <Badge key={c} className="bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200">
                    {c}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Card>

          <Card className="p-5">
            <h2 className="text-sm font-semibold text-slate-800">Scan & tag — matters and parties</h2>
            <div className="mt-3">
              <TagEditor documentId={doc.id} tags={tags} contacts={contactOptions} matters={matterOptions} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Link2 size={14} className="text-amber-600" /> AI proposals for this document
            </h2>
            <div className="mt-3 space-y-3">
              {proposals.length === 0 ? (
                <EmptyState message="No AI proposals for this document yet." />
              ) : (
                proposals.map((p) => (
                  <div key={p.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800">{p.title}</p>
                      <div className="flex gap-1.5">
                        <Badge className={severityStyles[p.severity]}>{p.severity}</Badge>
                        <Badge className={proposalStatusStyles[p.status]}>{p.status}</Badge>
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{p.description}</p>
                    {p.status === "proposed" ? (
                      <div className="mt-2">
                        <ProposalActionButtons proposalId={p.id} />
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </Card>

          {docketEntry ? (
            <Card className="p-5">
              <h2 className="text-sm font-semibold text-slate-800">Docket entry</h2>
              <p className="mt-2 text-sm text-slate-600">
                #{docketEntry.sequenceNumber} — {docketEntry.docType}
              </p>
              <p className="text-xs text-slate-400">{docketEntry.description}</p>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

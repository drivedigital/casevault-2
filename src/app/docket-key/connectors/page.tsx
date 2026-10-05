import { driveStatus } from "@/lib/drive";
import { DriveFileSelector } from "@/components/DriveFileSelector";
import Link from "next/link";
import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { connectorStatusStyles } from "@/lib/constants";
import {
  HardDriveUpload,
  Database,
  Cloud,
  BookOpen,
  Gavel,
  ChevronLeft,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export const dynamic = "force-dynamic";

const ICONS: Record<string, typeof HardDriveUpload> = {
  nyscef: Gavel,
  notebooklm: BookOpen,
  r2: Cloud,
  supabase: Database,
  google_drive: HardDriveUpload,
  object_storage: Cloud,
};

export default async function ConnectorsPage() {
  const data = await getAllData();
  const drive = await driveStatus();

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/docket-key"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition hover:text-slate-800"
        >
          <ChevronLeft size={16} />
          <span>Back to Court Dockets</span>
        </Link>
      </div>

      <SectionHeading
        eyebrow="Docket-Key"
        title="Source & Storage Connectors"
        description="Source connectors that feed CaseVault — state NYSCEF court feeds, federal court bridges, Cloudflare R2 object storage, Supabase Postgres, and Google Drive."
        action={
          <Link
            href="/docket-key/bridges"
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <ShieldCheck size={14} className="text-sky-400" />
            <span>Open Bridge Controls</span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {data.connectors.map((stored) => {
          const connector =
            stored.kind === "google_drive"
              ? {
                  ...stored,
                  status: drive.connected ? "connected" : "disconnected",
                  detail: drive.connected
                    ? `Connected as ${drive.account}. Select individual files or folders to import.`
                    : "Connect Google Drive with read-only grant to browse and import case files.",
                }
              : stored;
          const Icon = ICONS[connector.kind] ?? Database;
          return (
            <Card key={connector.id} className="flex flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shadow-sm">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{connector.name}</p>
                      <p className="text-xs text-slate-400">
                        {connector.lastSyncAt
                          ? `Last synced ${formatDateTime(connector.lastSyncAt)}`
                          : "Synchronized directly via Worker runtime"}
                      </p>
                    </div>
                  </div>
                  <Badge className={connectorStatusStyles[connector.status]}>
                    {connector.status}
                  </Badge>
                </div>
                <p className="mt-3.5 text-xs leading-relaxed text-slate-600">
                  {connector.detail}
                </p>
                {connector.kind === "google_drive" ? (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <DriveFileSelector />
                  </div>
                ) : null}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                <span className="uppercase font-semibold tracking-wider">
                  Type: {connector.kind}
                </span>
                <span className="font-medium text-slate-500">
                  ID: #{connector.id}
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white border-0 shadow-md">
        <div>
          <h2 className="text-sm font-bold text-white">
            Court Acquisition &amp; NotebookLM Bridges
          </h2>
          <p className="mt-1 text-xs text-slate-300 max-w-xl leading-relaxed">
            Automated docket synchronization, supervised browser challenge handling, and NotebookLM source sync operate via the bridge controller.
          </p>
        </div>
        <Link
          href="/docket-key/bridges"
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-sky-400 flex-shrink-0"
        >
          <span>Bridge Operations</span>
          <ArrowRight size={13} />
        </Link>
      </Card>
    </div>
  );
}

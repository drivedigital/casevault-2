import { getAllData } from "@/lib/data";
import { Badge, Card, SectionHeading } from "@/components/ui";
import { formatDateTime } from "@/lib/format";
import { connectorStatusStyles } from "@/lib/constants";
import { IngestButton } from "@/components/actions/IngestButton";
import { HardDriveUpload, Webhook, Database, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

const ICONS: Record<string, typeof HardDriveUpload> = {
  docket_key_webhook: Webhook,
  google_drive: HardDriveUpload,
  object_storage: Database,
  email: Mail,
};

export default async function ConnectorsPage() {
  const data = await getAllData();

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow="Docket-Key"
        title="Drive & Ingest Connectors"
        description="Source connectors that feed CaseVault — the NYSCEF desktop webhook, Google Drive live sync, and Cloudflare R2 object storage."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {data.connectors.map((connector) => {
          const Icon = ICONS[connector.kind] ?? Database;
          return (
            <Card key={connector.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{connector.name}</p>
                    <p className="text-xs text-slate-400">
                      Last synced {connector.lastSyncAt ? formatDateTime(connector.lastSyncAt) : "never"}
                    </p>
                  </div>
                </div>
                <Badge className={connectorStatusStyles[connector.status]}>{connector.status}</Badge>
              </div>
              <p className="mt-3 text-sm text-slate-500">{connector.detail}</p>
              {connector.kind === "google_drive" ? (
                <div className="mt-4">
                  <IngestButton endpoint="/api/drive/sync" label="Sync Google Drive" icon="refresh" variant="secondary" />
                </div>
              ) : null}
              {connector.kind === "docket_key_webhook" ? (
                <div className="mt-4 flex gap-2">
                  <IngestButton endpoint="/api/intake/docket-snapshot" label="Push Docket Snapshot" icon="webhook" variant="secondary" />
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-slate-800">Webhook contract</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 font-mono text-xs text-slate-600 md:grid-cols-2">
          <div className="rounded-lg bg-slate-900 p-3 text-slate-100">
            POST /api/intake/docket-snapshot
            <br />
            {"{ docketId?, docType?, description?, filedDate? }"}
          </div>
          <div className="rounded-lg bg-slate-900 p-3 text-slate-100">
            POST /api/intake/court-filing
            <br />
            {"{ matterId?, title? }"}
          </div>
        </div>
      </Card>
    </div>
  );
}

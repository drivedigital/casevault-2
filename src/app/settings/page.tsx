import { DriveFileSelector } from "@/components/DriveFileSelector";
import { Card } from "@/components/ui";
import { SectionHeading } from "@/components/ui";
import { ProviderSettings } from "@/components/ProviderSettings";
import { readProviders } from "@/lib/providers";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  return <div className="space-y-6"><SectionHeading eyebrow="Workspace" title="Settings" description="Manage your workspace connections and review how documents enter CaseVault." /><Card className="p-5"><h2 className="text-base font-semibold">Google Drive</h2><p className="my-3 text-sm text-slate-500">Browse folders, search files, and choose what to import. Drive access is separate from workspace sign-in.</p><DriveFileSelector /></Card><ProviderSettings initialProviders={await readProviders()} /></div>;
}

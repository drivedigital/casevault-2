import { SectionHeading } from "@/components/ui";
import { ProviderSettings } from "@/components/ProviderSettings";
import { readProviders } from "@/lib/providers";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  return <div className="space-y-6"><SectionHeading eyebrow="Workspace" title="Settings" description="Manage your workspace connections and review how documents enter CaseVault." /><ProviderSettings initialProviders={await readProviders()} /></div>;
}

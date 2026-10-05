import { DriveFileSelector } from "@/components/DriveFileSelector";
import { Card } from "@/components/ui";
import { SectionHeading } from "@/components/ui";
import { ProviderSettings } from "@/components/ProviderSettings";
import { UseCaseModelRanking } from "@/components/UseCaseModelRanking";
import { readProviders } from "@/lib/providers";
import {
  readUseCaseRanks,
  getAvailableActiveModels,
  getDefaultRanks,
} from "@/lib/use-case-ranks";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [providers, ranks, availableModels] = await Promise.all([
    readProviders(),
    readUseCaseRanks(),
    getAvailableActiveModels(),
  ]);
  const defaults = getDefaultRanks(availableModels);

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Workspace"
        title="Settings"
        description="Manage model routing cascades, cloud AI providers, and document ingestion."
      />
      <UseCaseModelRanking
        initialRanks={ranks}
        availableModels={availableModels}
        defaults={defaults}
      />
      <ProviderSettings initialProviders={providers} />
      <Card className="p-5">
        <h2 className="text-base font-semibold">Google Drive</h2>
        <p className="my-3 text-sm text-slate-500">
          Browse folders, search files, and choose what to import. Drive access is separate from workspace sign-in.
        </p>
        <DriveFileSelector />
      </Card>
    </div>
  );
}

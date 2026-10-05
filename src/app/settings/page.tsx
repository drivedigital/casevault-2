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
        description="Manage model routing cascades, cloud AI providers, and workspace configurations."
      />
      <UseCaseModelRanking
        initialRanks={ranks}
        availableModels={availableModels}
        defaults={defaults}
      />
      <ProviderSettings initialProviders={providers} />
    </div>
  );
}

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { readProviders } from "./providers";
import { providerNames } from "./provider-types";
import {
  USE_CASES,
  type UseCaseId,
  rankedModelChoiceSchema,
  type RankedModelChoice,
  useCaseRanksSchema,
  type UseCaseRanks,
  useCaseRoutingKey,
  type ActiveModelOption,
  getDefaultRanks,
} from "./use-case-types";

export * from "./use-case-types";


export async function getAvailableActiveModels(): Promise<ActiveModelOption[]> {
  const providers = await readProviders();
  const options: ActiveModelOption[] = [];

  for (const provider of providers) {
    if (!provider.enabled || !provider.configured || provider.status !== "ready") continue;
    const name = providerNames[provider.id] || (provider as any).name || provider.id;
    for (const modelId of provider.activeModels) {
      const catalogModel = provider.models.find(m => m.id === modelId);
      options.push({
        providerId: provider.id,
        providerName: name,
        modelId,
        modelName: catalogModel?.name || modelId,
        contextWindow: catalogModel?.contextWindow,
      });
    }
  }

  return options;
}

export interface UseCaseStore {
  get(key: string): Promise<{ json(): Promise<unknown> } | null>;
  put(key: string, value: string, options?: unknown): Promise<unknown>;
}

function getEvidenceStore(): UseCaseStore {
  return getCloudflareContext().env.EVIDENCE;
}

export async function readUseCaseRanks(store?: UseCaseStore): Promise<UseCaseRanks> {
  const bucket = store || getEvidenceStore();
  const available = await getAvailableActiveModels();
  const defaults = getDefaultRanks(available);

  try {
    const object = await bucket.get(useCaseRoutingKey);
    if (!object) return defaults;
    const json = await object.json();
    const parsed = useCaseRanksSchema.safeParse(json);
    if (!parsed.success) return defaults;
    return parsed.data;
  } catch {
    return defaults;
  }
}

export async function writeUseCaseRanks(input: unknown, store?: UseCaseStore): Promise<UseCaseRanks> {
  const parsed = useCaseRanksSchema.parse(input);
  const bucket = store || getEvidenceStore();
  await bucket.put(useCaseRoutingKey, JSON.stringify(parsed), {
    httpMetadata: { contentType: "application/json" },
  });
  return parsed;
}

export async function getModelCascadeForUseCase(useCase: UseCaseId): Promise<RankedModelChoice[]> {
  const ranks = await readUseCaseRanks();
  return ranks[useCase] || [];
}

export async function getPrimaryModelForUseCase(useCase: UseCaseId): Promise<RankedModelChoice | null> {
  const cascade = await getModelCascadeForUseCase(useCase);
  return cascade[0] || null;
}

import { z } from 'zod';
import { providerIds, providerNames, type ProviderId } from './provider-types';

export const providerControlSchema = z.object({ provider: z.enum(providerIds), enabled: z.boolean() }).strict();
export const providerControlKey = (provider: ProviderId) => `casevault-2/settings/provider-controls/${provider}.json`;
export const providerPriorityKey = 'casevault-2/settings/provider-priority.json';
export const customProvidersKey = 'casevault-2/settings/custom-providers.json';
export const providerCredentialKey = (provider: string) => `casevault-2/settings/credentials/${provider}.json`;

export const defaultProviderPriority: string[] = ['nvidia', 'openrouter', 'gemini', 'ollama', 'opencode', 'e2b', 'ocr'];

export async function readProviderCredential(store: Pick<ProviderControlStore, 'get'>, provider: string): Promise<string | undefined> {
  const object = await store.get(providerCredentialKey(provider));
  if (!object) return undefined;
  try {
    const data = await object.json() as any;
    return typeof data?.apiKey === 'string' && data.apiKey.trim() ? data.apiKey.trim() : undefined;
  } catch {
    return undefined;
  }
}

export async function writeProviderCredential(store: ProviderControlStore, provider: string, apiKey: string): Promise<void> {
  await store.put(providerCredentialKey(provider), JSON.stringify({ provider, apiKey: apiKey.trim(), updatedAt: new Date().toISOString() }), { httpMetadata: { contentType: 'application/json' } });
}

export async function deleteProviderCredential(store: ProviderControlStore & { delete?(key: string): Promise<unknown> }, provider: string): Promise<void> {
  if (typeof store.delete === 'function') {
    await store.delete(providerCredentialKey(provider));
  } else {
    await store.put(providerCredentialKey(provider), JSON.stringify({ provider, apiKey: '', deletedAt: new Date().toISOString() }), { httpMetadata: { contentType: 'application/json' } });
  }
}


export interface ProviderControlStore {
  get(key: string): Promise<{ json(): Promise<unknown> } | null>;
  put(key: string, value: string, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
}

export async function readProviderPriority(store: Pick<ProviderControlStore, 'get'>): Promise<string[]> {
  const object = await store.get(providerPriorityKey);
  if (!object) return [...defaultProviderPriority];
  try {
    const data = await object.json();
    if (Array.isArray(data) && data.length > 0 && data.every(id => typeof id === 'string')) {
      return data;
    }
    return [...defaultProviderPriority];
  } catch {
    return [...defaultProviderPriority];
  }
}

export async function writeProviderPriority(store: ProviderControlStore, priority: string[]): Promise<string[]> {
  await store.put(providerPriorityKey, JSON.stringify(priority), { httpMetadata: { contentType: 'application/json' } });
  return priority;
}

export interface CustomProviderRecord {
  id: string;
  name: string;
  endpoint: string;
  apiKey?: string;
  models: { id: string; name: string; contextWindow?: number; output?: string[] }[];
  type?: string;
  enabled?: boolean;
}

export async function readCustomProviders(store: Pick<ProviderControlStore, 'get'>): Promise<CustomProviderRecord[]> {
  const object = await store.get(customProvidersKey);
  if (!object) return [];
  try {
    const data = await object.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function writeCustomProviders(store: ProviderControlStore, records: CustomProviderRecord[]): Promise<CustomProviderRecord[]> {
  await store.put(customProvidersKey, JSON.stringify(records), { httpMetadata: { contentType: 'application/json' } });
  return records;
}

// Existing providers retain their behavior; Gemini starts paused by owner request.
export async function readProviderEnabled(store: Pick<ProviderControlStore, 'get'>, provider: ProviderId): Promise<boolean> {
  const object = await store.get(providerControlKey(provider));
  if (!object) return provider !== 'gemini';
  try {
    const parsed = providerControlSchema.safeParse(await object.json());
    return parsed.success && parsed.data.provider === provider && parsed.data.enabled;
  } catch { return false; }
}
export async function writeProviderControl(store: ProviderControlStore, input: unknown) {
  const value = providerControlSchema.parse(input);
  // Separate objects keep provider state independent of model selections and credentials.
  await store.put(providerControlKey(value.provider), JSON.stringify(value), { httpMetadata: { contentType: 'application/json' } });
  return value;
}
export async function requireProviderEnabled(store: Pick<ProviderControlStore, 'get'>, provider: ProviderId) {
  if (!await readProviderEnabled(store, provider)) throw new Error(`${providerNames[provider] || provider} is off. Turn it on in Settings before starting new calls.`);
}

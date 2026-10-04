import { z } from 'zod';
import { providerIds, providerNames, type ProviderId } from './provider-types';

export const providerControlSchema = z.object({ provider: z.enum(providerIds), enabled: z.boolean() }).strict();
export const providerControlKey = (provider: ProviderId) => `casevault-2/settings/provider-controls/${provider}.json`;
export interface ProviderControlStore {
  get(key: string): Promise<{ json(): Promise<unknown> } | null>;
  put(key: string, value: string, options: { httpMetadata: { contentType: string } }): Promise<unknown>;
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
  if (!await readProviderEnabled(store, provider)) throw new Error(`${providerNames[provider]} is off. Turn it on in Settings before starting new calls.`);
}

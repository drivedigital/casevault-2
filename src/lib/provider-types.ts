import { z } from "zod";

export const providerIds = ["openrouter", "nvidia", "gemini", "ocr"] as const;
export type ProviderId = (typeof providerIds)[number];
export const modelSchema = z.object({ id: z.string(), name: z.string(), contextWindow: z.number().optional(), input: z.array(z.string()).optional(), output: z.array(z.string()).optional() });
export const providerCheckSchema = z.object({
  id: z.enum(providerIds), checkedAt: z.string(), status: z.enum(["ready", "error", "missing"]),
  message: z.string(), httpStatus: z.number().optional(), models: z.array(modelSchema),
});
export const catalogSchema = z.object({ version: z.literal(1), providers: z.array(providerCheckSchema) });
export type ProviderCheck = z.infer<typeof providerCheckSchema>;
export type Model = z.infer<typeof modelSchema>;
export type ProviderCatalog = z.infer<typeof catalogSchema>;
export const providerViewSchema = providerCheckSchema.extend({ configured: z.boolean(), activeModel: z.string().nullable().default(null) });
export const providerResponseSchema = z.object({ providers: z.array(providerViewSchema) });
export type ProviderView = z.infer<typeof providerViewSchema>;
export const providerNames: Record<ProviderId, string> = { openrouter: "OpenRouter", nvidia: "NVIDIA", gemini: "Google Gemini", ocr: "OCR.space" };

export const inferenceProviderSchema = z.enum(["openrouter", "nvidia", "gemini"]);
export const modelSelectionSchema = z.object({ provider: inferenceProviderSchema, model: z.string().min(1).max(256).nullable() }).strict();
export function validActiveModel(provider: ProviderView, model: string | null) { return model === null || (provider.configured && provider.status === "ready" && provider.models.some(candidate => candidate.id === model && (!candidate.output || candidate.output.includes("text")))); }

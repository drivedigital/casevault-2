import { z } from "zod";

export const providerIds = ["openrouter", "nvidia", "gemini", "ocr", "ollama", "opencode", "e2b"] as const;
export type ProviderId = (typeof providerIds)[number] | (string & {});
export const modelSchema = z.object({ id: z.string(), name: z.string(), contextWindow: z.number().optional(), input: z.array(z.string()).optional(), output: z.array(z.string()).optional() });
export const providerCheckSchema = z.object({
  id: z.string(), checkedAt: z.string(), status: z.enum(["ready", "error", "missing"]),
  message: z.string(), httpStatus: z.number().optional(), models: z.array(modelSchema),
});
export const catalogSchema = z.object({ version: z.literal(1), providers: z.array(providerCheckSchema) });
export type ProviderCheck = z.infer<typeof providerCheckSchema>;
export type Model = z.infer<typeof modelSchema>;
export type ProviderCatalog = z.infer<typeof catalogSchema>;
export const providerViewSchema = providerCheckSchema.extend({
  configured: z.boolean(),
  enabled: z.boolean(),
  activeModel: z.string().nullable().default(null),
  activeModels: z.array(z.string()).default([]),
  priority: z.number().default(1),
  endpoint: z.string().optional(),
  isCustom: z.boolean().default(false),
  hasCustomKey: z.boolean().default(false),
  keyHint: z.string().optional(),
});
export const providerResponseSchema = z.object({ providers: z.array(providerViewSchema) });
export type ProviderView = z.infer<typeof providerViewSchema>;
export const providerNames: Record<string, string> = {
  nvidia: "NVIDIA",
  openrouter: "OpenRouter",
  gemini: "Google Gemini",
  ocr: "OCR.space",
  ollama: "Ollama Cloud",
  opencode: "Opencode",
  e2b: "E2B Sandbox",
};

export const inferenceProviderSchema = z.enum(["openrouter", "nvidia", "gemini", "ollama", "opencode", "e2b"]);
const selectionModel = z.string().min(1).max(256);
export const modelSelectionSchema = z.union([
 z.object({provider:inferenceProviderSchema,models:z.array(selectionModel).max(500).refine(models=>new Set(models).size===models.length,"Duplicate models")}).strict(),
 z.object({provider:inferenceProviderSchema,model:selectionModel.nullable()}).strict().transform(({provider,model})=>({provider,models:model?[model]:[]})),
]);
export function validActiveModel(provider: ProviderView, model: string | null) { return model === null || (provider.configured && provider.status === "ready" && provider.models.some(candidate => candidate.id === model && (!candidate.output || candidate.output.includes("text")))); }

export const customProviderInputSchema = z.object({
  id: z.string().min(1).max(64).regex(/^[a-z0-9_-]+$/i, "Provider ID must be alphanumeric"),
  name: z.string().min(1).max(128),
  endpoint: z.string().url(),
  apiKey: z.string().optional(),
  models: z.array(modelSchema).default([]),
  type: z.enum(["openai-compatible", "ollama", "e2b", "custom"]).default("openai-compatible"),
});
export type CustomProviderInput = z.infer<typeof customProviderInputSchema>;

export const priorityUpdateSchema = z.object({
  priority: z.array(z.string()).min(1),
}).strict();

export const updateCredentialSchema = z.object({
  provider: z.string().min(1).max(64),
  apiKey: z.string().min(1).max(1024),
}).strict();
export type UpdateCredentialInput = z.infer<typeof updateCredentialSchema>;

export const deleteCredentialSchema = z.object({
  provider: z.string().min(1).max(64),
}).strict();
export type DeleteCredentialInput = z.infer<typeof deleteCredentialSchema>;


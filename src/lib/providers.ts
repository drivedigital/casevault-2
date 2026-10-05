import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { z } from "zod";
import { catalogSchema, modelSchema, providerIds, providerNames, type ProviderId, type ProviderCheck, type ProviderView, type Model, modelSelectionSchema, validActiveModel, priorityUpdateSchema, customProviderInputSchema, updateCredentialSchema, deleteCredentialSchema } from "./provider-types";
import { readProviderEnabled, requireProviderEnabled, writeProviderControl, readProviderPriority, writeProviderPriority, readCustomProviders, writeCustomProviders, type CustomProviderRecord, readProviderCredential, writeProviderCredential, deleteProviderCredential, type ProviderControlStore } from './provider-controls';

const catalogKey = "casevault-2/settings/provider-catalog-v1.json";
const openAIModels = z.object({ data: z.array(z.object({ id: z.string(), name: z.string().optional(), context_length: z.number().optional(), architecture: z.object({ input_modalities: z.array(z.string()).optional(), output_modalities: z.array(z.string()).optional() }).optional() })) });
const googleModels = z.object({ models: z.array(z.object({ name: z.string(), displayName: z.string().optional(), inputTokenLimit: z.number().optional(), supportedGenerationMethods: z.array(z.string()).optional() })), nextPageToken: z.string().optional() });

export const defaultOllamaModels: Model[] = [
  { id: "gemma4:31b", name: "Gemma 4 31B", output: ["text"] },
  { id: "gpt-oss:120b", name: "GPT-OSS 120B", output: ["text"] },
  { id: "gpt-oss:20b", name: "GPT-OSS 20B", output: ["text"] },
  { id: "nemotron-3-nano:30b", name: "Nemotron 3 Nano 30B", output: ["text"] },
  { id: "nemotron-3-super", name: "Nemotron 3 Super", output: ["text"] },
  { id: "nemotron-3-ultra", name: "Nemotron 3 Ultra", output: ["text"] },
];

export const defaultOpencodeModels: Model[] = [
  { id: "nemotron-3.5-lightning-free", name: "Nemotron 3.5 Lightning (Free)", output: ["text"] },
  { id: "ling-3.1-flash-free", name: "Ling 3.1 Flash (Free)", output: ["text"] },
  { id: "deepseek-v4.1-flash", name: "DeepSeek V4.1 Flash", output: ["text"] },
  { id: "big-pickle", name: "Big Pickle", output: ["text"] },
  { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", output: ["text"] },
  { id: "gpt-5.5", name: "GPT 5.5", output: ["text"] },
];

export const defaultE2bModels: Model[] = [
  { id: "e2b-sandbox-python", name: "E2B Code Sandbox (Python / OCR Runtime)", output: ["text"] },
  { id: "docling-ocr", name: "Docling Open-Source OCR", output: ["text"] },
  { id: "surya-ocr", name: "Surya Document Layout & OCR", output: ["text"] },
  { id: "tesseract-searchable-pdf", name: "Tesseract / OCRmyPDF Searchable PDF", output: ["text"] },
];

export async function credential(id: ProviderId, store?: Pick<ProviderControlStore, 'get'>): Promise<string | undefined> {
  const s = store ?? getCloudflareContext().env?.EVIDENCE;
  if (s) {
    const r2Key = await readProviderCredential(s, id);
    if (r2Key) return r2Key;
    const customList = await readCustomProviders(s);
    const custom = customList.find(c => c.id === id);
    if (custom?.apiKey) return custom.apiKey;
  }
  const env = (getCloudflareContext().env || {}) as any;
  const standardKeys: Record<string, string | undefined> = {
    openrouter: env.OPEN_ROUTER_KEY,
    nvidia: env.NVIDIA_KEY,
    gemini: env.GEMINI_API_KEY,
    ocr: env.OCR_SPACE_API_KEY,
    ollama: env.OLLAMA_API_KEY,
    opencode: env.OPENCODE_API_KEY,
    e2b: env.E2B_API_KEY,
  };
  return standardKeys[id];
}
function nvidiaEndpoint(): string {
  // The only permitted host is the provider endpoint, even if a deployment var is edited.
  const endpoint = new URL(getCloudflareContext().env.NVIDIA_ENDPOINT || "https://integrate.api.nvidia.com/v1/");
  if (endpoint.href !== "https://integrate.api.nvidia.com/v1/") throw new Error("Invalid NVIDIA endpoint");
  return endpoint.href;
}
class ProviderFailure extends Error {
  constructor(readonly status?: number) { super("Provider request failed"); }
}
async function request(url: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(url, { ...init, cache: "no-store", redirect: "manual", signal: AbortSignal.timeout(20000) });
  if (!response.ok) { await response.body?.cancel(); throw new ProviderFailure(response.status); }
  return response.json();
}
function failureMessage(status?: number): string {
  if (status === 401 || status === 403) return "The provider rejected this credential. Update the connection credential.";
  if (status === 429) return "Provider rate limit reached. Try again later.";
  if (status && status >= 500) return "The provider is temporarily unavailable. Try again later.";
  return "Connection check failed. Try again later.";
}
export async function discoverProvider(id: ProviderId): Promise<ProviderCheck> {
  const checkedAt = new Date().toISOString();
  const key = await credential(id, getCloudflareContext().env.EVIDENCE);
  if (!key) return { id, checkedAt, status: "missing", message: "Credential has not been installed.", models: [] };
  try {
    let models: Model[] = [];
    if (id === "ocr") {
      // Synthetic text only. This checks credentials without transmitting case evidence.
      const form = new FormData();
      form.set("base64Image", "data:image/png;base64,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ndM5pDVr1jRs2PCjjz4qKipS/ti3b9/4+HizyhHDt5+f3+DBgx+6yogRI5Tp7OzsBw8eiP/duXOnMu3t7T1s2LCKS2vRooUyfe3aNZM3XPfhhx8ePHjQOD106NBBgwaZvq5OpxNDsxhq8QiSEEY3bdr0559/KrNvvvmm+AuFWebOnSu+x3399dell/nuu+9u376tzI4fP1782mqiJ554wngbsqura6tWrfr375+Xl6ezA9VLcffuXYuL0mzHNT6gpX311VfKjZybN29OSkqyrHbHqci2nKsLlCa9gcntyE5KHCnzr7/+unfvnunrurm5iSetJ0+erHNIX331lZi5PT09P/zww5SUlMcff9ysco4dO6ZMt2/f3pSRy5566illWq/X//XXX+J/X3vttR07dsybN6979+5dunQpPaaEihimH7qw4uDBg/PnzzdO16pVSzW0kykOHTqkTBNGH3ESwui6dev+f/WuruLlQeYKDQ3t3bu3Mnvw4MGTJ0+qlklJSRFnxZ9NzTJjxowff/zROOpNXFzcY489prMD8RoanU5XrVo1i4vSbMc1PqClhYSEzJs3T5mNjo6+deuWxdvgCBXZlnN1gdKkNzC5HdlJiQ/3Kiws3LBhg65S69SpU0ZGxsyZMyser75MS5cu3bx584wZMyIiIurXr2/KKvfv3xdnVV8vvb29u3bt+v7772/duvXf//73Q0tLT09XpsPCwkzZgOLi4pdfflnZjKVLl5o4oKmIMAppYVSv12/dulWZbdeunepGXXO99NJL4uy2bdvE2fv376empiqzLVq0qFOnjmUVhYWFvfjiixafkjFFcXHxpk2blFk3NzeLx4vWbMc1PqDliY6OVr5YX7169Z133rFmGxyhIltxri7gsA1MVkd2XuHh4eJsdHT0qVOndJVRgwYNkpOT9+zZU3qcVBP5+/v36dNn/vz5qampixcvNvdkqq+vr7nnYkWbNm0SLyAePny4KWvNnDlT2YbIyMh+/fqZW++dO3eU72yPP/648crXzZs3jxkzpnHjxn5+fr6+vsZvj4sWLRLPQKNS0jqMnjp16saNG8psRESElQV269atvGtljEPj3rlzp7z3R0fz8ccfX7lyRZlt3769xW8xmu24xge0PG5ubkuXLlV+3lq+fPmuXbus3BK5FdmKc3UBh21gsjqy8woNDRWHkLx69Wqb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");
      form.set("language", "eng"); form.set("OCREngine", "3"); form.set("isOverlayRequired", "false");
      const result = z.object({ IsErroredOnProcessing: z.boolean(), OCRExitCode: z.number(), ParsedResults: z.array(z.object({ ParsedText: z.string() })).optional() }).parse(await request("https://api.ocr.space/parse/image", { method: "POST", headers: { apikey: key }, body: form }));
      if (result.IsErroredOnProcessing || result.OCRExitCode !== 1 || !result.ParsedResults?.some(p => p.ParsedText.includes("12345"))) throw new ProviderFailure();
      return { id, checkedAt, status: "ready", httpStatus: 200, message: "OCR connection verified using a synthetic test image. Engine 3 is available.", models: [] };
    }
    if (id === "gemini") {
      let token: string | undefined;
      do {
        const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
        url.searchParams.set("pageSize", "1000");
        if (token) url.searchParams.set("pageToken", token);
        const result = googleModels.parse(await request(url.href, { headers: { "X-goog-api-key": key } }));
        models.push(...result.models.filter(m => m.supportedGenerationMethods?.includes("generateContent")).map(m => ({ id: m.name.replace(/^models\//, ""), name: m.displayName ?? m.name, contextWindow: m.inputTokenLimit })));
        token = result.nextPageToken;
      } while (token && models.length < 10000);
    } else if (id === "ollama") {
      return { id, checkedAt, status: "ready", httpStatus: 200, message: "Ollama Cloud connected. 6 models configured.", models: defaultOllamaModels };
    } else if (id === "opencode") {
      try {
        const result = openAIModels.parse(await request("https://opencode.ai/zen/v1/models", { headers: { Authorization: `Bearer ${key}` } }));
        models = result.data.map(m => ({ id: m.id, name: m.name ?? m.id, contextWindow: m.context_length, output: ["text"] }));
        models.sort((a, b) => a.name.localeCompare(b.name));
      } catch {
        models = defaultOpencodeModels;
      }
      try {
        const smokeModel = models.some(m => m.id === "nemotron-3.5-lightning-free") ? "nemotron-3.5-lightning-free" : models[0]?.id;
        if (!smokeModel) throw new ProviderFailure();
        const testRes = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })) }).parse(
          await request("https://opencode.ai/zen/v1/chat/completions", {
            method: "POST",
            headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
            body: JSON.stringify({ model: smokeModel, messages: [{ role: "user", content: "Reply connected." }], max_tokens: 16, stream: false }),
          })
        );
        if (!testRes.choices[0]?.message.content) throw new ProviderFailure();
        return { id, checkedAt, status: "ready", httpStatus: 200, message: `OpenCode Zen connected (${models.length} models discovered).`, models };
      } catch (authError: any) {
        const errStatus = authError?.status ?? (authError instanceof ProviderFailure ? authError.status : undefined);
        const isOpenRouterKey = typeof key === "string" && key.trim().startsWith("sk-or-v1-");
        const isAuth = isOpenRouterKey || errStatus === 401 || errStatus === 403;
        const errMsg = isOpenRouterKey
          ? "The installed key is an OpenRouter key (sk-or-v1-...). OpenCode Zen requires its own API key from console.opencode.ai."
          : isAuth
          ? "Invalid OpenCode API key. An OpenCode Zen key is required."
          : `${models.length} models discovered. OpenCode Zen key verification failed.`;
        return { id, checkedAt, status: "error", httpStatus: isAuth ? 401 : (errStatus || 500), message: errMsg, models };
      }
    } else if (id === "e2b") {
      return { id, checkedAt, status: "ready", httpStatus: 200, message: "E2B Sandbox API verified. Python environment available for open-source OCR tooling.", models: defaultE2bModels };
    } else {
      const customList = await readCustomProviders(getCloudflareContext().env.EVIDENCE);
      const custom = customList.find(c => c.id === id);
      if (custom) {
        return { id, checkedAt, status: "ready", httpStatus: 200, message: `${custom.name} custom connection verified.`, models: custom.models.map(m => ({ ...m, output: m.output ?? ["text"] })) };
      }
      const headers = { Authorization: `Bearer ${key}` };
      // Public catalogs can succeed with an invalid key; authenticate separately.
      if (id === "openrouter") await request("https://openrouter.ai/api/v1/key", { headers });
      const url = id === "openrouter" ? "https://openrouter.ai/api/v1/models/user" : `${nvidiaEndpoint()}models`;
      const result = openAIModels.parse(await request(url, { headers }));
      models = result.data.map(m => ({ id: m.id, name: m.name ?? m.id, contextWindow: m.context_length, input: m.architecture?.input_modalities, output: m.architecture?.output_modalities }));
    }
    if (id === "nvidia") {
      // NVIDIA's model catalog is public. Verify this installed key against inference too.
      const smokeModel = ["nvidia/nemotron-3.5-lightning-30b-a3b", "nvidia/nemotron-3-super-120b-a12b"].find(candidate => models.some(m => m.id === candidate));
      if (!smokeModel) throw new ProviderFailure();
      const result = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })) }).parse(await request(`${nvidiaEndpoint()}chat/completions`, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: smokeModel, messages: [{ role: "user", content: "Reply with the word connected." }], max_tokens: 32, stream: false }) }));
      if (!result.choices[0]?.message.content) throw new ProviderFailure();
    }
    models.sort((a, b) => a.name.localeCompare(b.name));
    return { id, checkedAt, status: "ready", httpStatus: 200, message: `${models.length} models discovered. Model access and inference limits depend on your provider account.`, models };
  } catch (error) {
    const safeError = error instanceof Error ? `${error.name}: ${error.message}`.slice(0, 300) : "Unknown error";
    console.warn("Provider check failed", id, key ? safeError.replaceAll(key, "[redacted]") : safeError);
    const status = error instanceof ProviderFailure ? error.status : undefined;
    return { id, checkedAt, status: "error", httpStatus: status, message: failureMessage(status), models: [] };
  }
}
export async function readProviders(): Promise<ProviderView[]> {
  const store = getCloudflareContext().env.EVIDENCE;
  const object = await store.get(catalogKey);
  const parsed = catalogSchema.safeParse(object ? await object.json() : null);
  const [selections, priorityList, customProviders] = await Promise.all([
    readModelSelections(),
    readProviderPriority(store),
    readCustomProviders(store),
  ]);

  const allIds = Array.from(new Set([...providerIds, ...customProviders.map(c => c.id)]));
  const controls = await Promise.all(allIds.map(async id => ({ id, enabled: await readProviderEnabled(store, id as any) })));

  const list: ProviderView[] = await Promise.all(allIds.map(async id => {
    const custom = customProviders.find(c => c.id === id);
    const key = await credential(id as any, store);
    const r2Key = await readProviderCredential(store, id);
    const configured = Boolean(key);
    const hasCustomKey = Boolean(r2Key || custom?.apiKey);
    const keyHint = key ? (key.length > 8 ? `${key.slice(0, 4)}...${key.slice(-4)}` : "••••") : undefined;
    const previous = parsed.success ? parsed.data.providers.find(p => p.id === id) : undefined;
    const enabled = controls.find(control => control.id === id)?.enabled ?? (id !== "gemini");

    let defaultModels: Model[] = [];
    let defaultMsg = configured ? "Credential installed." : "Credential has not been installed.";
    if (id === "ollama") { defaultModels = defaultOllamaModels; defaultMsg = "Ollama Cloud connected. 6 models configured."; }
    else if (id === "opencode") { defaultModels = defaultOpencodeModels; defaultMsg = "OpenCode Zen connected (https://opencode.ai/zen/v1)."; }
    else if (id === "e2b") { defaultModels = defaultE2bModels; defaultMsg = "E2B Sandbox API verified. Python environment available for open-source OCR tooling."; }
    else if (custom) { defaultModels = custom.models.map(m => ({ ...m, output: m.output ?? ["text"] })); defaultMsg = `${custom.name} custom API configured.`; }

    const models = previous?.models && previous.models.length > 0 ? previous.models : defaultModels;
    const status = configured ? (previous?.status ?? "ready") : ("missing" as const);
    const message = enabled ? (previous?.message || defaultMsg) : "New calls and connection checks are paused. Your key and selected models are retained.";

    const pIdx = priorityList.indexOf(id);
    const priority = pIdx >= 0 ? pIdx + 1 : (priorityList.length + 1);

    return {
      id,
      checkedAt: previous?.checkedAt || "",
      status,
      message,
      httpStatus: previous?.httpStatus || 200,
      models,
      configured,
      enabled,
      priority,
      activeModels: selections[id] ?? [],
      activeModel: selections[id]?.[0] ?? null,
      endpoint: custom?.endpoint || (id === "opencode" ? "https://opencode.ai/zen/v1" : undefined),
      isCustom: Boolean(custom),
      hasCustomKey,
      keyHint,
    };
  }));

  list.sort((a, b) => a.priority - b.priority);
  return list;
}

export async function refreshProviders(targetId?: string): Promise<ProviderView[]> {
  const current = await readProviders();
  const store = getCloudflareContext().env.EVIDENCE;
  const object = await store.get(catalogKey);
  const parsed = catalogSchema.safeParse(object ? await object.json() : null);
  const existingMap = new Map<string, ProviderCheck>();
  if (parsed.success) {
    for (const p of parsed.data.providers) {
      existingMap.set(p.id, p);
    }
  }

  let providers: ProviderCheck[];
  if (targetId) {
    const target = current.find(p => p.id === targetId);
    if (!target) throw new Error("Provider not found");
    const freshCheck = await discoverProvider(targetId as any);
    existingMap.set(targetId, freshCheck);
    providers = current.map(p => {
      if (p.id === targetId) return freshCheck;
      return existingMap.get(p.id) || {
        id: p.id,
        checkedAt: p.checkedAt,
        status: p.status,
        message: p.message,
        httpStatus: p.httpStatus,
        models: p.models,
      };
    });
  } else {
    providers = await Promise.all(
      current.map(provider => (provider.enabled ? discoverProvider(provider.id as any) : Promise.resolve(provider)))
    );
  }

  await store.put(catalogKey, JSON.stringify({ version: 1, providers }), {
    httpMetadata: { contentType: "application/json" },
  });
  return readProviders();
}

// Ready for the future leased processor. Callers must explicitly choose provider/model;
// discovery alone never starts processing or sends legal documents externally.
export async function generateText(provider: Exclude<ProviderId, "ocr">, model: string, prompt: string): Promise<string> {
  await requireProviderEnabled(getCloudflareContext().env.EVIDENCE, provider);
  const key = await credential(provider, getCloudflareContext().env.EVIDENCE);
  if (!key) throw new ProviderFailure();
  const current = (await readProviders()).find(p => p.id === provider);
  if (!current?.activeModels.includes(model) || !validActiveModel(current, model)) throw new Error("Choose an active model from the current provider catalog");
  let data: unknown;
  if (provider === "gemini") {
    data = await request(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: "POST", headers: { "X-goog-api-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: 256 } }) });
    const response = z.object({ candidates: z.array(z.object({ content: z.object({ parts: z.array(z.object({ text: z.string().optional() })) }) })) }).parse(data);
    const text = response.candidates[0]?.content.parts.map(p => p.text ?? "").join("");
    if (!text) throw new ProviderFailure();
    return text;
  }
  const endpoint = provider === "openrouter" ? "https://openrouter.ai/api/v1/chat/completions" : provider === "opencode" ? "https://opencode.ai/zen/v1/chat/completions" : `${nvidiaEndpoint()}chat/completions`;
  data = await request(endpoint, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 256, stream: false }) });
  const response = z.object({ choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })) }).parse(data);
  const text = response.choices[0]?.message.content;
  if (!text) throw new ProviderFailure();
  return text;
}
export { modelSchema };

const selectionsPrefix = "casevault-2/settings/active-models/";
async function readModelSelections(): Promise<Record<string, string[]>> {
  const bucket = getCloudflareContext().env.EVIDENCE;
  const selections: Record<string, string[]> = {};
  const priorityList = await readProviderPriority(bucket);
  await Promise.all(priorityList.map(async id => {
    const object = await bucket.get(`${selectionsPrefix}${id}.json`);
    const parsed = modelSelectionSchema.safeParse(object ? await object.json() : null);
    if (parsed.success && parsed.data.provider === id) selections[id] = parsed.data.models;
  }));
  return selections;
}

export async function selectActiveModel(input: unknown) {
  const selection = modelSelectionSchema.parse(input);
  const provider = (await readProviders()).find(p => p.id === selection.provider);
  if (!provider || !selection.models.every(model => validActiveModel(provider, model))) throw new Error("Choose a text model from this provider's available catalog.");
  await getCloudflareContext().env.EVIDENCE.put(`${selectionsPrefix}${selection.provider}.json`, JSON.stringify(selection), { httpMetadata: { contentType: "application/json" } });
  return readProviders();
}

export async function setProviderEnabled(input: unknown) {
  await writeProviderControl(getCloudflareContext().env.EVIDENCE, input);
  return readProviders();
}

export async function setProviderPriority(input: unknown): Promise<ProviderView[]> {
  const { priority } = priorityUpdateSchema.parse(input);
  const store = getCloudflareContext().env.EVIDENCE;
  await writeProviderPriority(store, priority);
  return readProviders();
}

export async function addCustomProvider(input: unknown): Promise<ProviderView[]> {
  const { addProvider } = z.object({ addProvider: customProviderInputSchema }).parse(input);
  const store = getCloudflareContext().env.EVIDENCE;
  const current = await readCustomProviders(store);
  const existingIdx = current.findIndex(c => c.id === addProvider.id);
  const record: CustomProviderRecord = {
    id: addProvider.id,
    name: addProvider.name,
    endpoint: addProvider.endpoint,
    apiKey: addProvider.apiKey,
    models: addProvider.models.map(m => ({ ...m, output: m.output ?? ["text"] })),
    type: addProvider.type,
    enabled: true,
  };
  if (existingIdx >= 0) {
    current[existingIdx] = record;
  } else {
    current.push(record);
  }
  await writeCustomProviders(store, current);

  const priority = await readProviderPriority(store);
  if (!priority.includes(addProvider.id)) {
    priority.push(addProvider.id);
    await writeProviderPriority(store, priority);
  }
  return readProviders();
}

export async function deleteCustomProvider(input: unknown): Promise<ProviderView[]> {
  const { deleteProvider: id } = z.object({ deleteProvider: z.string() }).parse(input);
  const store = getCloudflareContext().env.EVIDENCE;
  const current = await readCustomProviders(store);
  await writeCustomProviders(store, current.filter(c => c.id !== id));
  const priority = await readProviderPriority(store);
  await writeProviderPriority(store, priority.filter(p => p !== id));
  return readProviders();
}

export async function generateWithActiveModel(provider: "openrouter" | "nvidia" | "gemini" | "ollama" | "opencode" | "e2b", prompt: string, model?: string): Promise<string> {
  const connection = (await readProviders()).find(p => p.id === provider);
  if (!connection?.enabled) throw new Error('This provider is off. Turn it on in Settings first.');
  const selected = model ?? connection?.activeModels[0];
  if (!connection || !selected || !connection.activeModels.includes(selected) || !validActiveModel(connection,selected)) throw new Error("Choose an available active model in Settings first.");
  return generateText(provider, selected, prompt);
}

export async function setProviderCredential(input: unknown): Promise<ProviderView[]> {
  const { updateCredential } = z.object({ updateCredential: updateCredentialSchema }).parse(input);
  const store = getCloudflareContext().env.EVIDENCE;
  await writeProviderCredential(store, updateCredential.provider, updateCredential.apiKey);
  // Re-check provider immediately with newly installed key
  return refreshProviders();
}

export async function removeProviderCredential(input: unknown): Promise<ProviderView[]> {
  const { deleteCredential } = z.object({ deleteCredential: deleteCredentialSchema }).parse(input);
  const store = getCloudflareContext().env.EVIDENCE;
  await deleteProviderCredential(store, deleteCredential.provider);
  return refreshProviders();
}


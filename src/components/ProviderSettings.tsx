"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, CheckCircle2, CircleAlert, KeyRound, Loader2, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui";
import { providerNames, providerResponseSchema, type ProviderView } from "@/lib/provider-types";

export function ProviderSettings({ initialProviders }: { initialProviders: ProviderView[] }) {
  const [providers, setProviders] = useState(initialProviders);
  const [refreshing, setRefreshing] = useState(false);
  const [queries, setQueries] = useState<Record<string,string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  // Modal state for adding additional APIs
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProviderName, setNewProviderName] = useState("");
  const [newProviderId, setNewProviderId] = useState("");
  const [newEndpoint, setNewEndpoint] = useState("");
  const [newApiKey, setNewApiKey] = useState("");
  const [newModelsText, setNewModelsText] = useState("");
  const [newType, setNewType] = useState<"openai-compatible" | "ollama" | "e2b" | "custom">("openai-compatible");

  async function chooseModel(provider: string, models: string[]) {
    setSaving(provider); setError("");
    try {
      const response = await fetch("/api/settings/providers", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider, models }) });
      if (!response.ok) throw new Error();
      setProviders(providerResponseSchema.parse(await response.json()).providers);
    } catch { setError("Could not save that model. Refresh connections and try again."); }
    finally { setSaving(null); }
  }

  async function toggleProvider(provider: ProviderView) {
    setSaving(provider.id); setError('');
    try {
      const response = await fetch('/api/settings/providers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: provider.id, enabled: !provider.enabled }) });
      if (!response.ok) throw new Error();
      setProviders(providerResponseSchema.parse(await response.json()).providers);
    } catch { setError('Could not save the provider toggle. Please try again.'); }
    finally { setSaving(null); }
  }

  async function refresh() {
    setRefreshing(true); setError("");
    try {
      const response = await fetch("/api/settings/providers", { method: "POST" });
      if (!response.ok) throw new Error();
      const result = providerResponseSchema.parse(await response.json());
      setProviders(result.providers);
    } catch { setError("Could not refresh connections. Please try again."); }
    finally { setRefreshing(false); }
  }

  async function movePriority(index: number, direction: "up" | "down") {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= providers.length) return;
    const reordered = [...providers];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const priorityOrder = reordered.map(p => p.id);
    setSaving("priority"); setError("");
    try {
      const response = await fetch("/api/settings/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: priorityOrder }),
      });
      if (!response.ok) throw new Error();
      setProviders(providerResponseSchema.parse(await response.json()).providers);
    } catch {
      setError("Could not update API priority order.");
    } finally {
      setSaving(null);
    }
  }

  async function handleAddProvider(e: React.FormEvent) {
    e.preventDefault();
    if (!newProviderName.trim() || !newEndpoint.trim()) {
      setError("Name and endpoint are required.");
      return;
    }
    const slug = (newProviderId.trim() || newProviderName.toLowerCase().replace(/[^a-z0-9_-]/g, "-")).slice(0, 64);
    const parsedModels = newModelsText.split(/[\n,]/).map(m => m.trim()).filter(Boolean).map(id => ({ id, name: id, output: ["text"] }));

    setSaving("add-provider"); setError("");
    try {
      const response = await fetch("/api/settings/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addProvider: {
            id: slug,
            name: newProviderName.trim(),
            endpoint: newEndpoint.trim(),
            apiKey: newApiKey.trim() || undefined,
            models: parsedModels,
            type: newType,
          },
        }),
      });
      if (!response.ok) throw new Error();
      setProviders(providerResponseSchema.parse(await response.json()).providers);
      setShowAddModal(false);
      setNewProviderName("");
      setNewProviderId("");
      setNewEndpoint("");
      setNewApiKey("");
      setNewModelsText("");
    } catch {
      setError("Failed to add custom provider. Verify endpoint URL.");
    } finally {
      setSaving(null);
    }
  }

  async function deleteCustom(id: string) {
    if (!confirm("Are you sure you want to remove this custom API connection?")) return;
    setSaving(id); setError("");
    try {
      const response = await fetch("/api/settings/providers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteProvider: id }),
      });
      if (!response.ok) throw new Error();
      setProviders(providerResponseSchema.parse(await response.json()).providers);
    } catch {
      setError("Could not remove custom API connection.");
    } finally {
      setSaving(null);
    }
  }

  return <>
    <Card className="p-5">
      <h2 className="text-base font-semibold text-slate-800">Document workflow</h2>
      <div className="mt-4 grid gap-4 text-sm md:grid-cols-3">
        <div><p className="font-medium text-slate-700">Court docket imports</p><p className="mt-1 text-slate-500">Bypass routine document review. Flagged filings still need your attention.</p></div>
        <div><p className="font-medium text-slate-700">Knowledge Graph</p><p className="mt-1 text-slate-500">Placeholder for now.</p></div>
        <div><p className="font-medium text-slate-700">Extraction and AI processing</p><p className="mt-1 text-slate-500">The cloud processor handles approved pilot jobs. Model discovery alone does not start the document backlog.</p></div>
      </div>
    </Card>

    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">OCR and Cloud AI APIs</h2>
        <p className="mt-1 text-sm text-slate-500">
          Set API priority order (NVIDIA leads by default). Turn providers on or off without removing keys or model choices.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          disabled={refreshing || saving !== null}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
        >
          <Plus size={15} /> Add API
        </button>
        <button
          onClick={refresh}
          disabled={refreshing || saving !== null}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-50"
        >
          {refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          {refreshing ? "Checking connections…" : "Refresh connections"}
        </button>
      </div>
    </div>

    {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}

    <div className="grid items-start gap-5 xl:grid-cols-2">
      {providers.map((provider, index) => {
        const query = queries[provider.id] ?? "";
        const models = provider.models.filter(m => `${m.id} ${m.name}`.toLowerCase().includes(query.trim().toLowerCase()));
        const ready = provider.status === "ready";
        const displayName = providerNames[provider.id] || (provider as any).name || provider.id;

        return <Card key={provider.id} className="overflow-hidden border border-slate-200">
          <div className="p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                  Priority #{index + 1}
                </span>
                <h3 className="text-base font-semibold text-slate-800">{displayName}</h3>
                {provider.isCustom ? (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">
                    Custom
                  </span>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {/* Priority Reordering Controls */}
                <div className="flex items-center rounded-md border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    title="Increase API priority (move up)"
                    aria-label={`Increase priority for ${displayName}`}
                    disabled={index === 0 || saving !== null}
                    onClick={() => movePriority(index, "up")}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    title="Decrease API priority (move down)"
                    aria-label={`Decrease priority for ${displayName}`}
                    disabled={index === providers.length - 1 || saving !== null}
                    onClick={() => movePriority(index, "down")}
                    className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>

                <span className="text-xs font-medium text-slate-600">{provider.enabled ? 'On' : 'Off'}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={provider.enabled}
                  aria-label={`${displayName} provider`}
                  disabled={saving !== null || refreshing}
                  onClick={() => toggleProvider(provider)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 ${provider.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${provider.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>

                {provider.isCustom ? (
                  <button
                    type="button"
                    title="Remove custom API"
                    aria-label={`Remove ${displayName}`}
                    onClick={() => deleteCustom(provider.id)}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 size={15} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${!provider.enabled ? 'bg-slate-100 text-slate-600' : ready ? "bg-emerald-50 text-emerald-700" : provider.status === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                {provider.enabled && ready ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />}
                {!provider.enabled ? 'Provider paused' : ready ? "Connection verified" : provider.status === "error" ? "Check failed" : "Not checked"}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <KeyRound size={13} />
                {provider.configured ? "Credential installed" : "Credential missing"}
              </span>
              {provider.endpoint ? (
                <span className="truncate text-xs text-slate-400" title={provider.endpoint}>
                  {provider.endpoint}
                </span>
              ) : null}
            </div>

            <p className="mt-2 text-sm text-slate-600">
              {provider.enabled ? provider.message : 'New calls and connection checks are paused. Your key and selected models are retained.'}
            </p>
            {provider.checkedAt ? (
              <p className="mt-2 text-xs text-slate-400">Last checked: {new Date(provider.checkedAt).toLocaleString()}</p>
            ) : null}
          </div>

          {provider.id !== "ocr" ? <div className="border-t border-slate-100 p-5">
            <p className="mb-3 text-sm font-medium text-slate-700">
              {provider.enabled ? 'Active models' : 'Saved model selections'}: <span className="font-normal break-all">{provider.activeModels.length ? provider.activeModels.join(", ") : "None selected"}</span>
            </p>
            <label className="mb-3 block text-xs font-medium text-slate-600">
              Filter {displayName} models
              <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
                <Search size={16} className="text-slate-400" />
                <input
                  type="search"
                  aria-label={`Filter ${displayName} models`}
                  placeholder="Type a model name or ID…"
                  value={query}
                  onChange={e => setQueries(previous => ({...previous,[provider.id]:e.target.value}))}
                  className="w-full text-sm outline-none"
                />
                {query ? (
                  <button type="button" onClick={()=>setQueries(previous=>({...previous,[provider.id]:""}))} aria-label={`Clear ${displayName} model filter`} className="text-xs text-indigo-600">
                    Clear
                  </button>
                ) : null}
              </span>
            </label>
            {models.length===0 ? <p role="status" className="mb-3 text-sm text-slate-500">{query.trim() ? "No models match this filter." : "No models configured."}</p> : null}
            <div role="group" aria-label={`${displayName} active model`} className="flex max-h-72 flex-wrap gap-2 overflow-y-auto p-1">
              <button aria-pressed={provider.activeModels.length === 0} disabled={saving !== null || refreshing} onClick={() => chooseModel(provider.id, [])} className={`rounded-full border px-3 py-1.5 text-xs ${provider.activeModels.length === 0 ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600"}`}>Clear all</button>
              {models.map(model => (
                <button
                  key={model.id}
                  title={`${model.id}${model.contextWindow ? ` · ${model.contextWindow.toLocaleString()} token context` : ""}`}
                  aria-pressed={provider.activeModels.includes(model.id)}
                  disabled={saving !== null || refreshing || (!ready && !provider.isCustom) || (model.output !== undefined && !model.output.includes("text"))}
                  onClick={() => chooseModel(provider.id, provider.activeModels.includes(model.id) ? provider.activeModels.filter(id=>id!==model.id) : [...provider.activeModels,model.id])}
                  className={`max-w-full truncate rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-40 ${provider.activeModels.includes(model.id) ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:bg-indigo-50"}`}
                >
                  {model.name}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {saving === provider.id ? "Saving…" : `${models.length} of ${provider.models.length} discovered models. Priority order determines fallback precedence.`}
            </p>
          </div> : null}
        </Card>;
      })}
    </div>

    {/* Add Additional API Modal */}
    {showAddModal ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-800">Add API Connection</h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleAddProvider} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700">Provider Name</label>
              <input
                type="text"
                placeholder="e.g. Ollama Cloud, Opencode, Groq, E2B"
                value={newProviderName}
                onChange={e => setNewProviderName(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Provider ID / Slug (optional)</label>
              <input
                type="text"
                placeholder="e.g. groq, mistral (auto-generated if empty)"
                value={newProviderId}
                onChange={e => setNewProviderId(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">API Endpoint URL</label>
              <input
                type="url"
                placeholder="https://api.example.com/v1"
                value={newEndpoint}
                onChange={e => setNewEndpoint(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">API Key (optional)</label>
              <input
                type="password"
                placeholder="sk-..."
                value={newApiKey}
                onChange={e => setNewApiKey(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">Protocol / Type</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as any)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
              >
                <option value="openai-compatible">OpenAI-Compatible (Chat Completions)</option>
                <option value="ollama">Ollama Cloud / Native</option>
                <option value="e2b">E2B Code Sandbox (OCR Runtime)</option>
                <option value="custom">Custom Protocol</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700">
                Models (comma or line-separated)
              </label>
              <textarea
                placeholder="model-1, model-2"
                rows={2}
                value={newModelsText}
                onChange={e => setNewModelsText(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-slate-300 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving !== null}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving === "add-provider" ? "Adding…" : "Save Connection"}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null}
  </>;
}


"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, KeyRound, Loader2, RefreshCw, Search } from "lucide-react";
import { Card } from "@/components/ui";
import { providerNames, providerResponseSchema, type ProviderView } from "@/lib/provider-types";

export function ProviderSettings({ initialProviders }: { initialProviders: ProviderView[] }) {
  const [providers, setProviders] = useState(initialProviders);
  const [refreshing, setRefreshing] = useState(false);
  const [queries, setQueries] = useState<Record<string,string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
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
      <div><h2 className="text-lg font-semibold text-slate-800">OCR and cloud AI</h2><p className="mt-1 text-sm text-slate-500">Turn providers on or off without removing keys or model choices. Refresh checks only providers that are on.</p></div>
      <button onClick={refresh} disabled={refreshing || saving !== null} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}{refreshing ? "Checking connections…" : "Refresh connections"}</button>
    </div>
    {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
    <div className="grid items-start gap-5 xl:grid-cols-2">
      {providers.map(provider => {
        const query = queries[provider.id] ?? "";
        const models = provider.models.filter(m => `${m.id} ${m.name}`.toLowerCase().includes(query.trim().toLowerCase()));
        const ready = provider.status === "ready";
        return <Card key={provider.id} className="overflow-hidden">
          <div className="p-5"><div className="flex items-center justify-between gap-3"><h3 className="text-base font-semibold text-slate-800">{providerNames[provider.id]}</h3><div className="flex shrink-0 items-center gap-2"><span className="text-xs font-medium text-slate-600">{provider.enabled ? 'On' : 'Off'}</span><button type="button" role="switch" aria-checked={provider.enabled} aria-label={`${providerNames[provider.id]} provider`} disabled={saving !== null || refreshing} onClick={() => toggleProvider(provider)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 ${provider.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}><span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${provider.enabled ? 'translate-x-5' : 'translate-x-0.5'}`} /></button></div></div>
            <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${!provider.enabled ? 'bg-slate-100 text-slate-600' : ready ? "bg-emerald-50 text-emerald-700" : provider.status === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{provider.enabled && ready ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />}{!provider.enabled ? 'Provider paused' : ready ? "Connection verified" : provider.status === "error" ? "Check failed" : "Not checked"}</span>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><KeyRound size={13} />{provider.configured ? "Credential installed" : "Credential missing"}</p>
            <p className="mt-2 text-sm text-slate-600">{provider.enabled ? provider.message : 'New calls and connection checks are paused. Your key and selected models are retained.'}</p>
            {provider.checkedAt ? <p className="mt-2 text-xs text-slate-400">Last checked: {new Date(provider.checkedAt).toLocaleString()}</p> : null}
          </div>
          {provider.id !== "ocr" ? <div className="border-t border-slate-100 p-5">
            <p className="mb-3 text-sm font-medium text-slate-700">{provider.enabled ? 'Active models' : 'Saved model selections'}: <span className="font-normal break-all">{provider.activeModels.length ? provider.activeModels.join(", ") : "None selected"}</span></p>
            <label className="mb-3 block text-xs font-medium text-slate-600">Filter {providerNames[provider.id]} models
              <span className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><Search size={16} className="text-slate-400" /><input type="search" aria-label={`Filter ${providerNames[provider.id]} models`} placeholder="Type a model name or ID…" value={query} onChange={e => setQueries(previous => ({...previous,[provider.id]:e.target.value}))} className="w-full text-sm outline-none" />{query ? <button type="button" onClick={()=>setQueries(previous=>({...previous,[provider.id]:""}))} aria-label={`Clear ${providerNames[provider.id]} model filter`} className="text-xs text-indigo-600">Clear</button> : null}</span>
            </label>
            {models.length===0 ? <p role="status" className="mb-3 text-sm text-slate-500">{query.trim() ? "No models match this filter." : "No models available."}</p> : null}
            <div role="group" aria-label={`${providerNames[provider.id]} active model`} className="flex max-h-72 flex-wrap gap-2 overflow-y-auto p-1">
              <button aria-pressed={provider.activeModels.length === 0} disabled={saving !== null || refreshing} onClick={() => chooseModel(provider.id, [])} className={`rounded-full border px-3 py-1.5 text-xs ${provider.activeModels.length === 0 ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 text-slate-600"}`}>Clear all</button>
              {models.map(model => <button key={model.id} title={`${model.id}${model.contextWindow ? ` · ${model.contextWindow.toLocaleString()} token context` : ""}`} aria-pressed={provider.activeModels.includes(model.id)} disabled={saving !== null || refreshing || !ready || (model.output !== undefined && !model.output.includes("text"))} onClick={() => chooseModel(provider.id, provider.activeModels.includes(model.id) ? provider.activeModels.filter(id=>id!==model.id) : [...provider.activeModels,model.id])} className={`max-w-full truncate rounded-full border px-3 py-1.5 text-xs transition disabled:opacity-40 ${provider.activeModels.includes(model.id) ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-400 hover:bg-indigo-50"}`}>{model.name}</button>)}
            </div>
            <p className="mt-3 text-xs text-slate-400">{saving === provider.id ? "Saving…" : `${models.length} of ${provider.models.length} discovered models. Toggle pills independently; selections apply while the provider is on.`}</p>
            {provider.activeModels.some(id => !provider.models.some(m => m.id === id)) ? <p className="mt-2 text-xs text-amber-700">An active model is unavailable in the current catalog. Refresh or clear the selections.</p> : null}
          </div> : null}
        </Card>;
      })}
    </div>
  </>;
}

"use client";

import { useState } from "react";
import { CheckCircle2, CircleAlert, KeyRound, Loader2, RefreshCw, Search } from "lucide-react";
import { Card } from "@/components/ui";
import { providerNames, providerResponseSchema, type ProviderView } from "@/lib/provider-types";

export function ProviderSettings({ initialProviders }: { initialProviders: ProviderView[] }) {
  const [providers, setProviders] = useState(initialProviders);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
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
        <div><p className="font-medium text-slate-700">Extraction and AI processing</p><p className="mt-1 text-slate-500">Processing service pending. Connected providers and model discovery do not start the document backlog.</p></div>
      </div>
    </Card>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-slate-800">OCR and cloud AI</h2><p className="mt-1 text-sm text-slate-500">Credentials are stored privately. Refresh checks access and retrieves the current model lists.</p></div>
      <button onClick={refresh} disabled={refreshing} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{refreshing ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}{refreshing ? "Checking connections…" : "Refresh connections"}</button>
    </div>
    {error ? <p role="alert" className="text-sm text-rose-600">{error}</p> : null}
    <label className="flex max-w-md items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2"><Search size={16} className="text-slate-400" /><input aria-label="Search available models" placeholder="Search available models…" value={query} onChange={e => setQuery(e.target.value)} className="w-full text-sm outline-none" /></label>
    <div className="grid items-start gap-5 xl:grid-cols-2">
      {providers.map(provider => {
        const models = provider.models.filter(m => `${m.id} ${m.name}`.toLowerCase().includes(query.toLowerCase()));
        const ready = provider.status === "ready";
        return <Card key={provider.id} className="overflow-hidden">
          <div className="p-5"><div className="flex items-center justify-between gap-2"><h3 className="text-base font-semibold text-slate-800">{providerNames[provider.id]}</h3><span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${ready ? "bg-emerald-50 text-emerald-700" : provider.status === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>{ready ? <CheckCircle2 size={13} /> : <CircleAlert size={13} />}{ready ? "Connection verified" : provider.status === "error" ? "Check failed" : "Not checked"}</span></div>
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"><KeyRound size={13} />{provider.configured ? "Credential installed" : "Credential missing"}</p>
            <p className="mt-2 text-sm text-slate-600">{provider.message}</p>
            {provider.checkedAt ? <p className="mt-2 text-xs text-slate-400">Last checked: {new Date(provider.checkedAt).toLocaleString()}</p> : null}
          </div>
          {provider.models.length ? <div className="border-t border-slate-100"><div className="bg-slate-50 px-5 py-2 text-xs font-medium text-slate-500">{models.length} of {provider.models.length} discovered models</div><ul aria-label={`${providerNames[provider.id]} available models`} className="max-h-72 divide-y divide-slate-100 overflow-y-auto">{models.map(model => <li key={model.id} className="px-5 py-2.5"><p className="text-sm font-medium text-slate-700">{model.name}</p><p className="break-all text-xs text-slate-400">{model.id}{model.contextWindow ? ` · ${model.contextWindow.toLocaleString()} token context` : ""}</p></li>)}</ul>{!models.length ? <p className="px-5 py-3 text-sm text-slate-500">No models match your search.</p> : null}</div> : null}
        </Card>;
      })}
    </div>
  </>;
}

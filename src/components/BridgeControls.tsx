"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "./ui";
import { bridgeStateSchema, type BridgeState } from "@/lib/bridge-schema";
export function BridgeControls({ initialState }: { initialState: BridgeState }) {
  const [state, setState] = useState(initialState); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  async function refresh() { const response = await fetch("/api/bridges"); if (!response.ok) throw new Error(); setState(bridgeStateSchema.parse(await response.json())); }
  async function request(kind: "nyscef_refresh" | "notebooklm_sync", docketId: number) {
    setBusy(true); setMessage("");
    try { const response = await fetch("/api/bridges", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, docketId, requestId: crypto.randomUUID() }) }); if (!response.ok) throw new Error(); setMessage("Update queued. The local bridge will pick it up when running."); await refresh(); }
    catch { setMessage("Could not queue the update. Check the docket connection and try again."); }
    finally { setBusy(false); }
  }
  return <>
    <Card className="p-5"><div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-semibold">Local bridge</h2><p className="mt-2 text-sm text-slate-500">{state.heartbeat ? `Last seen ${new Date(state.heartbeat.seenAt).toLocaleString()}` : "No local bridge has checked in yet."}</p></div><button disabled={busy} onClick={() => { setBusy(true); void refresh().catch(() => setMessage("Could not refresh bridge status.")).finally(() => setBusy(false)); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">Refresh status</button></div><p className="mt-4 text-sm text-slate-500">Court challenges and expired NotebookLM sessions pause a job for your attention. Notebook updates preserve existing sources and reconcile before adding files.</p></Card>
    {message ? <p role="status" className="text-sm text-indigo-700">{message}</p> : null}
    <div className="grid gap-5 md:grid-cols-2">{state.dockets.map(docket => <Card key={docket.id} className="p-5"><p className="text-xs text-slate-400">{docket.indexNumber}</p><h2 className="mt-1 font-semibold text-slate-800">{docket.caption}</h2><div className="mt-4 flex flex-wrap gap-2"><button disabled={busy} onClick={() => request("nyscef_refresh", docket.id)} className="rounded-lg bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-40">Refresh NYSCEF</button><button disabled={busy || !docket.notebookId} onClick={() => request("notebooklm_sync", docket.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:opacity-40">Update NotebookLM</button></div><Link href={`/docket-key/${docket.id}`} className="mt-4 inline-block text-xs text-indigo-600">Open docket</Link></Card>)}</div>
    <Card className="overflow-hidden"><h2 className="border-b border-slate-100 p-5 font-semibold">Recent bridge work</h2>{state.jobs.length ? <ul className="divide-y divide-slate-100">{state.jobs.map(job => <li key={job.id} className="p-5"><div className="flex justify-between gap-3"><p className="text-sm font-medium">{job.kind === "nyscef_refresh" ? "NYSCEF refresh" : "NotebookLM update"}</p><span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{job.status.replaceAll("_", " ")}</span></div>{job.error ? <p className="mt-2 text-sm text-amber-700">{job.error}</p> : null}</li>)}</ul> : <p className="p-5 text-sm text-slate-500">No bridge jobs yet.</p>}</Card>
  </>;
}

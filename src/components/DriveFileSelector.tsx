"use client";
import Link from "next/link";
import { useState } from "react";
import { Folder, HardDriveUpload, Loader2, X } from "lucide-react";
import { driveListSchema, type DriveFile } from "@/lib/drive-schema";

type FolderPath = { id: string; name: string };
export function DriveFileSelector() {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [folders, setFolders] = useState<FolderPath[]>([{ id: "root", name: "My Drive" }]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Map<string, DriveFile>>(new Map());
  const [nextPage, setNextPage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imported, setImported] = useState<number[]>([]);
  async function load(path: FolderPath[], query: string, pageToken?: string) {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ folder: path.at(-1)!.id, q: query });
      if (pageToken) params.set("pageToken", pageToken);
      const response = await fetch(`/api/drive/files?${params}`);
      if (!response.ok) throw new Error();
      const result = driveListSchema.parse(await response.json());
      setFiles(previous => pageToken ? [...previous, ...result.files] : result.files);
      setNextPage(result.nextPageToken); setFolders(path); setConnected(true);
    } catch { setError("Drive access is unavailable. Connect or reconnect Drive. If access still fails, the Google Drive API needs to be enabled for this app."); }
    finally { setLoading(false); }
  }
  async function show() {
    setOpen(true); setLoading(true); setError(""); setImported([]);
    try {
      const response = await fetch("/api/drive/connection");
      const status = await response.json() as { connected: boolean };
      setConnected(status.connected);
      if (status.connected) await load([{ id: "root", name: "My Drive" }], "");
    } catch { setError("Could not check the Drive connection."); }
    finally { setLoading(false); }
  }
  function toggle(file: DriveFile) {
    const updated = new Map(selected);
    if (updated.has(file.id)) updated.delete(file.id);
    else if (updated.size < 5) updated.set(file.id, file);
    else { setError("Select up to five files at a time."); return; }
    setSelected(updated);
  }
  async function ingest() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/drive/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileIds: [...selected.keys()] }) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { results: { fileId: string; documentId?: number; error?: string }[] };
      setImported(result.results.flatMap(r => r.documentId ? [r.documentId] : []));
      setSelected(previous => { const updated = new Map(previous); result.results.filter(r => r.documentId).forEach(r => updated.delete(r.fileId)); return updated; });
      if (result.results.some(r => r.error)) setError("Some files could not be imported. Check the file format and 20 MB limit, or reconnect Drive.");
    } catch { setError("Could not import the selected files. Reconnect Drive and try again."); }
    finally { setLoading(false); }
  }

  // Temporarily hidden per workspace settings
  const hidden = true;
  if (hidden) return null;

  return <>
    <button onClick={show} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"><HardDriveUpload size={15} />Choose Drive files</button>
    {open ? <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><section role="dialog" aria-modal="true" aria-labelledby="drive-picker-title" className="flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h2 id="drive-picker-title" className="text-lg font-semibold">Choose Google Drive files</h2><p className="mt-1 text-xs text-slate-500">Imports copy files into CaseVault. Your Drive originals stay in place.</p></div><button aria-label="Close Drive file selector" disabled={loading} onClick={() => setOpen(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {!connected ? <div className="rounded-xl bg-slate-50 p-6 text-center"><p className="mb-4 text-sm text-slate-600">Authorize Google Drive access to browse and select your files.</p><Link href="/auth/google?drive=1" className="inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">Connect Google Drive</Link></div> : <>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">{folders.map((folder, i) => <button key={folder.id} disabled={loading} onClick={() => { setSearch(""); void load(folders.slice(0, i + 1), ""); }} className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-600 hover:bg-indigo-50">{folder.name}</button>)}</div>
          <form onSubmit={event => { event.preventDefault(); void load(folders, search); }} className="mb-4 flex gap-2"><input aria-label="Search Drive files" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search your Drive by filename…" className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm" /><button disabled={loading} className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white">Search</button></form>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-100">{files.map(file => file.mimeType === "application/vnd.google-apps.folder" ? <button key={file.id} disabled={loading} onClick={() => { setSearch(""); void load([...folders, { id: file.id, name: file.name }], ""); }} className="flex w-full items-center gap-3 p-3 text-left text-sm hover:bg-slate-50"><Folder size={17} className="text-amber-500" />{file.name}</button> : <label key={file.id} className="flex cursor-pointer items-center gap-3 p-3 hover:bg-slate-50"><input type="checkbox" disabled={loading} checked={selected.has(file.id)} onChange={() => toggle(file)} /><span className="min-w-0"><span className="block truncate text-sm text-slate-700">{file.name}</span><span className="block text-xs text-slate-400">{file.mimeType}{file.size ? ` · ${(Number(file.size) / 1024 / 1024).toFixed(1)} MB` : ""}</span></span></label>)}</div>
          {!loading && !files.length ? <p className="py-4 text-sm text-slate-500">No files found.</p> : null}
          {nextPage ? <button disabled={loading} onClick={() => load(folders, search, nextPage)} className="mt-3 text-sm font-medium text-indigo-600">Load more files</button> : null}
          <Link href="/auth/google?drive=1" className="mt-4 inline-block text-xs text-indigo-600">Reconnect Google Drive</Link>
        </>}
        {loading ? <p role="status" className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 size={15} className="animate-spin" />Working…</p> : null}
        {error ? <p role="alert" className="mt-4 text-sm text-rose-600">{error}</p> : null}
        {imported.length ? <div role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{imported.length} {imported.length === 1 ? "file" : "files"} added to CaseVault and queued for extraction. <div className="mt-2 flex flex-wrap gap-3">{imported.map(id => <Link key={id} href={`/documents/${id}`} className="underline">Open document {id}</Link>)}</div></div> : null}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 p-5"><p className="text-xs text-slate-500">{selected.size} selected · up to 5 files · 20 MB per file</p><button disabled={loading || !connected || selected.size === 0} onClick={ingest} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">Import selected files</button></div>
    </section></div> : null}
  </>;
}

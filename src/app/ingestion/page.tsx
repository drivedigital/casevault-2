import { db } from "@/db";
import { ingestionJobs, documents } from "@/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
export const dynamic="force-dynamic";
export default async function Ingestion() {
 const [jobs,docs]=await Promise.all([db.select().from(ingestionJobs).orderBy(asc(ingestionJobs.id)),db.select().from(documents)]);
 return <div><h1 className="text-2xl font-semibold">Ingestion queue</h1><p className="my-3 text-slate-500">{jobs.length} processing jobs. This queue tracks source acquisition, NotebookLM delivery, and document extraction. Approved pilot jobs run in the cloud. The remaining extraction backlog awaits expansion after pilot review.</p><p className="mb-5 text-sm text-slate-500">The <Link href="/documents" className="text-indigo-600 underline">document review queue</Link> is for your decisions and corrections. Court filings skip routine review but still need extraction.</p><div className="rounded-xl bg-white p-5"><table className="w-full text-left text-sm"><thead><tr><th>Document</th><th>Task</th><th>Status</th><th>Attempts</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id} className="border-t"><td className="py-3">{j.documentId?<Link href={`/documents/${j.documentId}`} className="text-indigo-600">{docs.find(d=>d.id===j.documentId)?.title??j.documentId}</Link>:"Inventory reconciliation"}</td><td>{{extract:"Extract text / OCR",pilot_process:"Pilot extraction + AI",nyscef_refresh:"Refresh court docket",notebooklm_sync:"Update NotebookLM"}[j.kind] ?? j.kind}</td><td>{j.status.replaceAll("_", " ")}{j.error?` — ${j.error}`:""}</td><td>{j.attempts}</td></tr>)}</tbody></table></div></div>;
}

import { db } from "@/db";
import { ingestionJobs, documents } from "@/db/schema";
import { asc } from "drizzle-orm";
import Link from "next/link";
export const dynamic="force-dynamic";
export default async function Ingestion() {
 const [jobs,docs]=await Promise.all([db.select().from(ingestionJobs).orderBy(asc(ingestionJobs.id)),db.select().from(documents)]);
 return <div><h1 className="text-2xl font-semibold">Ingestion queue</h1><p className="my-3 text-slate-500">{jobs.length} durable jobs. Queued work is waiting for the processing runner.</p><div className="rounded-xl bg-white p-5"><table className="w-full text-left text-sm"><thead><tr><th>Document</th><th>Task</th><th>Status</th><th>Attempts</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id} className="border-t"><td className="py-3">{j.documentId?<Link href={`/documents/${j.documentId}`} className="text-indigo-600">{docs.find(d=>d.id===j.documentId)?.title??j.documentId}</Link>:"Inventory reconciliation"}</td><td>{j.kind}</td><td>{j.status}{j.error?` — ${j.error}`:""}</td><td>{j.attempts}</td></tr>)}</tbody></table></div></div>;
}

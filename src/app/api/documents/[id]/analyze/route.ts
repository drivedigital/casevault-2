import { NextResponse } from "next/server";
import { db } from "@/db";
import { documents, ingestionJobs } from "@/db/schema";
import { eq } from "drizzle-orm";
export async function POST(_req: Request, context:{params:Promise<{id:string}>}) {
  const id=Number((await context.params).id);
  const [doc]=await db.select().from(documents).where(eq(documents.id,id));
  if (!doc) return NextResponse.json({error:"Document not found"},{status:404});
  const [job]=await db.insert(ingestionJobs).values({idempotencyKey:`extract:${doc.externalId??id}:${doc.sha256??"unknown"}:v1`,documentId:id,kind:"extract",payload:{objectKey:doc.objectKey,sha256:doc.sha256}}).onConflictDoNothing().returning();
  return NextResponse.json({document:doc,job:job??null,status:"queued",message:"Extraction queued; processing is not yet complete."},{status:202});
}

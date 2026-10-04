import { getCloudflareContext } from "@opennextjs/cloudflare";
import { NextResponse } from "next/server";
export async function POST(req: Request) {
  const form = await req.formData(); const file = form.get("file");
  if (!(file instanceof File) || !file.size || file.size > 50*1024*1024) return NextResponse.json({error:"File required; limit 50 MB"},{status:400});
  const bytes = await file.arrayBuffer();
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",bytes))).map(b=>b.toString(16).padStart(2,"0")).join("");
  const key=`casevault-2/originals/${hash}`;
  const bucket=getCloudflareContext().env.EVIDENCE;
  const existing = await bucket.head(key);
  if (!existing) await bucket.put(key,bytes,{httpMetadata:{contentType:file.type||"application/octet-stream"},customMetadata:{sha256:hash,filename:file.name}});
  return NextResponse.json({key,sha256:hash,size:file.size,bucket:"legal-evidence-arena",alreadyPresent:!!existing});
}

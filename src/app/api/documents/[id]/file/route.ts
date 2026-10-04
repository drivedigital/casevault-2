import { db } from "@/db";
import { documents } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
export async function GET(req:Request,context:{params:Promise<{id:string}>}) {
 const id=Number((await context.params).id);const [doc]=await db.select().from(documents).where(eq(documents.id,id));
 if (!doc?.objectKey) return new Response("Original not available",{status:404});
 const object=await getCloudflareContext().env.EVIDENCE.get(doc.objectKey);
 if(!object) return new Response("Original not available",{status:404});
 const headers=new Headers({"Cache-Control":"private, no-store","X-Content-Type-Options":"nosniff","Content-Security-Policy":"sandbox"});
 object.writeHttpMetadata(headers);
 headers.set("Content-Disposition",`${new URL(req.url).searchParams.get('download')==='1'?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(doc.fileName??"original")}`);
 return new Response(object.body,{headers});
}

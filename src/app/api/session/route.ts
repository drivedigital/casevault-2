import { z } from "zod";
import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { equalSecret, signSession } from "@/lib/auth";
export async function POST(req: Request) {
  if (req.headers.get("origin") !== new URL(req.url).origin) return NextResponse.json({error:"Invalid origin"},{status:403});
  const env = getCloudflareContext().env;
  const parsed=z.object({token:z.string().max(256)}).safeParse(await req.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:"Invalid login request"},{status:400});
  const body=parsed.data;
  if (!await equalSecret(String(body.token ?? ""), env.CASEVAULT_API_TOKEN)) return NextResponse.json({error:"Invalid access key"},{status:401});
  const session = await signSession(String(Date.now()+8*60*60*1000),env.SESSION_SECRET);
  const res = NextResponse.json({ok:true});
  res.cookies.set("cv2_session",session,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:28800});
  return res;
}

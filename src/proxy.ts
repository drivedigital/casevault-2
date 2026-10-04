import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { equalSecret, validSession } from "@/lib/auth";
export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/login" || path === "/api/session" || path === "/api/health") return NextResponse.next();
  const env = getCloudflareContext().env;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
  const tokenAuth = await equalSecret(bearer, env.CASEVAULT_API_TOKEN);
  const cookieAuth = await validSession(req.cookies.get("cv2_session")?.value ?? "", env.SESSION_SECRET);
  if (!tokenAuth && !cookieAuth) {
    if (path.startsWith("/api/")) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    return NextResponse.redirect(new URL("/login", req.url));
  }
  if (cookieAuth && !tokenAuth && !["GET","HEAD","OPTIONS"].includes(req.method)) {
    if (req.headers.get("origin") !== req.nextUrl.origin) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  const response = NextResponse.next();
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };

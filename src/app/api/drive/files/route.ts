import { NextResponse } from "next/server";
import { listDriveFiles } from "@/lib/drive";
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const folder = params.get("folder") ?? "root"; const search = params.get("q") ?? ""; const pageToken = params.get("pageToken") ?? undefined;
  if (!/^(root|[a-zA-Z0-9_-]{10,200})$/.test(folder) || search.length > 200 || (pageToken?.length ?? 0) > 2000) return NextResponse.json({ error: "Invalid file search." }, { status: 400 });
  try { return NextResponse.json(await listDriveFiles(folder, search, pageToken)); }
  catch { return NextResponse.json({ error: "Connect or reconnect Google Drive to browse files. The Google Drive API must be enabled for this app." }, { status: 409 }); }
}

import { NextResponse } from "next/server";
import { readProviders, refreshProviders, selectActiveModel } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({ providers: await readProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST() {
  return NextResponse.json({ providers: await refreshProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  try { return NextResponse.json({ providers: await selectActiveModel(await request.json()) }); }
  catch { return NextResponse.json({ error: "Choose a text model from this provider’s available catalog." }, { status: 400 }); }
}

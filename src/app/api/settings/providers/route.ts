import { NextResponse } from "next/server";
import { readProviders, refreshProviders } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({ providers: await readProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST() {
  return NextResponse.json({ providers: await refreshProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}

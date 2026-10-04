import { NextResponse } from "next/server";
import { readProviders, refreshProviders, selectActiveModel, setProviderEnabled } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({ providers: await readProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST() {
  return NextResponse.json({ providers: await refreshProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  try {
    const input: unknown = await request.json();
    const control = input !== null && typeof input === 'object' && Object.hasOwn(input, 'enabled');
    return NextResponse.json({ providers: await (control ? setProviderEnabled(input) : selectActiveModel(input)) });
  } catch { return NextResponse.json({ error: "Choose a valid provider toggle or models from this provider’s available text catalog." }, { status: 400 }); }
}

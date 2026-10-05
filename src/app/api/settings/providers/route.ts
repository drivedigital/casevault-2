import { NextResponse } from "next/server";
import { readProviders, refreshProviders, selectActiveModel, setProviderEnabled, setProviderPriority, addCustomProvider, deleteCustomProvider, setProviderCredential, removeProviderCredential } from "@/lib/providers";

export async function GET() {
  return NextResponse.json({ providers: await readProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}
export async function POST() {
  return NextResponse.json({ providers: await refreshProviders() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request) {
  try {
    const input: unknown = await request.json();
    if (input !== null && typeof input === 'object') {
      if (Object.hasOwn(input, 'priority')) {
        return NextResponse.json({ providers: await setProviderPriority(input) });
      }
      if (Object.hasOwn(input, 'updateCredential')) {
        return NextResponse.json({ providers: await setProviderCredential(input) });
      }
      if (Object.hasOwn(input, 'deleteCredential')) {
        return NextResponse.json({ providers: await removeProviderCredential(input) });
      }
      if (Object.hasOwn(input, 'addProvider')) {
        return NextResponse.json({ providers: await addCustomProvider(input) });
      }
      if (Object.hasOwn(input, 'deleteProvider')) {
        return NextResponse.json({ providers: await deleteCustomProvider(input) });
      }
      if (Object.hasOwn(input, 'enabled')) {
        return NextResponse.json({ providers: await setProviderEnabled(input) });
      }
    }
    return NextResponse.json({ providers: await selectActiveModel(input) });
  } catch { return NextResponse.json({ error: "Choose a valid provider toggle or models from this provider’s available text catalog." }, { status: 400 }); }
}


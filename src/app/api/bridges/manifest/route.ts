import { NextResponse } from "next/server";
import { docketManifest } from "@/lib/bridges";
import { machineAuthorized } from "@/lib/machine-auth";
export async function GET(request: Request) {
  if (!await machineAuthorized(request)) return NextResponse.json({ error: "Machine credential required." }, { status: 403 });
  const id = Number(new URL(request.url).searchParams.get("docketId"));
  if (!Number.isSafeInteger(id) || id < 1) return NextResponse.json({ error: "Invalid docket." }, { status: 400 });
  const manifest = await docketManifest(id);
  return NextResponse.json(manifest ?? { error: "Docket not found." }, { status: manifest ? 200 : 404 });
}

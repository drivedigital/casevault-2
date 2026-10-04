import { NextResponse } from "next/server";
import { leaseBridgeJob } from "@/lib/bridges";
import { machineAuthorized } from "@/lib/machine-auth";
export async function POST(request: Request) {
  if (!await machineAuthorized(request)) return NextResponse.json({ error: "Machine credential required." }, { status: 403 });
  return NextResponse.json({ job: await leaseBridgeJob() });
}

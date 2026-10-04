import { NextResponse } from "next/server";
import { driveStatus, disconnectDrive } from "@/lib/drive";
export async function GET() { return NextResponse.json(await driveStatus()); }
export async function DELETE() { await disconnectDrive(); return NextResponse.json({ connected: false }); }

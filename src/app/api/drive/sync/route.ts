import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({error:"Google Drive OAuth authorization and a selected folder are required. This connector is not configured."},{status:409}); }

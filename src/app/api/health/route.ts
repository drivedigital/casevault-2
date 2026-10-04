import { NextResponse } from "next/server";
export async function GET() { return NextResponse.json({service:"casevault-2",version:"2.0.0",status:"up"}); }

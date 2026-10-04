import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({error:"A complete dated docket manifest is required. Import it through the documented acquisition bridge."},{status:409}); }

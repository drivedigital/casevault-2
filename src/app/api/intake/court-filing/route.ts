import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({error:"Use /api/objects to preserve original bytes, then /api/intake/bootstrap with a verified manifest. Interactive court retrieval is not enabled yet."},{status:409}); }

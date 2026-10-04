import { NextResponse } from "next/server";
export async function POST() { return NextResponse.json({error:"Reviewed reversible merging is not enabled yet. Source identities remain separate."},{status:409}); }

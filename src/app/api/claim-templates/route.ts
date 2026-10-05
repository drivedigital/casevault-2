import { NextResponse } from "next/server";
import { CLAIM_TEMPLATES } from "@/lib/claim-templates";

export function GET() {
  return NextResponse.json({
    templates: CLAIM_TEMPLATES.map(({ elements, ...t }) => ({ ...t, elementCount: elements.length })),
  });
}

import { NextResponse } from "next/server";
import { readUseCaseRanks, writeUseCaseRanks, getAvailableActiveModels, getDefaultRanks } from "@/lib/use-case-ranks";

export async function GET() {
  const [ranks, availableModels] = await Promise.all([
    readUseCaseRanks(),
    getAvailableActiveModels(),
  ]);
  const defaults = getDefaultRanks(availableModels);
  return NextResponse.json(
    { ranks, availableModels, defaults },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export async function PATCH(request: Request) {
  try {
    const input = await request.json();
    const ranks = await writeUseCaseRanks(input);
    const availableModels = await getAvailableActiveModels();
    return NextResponse.json({ success: true, ranks, availableModels });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Invalid use case ranking schema";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

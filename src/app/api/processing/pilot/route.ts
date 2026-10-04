import { NextResponse } from 'next/server';
import { z } from 'zod';
import { installPilot, migrateProcessingRequests, pilotState } from '@/lib/processing';
export async function GET() { return NextResponse.json(await pilotState()); }
export async function POST(req: Request) { try {
    const input = z.object({ documentIds: z.array(z.number().int().positive()).length(10) }).parse(await req.json());
    return NextResponse.json({ pilot: await installPilot(input.documentIds), migrated: await migrateProcessingRequests() });
}
catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid pilot' }, { status: 400 });
} }

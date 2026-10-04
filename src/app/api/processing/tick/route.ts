import { NextResponse } from 'next/server';
import { z } from 'zod';
import { machineAuthorized } from '@/lib/machine-auth';
import { processTick, renewProcessingLease } from '@/lib/processing';
export async function POST(req: Request) { if (!await machineAuthorized(req))
    return NextResponse.json({ error: 'Machine credential required' }, { status: 403 }); return NextResponse.json(await processTick()); }
export async function PATCH(req: Request) { if (!await machineAuthorized(req))
    return NextResponse.json({ error: 'Machine credential required' }, { status: 403 }); try {
    const input = z.object({ jobId: z.number().int().positive(), leaseToken: z.uuid() }).parse(await req.json());
    await renewProcessingLease(input.jobId, input.leaseToken);
    return NextResponse.json({ status: 'renewed' });
}
catch {
    return NextResponse.json({ error: 'Invalid or expired lease' }, { status: 409 });
} }

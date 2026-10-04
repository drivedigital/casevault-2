import { NextResponse } from 'next/server';
import { z } from 'zod';
import { updateRun } from '@/lib/processing';
export async function PATCH(req: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { try {
    const id = z.uuid().parse((await params).id);
    const input = z.object({ action: z.enum(['retry', 'accepted', 'rejected']) }).parse(await req.json());
    return NextResponse.json(await updateRun(id, input.action));
}
catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Invalid run action' }, { status: 400 });
} }

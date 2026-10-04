import { NextResponse } from 'next/server';
import { processingHistory } from '@/lib/processing';
export async function GET(_req: Request, { params }: {
    params: Promise<{
        id: string;
    }>;
}) { const id = Number((await params).id); if (!Number.isSafeInteger(id) || id < 1)
    return NextResponse.json({ error: 'Invalid document' }, { status: 400 }); return NextResponse.json(await processingHistory(id)); }

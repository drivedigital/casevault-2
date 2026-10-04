import {NextResponse} from 'next/server';
import {z} from 'zod';
import {createProcessingRequest,approveRequest,processingHistory} from '@/lib/processing';
export async function GET(req:Request){const id=Number(new URL(req.url).searchParams.get('documentId'));if(!Number.isSafeInteger(id)||id<1)return NextResponse.json({error:'Invalid document'},{status:400});return NextResponse.json({instructions:(await processingHistory(id)).requests});}
export async function POST(req:Request){try{return NextResponse.json({instruction:await createProcessingRequest(await req.json())},{status:201});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Invalid processing request'},{status:400});}}
export async function PATCH(req:Request){try{const input=z.object({requestId:z.uuid()}).parse(await req.json());return NextResponse.json({run:await approveRequest(input.requestId)});}catch(error){return NextResponse.json({error:error instanceof Error?error.message:'Approval failed'},{status:400});}}

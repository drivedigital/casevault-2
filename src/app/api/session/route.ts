import {NextResponse} from 'next/server';
export async function POST(){return NextResponse.json({error:'Workspace access uses Google sign-in. Service credentials cannot create browser sessions.'},{status:410});}

import { NextResponse } from 'next/server';
import { readAgents,saveAgent,setAgentActive,bindAgentModel } from '@/lib/agent-workspace';
import { z } from 'zod';
export async function GET(){return NextResponse.json({agents:await readAgents()});}
export async function POST(req:Request){try{return NextResponse.json({agent:await saveAgent(await req.json())},{status:201});}catch{return NextResponse.json({error:'Provide a name, provider and instructions.'},{status:400});}}
export async function PATCH(req:Request){try{const input=z.object({id:z.uuid(),active:z.boolean().optional(),modelId:z.string().min(1).max(256).nullable().optional()}).parse(await req.json());if(input.active===undefined&&input.modelId===undefined)throw new Error('No fields');const agent=input.modelId!==undefined?await bindAgentModel(input.id,input.modelId):await setAgentActive(input.id,input.active!);return NextResponse.json(agent?{agent}:{error:'Agent not found'},{status:agent?200:404});}catch{return NextResponse.json({error:'Invalid agent update'},{status:400});}}

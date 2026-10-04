import 'server-only';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { z } from 'zod';
export const agentSchema=z.object({name:z.string().trim().min(1).max(100),provider:z.enum(['openrouter','nvidia','gemini']),instructions:z.string().trim().min(1).max(4000),active:z.boolean().default(true)});
export type WorkspaceAgent=z.infer<typeof agentSchema>&{id:string;createdAt:string};
export async function readAgents():Promise<WorkspaceAgent[]>{const objects=await getCloudflareContext().env.EVIDENCE.list({prefix:'casevault-2/agents/'});const agents=await Promise.all(objects.objects.map(async o=>(await getCloudflareContext().env.EVIDENCE.get(o.key))?.json<WorkspaceAgent>()));return agents.filter((a):a is WorkspaceAgent=>!!a);}
export async function saveAgent(input:unknown){const value=agentSchema.parse(input);const agent={...value,id:crypto.randomUUID(),createdAt:new Date().toISOString()};await getCloudflareContext().env.EVIDENCE.put(`casevault-2/agents/${agent.id}.json`,JSON.stringify(agent));return agent;}
export async function setAgentActive(id:string,active:boolean){z.uuid().parse(id);const bucket=getCloudflareContext().env.EVIDENCE;const object=await bucket.get(`casevault-2/agents/${id}.json`);if(!object)return null;const agent=await object.json<WorkspaceAgent>();agent.active=active;await bucket.put(object.key,JSON.stringify(agent));return agent;}
export const instructionSchema=z.object({documentId:z.number().int().positive(),agentId:z.uuid(),prompt:z.string().trim().min(1).max(4000)});
export async function readInstructions(documentId:number){const objects=await getCloudflareContext().env.EVIDENCE.list({prefix:`casevault-2/processing-instructions/${documentId}/`});return Promise.all(objects.objects.map(async o=>(await getCloudflareContext().env.EVIDENCE.get(o.key))?.json()));}

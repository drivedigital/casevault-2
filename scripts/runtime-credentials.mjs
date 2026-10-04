import { config } from 'dotenv';
config({path:'.env.local',quiet:true});
export const endpoint=process.env.CASEVAULT_ENDPOINT||'https://casevault-2.dan-2eb.workers.dev';
export function authHeaders(){ if(!process.env.CASEVAULT_API_TOKEN)throw new Error('Missing machine credential');return {Authorization:`Bearer ${process.env.CASEVAULT_API_TOKEN}`};}
export async function api(path,options={}){
 let res;
 for(let attempt=0;attempt<4;attempt++){
  try { res=await fetch(endpoint+path,{...options,headers:{...authHeaders(),...options.headers},signal:AbortSignal.timeout(60000)}); if(res.status<500)break; }
  catch(error){if(attempt===3)throw error;}
  if(attempt===3)break;
  await new Promise(resolve=>setTimeout(resolve,1000*2**attempt));
 }
 if(!res.ok)throw new Error(`${path}: HTTP ${res.status}: ${(await res.text()).slice(0,500)}`);
 return res.json();
}
export async function importRows(kind,rows){const result=[];for(let offset=0;offset<rows.length;offset+=100){const batch=await api('/api/intake/bootstrap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind,rows:rows.slice(offset,offset+100)})});result.push(...batch);}return result;}

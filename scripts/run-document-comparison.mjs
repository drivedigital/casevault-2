// App-controlled, resumable hosted OCR comparison; PDF rendering is not local OCR.
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Agent,setGlobalDispatcher,fetch as httpFetch} from 'undici';
setGlobalDispatcher(new Agent({allowH2:false,connections:6}));
import {api,authHeaders} from './runtime-credentials.mjs';
const endpoint=process.env.COMPARISON_ENDPOINT||'https://casevault-2-ocr-comparison.dan-2eb.workers.dev';
const directory='.private/doc8-comparison';mkdirSync(directory,{recursive:true});
const models=['kimi','qwen','nano','gemma','dots','deepseekocr','nemotronocr','moondream','llama90','deepseekflash'];
const pages=Array.from({length:13},(_,i)=>{const path=`.private/ocr-benchmark/page-${String(i+1).padStart(2,'0')}.png`;return {page:i+1,path,sha256:createHash('sha256').update(readFileSync(path)).digest('hex')};});
async function call(path,opts={}){const r=await httpFetch(endpoint+path,{...opts,headers:{...authHeaders(),...opts.headers},signal:AbortSignal.timeout(240000)});const data=await r.json();if(!r.ok)throw Error(`HTTP ${r.status}: ${data.error}`);return data;}
let run;
if(existsSync(directory+'/run.json'))run=JSON.parse(readFileSync(directory+'/run.json'));
else{const agent=(await api('/api/agents')).agents.find(a=>a.provider==='nvidia'&&a.modelId==='nvidia/nemotron-3.5-lightning-30b-a3b'&&a.active);if(!agent)throw Error('Explicit NVIDIA agent binding missing');run=await call('/runs',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({documentId:1008,originalHash:'9b7583985dfc3e190ff5b5eb7a6904f645c40eea1abb35032bfbc82880363cee',models,pages:pages.map(({page,sha256})=>({page,sha256})),renderer:'Poppler PNG 130 DPI; all original physical pages',agent})});writeFileSync(directory+'/run.json',JSON.stringify(run,null,2),{mode:0o600});}
console.log(JSON.stringify({event:'comparison',id:run.id,models:run.models.map(m=>m.id),pages:13}));
const queue=[...run.models];
async function worker(){while(queue.length){const model=queue.shift();mkdirSync(`${directory}/${model.id}`,{recursive:true});for(const page of pages){const path=`${directory}/${model.id}/page-${page.page}.json`;if(existsSync(path))continue;try{const receipt=await call(`/runs/${run.id}/pages/${model.id}/${page.page}`,{method:'POST',headers:{'Content-Type':'image/png'},body:readFileSync(page.path)});writeFileSync(path,JSON.stringify(receipt,null,2),{mode:0o600});console.log(JSON.stringify({model:model.id,page:page.page,state:receipt.state,elapsedMs:receipt.elapsedMs,error:receipt.error}));if(receipt.error?.includes('429'))await new Promise(r=>setTimeout(r,30000));}catch(e){console.log(JSON.stringify({model:model.id,page:page.page,transportError:e.message}));}}
}}
await Promise.all([worker(),worker(),worker()]);
const state=await call(`/runs/${run.id}`);writeFileSync(directory+'/state.json',JSON.stringify(state,null,2),{mode:0o600});console.log(JSON.stringify({event:'extraction-finished',id:run.id,pages:state.receipts.length,complete:state.receipts.filter(p=>p.state==='complete').length,failed:state.receipts.filter(p=>p.state==='failed').length}));

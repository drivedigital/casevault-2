import {test} from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import worker,{originalHash,candidates} from '../comparison-worker/worker.mjs';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
const workspaceId='b37e40d6-4746-490c-9b73-ea46e15e2b01',id='aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
const prefix=`casevault-2/workspaces/${workspaceId}/ocr-comparisons/${id}/`;
const bytes=new TextEncoder().encode('test-page');
const imageHash=Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex');
function setup(){
 const data=new Map();let count=0;
 const store={async get(k){const obj=data.get(k);return obj?{etag:obj.etag,json:async()=>JSON.parse(obj.body),body:new TextEncoder().encode(obj.body)}:null},async put(k,body,opts={}){const old=data.get(k);if(opts.onlyIf?.etagDoesNotMatch==='*'&&old)return null;if(opts.onlyIf?.etagMatches&&old?.etag!==opts.onlyIf.etagMatches)return null;const etag=String(++count);data.set(k,{body:String(body),etag});return {etag};},async list({prefix}){return {objects:[...data.keys()].filter(k=>k.startsWith(prefix)).map(key=>({key}))};}};
 const manifest={id,workspaceId,documentId:1008,originalHash,models:[candidates.find(c=>c.id==='moondream')],pages:Array.from({length:13},(_,i)=>({page:i+1,sha256:imageHash})),approvedAt:new Date().toISOString()};
 data.set(prefix+'manifest.json',{body:JSON.stringify(manifest),etag:'manifest'});
 let calls=0;
 const env={WORKSPACE_ID:workspaceId,CASEVAULT_API_TOKEN:'test-secret',EVIDENCE:store,AI:{async run(){calls++;return {result:{answer:'Complete page transcription for the bounded comparison.',finish_reason:'stop'}};}}};
 const request=(path,method='GET',body,auth=true)=>new Request('https://test/runs/'+id+path,{method,headers:{...(auth?{Authorization:'Bearer test-secret'}:{}),'Content-Type':'image/png'},body});
 return {env,request,data,store,calls:()=>calls};
}
test('public visitors cannot start inference or publish PDF artifacts',async()=>{const s=setup();for(const path of ['/pages/moondream/1','/artifacts/moondream','/analysis/moondream'])assert.equal((await worker.fetch(s.request(path,'POST',bytes,false),s.env)).status,401);assert.equal(s.calls(),0);});
test('only approved workspace, model, physical page and image hash execute',async()=>{const s=setup();for(const path of ['/pages/kimi/1','/pages/moondream/14','/pages/moondream/0'])assert.equal((await worker.fetch(s.request(path,'POST',bytes),s.env)).status,400);assert.equal((await worker.fetch(s.request('/pages/moondream/1','POST',new TextEncoder().encode('changed')),s.env)).status,400);s.env.WORKSPACE_ID='another-workspace';assert.equal((await worker.fetch(s.request(''),s.env)).status,400);assert.equal(s.calls(),0);});
test('page replay reuses receipt, wrapped Moondream response parses, and immutable attempt exists',async()=>{const s=setup();const first=await worker.fetch(s.request('/pages/moondream/1','POST',bytes),s.env);const receipt=await first.json();assert.equal(receipt.state,'complete');assert.equal(receipt.attempt,1);assert.ok(s.data.has(receipt.receiptKey));const second=await worker.fetch(s.request('/pages/moondream/1','POST',bytes),s.env);assert.equal((await second.json()).receiptKey,receipt.receiptKey);assert.equal(s.calls(),1);});
test('active lease blocks duplicate execution and a changed lease blocks stale completion',async()=>{const s=setup();await s.store.put(prefix+'leases/moondream/1.json',JSON.stringify({token:'busy',until:Date.now()+10000}));assert.equal((await worker.fetch(s.request('/pages/moondream/1','POST',bytes),s.env)).status,409);assert.equal(s.calls(),0);await s.store.put(prefix+'leases/moondream/1.json',JSON.stringify({token:'old',until:0}));s.env.AI.run=async()=>{await s.store.put(prefix+'leases/moondream/1.json',JSON.stringify({token:'replacement',until:Date.now()+10000}));return {answer:'This completion must never become authoritative.'};};const response=await worker.fetch(s.request('/pages/moondream/1','POST',bytes),s.env);assert.equal(response.status,400);assert.match((await response.json()).error,/Stale/);assert.equal(s.data.has(prefix+'pages/moondream/1.json'),false);});
test('quota-error text inside historical nominal success is reported as failure',async()=>{const s=setup();await s.store.put(prefix+'pages/dots/4.json',JSON.stringify({modelId:'dots',page:4,state:'complete',output:{text:'Error processing image: You have exceeded your ZeroGPU quota'}}));const r=await worker.fetch(s.request('','GET',undefined,false),s.env);assert.equal((await r.json()).receipts[0].state,'failed');});

import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {api,authHeaders,endpoint} from './runtime-credentials.mjs';
const jobs=await api('/api/ingestion');
assert.equal(jobs.length,506);
assert.equal(jobs.filter(j=>j.status==='queued').length,506);
const checks=[];
for(const route of ['/','/documents','/ingestion','/matters','/docket-key','/converge']){
 const response=await fetch(endpoint+route,{headers:authHeaders()});assert.equal(response.status,200,route);const html=await response.text();assert(!html.includes('Application error'));checks.push({route,status:response.status});
}
for(const route of ['/api/ingestion',`/api/documents/${jobs[0].documentId}/file`]){const r=await fetch(endpoint+route,{redirect:'manual'});assert.equal(r.status,401);}
const sample=[0,35,69,70,85,101,102,200,350,505];
const files=[];
for(const n of sample){const job=jobs[n];const res=await fetch(endpoint+`/api/documents/${job.documentId}/file`,{headers:authHeaders()});assert.equal(res.status,200);const bytes=Buffer.from(await res.arrayBuffer());const hash=createHash('sha256').update(bytes).digest('hex');assert.equal(hash,job.payload.sha256);files.push({documentId:job.documentId,sha256:hash,bytes:bytes.length});}
const invalid=await fetch(endpoint+'/api/intake/bootstrap',{method:'POST',headers:{...authHeaders(),'Content-Type':'application/json'},body:JSON.stringify({kind:'documents',rows:[{externalId:'invalid',title:'invalid',sourceType:'upload',pageCount:1,sha256:'bad'}]})});assert.equal(invalid.status,400);
const login=await fetch(endpoint+'/api/session',{method:'POST',headers:{'Content-Type':'application/json',Origin:endpoint},body:JSON.stringify({token:process.env.CASEVAULT_API_TOKEN})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
assert.equal((await fetch(endpoint+'/api/ingestion',{headers:{Cookie:cookie}})).status,200);
assert.equal((await fetch(endpoint+'/api/intake/bootstrap',{method:'POST',headers:{Cookie:cookie,Origin:endpoint,'Content-Type':'application/json'},body:'{}'})).status,403);
assert.equal((await fetch(endpoint+'/api/objects',{method:'POST',headers:{Cookie:cookie,Origin:'https://untrusted.example'}})).status,403);
const replay=await api('/api/intake/bootstrap',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'jobs',rows:jobs.slice(0,10).map(j=>({idempotencyKey:j.idempotencyKey,documentId:j.documentId,kind:j.kind,payload:j.payload}))})});assert.equal(replay.length,0);assert.equal((await api('/api/ingestion')).length,506);
const report={verifiedAt:new Date().toISOString(),queueCount:506,pages:checks,originalReadback:files,unauthenticatedApiRejected:true,invalidImportRejected:true,browserSessionVerified:true,cookieBootstrapRejected:true,crossOriginMutationRejected:true,queueReplayCreated:0};
await fs.writeFile('docs/deployment-verification.json',JSON.stringify(report,null,2));console.log(JSON.stringify({queueCount:506,pages:checks.length,hashVerifiedReadbacks:files.length,securityChecks:'passed',duplicateJobs:0}));

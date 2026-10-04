import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { api, importRows } from './runtime-credentials.mjs';
const root=path.resolve('.private');
const corpus=JSON.parse(await fs.readFile(path.join(root,'corpus.json'),'utf8'));
const notion=JSON.parse(await fs.readFile(path.join(root,'notion-import.json'),'utf8'));
const base='/Users/dangeorge/Documents/Codex/2026-10-02/check-the-build-plan-for-this/outputs';
const jsonRelations=value=>{try{return JSON.parse(value??'[]')}catch{return []}};
const clean=value=>value?.replace(/\*\*/g,'').trim()||null;
const notionId=url=>url.split('/').at(-1);
const matterRows=notion.lawsuits.filter(r=>!r['Case Name'].includes('Dominguez')).map(r=>({externalId:`notion:${notionId(r.url)}`,name:clean(r['Case Name']),caseNumber:r['Case Name']==='IR Bankruptcy'?'1-26-44227-jmm':clean(r['Index Number']),court:r['Case Name']==='IR Bankruptcy'?'EDNY Bankruptcy Court':clean(r.Court),provenance:{source:'notion',url:r.url,raw:r,importVersion:'2026-10-03-v1'}}));
matterRows.push({externalId:'legacy:m-510w42',name:'510W42 evidence collection',description:'Research collection retained separately from its related court proceedings.',provenance:{source:'legacy Cloudflare inventory'}});
const matters=await importRows('matters',matterRows);
const matterForUrl=url=>matters.find(r=>r.externalId===`notion:${notionId(url)}`)?.id;
const contacts=await importRows('contacts',[...notion.litigants.map(r=>({externalId:`notion:litigant:${notionId(r.url)}`,displayName:r.Name,type:/LLC|230CPS|City of/.test(r.Name)?'organization':'individual',provenance:{source:'notion',url:r.url,entityType:'litigant',raw:r}})),...notion.lawyers.map(r=>({externalId:`notion:lawyer:${notionId(r.url)}`,displayName:r.Name,type:'individual',primaryEmail:clean(r.Email),primaryPhone:clean(r.Phone),notes:r.Firm?`Firm: ${r.Firm}`:null,provenance:{source:'notion',url:r.url,entityType:'lawyer',raw:r}}))]);
const roles=[];
for(const r of [...notion.litigants,...notion.lawyers]){
 const type=notion.litigants.includes(r)?'litigant':'lawyer';const actor=contacts.find(c=>c.externalId===`notion:${type}:${notionId(r.url)}`);
 for(const url of jsonRelations(r.Cases)){const matterId=matterForUrl(url);if(matterId)roles.push({contactId:actor.id,matterId,capacity:type,roleLabel:type==='lawyer'?'Counsel listed in Notion':'Party listed in Notion'});}
}
await importRows('roles',roles);
const docketRows=corpus.dockets.map(d=>{const r=notion.lawsuits.find(n=>clean(n['Index Number'])===d.case_number||n.url.endsWith(d.slug==='nasca'?'3b8e64c0cfff8038af2bfcac475149fc':'42fe64c0cfff831dbad501d91f9dba6f'));return {externalId:`nyscef:${d.slug}`,matterId:r?matterForUrl(r.url):null,indexNumber:d.case_number,court:d.court,caption:d.caption,sourceUrl:d.source_url,notebookId:d.notebook_id}});
const dockets=await importRows('dockets',docketRows);
let checkpoint={};try{checkpoint=JSON.parse(await fs.readFile(path.join(root,'object-checkpoint.json'),'utf8'))}catch{}
const files=[...corpus.dockets.flatMap(d=>d.files.map(f=>({...f,docket:d}))),...corpus.legacy];
let next=0,done=0;
async function uploadLoop(){while(next<files.length){const f=files[next++];const hash=f.metadata.sha256;if(!checkpoint[hash]){const bytes=await fs.readFile(f.path);const digest=createHash('sha256').update(bytes).digest('hex');if(digest!==hash)throw new Error('Changed original: '+f.filename);const form=new FormData();form.set('file',new File([bytes],f.filename,{type:f.metadata.mime}));const result=await api('/api/objects',{method:'POST',body:form});if(result.sha256!==hash||result.size!==bytes.length)throw new Error('Upload integrity failed');checkpoint[hash]=result;}done++;if(done%25===0||done===files.length){await fs.writeFile(path.join(root,'object-checkpoint.json'),JSON.stringify(checkpoint,null,2));console.log(`Originals preserved: ${done}/${files.length}`);}}}
await Promise.all([uploadLoop(),uploadLoop(),uploadLoop()]);
await fs.writeFile(path.join(root,'object-checkpoint.json'),JSON.stringify(checkpoint,null,2));
const documents=await importRows('documents',files.map(f=>{const docket=f.docket?dockets.find(d=>d.externalId===`nyscef:${f.docket.slug}`):null;return {externalId:f.external_id,matterId:docket?.matterId??matters.find(m=>m.externalId==='legacy:m-510w42').id,docketId:docket?.id??null,title:f.title?.trim()||f.filename,fileName:f.filename,sourceType:docket?'docket_filing':'upload',sourceSystem:docket?'NYSCEF':'510W42 legacy collection',status:'pending_review',sha256:f.metadata.sha256,pageCount:f.metadata.page_count,objectKey:checkpoint[f.metadata.sha256].key,objectBucket:'legal-evidence-arena',filedDate:f.filed_date??null,provenance:{sourceUrl:f.source_url??null,sourcePath:f.path,acquisitionMethod:f.retrieval_method??'reconciled legacy original',legacyId:f.legacy_id??null,legacyMetadata:f.legacy_metadata??null,observedInCloudflareInventory:f.observed_in_live_cloudflare_inventory??null,inspection:f.metadata,quality:'unassessed',importVersion:'2026-10-03-v1'}}}));
const entries=[];
for(const d of corpus.dockets){const docket=dockets.find(x=>x.externalId===`nyscef:${d.slug}`);for(const e of d.entries){const number=Number(e.cells[0]);const file=d.files.find(f=>f.number===number);const document=file?documents.find(x=>x.externalId===file.external_id):null;const filingDate=e.cells[2]?.match(/Filed: (\d\d)\/(\d\d)\/(\d{4})/);entries.push({externalId:`nyscef:${d.slug}:entry:${number}`,docketId:docket.id,sequenceNumber:number,filedDate:filingDate?`${filingDate[3]}-${filingDate[1]}-${filingDate[2]}`:null,docType:e.cells[1].split('\n')[0],description:e.cells[1],documentId:document?.id??null,availability:file?'public_pdf':/Deleted/i.test(e.cells.join(' '))?'deleted':/Sealed|Restricted/i.test(e.cells.join(' '))?'restricted':'metadata_only',sourceStatus:e.cells[3],sourceUrl:file?.source_url??null,provenance:{raw:e,observedAt:'2026-10-03',snapshotVersion:'v1'}});}}
await importRows('entries',entries);
const jobs=await importRows('jobs',documents.map(d=>({idempotencyKey:`extract:${d.externalId}:${d.sha256}:v1`,documentId:d.id,kind:'extract',payload:{objectKey:d.objectKey,sha256:d.sha256,source:'initial corpus backfill',quality:'unassessed'}})));
const associations=[];
for(const d of corpus.dockets){
 const sync=JSON.parse(await fs.readFile(path.join(base,d.slug==='nasca'?'NASCA_RECONCILIATION/notebook-sync.json':'LT-316530-24-NY/notebook-sync.json'),'utf8'));
 const sources=new Map();
 for(const s of sync.original_sources??[]){const number=s.title.match(/^(\d{3})_/);sources.set(s.id,{sourceId:s.id,number:number?Number(number[1]):null,status:s.status===2?'ready':'failed',hash:null,equivalence:'title_candidate',raw:s});}
 for(const s of sync.sources??[]){if(!s.source_id)continue;sources.set(s.source_id,{sourceId:s.source_id,number:Number(s.document_number),status:(s.remote_status??s.processing_status)===2?'ready':'failed',hash:s.sha256??null,equivalence:s.sha256?'uploaded_hash':'unverified',raw:s});}
 for(const s of sources.values()){const file=d.files.find(f=>f.number===s.number);const document=file?documents.find(x=>x.externalId===file.external_id):null;associations.push({externalId:`notebook:${d.notebook_id}:${s.sourceId}`,documentId:document?.id??null,notebookId:d.notebook_id,sourceId:s.sourceId,artifactHash:s.hash,status:s.status,equivalence:s.equivalence,provenance:{importedFromPriorVerifiedSync:true,verifiedAt:'2026-10-03',observationKind:'historical sync receipt; remote presence not freshly verified',historicalAttempt:s.sourceId==='ebfcaee8-36b4-4ade-9a1f-aa9b9a8faf7c',remote:s.raw}});}
}
await importRows('notebooks',associations);
await importRows('connectors',[
{name:'NYSCEF acquisition bridge',kind:'nyscef',status:'disconnected',detail:'Prior snapshots imported. Fresh retrieval requires the supervised browser bridge.'},
{name:'NotebookLM local adapter',kind:'notebooklm',status:'disconnected',detail:'Prior verified source mappings imported; the local consumer-session connector is not running in this Worker.'},
{name:'Private R2 evidence',kind:'r2',status:'connected',detail:'Original bytes preserved by SHA-256 through the Worker binding.'},
{name:'Supabase Postgres',kind:'supabase',status:'connected',detail:'Isolated casevault2 schema accessed through a restricted database role and Hyperdrive.'},
{name:'Google Drive',kind:'google_drive',status:'disconnected',detail:'Optional delivery adapter; OAuth and folder selection required.'}
]);
const report={matters:matters.length,contacts:contacts.length,roles:roles.length,dockets:dockets.length,docketEntries:entries.length,documents:documents.length,newJobs:jobs.length,notebookAssociations:associations.length,originalObjects:Object.keys(checkpoint).length,completedAt:new Date().toISOString(),quality:'unassessed',processingRunner:'not yet enabled'};
await fs.writeFile('docs/initial-import-report.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report,null,2));

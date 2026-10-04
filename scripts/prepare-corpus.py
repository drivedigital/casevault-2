"""Read-only reconciliation of prior acquisition artifacts; never modifies originals."""
import json, pathlib, hashlib, re, datetime
import pymupdf as fitz
BASE=pathlib.Path('/Users/dangeorge/Documents/Codex/2026-10-02/check-the-build-plan-for-this/outputs')
ROOT=pathlib.Path(__file__).resolve().parents[1]
private=ROOT/'.private'
private.mkdir(exist_ok=True)

def inspect(path):
 b=path.read_bytes(); info={'sha256':hashlib.sha256(b).hexdigest(),'bytes':len(b),'page_count':None,'mime':'application/octet-stream'}
 if path.suffix.lower()=='.pdf':
  if not b.startswith(b'%PDF-'):raise ValueError('Invalid PDF header: '+str(path))
  with fitz.open(path) as d:
   if d.is_encrypted:raise ValueError('Encrypted PDF: '+str(path))
   info['page_count']=len(d);info['mime']='application/pdf'
 elif path.suffix.lower() in ['.png','.jpg','.jpeg','.webp']:info.update(page_count=1,mime='image/'+('jpeg' if path.suffix.lower() in ['.jpg','.jpeg'] else path.suffix[1:]))
 elif path.suffix.lower() in ['.md','.txt','.csv','.html','.json']:info.update(mime={'.md':'text/markdown','.csv':'text/csv','.html':'text/html','.json':'application/json'}.get(path.suffix.lower(),'text/plain'))
 return info

dockets=[]
for slug,case,name,court,url,notebook in [
 ('nasca','153243/2026','Nasca v. 230CPS','New York County Supreme Court','https://iapps.courts.state.ny.us/nyscef/DocumentList?docketId=5/kAAgjQM9UBcQ/ZYntEKA==','8a82e6be-2018-422a-9371-437ed1ad3269'),
 ('lt','LT-316530-24/NY','West 42nd Street Developers, LLC v. Urban Resort LLC et al.','New York County Civil Court','https://iapps.courts.state.ny.us/nyscef/DocumentList?docketId=y1X5d8LKx63cmPf3gU7X_PLUS_A==','3f1b2655-d8c6-4774-ae6f-44998e8dcea3')]:
 manifest_dir=BASE/('download-benchmark' if slug=='nasca' else 'LT-316530-24-NY')
 manifest=json.loads((manifest_dir/'manifest.json').read_text())
 entries=json.loads((BASE/'experiment/data.json').read_text())['docket'] if slug=='nasca' else manifest['docket_entries']
 files=manifest.get('files',manifest.get('downloads'))
 out=[]
 for f in files:
  path=manifest_dir/f['saved_file']; meta=inspect(path)
  if meta['sha256']!=f['sha256']:raise ValueError('Hash mismatch '+str(path))
  entry=next(e for e in entries if any(l['url']==f['url'] for l in e.get('links',[])))
  number=int(entry['cells'][0]);filer=entry['cells'][2];date=re.search(r'Filed: (\d\d/\d\d/\d{4})',filer)
  out.append({'external_id':f'nyscef:{slug}:{number}:{meta["sha256"]}','number':number,'title':f['title'],'path':str(path),'filename':path.name,'source_url':f['url'],'filed_date':datetime.datetime.strptime(date[1],'%m/%d/%Y').strftime('%Y-%m-%d') if date else None,'retrieval_method':f.get('retrieval_method','connected browser download'),'metadata':meta})
 dockets.append({'slug':slug,'case_number':case,'caption':name,'court':court,'source_url':url,'notebook_id':notebook,'entries':entries,'files':out})

manifest=json.loads(pathlib.Path('/Users/dangeorge/Documents/GitHub/casevault/infra/cloudflare-worker/src/sources-510w42.json').read_text())
live=json.loads((private/'legacy-cloudflare-sources.json').read_text())
found={}
for p in pathlib.Path('/Users/dangeorge/Documents/GitHub/510W42').rglob('*'):
 if p.is_file() and '.git' not in p.parts:found.setdefault(p.name,[]).append(p)
legacy=[]
for ordinal,row in enumerate(manifest):
 relative=row.get('authentication_notes','').removeprefix('Authenticated original from 510W42 repo: ')
 path_candidate=pathlib.Path('/Users/dangeorge/Documents/GitHub/510W42')/relative
 candidates=[path_candidate] if relative and path_candidate.is_file() else found.get(row['original_filename'],[])
 if len(candidates)!=1:raise ValueError('Ambiguous original '+row['original_filename'])
 path=candidates[0];meta=inspect(path)
 legacy.append({'external_id':f'510w42:{row["id"]}:{hashlib.sha256(relative.encode()).hexdigest()[:12]}','legacy_id':row['id'],'title':row['title'],'filename':path.name,'path':str(path),'metadata':meta,'legacy_metadata':row,'observed_in_live_cloudflare_inventory':any(x['id']==row['id'] and x['original_filename']==row['original_filename'] for x in live)})
(private/'corpus.json').write_text(json.dumps({'dockets':dockets,'legacy':legacy},indent=2))
summary={'dockets':[{'case_number':d['case_number'],'entries':len(d['entries']),'pdfs':len(d['files']),'pages':sum(f['metadata']['page_count'] for f in d['files'])} for d in dockets],'legacy':{'records':len(legacy),'unique_legacy_ids':len({r['legacy_id'] for r in legacy}),'live_inventory_records':len(live),'actual_pdf_pages':sum((r['metadata']['page_count'] or 0) for r in legacy if r['metadata']['mime']=='application/pdf'),'bytes':sum(r['metadata']['bytes'] for r in legacy),'unique_hashes':len({r['metadata']['sha256'] for r in legacy})}}
(ROOT/'docs/corpus-reconciliation.json').write_text(json.dumps(summary,indent=2))
print(json.dumps(summary,indent=2))

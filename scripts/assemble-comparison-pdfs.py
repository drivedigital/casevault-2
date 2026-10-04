"""Preserve original visuals; add unverified text layers from cloud OCR receipts only."""
import hashlib,json,pathlib,re,textwrap
import pymupdf as fitz
BASE=pathlib.Path('.private/doc8-comparison')
SOURCE=pathlib.Path('/Users/dangeorge/Downloads/8.pdf')
OUT=pathlib.Path('output/pdf/doc8-comparison');OUT.mkdir(parents=True,exist_ok=True)
sha=lambda b:hashlib.sha256(b).hexdigest()
source_bytes=SOURCE.read_bytes();original_hash=sha(source_bytes)
run=json.loads((BASE/'run.json').read_text())
if original_hash!=run['originalHash']:raise ValueError('Source changed')
source=fitz.open(stream=source_bytes,filetype='pdf')
if source.is_encrypted or len(source)!=13:raise ValueError('Unexpected source')
reports=[]
for model in run['models']:
 receipts=[]
 for number in range(1,14):
  p=BASE/model['id']/f'page-{number}.json'
  if not p.exists():break
  r=json.loads(p.read_text());r['page']=number
  if re.search(r'^(Error processing|Error:)|You have exceeded your ZeroGPU quota|GPU quota exceeded',r.get('output',{}).get('text',''),re.I):r['state']='failed';r['error']='Space returned a quota/service error, not a transcript'
  receipts.append(r)
 if len(receipts)!=13:continue
 usable=[r for r in receipts if r['state']=='complete' and r.get('output',{}).get('text','').strip()]
 if not usable:reports.append({'modelId':model['id'],'state':'failed','coverage':[],'error':'No usable pages; PDF not generated'});continue
 doc=fitz.open(stream=source_bytes,filetype='pdf')
 geometry='grounded-word' if model['id']=='nemotronocr' else 'page-anchored'
 warnings=['OCR text and AI interpretations await human review.']
 if geometry=='page-anchored':warnings.append('Transcript-only model: invisible text is anchored to its physical page; highlight/selection positions are approximate and have not been aligned to printed words.')
 coverage=[r['page'] for r in usable]
 if len(coverage)<13:warnings.append(f'Partial extraction: only pages {coverage} have an added text layer; failed pages preserve the original image.')
 pages=[]
 for receipt in receipts:
  number=receipt['page'];page=doc[number-1];text=receipt.get('output',{}).get('text','') if receipt['state']=='complete' else ''
  pages.append({'page':number,'state':receipt['state'],'text':text,'warnings':[] if text else [receipt.get('error','Extraction unavailable')],'receiptKey':receipt.get('receiptKey'),'imageSha256':receipt['imageSha256']})
  if not text:continue
  if geometry=='grounded-word':
   for box in receipt['output'].get('boxes',[]):
    points=box.get('points') or [];word=box.get('text') or ''
    if not points or not word:continue
    xs=[max(0,min(1,p['x']))*page.rect.width for p in points];ys=[max(0,min(1,p['y']))*page.rect.height for p in points]
    rect=fitz.Rect(min(xs),min(ys),max(xs),max(ys))
    if rect.is_empty:continue
    safe=word.replace('§','\xa7').encode('cp1252','replace').decode('cp1252')
    fs=max(.5,min(rect.height*.75, rect.width/max(fitz.get_text_length(safe,fontsize=1),.01)))
    page.insert_text((rect.x0,min(page.rect.height,rect.y0+fs)),safe,fontsize=fs,render_mode=3,overlay=True)
  else:
   # This is a page-search draft, not a falsely claimed layout-aligned word layer.
   safe=text.encode('cp1252','replace').decode('cp1252')
   lines=[]
   for paragraph in safe.splitlines():lines.extend(textwrap.wrap(paragraph,width=115,break_long_words=True,replace_whitespace=False) or [''])
   fs=max(.8,min(7,(page.rect.height-40)/(max(1,len(lines))*1.3)))
   for i,line in enumerate(lines):
    maxfs=(page.rect.width-40)/max(fitz.get_text_length(line,fontsize=1),.01)
    page.insert_text((20,20+(i+1)*fs*1.2),line,fontsize=min(fs,maxfs),render_mode=3,overlay=True)
 doc.set_metadata({**doc.metadata,'title':f'Doc 8 - {model["label"]} - searchable OCR draft','subject':'Unreviewed cloud OCR comparison. '+ ' '.join(warnings),'keywords':f'CaseVault; original-sha256:{original_hash}; model:{model["model"]}; comparison:{run["id"]}'})
 path=OUT/f'doc8-{model["id"]}-searchable.pdf';doc.save(path,garbage=3,deflate=True);doc.close()
 check=fitz.open(path)
 visual=[];search=[]
 for i in range(13):
  visual.append(source[i].get_pixmap(matrix=fitz.Matrix(1,1),alpha=False).samples==check[i].get_pixmap(matrix=fitz.Matrix(1,1),alpha=False).samples)
  if i+1 in coverage:search.append(len(check[i].get_text())>len(source[i].get_text())+30)
 valid={'visualIdentical':all(visual),'pageCountMatches':len(check)==len(source),'textSearchable':all(search),'dimensionsMatch':all(source[i].rect==check[i].rect for i in range(13)),'wordAlignmentVerified':False,'humanTranscriptionVerified':False}
 if not all(valid[k] for k in ['visualIdentical','pageCountMatches','textSearchable','dimensionsMatch']):raise ValueError(f'PDF validation failed {model["id"]}: {valid}')
 manifest={'modelId':model['id'],'model':model['model'],'provider':model['provider'],'originalHash':original_hash,'comparisonId':run['id'],'pageCount':13,'coverage':coverage,'geometry':geometry,'state':'complete' if len(coverage)==13 else 'partial','warnings':warnings,'validation':valid,'assembly':f'PyMuPDF {fitz.VersionBind}; no local OCR','pdfSha256':sha(path.read_bytes()),'path':str(path.resolve())}
 (BASE/model['id']/'pages.json').write_text(json.dumps(pages,indent=2));(BASE/model['id']/'artifact.json').write_text(json.dumps(manifest,indent=2));reports.append(manifest);check.close()
(BASE/'pdf-report.json').write_text(json.dumps(reports,indent=2))
print(json.dumps([{'modelId':r['modelId'],'state':r['state'],'pages':len(r['coverage'])} for r in reports]))

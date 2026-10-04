"use client";
import {useEffect,useRef,useState} from 'react';
import type {PDFDocumentProxy,RenderTask} from 'pdfjs-dist';
import {ChevronLeft,ChevronRight,Download,ZoomIn,ZoomOut} from 'lucide-react';

type Preview={kind:'pdf';document:PDFDocumentProxy}|{kind:'image';url:string}|{kind:'text';text:string}|{kind:'unsupported'};
export function FilePreview({fileUrl,title}:{fileUrl:string;title:string}){
 const [preview,setPreview]=useState<Preview|null>(null);
 const [error,setError]=useState('');
 const [page,setPage]=useState(1);
 const [zoom,setZoom]=useState(1);
 const [rendered,setRendered]=useState('');
 const canvas=useRef<HTMLCanvasElement>(null);
 const area=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const controller=new AbortController();let disposed=false;let loading:ReturnType<typeof import('pdfjs-dist').getDocument>|undefined;let imageUrl:string|undefined;
  async function load(){
   try{
    const response=await fetch(fileUrl,{credentials:'same-origin',signal:controller.signal});
    if(!response.ok)throw new Error(response.status===401?'Your session has expired. Sign in again to view this document.':'The original file could not be loaded.');
    const bytes=new Uint8Array(await response.arrayBuffer());
    if(disposed)return;
    const mime=response.headers.get('content-type')?.split(';')[0]??'';
    if(new TextDecoder().decode(bytes.slice(0,1024)).includes('%PDF-')){
     const pdfjs=await import('pdfjs-dist');if(disposed)return;
     pdfjs.GlobalWorkerOptions.workerSrc=`/pdfjs/pdf.worker-${pdfjs.version}.mjs`;
     loading=pdfjs.getDocument({data:bytes,cMapUrl:'/pdfjs/cmaps/',cMapPacked:true,standardFontDataUrl:'/pdfjs/standard_fonts/',wasmUrl:'/pdfjs/wasm/'});
     const document=await loading.promise;if(!disposed)setPreview({kind:'pdf',document});
    }else if(['image/png','image/jpeg','image/gif','image/webp','image/avif'].includes(mime)){
     imageUrl=URL.createObjectURL(new Blob([bytes],{type:mime}));setPreview({kind:'image',url:imageUrl});
    }else if(['text/plain','text/csv','application/json'].includes(mime)&&bytes.length<2*1024*1024){setPreview({kind:'text',text:new TextDecoder().decode(bytes)});}
    else setPreview({kind:'unsupported'});
   }catch(reason){if(!disposed)setError(reason instanceof Error?reason.message:'The document could not be displayed.');}
  }
  void load();
  return()=>{disposed=true;controller.abort();if(loading)void loading.destroy();if(imageUrl)URL.revokeObjectURL(imageUrl);};
 },[fileUrl]);
 useEffect(()=>{
  if(preview?.kind!=='pdf')return;
  let disposed=false;let task:RenderTask|undefined;
  async function render(){
   try{
    if(preview?.kind!=='pdf')return;
    const pdfPage=await preview.document.getPage(page);if(disposed||!canvas.current)return;
    const base=pdfPage.getViewport({scale:1});
    const width=Math.max(200,(area.current?.clientWidth??700)-40);
    const viewport=pdfPage.getViewport({scale:Math.min(width/base.width,1.5)*zoom});
    const ratio=Math.min(window.devicePixelRatio||1,2);
    const element=canvas.current;const context=element.getContext('2d');if(!context)throw new Error('The browser could not draw this document.');
    element.width=Math.ceil(viewport.width*ratio);element.height=Math.ceil(viewport.height*ratio);
    element.style.width=`${viewport.width}px`;element.style.height=`${viewport.height}px`;
    task=pdfPage.render({canvas:element,canvasContext:context,viewport,transform:ratio===1?undefined:[ratio,0,0,ratio,0,0]});
    await task.promise;if(!disposed)setRendered(`${page}:${zoom}`);
   }catch(reason){if(!disposed)setError(reason instanceof Error?reason.message:'The page could not be displayed.');}
  }
  void render();return()=>{disposed=true;task?.cancel();};
 },[preview,page,zoom]);
 const total=preview?.kind==='pdf'?preview.document.numPages:0;
 return <section className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100" aria-label="Document preview">
  <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 text-sm">
   <div className="flex items-center gap-2">{total>0&&<><button aria-label="Previous page" disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="rounded p-1 disabled:opacity-30"><ChevronLeft size={18}/></button><span>Page {page} of {total}</span><button aria-label="Next page" disabled={page>=total} onClick={()=>setPage(p=>p+1)} className="rounded p-1 disabled:opacity-30"><ChevronRight size={18}/></button><button aria-label="Zoom out" disabled={zoom<=0.5} onClick={()=>setZoom(z=>Math.max(0.5,z-0.25))} className="rounded p-1 disabled:opacity-30"><ZoomOut size={18}/></button><span>{Math.round(zoom*100)}%</span><button aria-label="Zoom in" disabled={zoom>=3} onClick={()=>setZoom(z=>Math.min(3,z+0.25))} className="rounded p-1 disabled:opacity-30"><ZoomIn size={18}/></button></>}</div>
   <a href={`${fileUrl}?download=1`} className="flex items-center gap-2 text-indigo-600"><Download size={16}/>Download original</a>
  </div>
  <div ref={area} className="flex-1 overflow-auto p-5">
   {error?<p role="alert" className="rounded bg-white p-4 text-red-700">{error}</p>:!preview?<p role="status">Loading document…</p>:preview.kind==='pdf'?<><p role="status" className="mb-2 text-xs text-slate-500">{rendered===`${page}:${zoom}`?'':`Loading page ${page}…`}</p><canvas ref={canvas} aria-label={`${title}, page ${page}`} data-rendered={rendered===`${page}:${zoom}`} className="mx-auto bg-white shadow"/></>:preview.kind==='image'?
   // The authenticated original is loaded into a local blob, outside Next image optimization.
   // eslint-disable-next-line @next/next/no-img-element
   <img src={preview.url} alt={title} className="mx-auto max-w-full"/>:preview.kind==='text'?<pre className="whitespace-pre-wrap rounded bg-white p-5 text-sm">{preview.text}</pre>:<p className="rounded bg-white p-5">A preview isn’t available for this file format. Download the original to open it.</p>}
  </div>
 </section>;
}

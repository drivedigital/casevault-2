import {getCloudflareContext} from '@opennextjs/cloudflare';
export const dynamic='force-dynamic';
async function forward(req:Request,{params}:{params:Promise<{path?:string[]}>}){
 const path=(await params).path??[];
 if(path.some(p=>!/^[-a-zA-Z0-9]+$/.test(p)))return Response.json({error:'Invalid comparison path'},{status:400});
 const env=getCloudflareContext().env;
 const headers=new Headers(req.headers);
 headers.set('X-Comparison-Base','/api/ocr-comparisons');
 // The app proxy authenticates all mutations before this handler. Never trust a browser-supplied machine token.
 if(!['GET','HEAD'].includes(req.method))headers.set('Authorization',`Bearer ${env.CASEVAULT_API_TOKEN}`);
 else headers.delete('Authorization');
 return env.OCR_COMPARISON.fetch(new Request(`https://comparison.internal/${path.join('/')}`,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:req.body,redirect:'manual'}));
}
export const GET=forward;
export const POST=forward;

import 'server-only';
import {createServerClient} from '@supabase/ssr';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {NextRequest,NextResponse} from 'next/server';

export function createAuthClient(request:NextRequest,initialResponse=NextResponse.next({request}),forwardRequest=false){
 const env=getCloudflareContext().env;
 let response=initialResponse;
 const client=createServerClient(env.SUPABASE_URL,env.SUPABASE_PUBLISHABLE_KEY,{
  cookieOptions:{httpOnly:true,secure:true,sameSite:'lax',path:'/'},
  cookies:{
   getAll(){return request.cookies.getAll();},
   setAll(cookies,headers){
    for(const {name,value} of cookies)request.cookies.set(name,value);
    if(forwardRequest)response=NextResponse.next({request});
    for(const {name,value,options} of cookies)response.cookies.set(name,value,{...options,httpOnly:true,secure:true,sameSite:'lax',path:'/'});
    for(const [name,value] of Object.entries(headers))response.headers.set(name,value);
    response.headers.set('Cache-Control','private, no-store');
   },
  },
 });
 return {client,response:()=>response};
}
export function copyAuthCookies(from:NextResponse,to:NextResponse){
 for(const cookie of from.cookies.getAll())to.cookies.set(cookie);
 to.headers.set('Cache-Control','private, no-store');
 return to;
}

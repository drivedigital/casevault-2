import {NextRequest,NextResponse} from 'next/server';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {createAuthClient} from '@/lib/supabase-auth';
export async function GET(req:NextRequest){
 const response=NextResponse.redirect(new URL('/login?error=provider_unavailable',req.url));
 response.headers.set('Cache-Control','private, no-store');
 const env=getCloudflareContext().env;
 try{
  const settings=await fetch(`${env.SUPABASE_URL}/auth/v1/settings`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY},signal:AbortSignal.timeout(10000)});
  if(!settings.ok||(await settings.json() as {external?:{google?:boolean}}).external?.google!==true)return response;
 }catch{return response;}
 const auth=createAuthClient(req,response);
 const {data,error}=await auth.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('/auth/callback',req.url).toString(),skipBrowserRedirect:true,scopes:'openid email profile',queryParams:{prompt:'select_account'}}});
 if(!error&&data.url)response.headers.set('Location',data.url);
 return response;
}

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
 const drive=req.nextUrl.searchParams.get('drive')==='1';
 if(drive)response.cookies.set('cv2_drive_connect',crypto.randomUUID(),{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:600});
 const auth=createAuthClient(req,response);
 const {data,error}=await auth.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:new URL('/auth/callback',req.url).toString(),skipBrowserRedirect:true,scopes:drive?'openid email profile https://www.googleapis.com/auth/drive.readonly':'openid email profile',queryParams:drive?{prompt:'consent select_account',access_type:'offline'}:{prompt:'select_account'}}});
 if(!error&&data.url)response.headers.set('Location',data.url);
 return response;
}

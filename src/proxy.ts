import {NextRequest,NextResponse} from 'next/server';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {equalSecret,authorizedGoogleUser} from '@/lib/auth';
import {createAuthClient,copyAuthCookies} from '@/lib/supabase-auth';
export async function proxy(req:NextRequest){
 const path=req.nextUrl.pathname;
 if(['/login','/api/health','/api/session','/auth/google','/auth/callback'].includes(path))return NextResponse.next();
 const env=getCloudflareContext().env;
 const tokenAuth=await equalSecret(req.headers.get('authorization')?.replace(/^Bearer /,'')??'',env.CASEVAULT_API_TOKEN);
 let response=NextResponse.next({request:req});
 if(!tokenAuth){
  const auth=createAuthClient(req,response,true);
  const {data:{user},error}=await auth.client.auth.getUser();
  response=auth.response();
  if(error||!authorizedGoogleUser(user,env.ALLOWED_LOGIN_EMAIL)){
   const denial=path.startsWith('/api/')?NextResponse.json({error:'Authentication required'},{status:401}):NextResponse.redirect(new URL('/login',req.url));
   return copyAuthCookies(response,denial);
  }
  if(!['GET','HEAD','OPTIONS'].includes(req.method)&&req.headers.get('origin')!==req.nextUrl.origin)return copyAuthCookies(response,NextResponse.json({error:'Invalid request origin'},{status:403}));
 }
 response.headers.set('Cache-Control','private, no-store');
 response.headers.set('X-Content-Type-Options','nosniff');
 return response;
}
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico).*)']};

import {NextRequest,NextResponse} from 'next/server';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {createAuthClient} from '@/lib/supabase-auth';
import {authorizedGoogleUser} from '@/lib/auth';
export async function GET(req:NextRequest){
 const response=NextResponse.redirect(new URL('/login?error=sign_in_failed',req.url));
 response.headers.set('Cache-Control','private, no-store');
 const code=req.nextUrl.searchParams.get('code');
 if(!code||req.nextUrl.searchParams.has('error'))return response;
 const auth=createAuthClient(req,response);
 const {error}=await auth.client.auth.exchangeCodeForSession(code);
 if(error)return response;
 const {data:{user},error:userError}=await auth.client.auth.getUser();
 if(userError||!authorizedGoogleUser(user,getCloudflareContext().env.ALLOWED_LOGIN_EMAIL)){
  await auth.client.auth.signOut({scope:'local'});
  response.headers.set('Location',new URL('/login?error=not_authorized',req.url).toString());
  return response;
 }
 response.cookies.set('cv2_session','',{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:0});
 response.headers.set('Location',new URL('/',req.url).toString());
 return response;
}

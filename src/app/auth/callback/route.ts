import {NextRequest,NextResponse} from 'next/server';
import {getCloudflareContext} from '@opennextjs/cloudflare';
import {createAuthClient} from '@/lib/supabase-auth';
import {connectDrive} from '@/lib/drive';
import {authorizedGoogleUser} from '@/lib/auth';
export async function GET(req:NextRequest){
 const response=NextResponse.redirect(new URL('/login?error=sign_in_failed',req.url));
 response.headers.set('Cache-Control','private, no-store');
 const code=req.nextUrl.searchParams.get('code');
 if(!code||req.nextUrl.searchParams.has('error'))return response;
 const auth=createAuthClient(req,response);
 const {data:sessionData,error}=await auth.client.auth.exchangeCodeForSession(code);
 if(error)return response;
 const {data:{user},error:userError}=await auth.client.auth.getUser();
 if(userError||!authorizedGoogleUser(user,getCloudflareContext().env.ALLOWED_LOGIN_EMAIL)){
  await auth.client.auth.signOut({scope:'local'});
  response.headers.set('Location',new URL('/login?error=not_authorized',req.url).toString());
  return response;
 }
 response.cookies.set('cv2_session','',{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:0});
 if(req.cookies.has('cv2_drive_connect')){
  response.cookies.set('cv2_drive_connect','',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0});
  try {
   if(!sessionData.session?.provider_token || !user?.email)throw new Error();
   await connectDrive(sessionData.session.provider_token,user.email,user.id);
   response.headers.set('Location',new URL('/settings?drive=connected',req.url).toString());
  }catch{response.headers.set('Location',new URL('/settings?drive=failed',req.url).toString());}
 }else response.headers.set('Location',new URL('/',req.url).toString());
 return response;
}

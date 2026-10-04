import {NextRequest,NextResponse} from 'next/server';
import {createAuthClient} from '@/lib/supabase-auth';
export async function POST(req:NextRequest){
 if(req.headers.get('origin')!==req.nextUrl.origin)return NextResponse.json({error:'Invalid origin'},{status:403});
 const response=NextResponse.redirect(new URL('/login',req.url),303);
 const auth=createAuthClient(req,response);
 await auth.client.auth.signOut({scope:'local'});
 response.cookies.set('cv2_session','',{httpOnly:true,secure:true,sameSite:'strict',path:'/',maxAge:0});
 response.headers.set('Cache-Control','private, no-store');
 return response;
}

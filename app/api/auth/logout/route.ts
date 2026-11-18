import { NextResponse } from 'next/server';
import { env } from 'cloudflare:workers';
import { sessionToken,clearSessionCookie } from '@/lib/password-auth';
import { tokenHash,safeReturnTo } from '@/lib/password-crypto';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return new Response('Please use Club Hub.',{status:403});
 try{
  const token=sessionToken(request.headers.get('cookie'));
  if(token&&env.DB)await env.DB.prepare('DELETE FROM auth_sessions WHERE token_hash=?').bind(await tokenHash(token)).run();
  const form=await request.formData();
  const response=NextResponse.redirect(new URL(safeReturnTo(form.get('returnTo')),request.url),303);
  response.headers.set('Set-Cookie',clearSessionCookie());
  response.headers.set('Cache-Control','private, no-store');
  return response;
 }catch{return new Response('Sign out could not be completed. Please try again.',{status:503});}
}

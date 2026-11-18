import { NextResponse } from 'next/server';
import { authDb,rateLimit,createSession,sessionCookie,validSetupCode } from '@/lib/password-auth';
import { hashPassword,verifyPassword,safeReturnTo } from '@/lib/password-crypto';
export const dynamic='force-dynamic';
const headers={'Cache-Control':'private, no-store'};
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return NextResponse.json({error:'Please use the Club Hub sign-in page.'},{status:403,headers});
 if(!request.headers.get('content-type')?.includes('application/json'))return NextResponse.json({error:'Invalid sign-in request.'},{status:400,headers});
 try{
  const raw=await request.text();if(raw.length>4096)return NextResponse.json({error:'Sign-in request is too large.'},{status:413,headers});
  const body=JSON.parse(raw) as Record<string,unknown>;
  const email=typeof body.email==='string'?body.email.trim().toLowerCase():'',password=typeof body.password==='string'?body.password:'';
  const name=typeof body.name==='string'?body.name.trim().slice(0,100):'';
  const mode=body.mode;
  if(!['login','register'].includes(String(mode))||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>128||(mode==='register'&&!name))return NextResponse.json({error:'Enter a valid email and a password of 12–128 characters. New accounts also need a name.'},{status:400,headers});
  const db=await authDb(),ip=request.headers.get('cf-connecting-ip')||'unknown';
  // Durable limits apply across isolates. Neither passwords nor raw IPs are stored in the limiter.
  if(!await rateLimit(db,'ip:'+ip,30)||!await rateLimit(db,'account:'+email,10))return NextResponse.json({error:'Too many sign-in attempts. Please try again in 15 minutes.'},{status:429,headers:{...headers,'Retry-After':'900'}});
  const existing=await db.prepare('SELECT id,password_hash FROM auth_users WHERE email=?').bind(email).first<{id:string;password_hash:string}>();
  const setupCode=typeof body.setupCode==='string'?body.setupCode.slice(0,160):'';
  let userId:string;
  if(mode==='register'){
   if(existing)return NextResponse.json({error:'Unable to create this account. If you already registered, use Sign in.'},{status:409,headers});
   const roleVerified=await validSetupCode(email,setupCode);
   if(setupCode&&!roleVerified)return NextResponse.json({error:'The optional setup code is not valid for this email.'},{status:403,headers});
   userId=crypto.randomUUID();
   const stored=await hashPassword(password);
   await db.prepare('INSERT INTO auth_users (id,email,name,password_hash,role_verified,created_at) VALUES (?,?,?,?,?,?)').bind(userId,email,name,stored,roleVerified?1:0,Math.floor(Date.now()/1000)).run();
  }else{
   // Do the same expensive password work when the account does not exist.
   const dummy='pbkdf2-sha256$100000$00000000000000000000000000000000$'+'0'.repeat(64);
   const valid=await verifyPassword(password,existing?.password_hash||dummy);
   if(!existing||!valid)return NextResponse.json({error:'Email or password is incorrect.'},{status:401,headers});
   userId=existing.id;
   if(setupCode){
    if(!await validSetupCode(email,setupCode))return NextResponse.json({error:'The optional setup code is not valid for this email.'},{status:403,headers});
    await db.prepare('UPDATE auth_users SET role_verified=1 WHERE id=?').bind(userId).run();
   }
  }
  const token=await createSession(db,userId);
  return NextResponse.json({redirectTo:safeReturnTo(body.returnTo)},{headers:{...headers,'Set-Cookie':sessionCookie(token)}});
 }catch{
  return NextResponse.json({error:'Sign-in is temporarily unavailable. Please try again.'},{status:503,headers});
 }
}

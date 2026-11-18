import { env } from 'cloudflare:workers';
import { randomToken,tokenHash } from './password-crypto';
export const SESSION_COOKIE='__Host-clubhub_session';
export const SESSION_SECONDS=60*60*24*7;
export type PasswordUser={id:string;name:string;email:string;role_verified:number};
export async function authDb(){
 if(!env.DB)throw new Error('Account storage is unavailable.');
 const db=env.DB;
 // Independent, additive tables; existing memberships and requests are untouched.
 await db.batch([
  db.prepare('CREATE TABLE IF NOT EXISTS auth_users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, password_hash TEXT NOT NULL, role_verified INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL)'),
  db.prepare('CREATE TABLE IF NOT EXISTS auth_sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL)'),
  db.prepare('CREATE INDEX IF NOT EXISTS auth_session_user ON auth_sessions(user_id)'),
  db.prepare('CREATE TABLE IF NOT EXISTS auth_attempts (key TEXT PRIMARY KEY, attempts INTEGER NOT NULL, expires_at INTEGER NOT NULL)')
 ]);
 return db;
}
export async function rateLimit(db:D1Database,key:string,limit:number):Promise<boolean>{
 const now=Math.floor(Date.now()/1000),window=Math.floor(now/900);
 const id=await tokenHash(key+':'+window);
 const row=await db.prepare('INSERT INTO auth_attempts (key,attempts,expires_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=attempts+1 RETURNING attempts').bind(id,(window+1)*900).first<{attempts:number}>();
 return !!row&&row.attempts<=limit;
}
export function sessionToken(cookie:string|null):string|null{
 const value=cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith(SESSION_COOKIE+'='))?.slice(SESSION_COOKIE.length+1);
 return value&&/^[a-f0-9]{64}$/.test(value)?value:null;
}
export async function sessionUser(cookie:string|null):Promise<PasswordUser|null>{
 const token=sessionToken(cookie);if(!token||!env.DB)return null;
 const row=await env.DB.prepare('SELECT u.id,u.name,u.email,u.role_verified FROM auth_sessions s JOIN auth_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(await tokenHash(token),Math.floor(Date.now()/1000)).first<PasswordUser>();
 return row||null;
}
export async function createSession(db:D1Database,userId:string):Promise<string>{
 const now=Math.floor(Date.now()/1000),token=randomToken();
 await db.batch([
  db.prepare('DELETE FROM auth_sessions WHERE expires_at<=?').bind(now),
  db.prepare('DELETE FROM auth_attempts WHERE expires_at<=?').bind(now),
  db.prepare('INSERT INTO auth_sessions (token_hash,user_id,expires_at) VALUES (?,?,?)').bind(await tokenHash(token),userId,now+SESSION_SECONDS)
 ]);
 return token;
}
export function sessionCookie(token:string):string{
 return SESSION_COOKIE+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age='+SESSION_SECONDS;
}
export function clearSessionCookie():string{
 return SESSION_COOKIE+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
export async function validSetupCode(email:string,code:string):Promise<boolean>{
 if(!code||!env.CLUB_BUILDER_INVITES)return false;
 try{
  const entries=JSON.parse(env.CLUB_BUILDER_INVITES) as Array<{email:string;code:string}>;
  if(!Array.isArray(entries))return false;
  const submitted=await tokenHash(code);
  for(const entry of entries){
   if(typeof entry.email!=='string'||typeof entry.code!=='string'||entry.email.trim().toLowerCase()!==email)continue;
   const expected=await tokenHash(entry.code);let difference=0;
   for(let i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^submitted.charCodeAt(i);
   if(difference===0)return true;
  }
 }catch{/* Invalid optional setup config never enables privileged access. */}
 return false;
}

const ITERATIONS = 100_000;
const encoder = new TextEncoder();
export function randomToken(bytes=32):string {
 return Array.from(crypto.getRandomValues(new Uint8Array(bytes)),n=>n.toString(16).padStart(2,'0')).join('');
}
export async function tokenHash(token:string):Promise<string> {
 return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(token))),n=>n.toString(16).padStart(2,'0')).join('');
}
async function derive(password:string,salt:string):Promise<string> {
 const key=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveBits']);
 const bits=await crypto.subtle.deriveBits({name:'PBKDF2',salt:encoder.encode(salt),iterations:ITERATIONS,hash:'SHA-256'},key,256);
 return Array.from(new Uint8Array(bits),n=>n.toString(16).padStart(2,'0')).join('');
}
export async function hashPassword(password:string):Promise<string> {
 const salt=randomToken(16);
 return 'pbkdf2-sha256$'+ITERATIONS+'$'+salt+'$'+await derive(password,salt);
}
export async function verifyPassword(password:string,stored:string):Promise<boolean> {
 const [algorithm,iterations,salt,expected]=stored.split('$');
 if(algorithm!=='pbkdf2-sha256'||Number(iterations)!==ITERATIONS||!/^[a-f0-9]{32}$/.test(salt)||!/^[a-f0-9]{64}$/.test(expected))return false;
 const actual=await derive(password,salt);
 let difference=0;
 for(let i=0;i<actual.length;i++)difference|=actual.charCodeAt(i)^expected.charCodeAt(i);
 return difference===0;
}
export function safeReturnTo(value:unknown):string {
 if(typeof value!=='string'||!value.startsWith('/')||value.startsWith('//'))return '/';
 try{
  const url=new URL(value,'https://club-hub.invalid');
  if(url.origin!=='https://club-hub.invalid'||/^\/(?:login|logout|signin-with-chatgpt|signout-with-chatgpt|api\/auth)(?:\/|$)/.test(url.pathname))return '/';
  return url.pathname+url.search+url.hash;
 }catch{return '/';}
}

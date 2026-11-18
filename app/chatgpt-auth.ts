import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { sessionUser } from '@/lib/password-auth';
import { safeReturnTo } from '@/lib/password-crypto';
// Compatibility export names retained for existing API handlers.
export type ChatGPTUser={userId:string;displayName:string;email:string;fullName:string|null;roleVerified:boolean};
export async function getChatGPTUser():Promise<ChatGPTUser|null>{
 const requestHeaders=await headers();
 // Public visitor-supplied identity headers are never trusted.
 const user=await sessionUser(requestHeaders.get('cookie'));
 return user?{userId:user.id,displayName:user.name,email:user.email,fullName:user.name,roleVerified:user.role_verified===1}:null;
}
export async function requireChatGPTUser(returnTo:string):Promise<ChatGPTUser>{
 const user=await getChatGPTUser();if(!user)redirect(chatGPTSignInPath(returnTo));return user;
}
export function chatGPTSignInPath(returnTo:string):string{return '/login?return_to='+encodeURIComponent(safeReturnTo(returnTo));}
export function chatGPTSignOutPath(returnTo='/'):string{return '/logout?return_to='+encodeURIComponent(safeReturnTo(returnTo));}

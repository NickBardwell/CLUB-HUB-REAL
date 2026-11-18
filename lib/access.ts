import { getChatGPTUser } from '@/app/chatgpt-auth';
import { ensureDatabase } from './database-setup';
import { canViewClubProposals } from './proposal-access';
import {env} from 'cloudflare:workers';
export async function identity() {
 await ensureDatabase();
 const user=await getChatGPTUser();
 // Allowlist stays on the server. The development identity is never privileged in production.
 const allow=(env.CLUB_HUB_ADMIN_EMAILS||process.env.CLUB_HUB_ADMIN_EMAILS||'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);
 const admin=!!user&&user.roleVerified&&(allow.includes(user.email.toLowerCase())||(process.env.NODE_ENV==='development'&&user.email==='seedy@sites.test'));
 const proposalViewer=!!user&&(admin||await canViewClubProposals(user.userId));
 return {user,admin,proposalViewer};
}
export function sameOrigin(request:Request) {
 const origin=request.headers.get('origin');
 return origin!==null&&origin===new URL(request.url).origin;
}

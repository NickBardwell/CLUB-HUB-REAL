import { env } from 'cloudflare:workers';
import { tokenHash } from './password-crypto';
type Account={email:string;created_at:number};
// Owner-authorized grant for the account already registered when permission was requested.
// Future registrations cannot gain access by claiming the same email.
const approvedEmailHash='ed3ec85065602b44c02575b014845f602387898cd617cdc98a01e7f21178434b';
const grantedAt=1794973997;
export async function hasProposalGrant(account:Account|null):Promise<boolean>{
 if(!account||!Number.isFinite(account.created_at)||account.created_at>grantedAt)return false;
 return await tokenHash(account.email.trim().toLowerCase())===approvedEmailHash;
}
export async function canViewClubProposals(userId:string):Promise<boolean>{
 if(!env.DB)return false;
 const account=await env.DB.prepare('SELECT email,created_at FROM auth_users WHERE id=?').bind(userId).first<Account>();
 return hasProposalGrant(account);
}

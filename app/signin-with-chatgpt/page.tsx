import { redirect } from 'next/navigation';
import { safeReturnTo } from '@/lib/password-crypto';
export default async function LegacyLogin({searchParams}:{searchParams:Promise<{return_to?:string}>}){
 const query=await searchParams;redirect('/login?return_to='+encodeURIComponent(safeReturnTo(query.return_to)));
}
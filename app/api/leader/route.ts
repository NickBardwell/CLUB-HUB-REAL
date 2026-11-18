import {NextResponse} from 'next/server';
import {and,eq,inArray,desc} from 'drizzle-orm';
import {getDb} from '@/db';
import {requests} from '@/db/schema';
import {identity} from '@/lib/access';
import {assignedClubs} from '@/lib/club-access';
import {catalogue} from '@/lib/catalogue';
export const dynamic='force-dynamic';
export async function GET(){
 const {user,admin,demo}=await identity();if(!user)return NextResponse.json({error:'Sign in to access your assigned clubs.'},{status:401});
 if(!user.roleVerified&&!demo)return NextResponse.json({error:'A private owner-issued setup code is required before this account can access assigned club applications. Enter it under Admin or representative setup on the sign-in page.'},{status:403});
 try{const all=await catalogue();
 const assignments=demo?all.filter(c=>c.kind==='club').map(c=>({id:'demo-'+c.id,clubId:c.id,email:user.email,role:'organizer',addedBy:user.userId,createdAt:''})):await assignedClubs(user.email);if(!assignments.length)return NextResponse.json({error:'Your account has not been added as a club organizer or professor lead. Ask the site administrator to assign your sign-in email to a club.'},{status:403});
 const clubIds=assignments.map(a=>a.clubId);
 const applications=clubIds.length?await getDb().select().from(requests).where(and(eq(requests.type,'application'),inArray(requests.clubId,clubIds))).orderBy(desc(requests.createdAt)):[];
 return NextResponse.json({clubs:all.filter(c=>clubIds.includes(c.id)),assignments,requests:applications,user:{email:user.email},admin,demo},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return NextResponse.json({error:'Unable to load your club applications.'},{status:503});}
}

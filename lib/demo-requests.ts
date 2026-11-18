type Founder={name:string;email:string};
type DemoRequest={id:string;type:'application'|'proposal';clubId:string|null;clubName:string;name:string;email:string;purpose:string;founders?:Founder[];advisor?:string};
export const demoRequests:DemoRequest[]=[
 {
  id:'demo-application-accounting-001',type:'application',clubId:'accounting',clubName:'Accounting Club',
  name:'Taylor Hayes',email:'taylor.hayes@example.com',
  purpose:'I am interested in joining the Accounting Club to meet other accounting students, learn about internships, and attend professional development events. I would love to help with the next campus workshop.\n\nStatus: interested and awaiting approval.'
 },
 {
  id:'demo-proposal-outdoors-001',type:'proposal',clubId:null,clubName:'DEMO: Generals Outdoor Adventure Club',
  name:'Jordan Ellis',email:'jordan.ellis@example.com',
  purpose:'Create a beginner-friendly outdoor recreation community for LSUA students. Members will organize affordable hiking, kayaking, and camping trips, plus local park cleanups. Meet twice a month, plan one trip per semester, and welcome students with no prior outdoor experience.\n\nKeywords: outdoors, hiking, kayaking, camping, recreation.\n\nProposed first event: a Saturday beginner hike and picnic.',
  advisor:'Dr. Morgan Lane (fictional demo advisor)',
  founders:[
   {name:'Jordan Ellis',email:'jordan.ellis@example.com'},
   {name:'Maya Brooks',email:'maya.brooks@example.com'},
   {name:'Ethan Carter',email:'ethan.carter@example.com'},
   {name:'Riley Bennett',email:'riley.bennett@example.com'}
  ]
 },
 {
  id:'demo-proposal-creative-media-001',type:'proposal',clubId:null,clubName:'DEMO: Generals Creative Media Club',
  name:'Ava Morgan',email:'ava.morgan@example.com',
  purpose:'Bring students together to learn photography, filmmaking, graphic design, and creative storytelling. Members will share equipment, practice editing, create campus stories, and host a student showcase. The club welcomes beginners and plans to meet every other week.\n\nKeywords: photography, film, graphic design, arts, creativity.\n\nProposed first event: a campus photo walk and introductory editing workshop.',
  advisor:'Professor Casey Rivers (fictional demo advisor)',
  founders:[
   {name:'Ava Morgan',email:'ava.morgan@example.com'},
   {name:'Liam Parker',email:'liam.parker@example.com'},
   {name:'Zoe Collins',email:'zoe.collins@example.com'},
   {name:'Noah Reed',email:'noah.reed@example.com'}
  ]
 }
];
const seedKey='owner-demo-review-requests-v1';
export function demoMessage(request:DemoRequest):string{
 const roster=request.founders?.map((person,index)=>(index+1)+'. '+person.name+' — '+person.email).join('\n');
 return 'FICTIONAL DEMO REQUEST — sample names and emails; not a real student submission.\n\n'+request.purpose+(roster?'\n\nPROPOSED FOUNDING MEMBERS ('+request.founders!.length+')\n'+roster+'\n\nAll four are fictional proposed members. Awaiting administrator approval.':'');
}
export async function seedDemoRequests(db:D1Database):Promise<void>{
 if(await db.prepare('SELECT key FROM configured_grants WHERE key=?').bind(seedKey).first())return;
 const statements:D1PreparedStatement[]=[];
 demoRequests.forEach((request,index)=>{
  const createdAt=new Date(Date.now()-(demoRequests.length-index)*60000).toISOString(),actor='demo-person-'+request.id;
  statements.push(db.prepare("INSERT OR IGNORE INTO requests (id,active_key,user_id,user_email,type,club_id,club_name,name,student_email,message,category,advisor,status,reviewer_note,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,NULL,?,'submitted','',?,? WHERE NOT EXISTS (SELECT 1 FROM configured_grants WHERE key=?)")
   .bind(request.id,request.type==='application'?'demo-active-'+request.id:null,actor,request.email,request.type,request.clubId,request.clubName,request.name,request.email,demoMessage(request),request.advisor||null,createdAt,createdAt,seedKey));
  statements.push(db.prepare("INSERT OR IGNORE INTO request_events (id,request_id,actor_id,status,note,created_at) SELECT ?,id,?,'submitted',?,? FROM requests WHERE id=? AND NOT EXISTS (SELECT 1 FROM configured_grants WHERE key=?)")
   .bind('demo-event-'+request.id,actor,'Fictional demo request submitted and awaiting approval.',createdAt,request.id,seedKey));
 });
 statements.push(db.prepare('INSERT OR IGNORE INTO configured_grants (key,created_at) VALUES (?,?)').bind(seedKey,new Date().toISOString()));
 // One transaction and stable IDs prevent duplicates, resets, or reinsertion after cleanup.
 await db.batch(statements);
}

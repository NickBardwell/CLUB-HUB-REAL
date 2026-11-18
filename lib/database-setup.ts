import { env } from 'cloudflare:workers';
const ready=new WeakSet<object>();
// Safe first-run initialization for standalone Cloudflare deployments.
// Existing accounts, memberships, requests, and assignments are never replaced.
export async function ensureDatabase():Promise<void>{
 const db=env.DB;if(!db)throw new Error('The DB database binding is not configured.');
 if(ready.has(db))return;
 const statements=[
  "CREATE TABLE IF NOT EXISTS club_settings (club_id TEXT PRIMARY KEY NOT NULL,members INTEGER,join_method TEXT NOT NULL,join_url TEXT,verified_at TEXT NOT NULL,updated_by TEXT NOT NULL)",
  "CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY NOT NULL,active_key TEXT,user_id TEXT NOT NULL,user_email TEXT NOT NULL,type TEXT NOT NULL,club_id TEXT,club_name TEXT NOT NULL,name TEXT NOT NULL,student_email TEXT NOT NULL,message TEXT NOT NULL,category TEXT,advisor TEXT,status TEXT NOT NULL DEFAULT 'submitted',reviewer_note TEXT NOT NULL DEFAULT '',created_at TEXT NOT NULL,updated_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS requests_active_key_unique ON requests(active_key)",
  "CREATE TABLE IF NOT EXISTS request_events (id TEXT PRIMARY KEY NOT NULL,request_id TEXT NOT NULL,actor_id TEXT NOT NULL,status TEXT NOT NULL,note TEXT NOT NULL,created_at TEXT NOT NULL,FOREIGN KEY(request_id) REFERENCES requests(id))",
  "CREATE TABLE IF NOT EXISTS memberships (id TEXT PRIMARY KEY NOT NULL,club_id TEXT NOT NULL,user_id TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',created_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS membership_club_user ON memberships(club_id,user_id)",
  "CREATE TABLE IF NOT EXISTS club_organizers (id TEXT PRIMARY KEY NOT NULL,club_id TEXT NOT NULL,email TEXT NOT NULL,role TEXT NOT NULL,added_by TEXT NOT NULL,created_at TEXT NOT NULL)",
  "CREATE UNIQUE INDEX IF NOT EXISTS organizer_club_email ON club_organizers(club_id,email)",
  "CREATE TABLE IF NOT EXISTS configured_grants (key TEXT PRIMARY KEY NOT NULL,created_at TEXT NOT NULL)"
 ];
 await db.batch(statements.map(sql=>db.prepare(sql)));
 const columns=await db.prepare('PRAGMA table_info(memberships)').all<{name:string}>();
 if(!columns.results.some(column=>column.name==='status')){
  try{await db.prepare("ALTER TABLE memberships ADD COLUMN status TEXT NOT NULL DEFAULT 'active'").run();}
  catch(error){
   // Another first request may have upgraded the same older database.
   const latest=await db.prepare('PRAGMA table_info(memberships)').all<{name:string}>();
   if(!latest.results.some(column=>column.name==='status'))throw error;
  }
 }
 ready.add(db);
}

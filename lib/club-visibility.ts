import { clubs,type Club } from './clubs';
// Server-only enrichment: the public client catalogue contains no lead names or sizes.
const sampleNames=['Jordan Ellis','Taylor Brooks','Morgan Reed','Casey Bennett','Avery Collins','Riley Hayes','Cameron Parker','Quinn Foster','Alex Monroe','Sam Carter','Jamie Rivers','Drew Lawson'];
export function clubsForViewer(items:Club[],signedIn:boolean):Club[]{
 return items.map(club=>{
  if(!signedIn){
   const {sampleProfile:privateProfile,...publicClub}=club;
   void privateProfile;
   return {...publicClub,members:null};
  }
  const index=clubs.findIndex(c=>c.id===club.id);
  if(club.kind!=='club'||index<0||club.sampleProfile)return club;
  return {...club,sampleProfile:{members:12+((index*17+23)%89),representative:sampleNames[index%sampleNames.length],role:'Student representative'}};
 });
}

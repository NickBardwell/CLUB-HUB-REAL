// Small browser-only PDF export; no server upload or external script is required.
// Built-in PDF fonts use ASCII transliteration for punctuation and accented letters.
function plain(value:string):string {
 return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"')
  .replace(/[\u2013\u2014]/g,'-').replace(/\u2022/g,'-')
  .replace(/\u2026/g,'...').replace(/[^\x20-\x7e\n]/g,'?');
}
function escapeText(value:string):string { return value.replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)'); }
function wrap(value:string,width=86):string[] {
 if(!value)return [''];
 const lines:string[]=[];
 let rest=value;
 while(rest.length>width){
  let split=rest.lastIndexOf(' ',width);
  if(split<width/3)split=width;
  lines.push(rest.slice(0,split));rest=rest.slice(split).trimStart();
 }
 lines.push(rest);return lines;
}
export function createClubPlanPdf(name:string,category:string,plan:string):Blob {
 const body=plain(plan).replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1 ($2)')
  .replace(/^#{1,6}\s+/gm,'').replace(/\*\*/g,'').replace(/__+/g,'')
  .replace(/^\s*[-*]\s+/gm,'- ');
 const lines=[...wrap(plain(name)),...wrap('Category: '+plain(category)),'',...body.split(/\r?\n/).flatMap(line=>wrap(line))];
 const pages:string[][]=[];
 for(let i=0;i<lines.length;i+=43)pages.push(lines.slice(i,i+43));
 const objects:string[]=[];
 objects[1]='<< /Type /Catalog /Pages 2 0 R >>';
 objects[2]='<< /Type /Pages /Kids ['+pages.map((_,i)=>(5+i*2)+' 0 R').join(' ')+'] /Count '+pages.length+' >>';
 objects[3]='<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>';
 objects[4]='<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>';
 pages.forEach((page,i)=>{
  const pageId=5+i*2,streamId=pageId+1;
  const stream=[
   '0.345 0.176 0.514 rg 0 734 612 58 re f',
   '1 0.784 0.173 rg 42 730 528 4 re f',
   'BT /F1 16 Tf 1 1 1 rg 1 0 0 1 42 755 Tm (LSUA Club Hub) Tj ET',
   'BT /F1 10 Tf 0.345 0.176 0.514 rg 1 0 0 1 42 710 Tm (CLUB PLEDGE & STARTUP PLAN) Tj ET',
   'BT /F2 10 Tf 0.12 0.10 0.16 rg 14 TL 1 0 0 1 42 684 Tm',
   ...page.map(line=>'('+escapeText(line)+') Tj T*'),
   'ET',
   'BT /F2 8 Tf 0.4 0.4 0.4 rg 1 0 0 1 42 46 Tm (Draft for planning - university recognition requires review.) Tj ET',
   'BT /F2 8 Tf 0.4 0.4 0.4 rg 1 0 0 1 480 30 Tm (Page '+(i+1)+' of '+pages.length+') Tj ET'
  ].join('\n');
  objects[pageId]='<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+streamId+' 0 R >>';
  objects[streamId]='<< /Length '+stream.length+' >>\nstream\n'+stream+'\nendstream';
 });
 let result='%PDF-1.4\n';
 const offsets=[0];
 for(let i=1;i<objects.length;i++){offsets[i]=result.length;result+=i+' 0 obj\n'+objects[i]+'\nendobj\n';}
 const xref=result.length;
 result+='xref\n0 '+objects.length+'\n0000000000 65535 f \n';
 for(let i=1;i<objects.length;i++)result+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
 result+='trailer\n<< /Size '+objects.length+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n';
 return new Blob([result],{type:'application/pdf'});
}
export function downloadClubPlanPdf(name:string,category:string,plan:string):void {
 const url=URL.createObjectURL(createClubPlanPdf(name,category,plan));
 const link=document.createElement('a');
 link.href=url;link.download=(plain(name).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'club')+'-pledge-startup-plan.pdf';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}

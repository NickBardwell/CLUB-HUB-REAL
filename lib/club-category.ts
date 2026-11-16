import { categories } from './clubs';

// Only called when an administrator approves a proposal.
const signals: Array<[number,string[]]> = [
 [0,['greek life','fraternity','sorority','brotherhood','sisterhood']],
 [1,['academic','professional','accounting','business','finance','biology','chemistry','nursing','psychology','criminal justice','pre med','pre law','engineering','computer science','coding','programming','research','mathematics']],
 [2,['education','educator','teaching','teacher','innovation','entrepreneurship','entrepreneur','makerspace','robotics','invent','tutoring']],
 [3,['art','arts','creative','creativity','painting','drawing','photography','film','music','theater','theatre','dance','poetry','writing','design']],
 [4,['leadership','service','volunteer','volunteering','community service','civic','student government','charity','fundraising']],
 [5,['campus resources','campus resource','library','housing','student support','title ix','campus services']],
 [6,['faith','spirituality','religion','religious','christian','bible','ministry','catholic','baptist','pentecostal','prayer','muslim','islam','jewish']],
 [7,['culture','cultural','multicultural','international','heritage','diversity','veterans','black student','language exchange']],
 [8,['sport','sports','recreation','fitness','wellness','outdoor','hiking','kayaking','camping','pickleball','basketball','football','gaming','esports','e sports','athlete','athletics']]
];
function normalize(value:string):string {
 return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
}
export function classifyApprovedClub(name:string,purpose:string):string {
 const title=' '+normalize(name)+' ',text=' '+normalize(purpose)+' ';
 let best=4,bestScore=0;
 for(const [index,terms] of signals){
  const score=terms.reduce((total,term)=>{
   const needle=' '+term+' ';
   return total+(title.includes(needle)?4:0)+(text.includes(needle)?1:0);
  },0);
  if(score>bestScore){best=index;bestScore=score;}
 }
 return categories[best];
}

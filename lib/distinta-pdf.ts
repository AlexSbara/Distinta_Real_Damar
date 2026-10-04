import {PDFDocument,StandardFonts,PDFFont,PDFPage,rgb} from 'pdf-lib';
export type DistintaPlayer={id:string;firstName:string;lastName:string;number:number;code:string;documentType:string;documentNumber:string};
export type DistintaInput={team:string;match:{opponent:string;date:string;time:string;venue:string;competition:string;shirt:string;category:string;home:boolean};players:DistintaPlayer[];staff:{name:string;code:string}[]};
const sponsors=['rush','europa','su','trento-trieste'];
async function asset(path:string){const res=await fetch(`/distinta/${path}`);if(!res.ok)throw new Error('Il modello PDF non è disponibile. Riprova.');return res.arrayBuffer();}
function text(page:PDFPage,font:PDFFont,value:string,x:number,top:number,width:number,size=10){if(!value)return;let safe='';for(const c of value.replace(/[\r\n\t]/g,' ')){try{font.encodeText(c);safe+=c;}catch{safe+='?';}}const actual=Math.min(size,width/Math.max(font.widthOfTextAtSize(safe,1),1));page.drawText(safe,{x,y:page.getHeight()-top,size:actual,font,color:rgb(0,0,0)});}
export async function createDistintaPdf(input:DistintaInput,loadAsset=asset){
 const [front,back,...logos]=await Promise.all(['fronte.pdf','retro.pdf',...sponsors.map(s=>`${s}.jpg`)].map(loadAsset));
 const doc=await PDFDocument.create();const f=await PDFDocument.load(front),b=await PDFDocument.load(back);const font=await doc.embedFont(StandardFonts.Helvetica);
 // The original A4 front has 17 rows. Overflow continues on identical fronts.
 for(let offset=0;offset<input.players.length;offset+=17){
  const [page]=await doc.copyPages(f,[0]);doc.addPage(page);const m=input.match;
  text(page,font,input.team,194,165,134);text(page,font,m.shirt,397,165,132);
  text(page,font,m.competition,166,215,134);text(page,font,m.category,390,215,137);
  text(page,font,[m.date?m.date.split('-').reverse().join('/'):'',m.time].filter(Boolean).join(' '),156,260,135);text(page,font,m.venue,376,260,132);
  text(page,font,m.home?input.team:m.opponent,146,305,104,9);text(page,font,m.home?m.opponent:input.team,374,305,100,9);
  input.players.slice(offset,offset+17).forEach((p,i)=>{const y=389+i*25.65;text(page,font,p.number?String(p.number):'',27,y,31,11);text(page,font,`${p.lastName} ${p.firstName}`,70,y,198,11);text(page,font,p.code,283,p.documentNumber?y-5:y,154,10);text(page,font,p.documentNumber?`${p.documentType||'Documento'} ${p.documentNumber}`:'',283,y+5,154,8);});
 }
 const [rear]=await doc.copyPages(b,[0]);doc.addPage(rear);
 input.staff.slice(0,7).forEach((s,i)=>{text(rear,font,s.name,28,88+i*51.2,242,11);text(rear,font,s.code,283,83+i*51.2,170,10);});
 text(rear,font,'I NOSTRI SPONSOR',24,665,540,11);
 for(let i=0;i<logos.length;i++){const img=await doc.embedJpg(logos[i]);const scale=Math.min(125/img.width,100/img.height);const width=img.width*scale,height=img.height*scale;rear.drawImage(img,{x:24+i*139+(125-width)/2,y:52+(100-height)/2,width,height});}
 doc.setTitle(`Distinta ${input.team}`);doc.setSubject('Modello fronte e retro con sponsor');return doc.save();
}

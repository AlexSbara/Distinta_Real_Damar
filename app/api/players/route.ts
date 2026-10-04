import {z} from 'zod';
import {database,failure} from '@/lib/database';
import {teamAccessError} from '@/lib/team-access';
export const dynamic='force-dynamic';
const playerInput=z.object({id:z.string().optional(),firstName:z.string().trim().min(1).max(80),lastName:z.string().trim().min(1).max(80),number:z.number().int().min(0).max(99),code:z.string().trim().min(1).max(80),documentType:z.string().trim().max(80).default(''),documentNumber:z.string().trim().max(80).default('')});
export async function GET(){const denied=await teamAccessError();if(denied)return denied;try{const r=await database().query('SELECT * FROM players ORDER BY CASE WHEN number=0 THEN 100 ELSE number END,"lastName"');return Response.json(r.rows,{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function POST(req:Request){return save(req,false);}
export async function PUT(req:Request){return save(req,true);}
async function save(req:Request,update:boolean){const denied=await teamAccessError();if(denied)return denied;try{
 const parsed=playerInput.safeParse(await req.json());if(!parsed.success||(update&&!parsed.data.id))return Response.json({error:'Verifica i dati e il numero di maglia (1–99 oppure vuoto).'},{status:400});
 const p=parsed.data,db=database(),id=update?p.id!:crypto.randomUUID();
 const values=[p.firstName,p.lastName,p.number,p.code,p.documentType,p.documentNumber,id];const r=await db.query(update?'UPDATE players SET "firstName"=$1,"lastName"=$2,number=$3,code=$4,"documentType"=$5,"documentNumber"=$6 WHERE id=$7':'INSERT INTO players("firstName","lastName",number,code,"documentType","documentNumber",id) VALUES($1,$2,$3,$4,$5,$6,$7)',values);if(update&&!r.rowCount)return Response.json({error:'Giocatore non trovato.'},{status:404});return Response.json({...p,id});
 }catch(e){if((e as {code?:string})?.code==='23505')return Response.json({error:'Questo codice tesseramento è già registrato.'},{status:409});return failure(e);}}
export async function DELETE(req:Request){const denied=await teamAccessError();if(denied)return denied;try{const {id}=await req.json() as {id?:unknown};if(typeof id!=='string')return Response.json({error:'ID non valido'},{status:400});await database().query('DELETE FROM players WHERE id=$1',[id]);return Response.json({ok:true});}catch(e){return failure(e);}}

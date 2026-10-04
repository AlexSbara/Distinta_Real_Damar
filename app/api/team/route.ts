import {database,failure} from '@/lib/database';
import {teamAccessError} from '@/lib/team-access';
export const dynamic='force-dynamic';
export async function GET(){const denied=await teamAccessError();if(denied)return denied;try{const r=await database().query('SELECT name FROM team WHERE id=1');return Response.json(r.rows[0]||{name:''},{headers:{'Cache-Control':'no-store'}});}catch(e){return failure(e);}}
export async function PUT(req:Request){const denied=await teamAccessError();if(denied)return denied;try{const {name}=await req.json() as {name?:unknown};if(typeof name!=='string'||!name.trim()||name.length>80)return Response.json({error:'Inserisci il nome della squadra.'},{status:400});await database().query('INSERT INTO team(id,name) VALUES(1,$1) ON CONFLICT(id) DO UPDATE SET name=excluded.name',[name.trim()]);return Response.json({name:name.trim()});}catch(e){return failure(e);}}

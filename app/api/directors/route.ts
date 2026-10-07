import {z} from 'zod';
import {database, failure} from '@/lib/database';
import {teamAccessError} from '@/lib/team-access';

export const dynamic = 'force-dynamic';

const directorInput = z.object({
  id: z.string().min(1).optional(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  code: z.string().trim().max(80).default(''),
  documentType: z.string().trim().max(80).default(''),
  documentNumber: z.string().trim().max(80).default(''),
});

export async function GET() {
  const denied = await teamAccessError();
  if (denied) return denied;
  try {
    const result = await database().query('SELECT * FROM directors ORDER BY "lastName", "firstName"');
    return Response.json(result.rows, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {return failure(error);}
}

export async function POST(req: Request) {return save(req, false);}
export async function PUT(req: Request) {return save(req, true);}

async function save(req: Request, update: boolean) {
  const denied = await teamAccessError();
  if (denied) return denied;
  try {
    const parsed = directorInput.safeParse(await req.json());
    if (!parsed.success || (update && !parsed.data.id)) {
      return Response.json({error: 'Verifica nome, cognome e dati del dirigente.'}, {status: 400});
    }
    const director = parsed.data;
    const id = update ? director.id! : crypto.randomUUID();
    const result = await database().query(
      update
        ? 'UPDATE directors SET "firstName"=$1,"lastName"=$2,code=$3,"documentType"=$4,"documentNumber"=$5 WHERE id=$6'
        : 'INSERT INTO directors("firstName","lastName",code,"documentType","documentNumber",id) VALUES($1,$2,$3,$4,$5,$6)',
      [director.firstName, director.lastName, director.code, director.documentType, director.documentNumber, id],
    );
    if (update && !result.rowCount) return Response.json({error: 'Dirigente non trovato.'}, {status: 404});
    return Response.json({...director, id});
  } catch (error) {return failure(error);}
}

export async function DELETE(req: Request) {
  const denied = await teamAccessError();
  if (denied) return denied;
  try {
    const parsed = z.object({id: z.string().min(1)}).safeParse(await req.json());
    if (!parsed.success) return Response.json({error: 'ID non valido.'}, {status: 400});
    const result = await database().query('DELETE FROM directors WHERE id=$1', [parsed.data.id]);
    if (!result.rowCount) return Response.json({error: 'Dirigente non trovato.'}, {status: 404});
    return Response.json({ok: true});
  } catch (error) {return failure(error);}
}

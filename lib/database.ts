import {Pool} from 'pg';
const shared=globalThis as typeof globalThis & {distintaPool?:Pool};
export function database(){if(!process.env.DATABASE_URL)throw new Error('Database unavailable');if(!shared.distintaPool)shared.distintaPool=new Pool({connectionString:process.env.DATABASE_URL,max:3,idleTimeoutMillis:10000,connectionTimeoutMillis:10000});return shared.distintaPool;}
export function failure(error:unknown){console.error('Database operation failed',{code:(error as {code?:string})?.code});return Response.json({error:'Salvataggio non disponibile. Riprova tra poco.'},{status:503});}

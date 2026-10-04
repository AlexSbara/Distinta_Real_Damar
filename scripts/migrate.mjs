import {readFile} from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('Configura DATABASE_URL prima di avviare la migrazione.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
try{await client.connect();await client.query('BEGIN');await client.query(await readFile(new URL('./schema.sql',import.meta.url),'utf8'));await client.query('COMMIT');console.log('Schema pronto.');}catch(e){await client.query('ROLLBACK').catch(()=>{});console.error('Migrazione non completata.',e.code||'');process.exitCode=1;}finally{await client.end();}

import {readFile} from 'node:fs/promises';
import {isDeepStrictEqual} from 'node:util';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('Configura DATABASE_URL prima di importare.');
const data=JSON.parse(await readFile(process.argv[2]||new URL('../data/roster-export.json',import.meta.url),'utf8'));
const fields=['id','firstName','lastName','number','code','documentType','documentNumber'];
if(!Array.isArray(data.players)||!data.team||new Set(data.players.map(p=>p.id)).size!==data.players.length||new Set(data.players.map(p=>p.code)).size!==data.players.length)throw new Error('Esportazione non valida.');
const normalize=p=>Object.fromEntries(fields.map(f=>[f,p[f]??'']));
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
try{
 await client.connect();await client.query('BEGIN');
 for(const raw of data.players){const p=normalize(raw);await client.query('INSERT INTO players(id,"firstName","lastName",number,code,"documentType","documentNumber") VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(id) DO NOTHING',fields.map(f=>p[f]));const r=await client.query('SELECT * FROM players WHERE id=$1',[p.id]);if(!isDeepStrictEqual(normalize(r.rows[0]),p))throw new Error('Un giocatore esistente contiene dati diversi: importazione annullata.');}
 await client.query('INSERT INTO team(id,name) VALUES($1,$2) ON CONFLICT(id) DO NOTHING',[data.team.id,data.team.name]);
 const t=await client.query('SELECT name FROM team WHERE id=$1',[data.team.id]);if(t.rows[0]?.name!==data.team.name)throw new Error('La squadra esistente è diversa: importazione annullata.');
 await client.query('COMMIT');console.log(`Importazione verificata: ${data.players.length} giocatori.`);
}catch(e){await client.query('ROLLBACK').catch(()=>{});console.error('Importazione annullata senza modifiche parziali.',e.code||e.message);process.exitCode=1;}finally{await client.end();}

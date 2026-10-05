import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {encode} from 'next-auth/jwt';
import pg from 'pg';

// Run only during the supervised migration, after next build.
// Tokens stay in memory. Disposable records are removed in finally.
assert(process.env.AUTH_SECRET && process.env.DATABASE_URL);
const base='http://127.0.0.1:3137';
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3137'],{
  env:{...process.env,AUTH_URL:base,AUTH_TRUST_HOST:'true',VERCEL:'',VERCEL_URL:''},stdio:'ignore'
});
const db=new pg.Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:10000});
const testCodes=[];
async function cookie(email){
  const token=await encode({secret:process.env.AUTH_SECRET,salt:'authjs.session-token',token:{sub:email,email,name:'Migration verification'},maxAge:300});
  return `authjs.session-token=${token}`;
}
async function request(path,{method='GET',session,body,extraHeaders}={}){
  return fetch(base+path,{method,redirect:'manual',headers:{...(session?{cookie:session}:{}),...(body?{'content-type':'application/json'}:{}),...extraHeaders},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)});
}
try{
  await db.connect();
  let started=false;
  for(let attempt=0;attempt<60;attempt++){
    if(child.exitCode!==null)throw new Error('Verification server exited.');
    try{if((await request('/login')).status===200){started=true;break;}}catch{}
    await delay(250);
  }
  assert(started,'Verification server did not start.');
  const source=process.env.ROSTER_IMPORT_JSON?JSON.parse(process.env.ROSTER_IMPORT_JSON):null;
  const expected=source?.players || (await db.query('SELECT * FROM players')).rows;
  for(const email of ['alex.sbaragli@gmail.com','matteo.fantinati2004@gmail.com']){
    const session=await cookie(email);
    const list=await request('/api/players',{session});
    assert.equal(list.status,200,'Allowed account cannot read players.');
    const players=await list.json();
    for(const p of expected)assert.deepEqual(players.find(x=>x.id===p.id),p,'Imported player differs from source.');
    const code=`migration-test-${randomUUID()}`;
    testCodes.push(code);
    const data={firstName:'Verifica',lastName:'Temporanea',number:0,code,documentType:'',documentNumber:''};
    const create=await request('/api/players',{method:'POST',session,body:data});
    assert.equal(create.status,200,'Allowed account cannot create players.');
    const p=await create.json();
    assert.equal((await request('/api/players',{method:'POST',session,body:data})).status,409,'Duplicate registration code not rejected.');
    assert.equal((await request('/api/players',{method:'PUT',session,body:{...p,number:99}})).status,200,'Allowed account cannot update players.');
    const changed=await db.query('SELECT number FROM players WHERE id=$1',[p.id]);
    assert.equal(changed.rows[0]?.number,99);
    assert.equal((await request('/api/players',{method:'DELETE',session,body:{id:p.id}})).status,200,'Allowed account cannot delete players.');
    assert.equal((await db.query('SELECT id FROM players WHERE id=$1',[p.id])).rowCount,0);
    const team=await request('/api/team',{session});
    assert.equal(team.status,200);
    const teamData=await team.json();
    if(source)assert.deepEqual(teamData,{name:source.team.name});
    console.log('Account authorized: read/create/update/delete verified.');
  }
  for(const method of ['GET','POST','PUT','DELETE']){
    assert.equal((await request('/api/players',{method,body:method==='GET'?undefined:{},extraHeaders:{'x-oai-email':'alex.sbaragli@gmail.com','x-oai-user-email':'alex.sbaragli@gmail.com'}})).status,401);
  }
  const outsider=await cookie('unauthorized@example.com');
  assert.equal((await request('/api/players',{session:outsider})).status,403);
  assert.equal((await request('/api/team',{session:outsider})).status,403);
  const providers=await request('/api/auth/providers');
  assert.equal(providers.status,200);
  assert((await providers.json()).google,'Google provider unavailable.');
  console.log(`Migration verified: ${expected.length} original players match; both accounts have full CRUD; anonymous and unauthorized requests denied.`);
}finally{
  if(testCodes.length)await db.query('DELETE FROM players WHERE code=ANY($1::text[])',[testCodes]);
  await db.end();
  child.kill('SIGTERM');
}

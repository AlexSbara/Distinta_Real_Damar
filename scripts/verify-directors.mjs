import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomUUID} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';
import {encode} from 'next-auth/jwt';
import pg from 'pg';

// Run against a completed build. Test records are isolated and always removed.
assert(process.env.AUTH_SECRET && process.env.DATABASE_URL);
const base = 'http://127.0.0.1:3138';
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3138'], {
  env: {...process.env, AUTH_URL: base, AUTH_TRUST_HOST: 'true', VERCEL: '', VERCEL_URL: ''},
  stdio: 'ignore',
});
const db = new pg.Client({connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000});
const codes = [];
async function session(email) {
  const token = await encode({secret: process.env.AUTH_SECRET, salt: 'authjs.session-token', token: {sub: email, email}, maxAge: 300});
  return `authjs.session-token=${token}`;
}
function request(method, cookie, body) {
  return fetch(`${base}/api/directors`, {
    method,
    headers: {'content-type': 'application/json', ...(cookie ? {cookie} : {})},
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
}
try {
  await db.connect();
  let started = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error('Verification server exited.');
    try {if ((await request('GET')).status === 401) {started = true; break;}} catch {}
    await delay(250);
  }
  assert(started, 'Verification server did not start.');
  for (const email of ['alex.sbaragli@gmail.com', 'matteo.fantinati2004@gmail.com']) {
    const cookie = await session(email);
    const code = `director-verification-${randomUUID()}`;
    codes.push(code);
    const create = await request('POST', cookie, {firstName: 'Verifica', lastName: 'Temporanea', code});
    assert.equal(create.status, 200);
    const director = await create.json();
    assert.equal(director.documentNumber, '');
    const update = {...director, firstName: 'Nome aggiornato', documentType: 'Carta di identità', documentNumber: 'TEST123'};
    assert.equal((await request('PUT', cookie, update)).status, 200);
    const list = await request('GET', cookie);
    assert.equal(list.status, 200);
    assert.deepEqual((await list.json()).find(d => d.id === director.id), update);
    assert.deepEqual((await db.query('SELECT * FROM directors WHERE id=$1', [director.id])).rows[0], update);
    assert.equal((await request('POST', cookie, {...director, firstName: ' '})).status, 400);
    assert.equal((await request('PUT', cookie, {...director, id: randomUUID()})).status, 404);
    assert.equal((await request('DELETE', cookie, {id: director.id})).status, 200);
    assert.equal((await db.query('SELECT id FROM directors WHERE id=$1', [director.id])).rowCount, 0);
    assert.equal((await request('DELETE', cookie, {id: director.id})).status, 404);
    console.log('Dirigenti: inserimento, modifica, lettura e rimozione verificati per un account autorizzato.');
  }
  const outsider = await session('unauthorized@example.com');
  for (const method of ['GET', 'POST', 'PUT', 'DELETE']) {
    const body = method === 'GET' ? undefined : {};
    assert.equal((await request(method, undefined, body)).status, 401);
    assert.equal((await request(method, outsider, body)).status, 403);
  }
  console.log('Dirigenti: accesso anonimo e account non autorizzati rifiutati.');
} finally {
  try {if (codes.length) await db.query('DELETE FROM directors WHERE code=ANY($1::text[])', [codes]);}
  finally {await db.end(); child.kill('SIGTERM');}
}

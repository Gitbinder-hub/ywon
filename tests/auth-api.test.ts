import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from '../apps/api/src/server.ts';

async function withApp(fn: (origin: string) => Promise<void>): Promise<void> {
  const prev = process.env['Ywoom_SESSION_SECRET'];
  process.env['Ywoom_SESSION_SECRET'] = 'test-secret-32-chars-long-enough!!';
  const app = createApp();
  await new Promise<void>((resolve) => app.listen(0, '127.0.0.1', resolve));
  try { await fn(`http://127.0.0.1:${(app.address() as AddressInfo).port}`); }
  finally {
    await new Promise<void>((resolve, reject) => { app.closeAllConnections(); app.close((e) => e ? reject(e) : resolve()); });
    if (prev === undefined) delete process.env['Ywoom_SESSION_SECRET']; else process.env['Ywoom_SESSION_SECRET'] = prev;
  }
}

test('login with valid email sets cookie and /auth/me verifies it', async () => withApp(async (origin) => {
  const login = await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'oleg@example.com' }) });
  assert.equal(login.status, 200);
  const cookie = login.headers.get('set-cookie') ?? '';
  assert.match(cookie, /ywoom_session=/);
  assert.match(cookie, /HttpOnly/);
  // me без куки — 401
  assert.equal((await fetch(origin + '/api/auth/me')).status, 401);
  // me с кукой — 200
  const me = await fetch(origin + '/api/auth/me', { headers: { Cookie: cookie.split(';')[0] ?? '' } });
  assert.equal(me.status, 200);
  assert.equal((await me.json()).userId, 'oleg@example.com');
}));

test('login rejects bad email and missing secret gives 503', async () => withApp(async (origin) => {
  assert.equal((await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'bad' }) })).status, 422);
  const prev = process.env['Ywoom_SESSION_SECRET'];
  delete process.env['Ywoom_SESSION_SECRET'];
  assert.equal((await fetch(origin + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a@b.co' }) })).status, 503);
  if (prev) process.env['Ywoom_SESSION_SECRET'] = prev;
}));

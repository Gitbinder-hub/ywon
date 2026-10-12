import test from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { createApp } from '../apps/api/src/server.ts';
const brief = { kind: 'video', contentLanguage: 'ru', audience: 'Эксперты', goal: 'Объяснить идею' };
async function withApp(fn: (origin: string) => Promise<void>): Promise<void> {
  const app = createApp();
  await new Promise<void>((resolve) => app.listen(0, '127.0.0.1', resolve));
  try { await fn(`http://127.0.0.1:${(app.address() as AddressInfo).port}`); }
  finally { await new Promise<void>((resolve, reject) => { app.closeAllConnections(); app.close((error) => error ? reject(error) : resolve()); }); }
}
test('health truthfully identifies dry-run mode', async () => withApp(async (origin) => {
  const r = await fetch(origin + '/api/health'); assert.equal(r.status, 200);
  assert.equal((await r.json()).productReady, false);
}));
test('valid brief passes HTTP→contract→core, without generation', async () => withApp(async (origin) => {
  const r = await fetch(origin + '/api/dry-run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(brief) });
  assert.equal(r.status, 200); const body = await r.json();
  assert.equal(body.status, 'validated_only'); assert.equal(body.billing.paidCallsAllowed, false);
}));
test('invalid and malformed requests return explicit errors', async () => withApp(async (origin) => {
  for (const [body, expected] of [['{', 400], ['{}', 422]] as const) {
    const r = await fetch(origin + '/api/dry-run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    assert.equal(r.status, expected);
  }
  const r = await fetch(origin + '/api/dry-run', { method: 'POST', body: 'x' }); assert.equal(r.status, 415);
}));
test('oversized body and cross-origin browser request rejected', async () => withApp(async (origin) => {
  let r = await fetch(origin + '/api/dry-run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...brief, goal: 'a'.repeat(20000) }) });
  assert.equal(r.status, 413);
  r = await fetch(origin + '/api/dry-run', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: 'https://other.example' }, body: JSON.stringify(brief) });
  assert.equal(r.status, 403);
}));
test('generation disabled regardless of client fields', async () => withApp(async (origin) => {
  const r = await fetch(origin + '/api/generate', { method: 'POST', body: JSON.stringify({ paidCallsAllowed: true }) });
  assert.equal(r.status, 403);
}));
test('static allowlist serves UI/catalogs, not repository files', async () => withApp(async (origin) => {
  const home = await fetch(origin + '/'); assert.equal(home.status, 200);
  assert.match(home.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
  assert.match(await home.text(), /id="brief-form"/);
  for (const p of ['/AGENTS.md', '/.env', '/packages/contracts/src/index.ts', '/locales/de.json']) {
    assert.equal((await fetch(origin + p)).status, 404);
  }
  assert.equal((await fetch(origin + '/locales/en.json')).status, 200);
}));

// B-001 follow-up: transport boundaries only, not product or P0/P1 acceptance.
test('generation route denies every exercised HTTP method', async () => withApp(async (origin) => {
  for (const method of ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']) {
    const r = await fetch(origin + '/api/generate', { method });
    assert.equal(r.status, 403, method);
    if (method !== 'HEAD') {
      assert.deepEqual(await r.json(), { error: 'paid_and_generation_actions_disabled' });
    } else {
      assert.equal(await r.text(), '');
    }
  }
}));
test('same-origin dry-run succeeds while null or lookalike origins are denied', async () => withApp(async (origin) => {
  for (const [requestOrigin, expected] of [
    [origin, 200], ['null', 403], [origin + '.example', 403],
    [origin.replace('http:', 'https:'), 403],
  ] as const) {
    const r = await fetch(origin + '/api/dry-run', {
      method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', Origin: requestOrigin },
      body: JSON.stringify(brief),
    });
    assert.equal(r.status, expected, requestOrigin);
    const response = await r.json();
    if (expected === 403) assert.equal(response.error, 'cross_origin_denied');
    else assert.equal(response.billing.paidCallsAllowed, false);
  }
}));
test('body limit is inclusive at 16 KiB and counts UTF-8 bytes', async () => withApp(async (origin) => {
  const json = JSON.stringify({ ...brief, audience: 'я'.repeat(2000), goal: 'я'.repeat(2000) });
  const boundary = json + ' '.repeat(16 * 1024 - Buffer.byteLength(json, 'utf8'));
  assert.equal(Buffer.byteLength(boundary, 'utf8'), 16 * 1024);
  assert.ok(boundary.length < 16 * 1024);
  for (const [body, expected] of [[boundary, 200], [boundary + ' ', 413]] as const) {
    const r = await fetch(origin + '/api/dry-run', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    });
    assert.equal(r.status, expected);
    const response = await r.json();
    if (expected === 413) assert.equal(response.error, 'body_too_large');
    else assert.equal(response.status, 'validated_only');
  }
}));
test('invalid envelopes and client-supplied payment permission never enter dry-run core', async () => withApp(async (origin) => {
  for (const value of [null, [], 'text', 42, { ...brief, paidCallsAllowed: true }]) {
    const r = await fetch(origin + '/api/dry-run', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value),
    });
    assert.equal(r.status, 422);
    const response = await r.json();
    assert.equal(response.error, 'invalid_brief');
    assert.ok(Array.isArray(response.issues));
    assert.equal(response.fingerprint, undefined);
    assert.equal(response.billing, undefined);
  }
}));

test('live result route is wired read-only and fails closed when store is unconfigured', async () => withApp(async (origin) => {
  let response = await fetch(origin + '/api/live-results/google-p0-002');
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'result_store_unavailable' });
  response = await fetch(origin + '/api/live-results/google-p0-002', { method: 'POST' });
  assert.equal(response.status, 405);
  assert.equal(response.headers.get('allow'), 'GET');
}));

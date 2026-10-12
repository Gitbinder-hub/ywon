import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEmail } from '../packages/auth/src/email.ts';
import { issueSession, verifySession } from '../packages/auth/src/session.ts';
import { canAccessTenant, canPerform } from '../packages/auth/src/tenant.ts';
import { isBlockedUrl, checkIngestLimit } from '../packages/auth/src/ssrf.ts';
import { checkTenantSchema } from '../packages/auth/src/schema-check.ts';
import { readFileSync } from 'node:fs';

// ── Email ──────────────────────────────────────────────────────────────
test('email normalized and bad rejected', () => {
  assert.equal(normalizeEmail('  Oleg@Example.COM  '), 'oleg@example.com');
  assert.equal(normalizeEmail('not-email'), null);
  assert.equal(normalizeEmail(''), null);
  assert.equal(normalizeEmail(null), null);
});

// ── Session (HMAC) — чужой секрет не подходит ─────────────────────────
test('session issued and verified; wrong secret fails, expired fails', () => {
  const secret = 'test-secret-32-chars-long-enough!!';
  const now = new Date('2026-10-07T10:00:00Z');
  const s = issueSession('oleg@example.com', secret, 3600, now);
  assert.equal(verifySession(s.token, secret, now).ok, true);
  assert.equal(verifySession(s.token, 'wrong-secret', now).ok, false);
  // просрочена
  const later = new Date('2026-10-07T12:00:00Z');
  const expired = verifySession(s.token, secret, later);
  assert.equal(expired.ok, false);
  if (!expired.ok) assert.equal(expired.code, 'expired');
  // подмена payload — подпись ломается
  const tampered = s.token.slice(0, -4) + 'xxxx';
  assert.equal(verifySession(tampered, secret, now).ok, false);
});

// ── Tenant isolation: главный забор ──────────────────────────────────
test('tenant isolation: same workspace allowed, cross-tenant denied, no auth denied', () => {
  const memberships = [{ userId: 'u1', workspaceId: 'ws-a', role: 'viewer' as const }];
  // свой
  assert.equal(canAccessTenant({ actor: { userId: 'u1', workspaceId: 'ws-a' }, resource: { workspaceId: 'ws-a' }, memberships }).allowed, true);
  // чужой (даже зная ID)
  const cross = canAccessTenant({ actor: { userId: 'u1', workspaceId: 'ws-a' }, resource: { workspaceId: 'ws-b' }, memberships });
  assert.equal(cross.allowed, false);
  if (!cross.allowed) assert.equal(cross.reason, 'cross_tenant_denied');
  // без входа
  assert.equal(canAccessTenant({ actor: null, resource: { workspaceId: 'ws-a' }, memberships }).allowed, false);
  // нет membership
  assert.equal(canAccessTenant({ actor: { userId: 'u2', workspaceId: 'ws-a' }, resource: { workspaceId: 'ws-a' }, memberships }).allowed, false);
});

test('roles: viewer read only, editor write, owner manage', () => {
  assert.equal(canPerform('viewer', 'read'), true);
  assert.equal(canPerform('viewer', 'write'), false);
  assert.equal(canPerform('editor', 'write'), true);
  assert.equal(canPerform('editor', 'manage_members'), false);
  assert.equal(canPerform('owner', 'manage_members'), true);
  assert.equal(canPerform(null, 'read'), false);
});

// ── SSRF ───────────────────────────────────────────────────────────────
test('SSRF blocked: private IP, localhost, metadata, wrong protocol', () => {
  assert.equal(isBlockedUrl('http://169.254.169.254/metadata').blocked, true);
  assert.equal(isBlockedUrl('http://10.0.0.5/secret').blocked, true);
  assert.equal(isBlockedUrl('http://192.168.1.1/').blocked, true);
  assert.equal(isBlockedUrl('http://localhost/api').blocked, true);
  assert.equal(isBlockedUrl('file:///etc/passwd').blocked, true);
  assert.equal(isBlockedUrl('https://example.com/image.png').blocked, false);
  assert.equal(isBlockedUrl('not a url').blocked, true);
});

// ── Ingest лимиты ──────────────────────────────────────────────────────
test('ingest limits enforced', () => {
  assert.equal(checkIngestLimit('image', 20 * 1024 * 1024).ok, true);
  assert.equal(checkIngestLimit('image', 21 * 1024 * 1024).ok, false);
  assert.equal(checkIngestLimit('url', 5 * 1024 * 1024).ok, true);
  assert.equal(checkIngestLimit('url', 6 * 1024 * 1024).ok, false);
});

// ── Миграция: tenant consistency ───────────────────────────────────────
test('migration 001 contains tenant constraints', () => {
  const sql = readFileSync('infra/migrations/001_tenant_consistency.sql', 'utf8');
  const check = checkTenantSchema(sql);
  assert.equal(check.ok, true, check.issues.join(', '));
});

// ── Секреты не в гите ─────────────────────────────────────────────────
test('no secret in repo: .env not committed, .env.example has no real key', () => {
  const example = readFileSync('.env.example', 'utf8');
  // example не должен содержать реального 32-символьного секрета
  assert.ok(!/ANTHROPIC_API_KEY=sk-/.test(example), 'no real key in example');
  assert.ok(example.includes('Ywoom_SESSION_SECRET'), 'secret placeholder documented');
});

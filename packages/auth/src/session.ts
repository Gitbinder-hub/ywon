import { createHmac, timingSafeEqual } from 'node:crypto';
export type UserId = string;

function b64uEncode(buf: Buffer): string { return buf.toString('base64url'); }
function b64uDecode(s: string): Buffer { return Buffer.from(s, 'base64url'); }

export interface Session { token: string; userId: UserId; expiresAt: string; issuedAt: string }

export function issueSession(userId: UserId, secret: string, ttlSec = 3600, now: Date = new Date()): Session {
  const issuedAt = now.toISOString();
  const expiresAt = new Date(now.getTime() + ttlSec * 1000).toISOString();
  const payload = JSON.stringify({ userId, issuedAt, expiresAt });
  const header = b64uEncode(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'YwoomSession' })));
  const body = b64uEncode(Buffer.from(payload));
  const sig = b64uEncode(createHmac('sha256', secret).update(`${header}.${body}`).digest());
  return { token: `${header}.${body}.${sig}`, userId, expiresAt, issuedAt };
}

export function verifySession(token: string, secret: string, now: Date = new Date()): { ok: true; userId: UserId } | { ok: false; code: string } {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, code: 'malformed_token' };
  const [header, body, sig] = parts as [string, string, string];
  const expected = b64uEncode(createHmac('sha256', secret).update(`${header}.${body}`).digest());
  const a = Buffer.from(sig); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return { ok: false, code: 'bad_signature' };
  try {
    const p = JSON.parse(b64uDecode(body).toString('utf8')) as { userId: string; expiresAt: string };
    if (!p.userId || !p.expiresAt) return { ok: false, code: 'bad_payload' };
    if (Date.parse(p.expiresAt) <= now.getTime()) return { ok: false, code: 'expired' };
    return { ok: true, userId: p.userId };
  } catch { return { ok: false, code: 'bad_payload' }; }
}

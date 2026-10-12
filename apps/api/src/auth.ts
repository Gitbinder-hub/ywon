import type { IncomingMessage, ServerResponse } from 'node:http';
import { normalizeEmail } from '../../../packages/auth/src/email.ts';
import { verifySession } from '../../../packages/auth/src/session.ts';

// Читает куку/заголовок и проверяет сессию. Секрет — только из env, никогда из кода/лога.
export function getSessionUser(req: IncomingMessage): { userId: string } | null {
  const secret = process.env['Ywoom_SESSION_SECRET'];
  if (!secret) return null; // без секрета — нет авторизации (fail-closed)
  const cookie = req.headers.cookie ?? '';
  const match = cookie.match(/(?:^|;\s*)ywoom_session=([^;]+)/);
  const token = match?.[1] ?? (req.headers['authorization'] as string | undefined)?.replace(/^Bearer\s+/i, '') ?? '';
  if (!token) return null;
  const res = verifySession(decodeURIComponent(token), secret);
  return res.ok ? { userId: res.userId } : null;
}

// Простая проверка email-формы (без пароля в прототипе — вход по email + кука)
export function parseLoginBody(body: unknown): { email: string } | { error: string } {
  if (typeof body !== 'object' || body === null) return { error: 'invalid_body' };
  const email = normalizeEmail((body as Record<string, unknown>)['email']);
  if (!email) return { error: 'invalid_email' };
  return { email };
}

export function setSessionCookie(res: ServerResponse, token: string): void {
  // httpOnly + SameSite=Lax + Secure в проде (здесь localhost — без Secure чтобы тестам не мешать)
  res.setHeader('Set-Cookie', `ywoom_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`);
}

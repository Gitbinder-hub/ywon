// SSRF защита + лимиты ingest — всё fail-closed (если сомневаемся — блокируем)
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1', '169.254.169.254', 'metadata.google.internal']);
const PRIVATE_RE = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|127\.|169\.254\.|::1|fc00:|fe80:)/i;

export function isBlockedUrl(raw: string): { blocked: boolean; reason?: string } {
  let url: URL;
  try { url = new URL(raw); } catch { return { blocked: true, reason: 'invalid_url' }; }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return { blocked: true, reason: 'only_http_https' };
  const host = url.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) return { blocked: true, reason: 'blocked_host' };
  if (PRIVATE_RE.test(host)) return { blocked: true, reason: 'private_ip' };
  return { blocked: false };
}

export const INGEST_LIMITS = {
  image: 20 * 1024 * 1024,
  audio: 50 * 1024 * 1024,
  video: 500 * 1024 * 1024,
  urlFetch: 5 * 1024 * 1024,
  zipEntries: 1000,
  zipRatio: 100,
} as const;

export function checkIngestLimit(kind: 'image' | 'audio' | 'video' | 'url', bytes: number): { ok: boolean; reason?: string } {
  const limit = kind === 'url' ? INGEST_LIMITS.urlFetch : INGEST_LIMITS[kind];
  if (bytes > limit) return { ok: false, reason: `exceeds_${kind}_limit_${limit}` };
  return { ok: true };
}

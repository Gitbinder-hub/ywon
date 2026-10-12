/** Billing — prototype with persistence (file fallback, Postgres when DATABASE_URL set). No Stripe yet per owner. */
export type Plan = 'free' | 'pro' | 'studio';
export interface Subscription { userId: string; plan: Plan; status: 'active' | 'canceled'; createdAt: string; updatedAt: string; trialUntil?: string | null; }

const store = new Map<string, Subscription>();
let pgReady: boolean | null = null;
let filePath: string | null = null;

function dbUrl(): string | null {
  const u = process.env['DATABASE_URL'] ?? '';
  return u.trim() ? u : null;
}

async function ensurePg(): Promise<boolean> {
  if (pgReady !== null) return pgReady;
  const url = dbUrl();
  if (!url) { pgReady = false; return false; }
  try {
    const { Client } = await import('pg') as unknown as { Client: new (opts: { connectionString: string; connectionTimeoutMillis: number }) => { connect(): Promise<void>; query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>; end(): Promise<void> } };
    const c = new Client({ connectionString: url, connectionTimeoutMillis: 6000 });
    await c.connect();
    await c.query(`CREATE TABLE IF NOT EXISTS ywoom_billing (
      user_id TEXT PRIMARY KEY,
      plan TEXT NOT NULL CHECK (plan IN ('free','pro','studio')),
      status TEXT NOT NULL CHECK (status IN ('active','canceled')),
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      trial_until TIMESTAMPTZ
    )`);
    await c.end();
    pgReady = true;
    return true;
  } catch { pgReady = false; return false; }
}

function ensureFile(): string | null {
  if (filePath !== null) return filePath;
  try {
    const { existsSync, readFileSync, mkdirSync } = require('node:fs') as typeof import('node:fs');
    const { join } = require('node:path') as typeof import('node:path');
    const { fileURLToPath } = require('node:url') as typeof import('node:url');
    const root = fileURLToPath(new URL('../../../.Ywoom-offline/', import.meta.url));
    const p = join(root, 'billing.json');
    filePath = p;
    if (existsSync(p)) {
      try {
        const raw = JSON.parse(readFileSync(p, 'utf8')) as Record<string, Subscription>;
        for (const [k, v] of Object.entries(raw)) store.set(k, v);
      } catch {}
    } else {
      try { mkdirSync(root, { recursive: true }); } catch {}
    }
    return p;
  } catch { filePath = ''; return null; }
}

function persistFile(): void {
  const p = ensureFile();
  if (!p) return;
  try {
    const { writeFileSync, renameSync } = require('node:fs') as typeof import('node:fs');
    const { randomUUID } = require('node:crypto') as typeof import('node:crypto');
    const tmp = p + '.' + randomUUID() + '.tmp';
    const obj: Record<string, Subscription> = {};
    for (const [k, v] of store) obj[k] = v;
    writeFileSync(tmp, JSON.stringify(obj, null, 2));
    renameSync(tmp, p);
  } catch {}
}

async function persistPg(sub: Subscription): Promise<void> {
  if (!(await ensurePg())) return;
  const url = dbUrl()!;
  try {
    const { Client } = await import('pg') as unknown as { Client: new (opts: { connectionString: string; connectionTimeoutMillis: number }) => { connect(): Promise<void>; query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }>; end(): Promise<void> } };
    const c = new Client({ connectionString: url, connectionTimeoutMillis: 6000 });
    await c.connect();
    await c.query(
      `INSERT INTO ywoom_billing (user_id, plan, status, created_at, updated_at, trial_until)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (user_id) DO UPDATE SET plan=EXCLUDED.plan, status=EXCLUDED.status, updated_at=EXCLUDED.updated_at, trial_until=EXCLUDED.trial_until`,
      [sub.userId, sub.plan, sub.status, sub.createdAt, sub.updatedAt, sub.trialUntil ?? null]
    );
    await c.end();
  } catch {}
}

export function getSubscription(userId: string): Subscription | null {
  ensureFile();
  // fire-and-forget pg read is not sync; caller that needs freshness should use getSubscriptionAsync
  return store.get(userId) ?? null;
}

export async function getSubscriptionAsync(userId: string): Promise<Subscription | null> {
  if (await ensurePg()) {
    try {
      const url = dbUrl()!;
      const { Client } = await import('pg') as unknown as { Client: new (opts: { connectionString: string; connectionTimeoutMillis: number }) => { connect(): Promise<void>; query(sql: string, params?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }>; end(): Promise<void> } };
      const c = new Client({ connectionString: url, connectionTimeoutMillis: 6000 });
      await c.connect();
      const r = await c.query(`SELECT user_id, plan, status, created_at, updated_at, trial_until FROM ywoom_billing WHERE user_id=$1`, [userId]);
      await c.end();
      const row = (r.rows[0] as Record<string, unknown> | undefined);
      if (row) {
        const sub: Subscription = {
          userId: String(row['user_id']),
          plan: String(row['plan']) as Plan,
          status: String(row['status']) as Subscription['status'],
          createdAt: new Date(String(row['created_at'])).toISOString(),
          updatedAt: new Date(String(row['updated_at'])).toISOString(),
          trialUntil: row['trial_until'] ? new Date(String(row['trial_until'])).toISOString() : null,
        };
        store.set(userId, sub);
        return sub;
      }
    } catch {}
  }
  ensureFile();
  return store.get(userId) ?? null;
}

export function getPlan(userId: string | null): Plan {
  if (!userId) return 'free';
  const s = store.get(userId);
  if (!s || s.status !== 'active') return 'free';
  return s.plan;
}

export function maxProjects(plan: Plan): number {
  if (plan === 'free') return 3;
  if (plan === 'pro') return 100;
  return Infinity;
}

export function subscribe(userId: string, plan: Plan): Subscription {
  ensureFile();
  const now = new Date().toISOString();
  const cur = store.get(userId);
  const sub: Subscription = cur
    ? { ...cur, plan, status: 'active', updatedAt: now }
    : { userId, plan, status: 'active', createdAt: now, updatedAt: now };
  store.set(userId, sub);
  persistFile();
  void persistPg(sub);
  return sub;
}

export function isTrial(sub: Subscription | null): boolean {
  if (!sub || !sub.trialUntil) return false;
  return new Date(sub.trialUntil).getTime() > Date.now();
}
export function effectivePlan(userId: string | null): Plan {
  const s = userId ? getPlan(userId) : 'free';
  if (s !== 'free') return s;
  const sub = userId ? getSubscription(userId) : null;
  if (isTrial(sub)) return 'pro';
  return 'free';
}
export function startTrial(userId: string, days = 7): Subscription {
  ensureFile();
  const now = new Date().toISOString();
  const until = new Date(Date.now() + days*24*60*60*1000).toISOString();
  const cur = store.get(userId);
  const sub: Subscription = cur
    ? { ...cur, plan: cur.plan, status: 'active' as const, trialUntil: until, updatedAt: now }
    : { userId, plan: 'free' as Plan, status: 'active' as const, createdAt: now, updatedAt: now, trialUntil: until };
  store.set(userId, sub);
  persistFile();
  void persistPg(sub);
  return sub;
}
export function cancel(userId: string): Subscription | null {
  ensureFile();
  const cur = store.get(userId);
  if (!cur) return null;
  const upd = { ...cur, status: 'canceled' as const, updatedAt: new Date().toISOString() };
  store.set(userId, upd);
  persistFile();
  void persistPg(upd);
  return upd;
}

export function listPlans(): Array<{ id: Plan; name: string; price: string; note: string }> {
  return [
    { id: 'free', name: 'Free', price: '$0', note: 'Offline studio only, локальная сборка FFmpeg · до 3 проектов' },
    { id: 'pro', name: 'Pro', price: '$19 / мес', note: 'Factory + Companion + облачные генерации · до 100 проектов' },
    { id: 'studio', name: 'Studio', price: '$49 / мес', note: 'Pro + приоритеты + команды (future) · без лимита' },
  ];
}

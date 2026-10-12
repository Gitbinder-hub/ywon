/** Live DB helpers — optional Postgres wiring for apps/api. No secrets in code. */
function envUrl(): string | null {
  const u = process.env['DATABASE_URL'] ?? '';
  return u.trim() ? u : null;
}
export async function checkDb(): Promise<{ ok: boolean; tables?: number; error?: string }> {
  const url = envUrl();
  if (!url) return { ok: false, error: 'DATABASE_URL not configured' };
  try {
    const { Client } = await import('pg') as unknown as { Client: new (opts: { connectionString: string; connectionTimeoutMillis: number }) => { connect(): Promise<void>; query(sql: string): Promise<{ rows: Array<Record<string,unknown>> }>; end(): Promise<void> } };
    const c = new Client({ connectionString: url, connectionTimeoutMillis: 6000 });
    await c.connect();
    const r = await c.query("select count(*)::int as n from pg_tables where schemaname='public'");
    const n = (r.rows[0] as { n: number }).n ?? 0;
    await c.end();
    return { ok: true, tables: n };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
export function dbConfigured(): boolean { return !!envUrl(); }

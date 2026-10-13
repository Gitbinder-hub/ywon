import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { createOffline } from './offline.ts';
import { createLiveResults } from './live-results.ts';
import { isAllowedPreviewRequest, isPublicCloud } from './local-request.ts';
import { getSessionUser, parseLoginBody, setSessionCookie } from './auth.ts';
import { issueSession } from '../../../packages/auth/src/session.ts';
import { checkDb, dbConfigured } from './db.ts';
import { checkS3, s3Configured } from './s3.ts';
import { startRadarCron } from './radar-cron.ts';
import { startFreelancerCron } from './freelancer-cron.ts';
import * as billing from './billing.ts';

const VERSION = '3.1';
const MAX_BODY = 16 * 1024;
const staticFiles = new Map([
  ['/architect', ['architect.html', 'text/html; charset=utf-8']],
  ['/architect.js', ['architect.js', 'text/javascript; charset=utf-8']],
  ['/architect.css', ['architect.css', 'text/css; charset=utf-8']],
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ['/install', ['install.html', 'text/html; charset=utf-8']],
  ['/drawer.js', ['drawer.js', 'text/javascript; charset=utf-8']],
  ['/design.css', ['design.css', 'text/css; charset=utf-8']],
  ['/home.js', ['home.js', 'text/javascript; charset=utf-8']],
  ['/pwa.js', ['pwa.js', 'text/javascript; charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript; charset=utf-8']],
  ['/style.css', ['style.css', 'text/css; charset=utf-8']],
  ['/shell.css', ['shell.css', 'text/css; charset=utf-8']],
  ['/shell.js', ['shell.js', 'text/javascript; charset=utf-8']],
  ['/journey', ['journey.html', 'text/html; charset=utf-8']],
  ['/journey.js', ['journey.js', 'text/javascript; charset=utf-8']],
  ['/journey-core.js', ['journey-core.js', 'text/javascript; charset=utf-8']],
  ['/journey.css', ['journey.css', 'text/css; charset=utf-8']],
  ['/studio-journey.js', ['studio-journey.js', 'text/javascript; charset=utf-8']],
  ['/billing', ['billing.html', 'text/html; charset=utf-8']],
  ['/billing.js', ['billing.js', 'text/javascript; charset=utf-8']],
  ['/settings', ['settings.html', 'text/html; charset=utf-8']],
  ['/skills', ['skills.html', 'text/html; charset=utf-8']],
  ['/skills.js', ['skills.js', 'text/javascript; charset=utf-8']],
  ['/skills.css', ['skills.css', 'text/css; charset=utf-8']],
  ['/video-editor', ['video-editor.html', 'text/html; charset=utf-8']],
  ['/video-editor.js', ['video-editor.js', 'text/javascript; charset=utf-8']],
  ['/video-editor.css', ['video-editor.css', 'text/css; charset=utf-8']],
  ['/manifest.webmanifest', ['manifest.webmanifest', 'application/manifest+json; charset=utf-8']],
  ['/sw.js', ['sw.js', 'text/javascript; charset=utf-8']],
  ['/image-editor', ['image-editor.html', 'text/html; charset=utf-8']],
  ['/image-editor.js', ['image-editor.js', 'text/javascript; charset=utf-8']],
  ['/image-editor.css', ['image-editor.css', 'text/css; charset=utf-8']],
  ['/Rubik-Cyrillic.woff2', ['Rubik-Cyrillic.woff2', 'font/woff2']],
  ['/Rubik-Latin.woff2', ['Rubik-Latin.woff2', 'font/woff2']],
  ['/Ywoom.ico', ['Ywoom.ico', 'image/x-icon']],
  ['/favicon.ico', ['Ywoom.ico', 'image/x-icon']],
  ['/locales/en.json', ['locales/en.json', 'application/json; charset=utf-8']],
  ['/locales/ru.json', ['locales/ru.json', 'application/json; charset=utf-8']],
  ['/icons/ywoom3d/512/home.png', ['icons/ywoom3d/512/home.png', 'image/png']],
  ['/icons/ywoom3d/512/studio.png', ['icons/ywoom3d/512/studio.png', 'image/png']],
  ['/icons/ywoom3d/512/plan.png', ['icons/ywoom3d/512/plan.png', 'image/png']],
  ['/icons/ywoom3d/512/avatars.png', ['icons/ywoom3d/512/avatars.png', 'image/png']],
  ['/icons/ywoom3d/512/director.png', ['icons/ywoom3d/512/director.png', 'image/png']],
  ['/icons/ywoom3d/512/analytics.png', ['icons/ywoom3d/512/analytics.png', 'image/png']],
  ['/icons/ywoom3d/512/settings.png', ['icons/ywoom3d/512/settings.png', 'image/png']],
  ['/icons/ywoom3d/512/pipeline.png', ['icons/ywoom3d/512/pipeline.png', 'image/png']],
  ['/icons/ywoom3d/512/approve.png', ['icons/ywoom3d/512/approve.png', 'image/png']],
  ['/icons/ywoom3d/512/publish.png', ['icons/ywoom3d/512/publish.png', 'image/png']],
  ['/icons/ywoom3d/512/balance.png', ['icons/ywoom3d/512/balance.png', 'image/png']],
  ['/icons/ywoom3d/512/search.png', ['icons/ywoom3d/512/search.png', 'image/png']],
  ['/icons/ywoom3d/512/bell.png', ['icons/ywoom3d/512/bell.png', 'image/png']],
  ['/icons/ywoom3d/512/folder.png', ['icons/ywoom3d/512/folder.png', 'image/png']],
  ['/icons/ywoom3d/512/wardrobe.png', ['icons/ywoom3d/512/wardrobe.png', 'image/png']],
  ['/icons/ywoom3d/1024/home.png', ['icons/ywoom3d/1024/home.png', 'image/png']],
  ['/icons/ywoom3d/1024/studio.png', ['icons/ywoom3d/1024/studio.png', 'image/png']],
  ['/icons/ywoom3d/1024/plan.png', ['icons/ywoom3d/1024/plan.png', 'image/png']],
  ['/icons/ywoom3d/1024/avatars.png', ['icons/ywoom3d/1024/avatars.png', 'image/png']],
  ['/icons/ywoom3d/1024/director.png', ['icons/ywoom3d/1024/director.png', 'image/png']],
  ['/icons/ywoom3d/1024/analytics.png', ['icons/ywoom3d/1024/analytics.png', 'image/png']],
  ['/icons/ywoom3d/1024/settings.png', ['icons/ywoom3d/1024/settings.png', 'image/png']],
  ['/icons/ywoom3d/1024/pipeline.png', ['icons/ywoom3d/1024/pipeline.png', 'image/png']],
  ['/icons/ywoom3d/1024/approve.png', ['icons/ywoom3d/1024/approve.png', 'image/png']],
  ['/icons/ywoom3d/1024/publish.png', ['icons/ywoom3d/1024/publish.png', 'image/png']],
  ['/icons/ywoom3d/1024/balance.png', ['icons/ywoom3d/1024/balance.png', 'image/png']],
  ['/icons/ywoom3d/1024/bell.png', ['icons/ywoom3d/1024/bell.png', 'image/png']],
  ['/icons/ywoom3d/1024/search.png', ['icons/ywoom3d/1024/search.png', 'image/png']],
  ['/icons/ywoom3d/1024/folder.png', ['icons/ywoom3d/1024/folder.png', 'image/png']],
  ['/icons/ywoom3d/1024/wardrobe.png', ['icons/ywoom3d/1024/wardrobe.png', 'image/png']],
]);
function json(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}
async function readBody(req: IncomingMessage): Promise<string> {
  let total = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += buffer.length;
    if (total > MAX_BODY) throw new Error('body_too_large');
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}
async function handle(req: IncomingMessage, res: ServerResponse, offline: ReturnType<typeof createOffline>, liveResults: ReturnType<typeof createLiveResults>): Promise<void> {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // CSP: allow self only; gtmpx is optional analytics, keep for compat
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://gtmpx.com 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://gtmpx.com; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  const url = new URL(req.url ?? '/', 'http://localhost');
  // normalize trailing slash
  if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.slice(0, -1);
  }
  const journeyPaths = ['/journey', '/journey.js', '/journey-core.js', '/journey.css', '/studio-journey.js'];
  if (journeyPaths.includes(url.pathname) && !isAllowedPreviewRequest(req)) {
    json(res, 403, { error: 'localhost_same_origin_required' }); return;
  }
  if (await offline.handle(req, res, url)) return;
  if (await liveResults.handle(req, res, url)) return;
  if (req.method === 'GET' && url.pathname === '/api/health') {
    const live = dbConfigured() && s3Configured() ? 'live_wired' : 'dry_run';
    json(res, 200, { service: 'Ywoom', mode: live, productReady: false, dbConfigured: dbConfigured(), s3Configured: s3Configured(), version: VERSION, cloud: isPublicCloud() }); return;
  }
  if (req.method === 'GET' && url.pathname === '/api/health/live') {
    // In cloud, allow health/live without strict same-origin so App Hosting checks pass
    if (!isPublicCloud() && !isAllowedPreviewRequest(req)) { json(res, 403, { error: 'localhost_same_origin_required' }); return; }
    const [db, s3] = await Promise.all([checkDb(), checkS3()]);
    const ok = db.ok && s3.ok;
    json(res, ok ? 200 : 503, { service: 'Ywoom', mode: ok ? 'live' : 'degraded', productReady: false, db, s3 });
    return;
  }
  if (url.pathname === '/api/auth/login' && req.method === 'POST') {
    let body: unknown;
    try { body = JSON.parse(await readBody(req)); } catch { json(res, 400, { error: 'invalid_json' }); return; }
    const parsed = parseLoginBody(body);
    if ('error' in parsed) { json(res, 422, { error: parsed.error }); return; }
    const secret = process.env['Ywoom_SESSION_SECRET'];
    if (!secret) { json(res, 503, { error: 'auth_not_configured' }); return; }
    const session = issueSession(parsed.email, secret);
    setSessionCookie(res, session.token);
    json(res, 200, { ok: true, userId: session.userId, expiresAt: session.expiresAt });
    return;
  }
  if (url.pathname === '/api/auth/me' && req.method === 'GET') {
    const user = getSessionUser(req);
    if (!user) { json(res, 401, { error: 'not_authenticated' }); return; }
    json(res, 200, { ok: true, userId: user.userId });
    return;
  }
  if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
    res.setHeader('Set-Cookie', `ywoom_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
    json(res, 200, { ok: true }); return;
  }
  if (url.pathname === '/api/generate') {
    json(res, 403, { error: 'paid_and_generation_actions_disabled' }); return;
  }
  if (url.pathname === '/api/version' && req.method === 'GET') {
    json(res, 200, { version: VERSION, name: 'Ywoom', displayName: 'Ywoom Factory', channel: isPublicCloud() ? 'cloud' : 'local' }); return;
  }
  if (url.pathname === '/api/updates' && req.method === 'GET') {
    json(res, 200, { current: VERSION, latest: VERSION, upToDate: true, notes: '3.1: оффлайн-студия — сцены, озвучка, MP4 30-60с' }); return;
  }
  if (url.pathname === '/api/billing/limits' && req.method === 'GET') {
    const u = getSessionUser(req);
    const plan = billing.effectivePlan(u ? u.userId : null);
    const lim = billing.maxProjects(plan);
    json(res, 200, { plan, maxProjects: Number.isFinite(lim) ? lim : -1, unlimited: !Number.isFinite(lim) }); return;
  }
  if (url.pathname === '/api/storage' && req.method === 'GET') {
    if (!isPublicCloud() && !isAllowedPreviewRequest(req)) { json(res, 403, { error: 'localhost_same_origin_required' }); return; }
    try {
      const offlineRoot = fileURLToPath(new URL('../../../.Ywoom-offline/', import.meta.url));
      let projects = 0, jobs = 0, assets = 0, totalAssetBytes = 0;
      const pDir = join(offlineRoot, 'projects');
      const jDir = join(offlineRoot, 'jobs');
      const aDir = join(offlineRoot, 'assets');
      if (existsSync(pDir)) projects = readdirSync(pDir).filter((n: string) => n.endsWith('.json')).length;
      if (existsSync(jDir)) jobs = readdirSync(jDir).filter((n: string) => /^[0-9a-f]{8}-/.test(n)).length;
      if (existsSync(aDir)) {
        for (const f of readdirSync(aDir)) {
          if (f.endsWith('.bin')) { assets++; try { totalAssetBytes += statSync(join(aDir, f)).size; } catch {} }
        }
      }
      json(res, 200, { version: VERSION, projects, jobs, assets, totalAssetBytes, totalAssetMiB: (totalAssetBytes/1024/1024).toFixed(2), offlineRoot }); return;
    } catch { json(res, 200, { version: VERSION, projects: 0, jobs: 0, assets: 0, totalAssetBytes: 0 }); return; }
  }
  if (url.pathname === '/api/billing/trial' && req.method === 'POST') {
    const u = getSessionUser(req);
    if (!u) { json(res, 401, { error: 'not_authenticated' }); return; }
    const cur = billing.getSubscription(u.userId);
    if (cur && billing.isTrial(cur)) { json(res, 409, { error: 'trial_already_active' }); return; }
    if (cur && cur.plan !== 'free' && cur.status==='active') { json(res, 409, { error: 'already_pro' }); return; }
    const sub = billing.startTrial(u.userId, 7);
    json(res, 200, { subscription: sub, effectivePlan: 'pro', trialUntil: sub.trialUntil }); return;
  }
  if (url.pathname === '/api/billing/plans' && req.method === 'GET') {
    json(res, 200, billing.listPlans()); return;
  }
  if (url.pathname === '/api/billing/subscription' && req.method === 'GET') {
    const u = getSessionUser(req);
    if (!u) { json(res, 401, { error: 'not_authenticated' }); return; }
    const sub = billing.getSubscription(u.userId);
    json(res, 200, { subscription: sub }); return;
  }
  if (url.pathname === '/api/billing/subscribe' && req.method === 'POST') {
    const u = getSessionUser(req);
    if (!u) { json(res, 401, { error: 'not_authenticated' }); return; }
    let b: unknown; try { b = JSON.parse(await readBody(req)); } catch { json(res, 400, { error: 'invalid_json' }); return; }
    const plan = (b as Record<string, unknown>)['plan'];
    if (plan !== 'free' && plan !== 'pro' && plan !== 'studio') { json(res, 422, { error: 'invalid_plan' }); return; }
    json(res, 200, { subscription: billing.subscribe(u.userId, plan as billing.Plan) }); return;
  }
  if (url.pathname === '/api/billing/cancel' && req.method === 'POST') {
    const u = getSessionUser(req);
    if (!u) { json(res, 401, { error: 'not_authenticated' }); return; }
    json(res, 200, { subscription: billing.cancel(u.userId) }); return;
  }
  if (req.method === 'GET' && url.pathname === '/api/skills') {
    try {
      const { listSkillCards } = await import('./skills.ts');
      const cards = listSkillCards();
      json(res, 200, { skills: cards, _debug: { count: cards.length } }); return;
    } catch (e) {
      json(res, 500, { error: 'skills_load_failed', detail: String(e) }); return;
    }
  }
  if (req.method === 'GET' && url.pathname.startsWith('/api/skills/')) {
    const id = decodeURIComponent(url.pathname.slice('/api/skills/'.length));
    if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(id)) { json(res, 422, { error: 'invalid_skill_id' }); return; }
    const fs = await import('node:fs');
    const path = await import('node:path');
    const { fileURLToPath: fup } = await import('node:url');
    const root = path.join(path.dirname(fup(import.meta.url)), '..', '..', '..');
    const yamlPath = path.join(root, 'skills', id, 'skill.yaml');
    const mdPath = path.join(root, 'skills', id, 'SKILL.md');
    if (!fs.existsSync(yamlPath)) { json(res, 404, { error: 'skill_not_found' }); return; }
    const yaml = fs.readFileSync(yamlPath, 'utf8');
    const md = fs.existsSync(mdPath) ? fs.readFileSync(mdPath, 'utf8') : null;
    const promptsDir = path.join(root, 'skills', id, 'prompts');
    const prompts: string[] = [];
    if (fs.existsSync(promptsDir)) for (const f of fs.readdirSync(promptsDir).filter((f: string) => f.endsWith('.md'))) prompts.push(f);
    json(res, 200, { id, yaml, md, prompts }); return;
  }
  if (req.method === 'GET' && url.pathname === '/api/agents') {
    const agents = [
      { id: 'strategist', role: 'Strategist', status: 'active', task: 'Планирует контент-неделю', uptime: '2ч 14м' },
      { id: 'producer', role: 'Producer', status: 'active', task: 'Собирает сцены MP4', uptime: '47м' },
      { id: 'quality', role: 'Quality', status: 'idle', task: 'Ждёт проверку', uptime: '—' },
      { id: 'guardian', role: 'Guardian', status: 'active', task: 'Мониторит лимиты', uptime: '5ч 02м' },
    ];
    json(res, 200, { agents }); return;
  }
  if (req.method === 'GET' && url.pathname === '/api/factories') {
    try {
      const { listSkillCards } = await import('./skills.ts');
      const cards = listSkillCards();
      const factories = [
        { id: 'content-factory', title: 'Контент-Завод', subtitle: 'Сцены → озвучка → MP4 · 30–60с', href: '/studio', status: 'ready', skills: cards.filter((c: { factory?: string }) => !c.factory || c.factory==='content').map((c: { id: string })=>c.id).slice(0,4) },
        { id: 'freelance-autopilot', title: 'Фриланс-Автопилот', subtitle: 'Поиск проектов → черновики ставок', href: '/journey?factory=freelance-autopilot', status: 'ready', skills: ['freelance-autopilot'] },
        { id: 'bot-factory', title: 'Бот-Фабрика', subtitle: 'Telegram / Discord / виджет', href: '/journey?factory=bot-factory', status: 'ready', skills: ['bot-factory'] },
        { id: 'code-scaffold', title: 'Код-Скаффолд', subtitle: 'Заготовка проекта → репо', href: '/journey?factory=code-scaffold', status: 'ready', skills: ['code-scaffold'] },
        { id: 'telegram-network', title: 'Сеть Telegram-каналов', subtitle: 'Контент-план → черновики → по расписанию', href: '/journey?factory=telegram-network', status: 'ready', skills: ['telegram-network'] },
        { id: 'commerce', title: 'Товары · Реклама · B-roll', subtitle: 'tovary-hero / reklama / b-roll-planning', href: '/skills?factory=commerce', status: 'ready', skills: ['tovary-hero','reklama-banner','b-roll-planning'] },
        { id: 'cinema-blender', title: 'Cinema / Blender · P5', subtitle: 'Exact 3D, 60+ пресетов — после гейта', href: '/skills', status: 'future', note: 'Требует P5 decomposition, real benchmark — не в 3.1.' },
        { id: 'physical-business', title: 'Physical / Business — FUTURE', subtitle: 'Personal shell F41 — опционально', href: '/skills', status: 'future', note: 'Требует owner gate, economics/rights — не обещание релиза.' },
      ];
      json(res, 200, { factories, skills: cards }); return;
    } catch (e) { json(res, 500, { error: 'factories_failed', detail: String(e) }); return; }
  }
  if (req.method === 'GET' && staticFiles.has(url.pathname)) {
    const [filename, mime] = staticFiles.get(url.pathname)!;
    if (!filename || !mime) throw new Error('invalid_static_map');
    const path = new URL(`../../web/public/${filename}`, import.meta.url);
    res.writeHead(200, { 'Content-Type': mime, 'Cache-Control': 'no-store' });
    res.end(readFileSync(path)); return;
  }
  if (req.method === 'GET' && url.pathname.toLowerCase().startsWith('/skills')) {
    try {
      const fallback = new URL(`../../web/public/skills.html`, import.meta.url);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(readFileSync(fallback)); return;
    } catch {}
  }
  json(res, 404, { error: 'not_found' });
}
export function createApp(options?: { offlineRoot?: string; liveResultDatabase?: string }): Server {
  const offline = createOffline(options?.offlineRoot, options?.liveResultDatabase);
  const liveResults = createLiveResults(options?.liveResultDatabase);
  const server = createServer((req, res) => {
    void handle(req, res, offline, liveResults).catch(() => {
      if (!res.headersSent) json(res, 500, { error: 'internal_error' });
      else res.end();
    });
  });
  server.on('close', () => offline.shutdown());
  return server;
}
const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const port = Number(process.env['PORT'] ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1..65535');
  const liveResultDatabase = process.env['Ywoom_LIVE_RESULT_DB'];
  const server = createApp(liveResultDatabase ? { liveResultDatabase } : undefined);
  const host = isPublicCloud() ? '0.0.0.0' : '127.0.0.1';
  server.listen(port, host, () => console.log(`Ywoom ${isPublicCloud() ? 'cloud' : 'dry-run'}: http://${host}:${port}`));
  server.on('error', () => { console.error('Server failed to listen'); process.exitCode = 1; });
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => { server.close(); setTimeout(() => process.exit(0), 1000).unref(); });
  }
  if (!process.env['Ywoom_OFFLINE']) {
    const gemKey = process.env['GEMINI_API_KEY'] ?? process.env['GOOGLE_API_KEY'] ?? '';
    if (gemKey) {
      void import('../../packages/model-switch/src/index.ts').then((m) => {
        const list = (m as unknown as { listProviders: () => unknown[] }).listProviders as () => unknown[];
        startRadarCron(() => list() as unknown as Array<{ id: string; version: string } & Record<string, unknown>> as never, () => gemKey, (t) => console.log(t));
      }).catch(() => {});
    }
    const flTok = process.env['FREELANCER_ACCESS_TOKEN'] ?? '';
    if (flTok) {
      const flQuery = process.env['FREELANCER_QUERY'] ?? 'video';
      const flInterval = Number(process.env['FREELANCER_CRON_MS'] ?? 60_000);
      startFreelancerCron({
        query: flQuery,
        intervalMs: Number.isFinite(flInterval) && flInterval >= 30_000 ? flInterval : 60_000,
        fetchActive: async (q) => {
          const r = await fetch(`https://www.freelancer.com/api/projects/0.1/projects/active?query=${encodeURIComponent(q)}&limit=5`, { headers: { 'freelancer-oauth-v1': flTok } });
          const j = (await r.json()) as { result?: { projects?: Array<{ id: number; budget?: { minimum: number; maximum: number }; title?: string }> } };
          return (j.result?.projects ?? []).map(p => ({ id: p.id, budget: { min: p.budget?.minimum ?? 0, max: p.budget?.maximum ?? 0 }, title: p.title ?? '' })).filter(p => p.budget.min > 0);
        },
        notify: (t) => console.log(t),
        getBaseline: () => Number(process.env['FREELANCER_BASELINE_MINOR'] ?? 0),
        getForecast: () => { const v = process.env['FREELANCER_FORECAST_MINOR']; return v != null && v !== '' ? Number(v) : null; },
      });
    }
  }
}

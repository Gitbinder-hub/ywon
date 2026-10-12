import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { request } from 'node:http';
import type { AddressInfo } from 'node:net';
import { createApp } from '../apps/api/src/server.ts';
import { validatePlan } from '../apps/api/src/offline.ts';
const plan = () => ({ title: 'Проект', script: 'Мой сценарий', duration: 30, aspect: 'portrait', trimAudio: false, audioId: null, scenes: [{ text: 'Первая сцена', imageId: null }] });
test('offline plan validates bounded types and rejects coercion/unknown fields', () => {
  assert.equal(validatePlan(plan()).duration, 30);
  for (const patch of [{ duration: 29 }, { duration: 61 }, { duration: 30.5 }, { duration: '30' }, { aspect: ['portrait'] }, { trimAudio: 1 }, { title: '' }, { audioId: '../../etc' }, { scenes: [] }, { scenes: Array(7).fill(plan().scenes[0]) }, { scenes: [{ text: 'x'.repeat(181), imageId: null }] }, { extra: true }]) assert.throws(() => validatePlan({ ...plan(), ...patch }));
});
async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'Ywoom-b002-'));
  const server = createApp({ offlineRoot: root });
  await new Promise<void>((yes) => server.listen(0, '127.0.0.1', yes));
  const base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
  async function call(path: string, method = 'GET', value?: unknown, status = 200, headers: Record<string, string> = {}) {
    const response = await fetch(base + path, { method, headers: { ...(value !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers }, ...(value !== undefined ? { body: JSON.stringify(value) } : {}) });
    const result = await response.json(); assert.equal(response.status, status, JSON.stringify(result)); return result;
  }
  async function wait(id: string) {
    const deadline = Date.now() + 120000;
    while (Date.now() < deadline) { const job = await call('/api/offline/jobs/' + id); if (!['running', 'cancelling'].includes(job.state)) return job; await new Promise((yes) => setTimeout(yes, 200)); }
    throw new Error('Render timed out');
  }
  async function close() { await new Promise<void>((yes, no) => server.close((e) => e ? no(e) : yes())); }
  return { root, server, base, call, wait, close, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}
test('offline HTTP: origin/host, persistence, revision conflict, material errors, static UI', async () => {
  const f = await fixture();
  try {
    await f.call('/api/offline/projects', 'GET', undefined, 403, { Origin: 'https://evil.invalid' });
    const hostCode = await new Promise<number>((yes, no) => { const req = request(f.base + '/api/offline/projects', { headers: { Host: 'evil.invalid' } }, (res) => { res.resume(); res.on('end', () => yes(res.statusCode!)); }); req.on('error', no); req.end(); });
    assert.equal(hostCode, 403);
    const p = await f.call('/api/offline/projects', 'POST', plan(), 201, { Origin: f.base });
    assert.equal(p.revision, 1);
    const updated = await f.call('/api/offline/projects/' + p.id, 'PUT', { revision: 1, plan: { ...plan(), title: 'Правка' } });
    assert.equal(updated.revision, 2);
    await f.call('/api/offline/projects/' + p.id, 'PUT', { revision: 1, plan: plan() }, 409);
    assert.equal((await f.call('/api/offline/projects/' + p.id)).title, 'Правка');
    await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 1 }, 409);
    await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 2 }, 422);
    for (const patch of [{ rightsConfirmed: false }, { kind: ['image'] }, { data: 'https://example.org/image' }, { data: Buffer.from('not image').toString('base64') }]) await f.call('/api/offline/assets', 'POST', { kind: 'image', name: 'a.png', data: 'YWJj', rightsConfirmed: true, ...patch }, 422);
    const r = await fetch(f.base + '/api/offline/projects', { method: 'POST', body: '{}' }); assert.equal(r.status, 415); await r.text();
    const bad = await fetch(f.base + '/api/offline/projects', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' }); assert.equal(bad.status, 400); await bad.text();
    await f.call('/api/generate', 'POST', {}, 403);
    assert.equal((await f.call('/api/health')).productReady, false);
    for (const path of ['/studio', '/studio.js', '/studio.css']) { const r = await fetch(f.base + path); assert.equal(r.status, 200); assert.ok((await r.text()).length > 100); }
    // Two same-revision PUTs cannot both win.
    const results = await Promise.all([1, 2].map((i) => fetch(f.base + '/api/offline/projects/' + p.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ revision: 2, plan: { ...plan(), title: 'Concurrent ' + i } }) })));
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]); await Promise.all(results.map((r) => r.text()));
    assert.equal((await f.call('/api/offline/projects')).length, 1);
  } finally { await f.close(); f.cleanup(); }
});
const mediaAvailable = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); execFileSync('ffprobe', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();
test('real offline MP4: uploaded media, immutable revision, range, decode, retry, cancel and failure', { timeout: 240000, skip: !mediaAvailable ? 'FFmpeg/ffprobe unavailable; real media NOT tested' : false }, async () => {
  const f = await fixture();
  try {
    const demo = await f.call('/api/offline/demo', 'POST', {}, 201);
    assert.equal(demo.diagnostic, true);
    const demoJob = await f.call('/api/offline/projects/' + demo.id + '/render', 'POST', { revision: 1 }, 202);
    assert.equal((await f.wait(demoJob.id)).state, 'succeeded');
    const demoReport = await f.call('/api/offline/jobs/' + demoJob.id + '/report'); assert.equal(demoReport.diagnostic_fixture, true);
    if (process.env['Ywoom_EVIDENCE_DIR']) { mkdirSync(process.env['Ywoom_EVIDENCE_DIR'], { recursive: true }); copyFileSync(join(f.root, 'jobs', demoJob.id, 'output.mp4'), join(process.env['Ywoom_EVIDENCE_DIR'], 'diagnostic-example.mp4')); writeFileSync(join(process.env['Ywoom_EVIDENCE_DIR'], 'diagnostic-report.json'), JSON.stringify(demoReport, null, 2)); }

    const imageBytes = readFileSync(join(f.root, 'assets', demo.scenes[0].imageId + '.bin'));
    const audioBytes = readFileSync(join(f.root, 'assets', demo.audioId + '.bin'));
    const image = await f.call('/api/offline/assets', 'POST', { kind: 'image', name: 'owned.png', data: imageBytes.toString('base64'), rightsConfirmed: true }, 201);
    const audio = await f.call('/api/offline/assets', 'POST', { kind: 'audio', name: 'owned.wav', data: audioBytes.toString('base64'), rightsConfirmed: true }, 201);
    for (const [ext, kind, source] of [['jpg', 'image', imageBytes], ['mp3', 'audio', audioBytes], ['m4a', 'audio', audioBytes]] as const) {
      const inputFile = join(f.root, 'encode-input-' + ext + (kind === 'image' ? '.png' : '.wav')); const encoded = join(f.root, 'encoded.' + ext); writeFileSync(inputFile, source);
      execFileSync('ffmpeg', ['-nostdin', '-y', '-v', 'error', '-i', inputFile, ...(kind === 'image' ? ['-frames:v', '1'] : []), encoded], { timeout: 30000 });
      const asset = await f.call('/api/offline/assets', 'POST', { kind, name: 'fixture.' + ext, data: readFileSync(encoded).toString('base64'), rightsConfirmed: true }, 201);
      assert.equal(asset.mime, ext === 'jpg' ? 'image/jpeg' : ext === 'mp3' ? 'audio/mpeg' : 'audio/mp4');
    }
    assert.equal(audio.duration, 30); assert.equal(image.sha256, createHash('sha256').update(imageBytes).digest('hex'));
    await f.call('/api/offline/projects', 'POST', { ...plan(), audioId: image.id }, 422);
    const input = { ...plan(), audioId: audio.id, scenes: [{ text: 'Свой сценарий: безопасные {плашки} \\N', imageId: image.id }] };
    const p = await f.call('/api/offline/projects', 'POST', input, 201);
    const job = await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 1 }, 202);
    await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 1 }, 409);
    await f.call('/api/offline/jobs/' + job.id + '/file', 'GET', undefined, 409);
    await f.call('/api/offline/projects/' + p.id, 'PUT', { revision: 1, plan: { ...input, title: 'Новая версия' } });
    assert.equal((await f.wait(job.id)).state, 'succeeded');
    const report = await f.call('/api/offline/jobs/' + job.id + '/report');
    assert.equal(report.revision, 1); assert.equal(report.p0_p1_acceptance, false); assert.equal(report.ai_generation, false); assert.equal(report.estimated_total_cost_usd, null);
    assert.equal(report.width, 720); assert.equal(report.height, 1280); assert.ok(Math.abs(report.duration - 30) <= .2);
    const response = await fetch(f.base + '/api/offline/jobs/' + job.id + '/file?download=1'); const bytes = Buffer.from(await response.arrayBuffer());
    assert.match(response.headers.get('content-disposition')!, /attachment/); assert.equal(createHash('sha256').update(bytes).digest('hex'), report.output_sha256);
    const range = await fetch(f.base + '/api/offline/jobs/' + job.id + '/file', { headers: { Range: 'bytes=0-31' } }); assert.equal(range.status, 206); assert.deepEqual(Buffer.from(await range.arrayBuffer()), bytes.subarray(0, 32));
    await f.call('/api/offline/jobs/' + job.id + '/file', 'GET', undefined, 416, { Range: 'bytes=999999999-' });
    const output = join(f.root, 'jobs', job.id, 'output.mp4');
    execFileSync('ffmpeg', ['-nostdin', '-v', 'error', '-i', output, '-f', 'null', '-'], { timeout: 60000 });
    if (process.env['Ywoom_EVIDENCE_DIR']) { mkdirSync(process.env['Ywoom_EVIDENCE_DIR'], { recursive: true }); copyFileSync(output, join(process.env['Ywoom_EVIDENCE_DIR'], 'diagnostic-upload-path.mp4')); writeFileSync(join(process.env['Ywoom_EVIDENCE_DIR'], 'render-report.json'), JSON.stringify({ report, evidence_note: 'Synthetic tone reuploaded to exercise own-file path; NOT speech. API cannot verify audio provenance.' }, null, 2)); }
    await f.call('/api/offline/projects/' + p.id, 'PUT', { revision: 2, plan: { ...input, duration: 31 } });
    await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 3 }, 422);
    const longFile = join(f.root, 'long.wav');
    execFileSync('python3', ['-c', 'import wave,sys; r=wave.open(sys.argv[1]); params=r.getparams(); frames=r.readframes(r.getnframes()); r.close(); w=wave.open(sys.argv[2],"wb"); w.setparams(params); w.writeframes(frames*2); w.close()', join(f.root, 'assets', audio.id + '.bin'), longFile]);
    const long = await f.call('/api/offline/assets', 'POST', { kind: 'audio', name: 'long.wav', data: readFileSync(longFile).toString('base64'), rightsConfirmed: true }, 201);
    await f.call('/api/offline/projects/' + p.id, 'PUT', { revision: 3, plan: { ...input, audioId: long.id } });
    await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 4 }, 422);
    await f.call('/api/offline/projects/' + p.id, 'PUT', { revision: 4, plan: { ...input, duration: 60, aspect: 'landscape', audioId: long.id } });
    const second = await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 5 }, 202);
    assert.equal((await f.wait(second.id)).state, 'succeeded'); const report2 = await f.call('/api/offline/jobs/' + second.id + '/report'); assert.equal(report2.revision, 5); assert.equal(report2.width, 1280); assert.equal(report2.height, 720); assert.ok(Math.abs(report2.duration - 60) < .2);
    const cancelled = await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 5 }, 202);
    await f.call('/api/offline/jobs/' + cancelled.id + '/cancel', 'POST', {}); assert.equal((await f.wait(cancelled.id)).state, 'cancelled');
    // Corrupted local asset is detected by immutable input hashes, never silently replaced.
    writeFileSync(join(f.root, 'assets', image.id + '.bin'), 'corrupt');
    const failed = await f.call('/api/offline/projects/' + p.id + '/render', 'POST', { revision: 5 }, 202);
    assert.equal((await f.wait(failed.id)).state, 'failed'); await f.call('/api/offline/jobs/' + failed.id + '/file', 'GET', undefined, 409);
    assert.equal((await f.call('/api/offline/jobs?projectId=' + p.id)).length, 4);
    const inherited = await f.call('/api/offline/projects', 'POST', { ...input, audioId: demo.audioId }, 201); assert.equal(inherited.diagnostic, true);
  } finally { await f.close(); f.cleanup(); }
});
test('persisted project and unfinished job survive server restart as interrupted', async () => {
  const f = await fixture();
  let second: ReturnType<typeof createApp> | undefined;
  try {
    const p = await f.call('/api/offline/projects', 'POST', plan(), 201); await f.close();
    const id = randomUUID(); const folder = join(f.root, 'jobs', id); mkdirSync(folder); writeFileSync(join(folder, 'record.json'), JSON.stringify({ id, projectId: p.id, state: 'running', revision: 1 }));
    second = createApp({ offlineRoot: f.root }); await new Promise<void>((yes) => second!.listen(0, '127.0.0.1', yes));
    const base = 'http://127.0.0.1:' + (second.address() as AddressInfo).port;
    assert.equal((await (await fetch(base + '/api/offline/projects/' + p.id)).json()).title, p.title);
    assert.equal((await (await fetch(base + '/api/offline/jobs/' + id)).json()).state, 'interrupted');
  } finally { if (second) await new Promise<void>((yes) => second!.close(() => yes())); if (f.server.listening) await f.close(); f.cleanup(); }
});

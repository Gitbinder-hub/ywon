// Actual studio.js in node:vm; minimal DOM fixtures, NOT real-browser acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
class Element {
  value: string | number = ''; textContent = ''; hidden = false; disabled = false; checked = false; src = ''; href = ''; className = ''; maxLength = 0; rows = 0; type = ''; accept = ''; alt = ''; files: unknown[] = [];
  children: Element[] = []; listeners: Record<string, () => unknown> = {}; attrs: Record<string, string> = {};
  addEventListener(name: string, listener: () => unknown) { this.listeners[name] = listener; }
  getAttribute(name: string) { return name === 'src' ? this.src : this.attrs[name] ?? null; }
  setAttribute(name: string, value: string) { this.attrs[name] = value; }
  removeAttribute(name: string) { if (name === 'src') this.src = ''; delete this.attrs[name]; }
  append(node: Element) { this.children.push(node); }
  replaceChildren() { this.children = []; }
  pause() {}
}
interface Hooks { action(fn: () => Promise<void>): Promise<void>; apply(p: unknown): void; plan(): { title: string; script: string; audioId: string }; showJob(j: unknown): void; save(): Promise<unknown>; loadVerifiedResult(): Promise<void>; showVerifiedResult(value: unknown): void; attachVerifiedResult(): Promise<void> }
function fixture(fetcher?: (path: string, init?: { body?: string }) => Promise<unknown>) {
  const nodes: Record<string, Element> = {};
  const node = (id: string) => nodes[id] ??= new Element();
  const context = { document: { getElementById: node, createElement: () => new Element() }, window: { addEventListener() {} }, crypto: { randomUUID: () => 'attach-command-1' }, setInterval() {}, confirm: () => true, fetch: async (path: string, init?: { body?: string }) => ({ ok: true, json: async () => fetcher ? fetcher(path, init) : [] }), studio: {} as Hooks };
  runInNewContext(readFileSync(new URL('../apps/web/public/studio.js', import.meta.url), 'utf8') + '\nglobalThis.studio = {action, apply, plan, showJob, save, loadVerifiedResult, showVerifiedResult, attachVerifiedResult};', context);
  return { node, hooks: context.studio };
}
const p = { id: 'project', title: '<script>not markup</script>', script: 'Сценарий', duration: 30, aspect: 'portrait', trimAudio: false, audioId: 'audio', revision: 2, diagnostic: true, scenes: [{ text: 'Плашка', imageId: 'image' }] };
test('studio loads editable fields and marks diagnostic sample without HTML insertion', () => {
  const f = fixture(); f.hooks.apply(p); assert.equal(f.node('title').value, p.title); assert.equal(f.hooks.plan().script, p.script); assert.equal(f.hooks.plan().audioId, p.audioId); assert.match(f.node('revision').textContent, /НЕ РЕЧЬ/); assert.equal(f.node('rights').checked, false); assert.equal(f.node('scenes').children.length, 1);
});
test('studio duplicate action is ignored and error restores editor without discarding input', async () => {
  const f = fixture(); f.node('title').value = 'Мой текст'; let release!: () => void; let calls = 0;
  const pending = f.hooks.action(() => new Promise<void>((yes) => { calls++; release = yes; }));
  assert.equal(f.node('editor').disabled, true); await f.hooks.action(async () => { calls++; }); assert.equal(calls, 1); release(); await pending;
  await f.hooks.action(async () => { throw new Error('Ошибка сети'); }); assert.equal(f.node('message').textContent, 'Ошибка сети'); assert.equal(f.node('editor').disabled, false); assert.equal(f.node('title').value, 'Мой текст');
});
test('studio preview/download are only shown for a succeeded render snapshot', () => {
  const f = fixture(); f.hooks.showJob({ id: 'job', revision: 2, state: 'succeeded', message: 'Готов', progress: 1 }); assert.equal(f.node('player').hidden, false); assert.match(f.node('download').href, /job\/file\?download=1/);
  f.hooks.showJob({ id: 'next', revision: 3, state: 'running', message: 'Сборка', progress: .2 }); assert.equal(f.node('player').hidden, true); assert.equal(f.node('download').hidden, true); assert.equal(f.node('cancel').disabled, false);
});

test('studio shows sanitized verified metadata without media or publication controls', async () => {
  const payload = { schemaVersion: 1, mode: 'verified_live_artifact_metadata', mediaAvailable: false, productionReady: false, executionAllowed: false, publicationAllowed: false, receipt: { schemaVersion: 1, mode: 'verified_live_artifact_receipt', runId: 'google-p0-002', width: 1280, height: 720, videoCodec: 'h264', audioCodec: 'aac', durationMs: 24720, sha256: '<hash-as-text>' } };
  let requested = '';
  const f = fixture(async (path) => { requested = path; return payload; });
  f.node('verified-run-id').value = 'google-p0-002'; await f.hooks.loadVerifiedResult();
  assert.equal(requested, '/api/live-results/google-p0-002');
  assert.equal(f.node('verified-card').hidden, false);
  assert.equal(f.node('verified-run').textContent, 'google-p0-002');
  assert.match(f.node('verified-format').textContent, /1280×720 · H264 \/ AAC/);
  assert.equal(f.node('verified-sha').textContent, '<hash-as-text>');
  assert.match(f.node('verified-status').textContent, /Медиа и публикация недоступны/);
  assert.equal(f.node('player').src, ''); assert.equal(f.node('verified-evidence').hidden, true); assert.equal(f.node('verified-evidence-download').hidden, true);
});
test('studio fails closed for malformed verified metadata and invalid run id', async () => {
  const f = fixture(async () => ({ mode: 'verified_live_artifact_metadata', mediaAvailable: true, receipt: {} }));
  f.node('verified-run-id').value = '../secret'; await f.hooks.loadVerifiedResult(); assert.match(f.node('verified-status').textContent, /корректный ID/);
  f.node('verified-run-id').value = 'safe-id'; await f.hooks.loadVerifiedResult(); assert.equal(f.node('verified-card').hidden, true); assert.match(f.node('verified-status').textContent, /неподходящие метаданные/);
});

test('studio attaches the verified receipt as a read-only project reference', async () => {
  const payload = { schemaVersion: 1, mode: 'verified_live_artifact_metadata', mediaAvailable: false, productionReady: false, executionAllowed: false, publicationAllowed: false, receipt: { schemaVersion: 1, mode: 'verified_live_artifact_receipt', runId: 'google-p0-002', width: 1280, height: 720, videoCodec: 'h264', audioCodec: 'aac', durationMs: 24720, sha256: 'a'.repeat(64) } };
  let attachment;
  const attached = { ...p, revision: 3, verifiedResultReference: { mode: 'verified_live_artifact_reference', runId: 'google-p0-002', artifactSha256: 'a'.repeat(64), verificationHash: 'b'.repeat(64), commandId: 'attach-command-1', mediaAvailable: false, productionReady: false, executionAllowed: false, publicationAllowed: false } };
  const f = fixture(async (path, init) => { if (path.endsWith('/verified-result')) { attachment = JSON.parse(init!.body!); return attached; } if (path === '/api/live-results/google-p0-002') return payload; return []; });
  f.hooks.apply(p); f.hooks.showVerifiedResult(payload); assert.equal(f.node('verified-attach').disabled, false); await f.hooks.attachVerifiedResult();
  assert.deepEqual(attachment, { revision: 2, runId: 'google-p0-002', commandId: 'attach-command-1' });
  assert.equal(f.node('verified-attach').disabled, true); assert.equal(f.node('verified-attach').textContent, 'Привязан к проекту'); assert.match(f.node('verified-reference-status').textContent, /r3/); assert.equal(f.node('verified-evidence').hidden, false); assert.equal(f.node('verified-evidence').href, '/api/offline/projects/project/evidence'); assert.equal(f.node('verified-evidence-download').href, '/api/offline/projects/project/evidence?download=1');
});

// Runs the actual browser JS in node:vm with a minimal DOM/fetch fixture.
// This is NOT real-browser, visual, accessibility or production acceptance evidence.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

type Listener = (event: { preventDefault(): void }) => unknown;
interface Element {
  value: string; textContent: string; hidden: boolean; disabled: boolean;
  fields: Record<string, string>; listeners: Record<string, Listener>;
  addEventListener(name: string, listener: Listener): void;
  getAttribute(name: string): string | null;
}
interface ResponseFixture { ok: boolean; status: number; json(): Promise<unknown> }
interface RequestFixture { url: string; init?: { method?: string; body?: string } }
type FetchFixture = (request: RequestFixture) => Promise<ResponseFixture>;
const catalogs = Object.fromEntries(['ru', 'en'].map((locale) => [locale,
  JSON.parse(readFileSync(new URL(`../apps/web/public/locales/${locale}.json`, import.meta.url), 'utf8')) as Record<string, string>,
])) as Record<'ru' | 'en', Record<string, string>>;
const source = readFileSync(new URL('../apps/web/public/app.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../apps/web/public/index.html', import.meta.url), 'utf8');
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));
function response(body: unknown, status = 200): ResponseFixture {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
function element(key?: string): Element {
  return {
    value: '', textContent: '', hidden: false, disabled: false, fields: {}, listeners: {},
    addEventListener(name, listener) { this.listeners[name] = listener; },
    getAttribute(name) { return name === 'data-i18n' ? key ?? null : null; },
  };
}
function fixture(api: FetchFixture = async () => response({ status: 'validated_only' }), locale?: FetchFixture) {
  const form = element();
  form.fields = { kind: 'video', contentLanguage: 'ru', audience: 'Эксперты', goal: 'Объяснить идею' };
  const selector = element(); selector.value = 'ru';
  const result = element(); result.hidden = true;
  const status = element(); const details = element(); const submit = element('submit');
  const localeStatus = element(); localeStatus.hidden = true;
  const nodes: Record<string, Element> = { '#brief-form': form, '#ui-language': selector, '#result': result,
    '#status': status, '#details': details, '#submit': submit, '#locale-status': localeStatus };
  const labels = [...new Set([...html.matchAll(/data-i18n="([^"]+)"/g)].map((m) => m[1]!))]
    .map((key) => key === 'submit' ? submit : element(key));
  const document = { documentElement: { lang: 'ru' },
    querySelector: (selector: string) => nodes[selector] ?? null,
    querySelectorAll: () => labels };
  const requests: RequestFixture[] = [];
  runInNewContext(source, {
    document,
    fetch: (url: string, init?: RequestFixture['init']) => {
      const request: RequestFixture = init ? { url, init } : { url };
      requests.push(request);
      if (url.startsWith('/locales/')) return locale ? locale(request) : Promise.resolve(response(url.includes('/en.') ? catalogs.en : catalogs.ru));
      assert.equal(url, '/api/dry-run', 'client never requests generation/provider work');
      return api(request);
    },
    FormData: class { form: Element; constructor(form: Element) { this.form = form; } entries() { return Object.entries(this.form.fields); } },
  }, { timeout: 1000 });
  return { form, selector, result, status, details, submit, localeStatus, document, requests,
    async changeLocale(value: string) { selector.value = value; selector.listeners['change']!({ preventDefault() {} }); await flush(); },
    async send() { await form.listeners['submit']!({ preventDefault() {} }); },
  };
}

test('client UI locale never changes content language or input; posted brief preserves them', async () => {
  const app = fixture(); await flush();
  const before = { ...app.form.fields };
  await app.changeLocale('en');
  assert.equal(app.document.documentElement.lang, 'en');
  assert.equal(app.submit.textContent, catalogs.en['submit']);
  assert.deepEqual(app.form.fields, before);
  await app.send();
  const request = app.requests.find((r) => r.url === '/api/dry-run'); assert.ok(request?.init?.body);
  assert.deepEqual(JSON.parse(request.init.body), before);
});
test('client re-translates an existing validation status after locale switch', async () => {
  const app = fixture(); await flush(); await app.send();
  assert.equal(app.status.textContent, catalogs.ru['valid']);
  const details = app.details.textContent;
  await app.changeLocale('en');
  assert.equal(app.status.textContent, catalogs.en['valid']);
  assert.equal(app.details.textContent, details);
});
test('client re-translates pending status and completes in the active locale', async () => {
  const pending = deferred<ResponseFixture>(); const app = fixture(async () => pending.promise); await flush();
  const send = app.send(); await flush();
  assert.equal(app.submit.disabled, true);
  await app.changeLocale('en');
  assert.equal(app.status.textContent, catalogs.en['working']);
  pending.resolve(response({ status: 'validated_only' })); await send;
  assert.equal(app.status.textContent, catalogs.en['valid']); assert.equal(app.submit.disabled, false);
});
test('stale failed locale request cannot replace current validation or show a warning', async () => {
  const stale = deferred<ResponseFixture>();
  const app = fixture(undefined, async ({ url }) => url.includes('/en.') ? stale.promise : response(catalogs.ru));
  await flush(); await app.send(); await app.changeLocale('en'); await app.changeLocale('ru');
  stale.reject(new Error('offline')); await flush();
  assert.equal(app.document.documentElement.lang, 'ru');
  assert.equal(app.status.textContent, catalogs.ru['valid']); assert.equal(app.localeStatus.hidden, true);
});
test('latest locale failure restores selector and uses separate translated warning', async () => {
  const app = fixture(undefined, async ({ url }) => url.includes('/en.') ? response({}, 503) : response(catalogs.ru));
  await flush(); await app.send(); const details = app.details.textContent;
  await app.changeLocale('en');
  assert.equal(app.selector.value, 'ru'); assert.equal(app.document.documentElement.lang, 'ru');
  assert.equal(app.localeStatus.hidden, false); assert.equal(app.localeStatus.textContent, catalogs.ru['translationError']);
  assert.equal(app.status.textContent, catalogs.ru['valid']); assert.equal(app.details.textContent, details);
});
test('malformed locale catalog does not partially switch the interface', async () => {
  const app = fixture(undefined, async ({ url }) => response(url.includes('/en.') ? [] : catalogs.ru));
  await flush(); await app.changeLocale('en');
  assert.equal(app.selector.value, 'ru'); assert.equal(app.document.documentElement.lang, 'ru');
  assert.equal(app.localeStatus.hidden, false);
});
test('client distinguishes server failure from invalid user brief and re-enables submit', async () => {
  const app = fixture(async () => response({ error: 'internal_error' }, 500)); await flush();
  const before = { ...app.form.fields }; await app.send();
  assert.equal(app.status.textContent, catalogs.ru['serverError']);
  assert.equal(app.submit.disabled, false); assert.deepEqual(app.form.fields, before);
});
test('non-JSON server response shows server error, not a fabricated validation result', async () => {
  const app = fixture(async () => ({ ok: false, status: 502, json: async () => { throw new SyntaxError('HTML error page'); } }));
  await flush(); await app.send();
  assert.equal(app.status.textContent, catalogs.ru['serverError']);
  assert.equal(app.details.textContent, ''); assert.equal(app.submit.disabled, false);
});
test('network failure keeps user fields and allows another attempt', async () => {
  const app = fixture(async () => { throw new Error('offline'); }); await flush();
  const before = { ...app.form.fields }; await app.send();
  assert.equal(app.status.textContent, catalogs.ru['network']);
  assert.equal(app.submit.disabled, false); assert.deepEqual(app.form.fields, before);
});
test('duplicate submit while pending does not create a second dry-run request', async () => {
  const pending = deferred<ResponseFixture>(); const app = fixture(async () => pending.promise); await flush();
  const first = app.send(); await flush(); const second = app.send(); await flush();
  assert.equal(app.requests.filter((r) => r.url === '/api/dry-run').length, 1);
  pending.resolve(response({ status: 'validated_only' })); await Promise.all([first, second]);
  assert.equal(app.submit.disabled, false);
});
test('initial catalog failure leaves RU usable and reports an explicit warning', async () => {
  const app = fixture(undefined, async () => { throw new Error('offline'); }); await flush();
  assert.equal(app.document.documentElement.lang, 'ru'); assert.equal(app.localeStatus.hidden, false);
  assert.match(app.localeStatus.textContent, /перевод/);
});

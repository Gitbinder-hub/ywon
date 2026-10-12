import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('RU/EN catalogs have the same complete key set', () => {
  const read = (locale: string) => JSON.parse(readFileSync(new URL(`../apps/web/public/locales/${locale}.json`, import.meta.url), 'utf8')) as Record<string, string>;
  const en = read('en'); const ru = read('ru');
  assert.deepEqual(Object.keys(en).sort(), Object.keys(ru).sort());
  for (const value of [...Object.values(en), ...Object.values(ru)]) assert.ok(value.length);
});

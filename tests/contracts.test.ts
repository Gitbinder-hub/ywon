import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBrief } from '../packages/contracts/src/index.ts';
import { prepareDryRun } from '../packages/core/src/dry-run.ts';
const valid = { kind: 'image', contentLanguage: 'en', audience: 'People', goal: 'An image' };
test('valid brief has explicit language and trimmed text', () => {
  const parsed = validateBrief({ ...valid, audience: ' People ' });
  assert.equal(parsed.ok, true);
  if (parsed.ok) assert.equal(parsed.brief.audience, 'People');
});
test('missing language is rejected, never defaulted', () => {
  const { contentLanguage: _, ...without } = valid;
  assert.equal(validateBrief(without).ok, false);
});
test('unsupported language/kind and empty/oversized fields rejected', () => {
  for (const input of [{ ...valid, contentLanguage: 'xx' }, { ...valid, kind: 'unknown' },
    { ...valid, goal: '   ' }, { ...valid, audience: 'a'.repeat(2001) }]) assert.equal(validateBrief(input).ok, false);
});
test('non-object and unknown fields rejected', () => {
  for (const input of [null, [], 1, { ...valid, kind: ['image'] }, { ...valid, contentLanguage: ['en'] }, { ...valid, paidCallsAllowed: true }, { ...valid, provider: 'secret' }]) {
    assert.equal(validateBrief(input).ok, false);
  }
});
test('dry run deterministic and cost unknown, not fabricated zero', () => {
  const parsed = validateBrief(valid); assert.ok(parsed.ok);
  const a = prepareDryRun(parsed.brief); const b = prepareDryRun(parsed.brief);
  assert.deepEqual(a, b); assert.equal(a.billing.paidCallsAllowed, false);
  assert.equal(a.billing.estimatedCostUsd, null); assert.equal(a.status, 'validated_only');
});

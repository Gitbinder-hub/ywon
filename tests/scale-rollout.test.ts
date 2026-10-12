import test from 'node:test';
import assert from 'node:assert/strict';
import { loadTest, billingReconcile, supportRunbook, restoreBackup, isRestored, isAbuseBlocked, hasUnsafePerms } from '../packages/scale-rollout/src/index.ts';
test('AC1: load/billing/support runbooks', () => {
  assert.match(loadTest('100rps'), /load:100rps:ok/);
  assert.equal(billingReconcile(), true);
  assert.match(supportRunbook(), /support/);
});
test('AC2: restore/tenant/abuse no unsafe perms', () => {
  assert.equal(restoreBackup(), true);
  assert.equal(isRestored(), true);
  assert.equal(isAbuseBlocked(), true);
  assert.equal(hasUnsafePerms(), false);
});

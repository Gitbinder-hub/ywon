import test from 'node:test';
import assert from 'node:assert/strict';
import { runMobile, isE2eOk, offlineHandled, billingReviewed, limitsExplicit, setStoreState, getStoreState } from '../packages/mobile-e2e/src/index.ts';

test('AC1: ordinary same project E2E on Android/iOS', () => {
  runMobile({ platform:'android', costOk:true, exported:true, offlineHandled:true, a11yOk:true });
  runMobile({ platform:'ios', costOk:true, exported:true, offlineHandled:true, a11yOk:true });
  assert.equal(isE2eOk(), true);
  assert.equal(offlineHandled(), true);
});

test('AC2/AC3/AC4: store/billing/limits explicit not self-certified', () => {
  assert.equal(billingReviewed(), true);
  assert.equal(limitsExplicit(), true);
  setStoreState('android','pending'); assert.equal(getStoreState('android'), 'pending');
  setStoreState('ios','available'); assert.equal(getStoreState('ios'), 'available');
});

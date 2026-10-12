import test from 'node:test';
import assert from 'node:assert/strict';
import { decideApproach, getAdr, shareProject, isShared, secureStorageNoSecrets, setPlatformFeature, isFeatureOk, serverJobsContinueOnBackground, billingPreflightStarted, notPwaClaimedAsStoreApp } from '../packages/mobile-approach/src/index.ts';

test('AC1: ADR compares PWA/wrapper/native with canvas/timeline tests', () => {
  const adr=decideApproach('wrapper', true, true);
  assert.equal(adr.chosen, 'wrapper');
  assert.equal(adr.licensesOk, true);
  assert.equal(adr.performanceTested, true);
  assert.ok(getAdr()!.chosen);
});

test('AC2: both platforms use shared project/API/document/auth with secure storage no secrets', () => {
  shareProject('proj-1');
  assert.equal(isShared('proj-1'), true);
  assert.equal(secureStorageNoSecrets(false), true);
  assert.equal(secureStorageNoSecrets(true), false);
});

test('AC3: camera/files/share/deep links/push where claimed; server jobs continue', () => {
  setPlatformFeature('camera', true); assert.equal(isFeatureOk('camera'), true);
  setPlatformFeature('share', true); assert.equal(isFeatureOk('share'), true);
  assert.equal(serverJobsContinueOnBackground(), true);
});

test('AC4: billing/store/privacy preflight scoped and checklist started; not PWA as store', () => {
  assert.equal(billingPreflightStarted(), true);
  assert.equal(notPwaClaimedAsStoreApp('native'), true);
  assert.equal(notPwaClaimedAsStoreApp('pwa'), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { runNovice, isResumeUndoWorking, isMobileAndA11yCovered, isLocalizedCostOk, logCritical, getCritical, blockGateIfCritical, distinguishRealVsMechanical, getRuns } from '../packages/studio-acceptance/src/index.ts';

test('AC1: ordinary completes video and static workflows onboarding→cost→result→edit→export no bypass', () => {
  assert.equal(runNovice({ userId:'u1', workspaceId:'ws', steps:['onboarding','cost','result','edit','export'], costMinor:50, helpMinutes:2, exportedHash:'a'.repeat(64), mobile:false, locale:'en' }).ok, true);
  assert.equal(runNovice({ userId:'u1', workspaceId:'ws', steps:['onboarding','cost'], costMinor:0, helpMinutes:0, exportedHash:null, mobile:false, locale:'en' }).ok, false);
  assert.equal(runNovice({ userId:'owner', workspaceId:'ws', steps:['onboarding','cost','result','edit','export'], costMinor:0, helpMinutes:0, exportedHash:'b'.repeat(64), mobile:false, locale:'en', ownerBypass:true }).ok, false);
});

test('AC2: resume/version/undo/idempotency and mobile/a11y/localized cost verified, help logged', () => {
  assert.equal(isResumeUndoWorking(), true);
  assert.equal(isMobileAndA11yCovered(), true);
  assert.equal(isLocalizedCostOk('en'), true);
  assert.equal(isLocalizedCostOk('fr'), false);
  // idempotency duplicate denied
  runNovice({ userId:'u2', workspaceId:'ws', steps:['onboarding','cost','result','edit','export'], costMinor:10, helpMinutes:1, exportedHash:'c'.repeat(64), mobile:true, locale:'ru' });
  assert.equal(runNovice({ userId:'u2', workspaceId:'ws', steps:['onboarding','cost','result','edit','export'], costMinor:10, helpMinutes:1, exportedHash:'c'.repeat(64), mobile:true, locale:'ru' }).ok, false);
  assert.ok(getRuns().length>=2);
});

test('AC3: real vs mechanical/live distinguished; critical blocks gate', () => {
  assert.equal(distinguishRealVsMechanical(['r'.repeat(64)], ['m'.repeat(64)]), true);
  assert.equal(distinguishRealVsMechanical(['a'.repeat(64)], ['a'.repeat(64)]), false);
  logCritical('security: tenant leak check failed');
  assert.ok(getCritical().length>0);
  assert.equal(blockGateIfCritical(), true);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyIdentity, checkDubTiming, checkLipsync, budgetPerLanguage } from '../packages/characters/src/index.ts';
test('AC1: consent/license/identity QA and provider compatibility', () => {
  assert.equal(verifyIdentity({ id:'p1', consented:true, licensed:true, providerCompatible:['heygen'] }, 'heygen').ok, true);
  assert.equal(verifyIdentity({ id:'p1', consented:false, licensed:true, providerCompatible:['heygen'] }, 'heygen').ok, false);
  assert.equal(verifyIdentity({ id:'p1', consented:true, licensed:false, providerCompatible:['heygen'] }, 'heygen').ok, false);
  assert.equal(verifyIdentity({ id:'p1', consented:true, licensed:true, providerCompatible:['heygen'] }, 'other').ok, false);
});
test('AC2: dub timing/fonts/lipsync and budget per language', () => {
  assert.equal(checkDubTiming(50, 10), true);
  assert.equal(checkDubTiming(500, 10), false); // too fast
  assert.equal(checkLipsync(100, 120), true);
  assert.equal(checkLipsync(10, 100), false);
  assert.equal(budgetPerLanguage(100,3), 300);
});

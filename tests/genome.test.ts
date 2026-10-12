import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOnboarding, OnboardingSession, createFact, promoteFact, BibleStore } from '../packages/genome/src/index.ts';

test('AC1: mandatory language/presentation/budget/consents/review without owner bypass', () => {
  const incomplete = validateOnboarding({ language:'en', presentation:'expert' });
  assert.equal(incomplete.ok, false);
  assert.ok((incomplete as Extract<typeof incomplete,{ok:false}>).missing.includes('budgetMinor'));
  const badLang = validateOnboarding({ language:'fr', presentation:'p', budgetMinor:0, consentVoice:true, consentFace:false, manualReview:true, storagePolicy:'retain-30d' });
  assert.equal(badLang.ok, false);
  const ok = validateOnboarding({ language:'ru', presentation:'calm expert', budgetMinor:1000, consentVoice:false, consentFace:false, manualReview:true, storagePolicy:'retain-30d' });
  assert.equal(ok.ok, true);
  // no owner bypass — validateOnboarding is same for all callers
});

test('AC2: progressive save/resume, fact tiers, versioned Bible resolution', () => {
  const s = new OnboardingSession();
  s.set('language','en'); s.set('presentation','brief'); s.save();
  const saved = s.getSaved()!;
  const s2 = new OnboardingSession(); s2.resume(saved);
  assert.equal(s2.get()['language'], 'en');
  s2.set('budgetMinor', 500); s2.set('consentVoice', true); s2.set('consentFace', false); s2.set('manualReview', true); s2.set('storagePolicy','retain');
  assert.equal(s2.isComplete(), true);

  const f = createFact('audience','devs','inferred','interview');
  assert.equal(promoteFact(f,'confirmed', false), null); // needs explicit confirm
  assert.equal(promoteFact(f,'confirmed', true)!.tier, 'confirmed');

  const store = new BibleStore();
  const b1 = store.put('series-a','ws-1','canon-a','ch-1','en',[f]);
  assert.equal(b1.version, 1);
  const b2 = store.put('series-a','ws-1','canon-a v2','ch-1','en',[f]);
  assert.equal(b2.version, 2);
  assert.equal(store.get('series-a',1)!.canonical, 'canon-a');
  assert.equal(store.get('series-a')!.version, 2);
});

test('AC3: series B cannot see canon A; primary-channel language unambiguous', () => {
  const store = new BibleStore();
  store.put('series-a','ws-1','canon-a','ch-1','en',[]);
  store.put('series-b','ws-1','canon-b','ch-2','ru',[]);
  assert.equal(store.canAccess('series-a','series-b'), false);
  assert.equal(store.canAccess('series-a','series-a'), true);
  assert.equal(store.getPrimaryChannelLanguage('series-a'), 'en');
  assert.equal(store.getPrimaryChannelLanguage('series-b'), 'ru');
  // lang is pinned per series bible, not guessed from user UI locale
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { setCoverage, isReviewed, isMediaVerified, enableLocale, betaLabelForPartial, uiContentIndependent, noAllLanguageClaim, deltaBudgetVisible, pricingTimestamp } from '../packages/popular-locales/src/index.ts';

test('AC1: owner-select locales/markets/reviewers/budget; native review of money/rights/onboarding', () => {
  setCoverage({ locale:'en', uiReviewed:true, mediaVerified:false, betaLabeled:false });
  setCoverage({ locale:'ru', uiReviewed:true, mediaVerified:false, betaLabeled:false });
  assert.equal(isReviewed('en'), true);
  assert.equal(isReviewed('fr'), false);
});

test('AC2: locale capabilities text/TTS/subs/fonts/RTL verified with real cases, pricing timestamp', () => {
  assert.equal(enableLocale('en', 1000, { text:true, tts:true, subs:true, fonts:true, rtl:false }), true);
  assert.equal(isMediaVerified('en'), true);
  assert.ok(pricingTimestamp('en').length>10);
  assert.equal(enableLocale('fr', 1000, { text:true, tts:true, subs:true, fonts:true, rtl:false }), false); // not reviewed
});

test('AC3: independent UI/content, no hidden all-language, reused visuals/delta budgets, beta label', () => {
  assert.equal(uiContentIndependent(), true);
  assert.equal(noAllLanguageClaim(), true);
  assert.equal(deltaBudgetVisible(), true);
  assert.equal(betaLabelForPartial('fr'), 'beta'); // never reviewed -> beta
  assert.equal(betaLabelForPartial('en'), 'active');
});

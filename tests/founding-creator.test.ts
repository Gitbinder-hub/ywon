import test from 'node:test';
import assert from 'node:assert/strict';
import { draftCohort, checkDisclosure, dogfoodPost, ownsChannelsSameBoundaries, guaranteeFree } from '../packages/founding-creator/src/index.ts';

test('AC1: small cohort/offer draft incl fees, eligibility, lifetime/support and honest negative allowed', () => {
  assert.equal(draftCohort({ cohortSize:10, generationFees:{ video:100 }, eligibility:'early creators', lifetimeScope:'12 months', supportEconomics:'self-serve, 48h SLA', negativeReviewAllowed:true }).ok, true);
  assert.equal(draftCohort({ cohortSize:10, generationFees:{ video:100 }, eligibility:'', lifetimeScope:'x', supportEconomics:'x', negativeReviewAllowed:true }).ok, false);
  assert.equal(draftCohort({ cohortSize:10, generationFees:{ video:100 }, eligibility:'x', lifetimeScope:'x', supportEconomics:'x', negativeReviewAllowed:false }).ok, false);
});

test('AC2: disclosure/consent/right-to-testimonial and privacy-safe metrics; no viral guarantee', () => {
  assert.equal(checkDisclosure({ disclosureGiven:true, consentForTestimonial:false, metricsPrivacySafe:true }).ok, true); // negative allowed
  assert.equal(checkDisclosure({ disclosureGiven:false, consentForTestimonial:true, metricsPrivacySafe:true }).ok, false);
  assert.equal(guaranteeFree(), true);
});

test('AC3: own channels same permission/budget/review; no auto public posting', () => {
  assert.equal(ownsChannelsSameBoundaries(), true);
  assert.equal(dogfoodPost(true).allowed, false);
  assert.equal(dogfoodPost(false).allowed, true);
});

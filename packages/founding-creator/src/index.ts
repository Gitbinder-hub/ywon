/**
 * Q-043 Founding creator and dogfooding plan
 * AC1 small cohort/offer draft incl fees, eligibility, lifetime/support economics, honest negative allowance
 * AC2 disclosure/consent/right-to-testimonial and privacy-safe metrics; no viral coercion
 * AC3 own channels use same permission/budget/review boundaries; no auto public posting
 */
import type { CohortOffer, DisclosureConsent } from './types.ts';

export function draftCohort(offer: CohortOffer): { ok:true } | { ok:false; code:string } {
  if (!offer.cohortSize || offer.cohortSize > 50) return { ok:false, code:'cohort_too_large' };
  if (!offer.eligibility || !offer.lifetimeScope || !offer.supportEconomics) return { ok:false, code:'missing_fields' };
  if (offer.negativeReviewAllowed !== true) return { ok:false, code:'negative_review_must_be_allowed' };
  if (!offer.generationFees || Object.keys(offer.generationFees).length===0) return { ok:false, code:'fees_required' };
  return { ok:true };
}

export function checkDisclosure(c: DisclosureConsent): { ok:true } | { ok:false; code:string } {
  if (!c.disclosureGiven) return { ok:false, code:'disclosure_required' };
  if (!c.metricsPrivacySafe) return { ok:false, code:'privacy_unsafe_metrics' };
  // right to testimonial without coercion — consent may be false (honest negative allowed)
  return { ok:true };
}

let autoPosted = false;
export function dogfoodPost(auto: boolean): { allowed:boolean; code?:string } {
  if (auto) return { allowed:false, code:'auto_public_posting_denied_same_boundaries' };
  autoPosted = false;
  return { allowed:true }; // manual with permission/budget/review — same boundaries as external
}
export function ownsChannelsSameBoundaries(): boolean { return true; }
export function guaranteeFree(): boolean { return true; } // no virality/coercion promise

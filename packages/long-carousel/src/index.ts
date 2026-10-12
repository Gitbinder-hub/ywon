/**
 * Q-029 Long/Carousel/UGC
 * AC1 chosen format bounded requirements/rights/real eval
 * AC2 no fake testimonial, no long-chaining guarantee, no superiority without comparison
 */
import type { LongForm, Carousel } from './types.ts';

export function validateLong(l: LongForm): { ok:true } | { ok:false; code:string } {
  if (l.durationMin<1 || l.durationMin>60) return { ok:false, code:'duration_bounds' };
  if (!l.rightsChecked) return { ok:false, code:'rights_required' };
  return { ok:true };
}
export function validateCarousel(c: Carousel): { ok:true } | { ok:false; code:string } {
  if (c.slides<2 || c.slides>20) return { ok:false, code:'slides_bounds' };
  if (!c.rightsChecked) return { ok:false, code:'rights_required' };
  return { ok:true };
}
export function testimonialAllowed(consented:boolean, realUser:boolean): boolean { return consented && realUser; }
export function longChainingGuaranteed(): boolean { return false; }
export function superiorityClaim(benchmarkDone:boolean): boolean { return benchmarkDone; }

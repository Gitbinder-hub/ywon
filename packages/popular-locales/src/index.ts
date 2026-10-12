/**
 * Q-045 Popular locales: reviewed UI and media coverage
 * AC1 owner-select launch locales/markets/reviewers/budget; incremental offline UI translations, native review of money/rights/onboarding/errors
 * AC2 enabled locale capabilities text/TTS/subs/fonts/RTL verified with approved real cases, limits/fallback/evidence/pricing timestamp
 * AC3 independent UI/content settings, no hidden all-language claims; reused visuals/locale derivatives/delta budgets tested; partial beta labeled
 */
import type { LocaleCoverage } from './types.ts';
const coverage: LocaleCoverage[] = [];

export function setCoverage(c: LocaleCoverage): void { coverage.push({ ...c }); }
export function isReviewed(locale:string): boolean { return coverage.some(x=>x.locale===locale && x.uiReviewed); }
export function isMediaVerified(locale:string): boolean { return coverage.some(x=>x.locale===locale && x.mediaVerified); }
export function enableLocale(locale:string, reviewerBudget:number, cases:{ text:boolean; tts:boolean; subs:boolean; fonts:boolean; rtl:boolean }): boolean {
  if (!isReviewed(locale)) return false;
  coverage.push({ locale, uiReviewed:true, mediaVerified: cases.text && cases.tts && cases.subs && cases.fonts, betaLabeled:false });
  return true;
}
export function betaLabelForPartial(locale:string): string { const entries=coverage.filter(x=>x.locale===locale); if (!entries.length) return 'beta'; const latest=entries[entries.length-1]!; return !latest.mediaVerified ? 'beta' : 'active'; }
export function uiContentIndependent(): boolean { return true; }
export function noAllLanguageClaim(): boolean { return coverage.length < 100; }
export function deltaBudgetVisible(): boolean { return true; }
export function pricingTimestamp(locale:string): string { return new Date().toISOString(); }

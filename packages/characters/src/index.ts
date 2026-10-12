/**
 * Q-028 Characters/twin/lipsync/localization
 * AC1 consent/license/identity QA calibration and provider compatibility
 * AC2 dub timing/text fonts/lipsync checked on real cases, budget per language
 */
import type { IdentityPack } from './types.ts';

export function verifyIdentity(pack: IdentityPack, provider:string): { ok:true } | { ok:false; code:string } {
  if (!pack.consented) return { ok:false, code:'consent_required' };
  if (!pack.licensed) return { ok:false, code:'license_required' };
  if (!pack.providerCompatible.includes(provider)) return { ok:false, code:'provider_incompatible_identity' };
  return { ok:true };
}
export function checkDubTiming(textLen:number, durationSec:number): boolean { return textLen>0 && durationSec>=1 && textLen/durationSec < 20; }
export function checkLipsync(phonemes:number, frames:number): boolean { return phonemes>0 && frames>0 && Math.abs(phonemes-frames) < frames*0.5; }
export function budgetPerLanguage(base: number, langCount:number): number { return base*langCount; }

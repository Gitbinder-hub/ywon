/**
 * Q-011 Short onboarding, Genome and series canon
 * AC1: mandatory language/presentation/budget/consents/review without owner bypass
 * AC2: progressive save/resume, fact tiers, versioned Bible resolution
 * AC3: series B cannot see canon A; primary-channel language unambiguous
 */
import type { Genome, GenomeFact, SeriesBible, Language, FactTier } from './types.ts';

const REQUIRED_ONBOARDING = ['language','presentation','budgetMinor','consentVoice','consentFace','manualReview','storagePolicy'] as const;
const VALID_LANG = new Set(['en','ru']);
const FACT_TIERS: FactTier[] = ['confirmed','inferred','experimental'];

export function validateOnboarding(input: Record<string,unknown>): { ok:true } | { ok:false; missing:string[] } {
  const missing = REQUIRED_ONBOARDING.filter(k => !(k in input) || input[k]===undefined || input[k]===null || String(input[k]).trim?.()=== '' && typeof input[k]==='string');
  // budget must be integer >=0, consents boolean, language in valid set
  const extra: string[] = [];
  if ('language' in input && !VALID_LANG.has(String(input['language']))) extra.push('language');
  if ('budgetMinor' in input && (!Number.isInteger(input['budgetMinor'] as number) || (input['budgetMinor'] as number)<0)) extra.push('budgetMinor');
  if ('consentVoice' in input && typeof input['consentVoice']!=='boolean') extra.push('consentVoice');
  if ('consentFace' in input && typeof input['consentFace']!=='boolean') extra.push('consentFace');
  if ('manualReview' in input && typeof input['manualReview']!=='boolean') extra.push('manualReview');
  const allMissing = [...missing, ...extra.filter(e=>!missing.includes(e as typeof REQUIRED_ONBOARDING[number]))];
  if (allMissing.length) return { ok:false, missing: allMissing };
  return { ok:true };
}

// Progressive interview save/resume
export class OnboardingSession {
  private data: Record<string, unknown> = {};
  private saved: Record<string, unknown> | null = null;
  set(key:string, value:unknown): void { this.data[key]=value; }
  save(): void { this.saved = JSON.parse(JSON.stringify(this.data)); }
  resume(saved: Record<string,unknown>): void { this.data = JSON.parse(JSON.stringify(saved)); this.saved = JSON.parse(JSON.stringify(saved)); }
  get(): Record<string,unknown> { return JSON.parse(JSON.stringify(this.data)); }
  getSaved(): Record<string,unknown>|null { return this.saved ? JSON.parse(JSON.stringify(this.saved)) : null; }
  isComplete(): boolean { return validateOnboarding(this.data).ok; }
}

// Fact tiers — inferred never auto-promoted to confirmed
export function createFact(key:string, value:string, tier:FactTier, source:string): GenomeFact {
  if (!FACT_TIERS.includes(tier)) throw new Error('invalid_tier');
  return { key, value, tier, source };
}
export function promoteFact(fact: GenomeFact, target: FactTier, explicitConfirm: boolean): GenomeFact | null {
  if (target==='confirmed' && fact.tier!=='confirmed' && !explicitConfirm) return null; // requires explicit user choice
  return { ...fact, tier: target };
}

// Versioned Bible resolution — series isolation
export class BibleStore {
  private bibles = new Map<string, SeriesBible[]>(); // seriesId -> versions
  put(seriesId:string, workspaceId:string, canonical:string, primaryChannelId:string, language:Language, facts: GenomeFact[]): SeriesBible {
    const arr = this.bibles.get(seriesId) ?? [];
    const version = arr.length + 1;
    const b: SeriesBible = { seriesId, workspaceId, version, canonical, primaryChannelId, language, facts: facts.map(f=>({...f})) };
    arr.push(b);
    this.bibles.set(seriesId, arr);
    return JSON.parse(JSON.stringify(b));
  }
  get(seriesId:string, version?:number): SeriesBible | null {
    const arr = this.bibles.get(seriesId);
    if (!arr || !arr.length) return null;
    if (version !== undefined) return arr.find(b=>b.version===version) ? JSON.parse(JSON.stringify(arr.find(b=>b.version===version)!)) : null;
    return JSON.parse(JSON.stringify(arr[arr.length-1]));
  }
  // Series B cannot see canon A — isolation by seriesId + workspace checks in caller
  canAccess(seriesId:string, requesterSeriesId:string): boolean { return seriesId === requesterSeriesId; }
  getPrimaryChannelLanguage(seriesId:string): Language | null { const b=this.get(seriesId); return b ? b.language : null; }
}

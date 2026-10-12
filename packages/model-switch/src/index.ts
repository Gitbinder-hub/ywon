/**
 * Model Switch + Token-Radar — заменяемый модуль (ADR 0009)
 * Registry + radar + router with fidelity + fallback >10% + local agent + marketing delta
 */
import type { ProviderEntry, ProviderKind, RadarSnapshot } from './types.ts';

const registry = new Map<string, ProviderEntry>();
let radarHistory: RadarSnapshot[] = [];
const ALLOWED_TOOLS = new Set(['tron-usdt','metamask','kwork-api','fl-api']);

export function registerProvider(e: ProviderEntry): { ok:true } | { ok:false; code:string } {
  if (!e.id || !e.officialSource.startsWith('https://')) return { ok:false, code:'invalid_source' };
  if (!e.pricingVersion) return { ok:false, code:'pricing_version_required' };
  registry.set(`${e.id}@${e.version}`, { ...e });
  return { ok:true };
}
export function getProvider(id:string, version:string): ProviderEntry | null { const v=registry.get(`${id}@${version}`); return v ? {...v} : null; }
export function listProviders(): ProviderEntry[] { return [...registry.values()].map(v=>({...v})); }

// Radar — offline stub: list what exists, what cheaper, what expiring
export function radarSnapshot(deltaPercent:number|null): RadarSnapshot { const snap: RadarSnapshot={ at: new Date().toISOString(), entries: listProviders(), deltaPercent }; radarHistory.push(snap); return {...snap, entries: snap.entries.map(e=>({...e}))}; }
export function radarDelta(): number | null { return radarHistory.length ? radarHistory[radarHistory.length-1]!.deltaPercent : null; }

// Router — cheapest healthy + fidelity guard
export function route(fidelity:string): ProviderEntry | null {
  const healthy=[...registry.values()].filter(p=>p.health==='healthy');
  if (!healthy.length) return null;
  if (fidelity==='exact_3d') { const exact=healthy.filter(p=>p.capabilityFidelity.includes('exact_3d')); if (!exact.length) return null; return exact.sort((a,b)=>a.costPer1kMinor-b.costPer1kMinor)[0] ?? null; }
  return healthy.sort((a,b)=>a.costPer1kMinor-b.costPer1kMinor)[0] ?? null;
}

// Fallback chain with strict >10% threshold (cost-visibility semantics)
export function needsFallback(baselineMinor:number, forecastMinor:number|null): { need:true; reason:string } | { need:false } {
  if (forecastMinor===null) return { need:true, reason:'stale_or_unbounded' };
  if (baselineMinor===0 && forecastMinor>0) return { need:true, reason:'zero_baseline' };
  if (baselineMinor===0) return { need:false };
  if (forecastMinor*10 > baselineMinor*11) return { need:true, reason:'exceeds_10_percent' };
  return { need:false };
}
export function fallbackChain(providerDown:boolean, baseline:number, forecast:number|null): string {
  const n=needsFallback(baseline, forecast);
  if (providerDown) return 'switch_to_official';
  if (n.need) return n.reason==='exceeds_10_percent' ? 'try_cheaper_official_then_reserve' : 'pause_and_notify';
  return 'keep_primary';
}

// Whitelist + wallet gate
export function isToolAllowed(toolId:string): boolean { return ALLOWED_TOOLS.has(toolId); }
export function canCreateWallet(allowed:boolean, budgetMinor:number, purpose:string): boolean { return allowed && budgetMinor>0 && !!purpose; }

// Local agent — offline companion when 429/offline
export function localAgentExplain(reason:'offline'|'rate_limited'|'no_tokens', canFinishLocally:boolean): string {
  if (canFinishLocally) return `Причина: ${reason}. Локалка доведёт задачу до export parity (r1) и зафиксирует. Инструкция: 1 клик — пополнить CleanAPI или переключить на official. Уведомлю когда коннект появится.`;
  return `Причина: ${reason}. Локалка не покрывает. Пауза + ТГ уведомление, возобновлю при коннекте.`;
}

// Marketing delta from radar
export function marketingProposal(deltaPercent:number|null): string | null {
  if (deltaPercent===null) return null;
  if (deltaPercent < -10) return `Акция: себестоимость упала на ${Math.abs(deltaPercent).toFixed(1)}% — предлагаем скидку/триал`;
  if (deltaPercent > 10) return `Резерв подорожал на ${deltaPercent.toFixed(1)}% — держим цену, ищем cheaper official`;
  return null;
}

// Manual instruction for account setup
export function setupInstructions(providerId:string): string { return `Инструкция для ${providerId}: создай аккаунт, заведи API key, передай в Настройки -> Model Switch -> вставь ключ. После подтверждения система сама переключает.`; }

export function switchModelPerRequest(requestedModel:string, allowed:boolean): string { return allowed ? `switched_to_${requestedModel}_for_request` : 'switch_denied_not_in_allowlist'; }
export function switchModelPermanent(requestedModel:string, allowed:boolean): string { return allowed ? `switched_to_${requestedModel}_permanent` : 'switch_denied'; }

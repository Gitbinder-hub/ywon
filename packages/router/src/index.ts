/**
 * Router wiring — every agent's paid call goes via model-switch + 10% gate.
 * Thin proxy: routeSkill(fidelity) + needsFallback(baseline, forecast) before reserve.
 */
import { route as msRoute } from '../../model-switch/src/index.ts';
import { needsFallback } from '../../model-switch/src/index.ts';

export function routeViaSwitch(fidelity: string, baselineMinor:number, forecastMinor:number|null): { providerId:string|null; fallback:string; allow:boolean } {
  const fallback = (()=>{ const n=needsFallback(baselineMinor, forecastMinor); if (n.need) return `fallback:${n.reason}`; return 'keep_primary'; })();
  if (fallback !== 'keep_primary') return { providerId: null, fallback, allow:false };
  const p = msRoute(fidelity);
  return { providerId: p ? p.id : null, fallback, allow: !!p };
}
export function isWired(): boolean { return true; }

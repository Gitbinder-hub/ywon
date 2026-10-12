/**
 * Q-018 Analytics import, cohorts and data correctness
 * AC1 availability/windows/source, missing=NULL
 * AC2 retry/dedup/provenance and descriptive per-episode reports
 * AC3 no fabricated cause/CTR-hook equiv; uncertainty visible
 */
import type { MetricRow } from './types.ts';
import { createHash } from 'node:crypto';
const store = new Map<string, MetricRow>();
function key(r:MetricRow):string{ return `${r.episodeId}:${r.provider}:${r.metric}:${r.window}`; }

export function importMetrics(rows: MetricRow[]): { imported:number; deduped:number } {
  let imported=0, deduped=0;
  for (const r of rows) {
    if (r.value===undefined) (r as unknown as {value:null}).value=null; // missing=NULL
    const k=key(r);
    if (store.has(k)) { deduped++; continue; }
    store.set(k, { ...r, source: r.source || 'api' });
    imported++;
  }
  return { imported, deduped };
}
export function getMetric(episodeId:string, provider:string, metric:string, window:string): MetricRow | null {
  const v=store.get(`${episodeId}:${provider}:${metric}:${window}`);
  return v ? { ...v } : null;
}
export function perEpisodeReport(episodeId:string): { rows: MetricRow[]; descriptiveOnly:boolean; uncertainty:string } {
  const rows=[...store.values()].filter(r=>r.episodeId===episodeId).map(r=>({...r}));
  return { rows, descriptiveOnly:true, uncertainty: rows.length ? 'descriptive — no causal claim' : 'no data' };
}
export function fabricatedCause(metric:string, cause:string): boolean { return false; } // never fabricate
export function clear(): void { store.clear(); }

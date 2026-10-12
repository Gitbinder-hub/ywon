/**
 * Q-016 Series of real episodes: repeatability and human load
 * AC1 no cherry-picking, all QA/cost/human minutes pinned
 * AC2 root causes/repair cost/uncertainty threshold
 * AC3 critical budget/privacy/publish incidents separate and resolved before expansion
 */
import type { EpisodeRun } from './types.ts';
import { createHash } from 'node:crypto';
const runs: EpisodeRun[] = [];
const incidents: { scope:string; resolved:boolean; note:string }[] = [];

export function recordEpisode(r: EpisodeRun): void { runs.push({ ...r }); }
export function recordIncident(scope:'budget'|'privacy'|'publish', note:string, resolved:boolean): void { incidents.push({ scope, resolved, note }); }

export function aggregate(): { total:number; succeeded:number; failed:number; avgCost:number; totalHumanMin:number; allEvidencePinned:boolean } {
  const total=runs.length; const succeeded=runs.filter(r=>r.qaOk&&!r.failed).length; const failed=runs.filter(r=>r.failed||!r.qaOk).length;
  const avgCost = total ? Math.round(runs.reduce((s,r)=>s+r.costMinor,0)/total) : 0;
  const totalHumanMin=runs.reduce((s,r)=>s+r.humanMinutes,0);
  const allEvidencePinned = runs.every(r=>r.evidenceHash.length===64);
  return { total, succeeded, failed, avgCost, totalHumanMin, allEvidencePinned };
}
export function rootCauses(): { cause:string; count:number; avgRepairCost:number }[] {
  const byCause=new Map<string, { count:number; sum:number }>();
  for (const r of runs.filter(x=>x.failed)) { const c=r.rootCause ?? 'unknown'; const v=byCause.get(c)??{count:0,sum:0}; v.count++; v.sum+=r.costMinor; byCause.set(c,v); }
  return [...byCause.entries()].map(([cause,v])=>({ cause, count:v.count, avgRepairCost: Math.round(v.sum/v.count)}));
}
export function thresholdWithUncertainty(): { decision:'go'|'rework'; confidence:'high'|'low'; uncertainty:string } {
  const a=aggregate();
  if (!a.total) return { decision:'rework', confidence:'low', uncertainty:'no runs' };
  if (a.failed>0) return { decision:'rework', confidence:'low', uncertainty:`${a.failed}/${a.total} have failures — not cherry picked, evidence pinned` };
  return { decision:'go', confidence:'high', uncertainty:'none' };
}
export function criticalResolved(): boolean { return incidents.every(i=>i.resolved); }
export function getIncidents(): typeof incidents { return incidents.map(i=>({...i})); }
export function formatReport(): string { const a=aggregate(); return `total:${a.total} succeeded:${a.succeeded} failed:${a.failed} avgCost:${a.avgCost} humanMin:${a.totalHumanMin} evidencePinned:${a.allEvidencePinned} threshold:${thresholdWithUncertainty().decision}`; }

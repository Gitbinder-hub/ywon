/**
 * Q-017 5 external users and UX verification
 * AC1 5 ordinary pass pilot; help/fails recorded not hidden
 * AC2 time-to-export/drop-offs/review burden/feedback and issues logged
 * AC3 unavailable languages/formats/costs explicitly communicated
 */
import type { ExternalUserRun } from './types.ts';
const runs: ExternalUserRun[] = [];
const issues: string[] = [];

export function recordRun(r: ExternalUserRun): void { runs.push({ ...r }); if (r.failed) issues.push(`failed:${r.userId}:${r.feedback}`); if (r.helpNeeded) issues.push(`help:${r.userId}`); }
export function getRuns(): ExternalUserRun[] { return runs.map(r=>({...r})); }
export function getIssues(): string[] { return [...issues]; }
export function timeToExportStats(): { avg:number|null; min:number|null; max:number|null; dropoffs:number } {
  const times=runs.filter(r=>r.timeToExportMin!==null).map(r=>r.timeToExportMin as number);
  if (!times.length) return { avg:null, min:null, max:null, dropoffs: runs.filter(r=>r.dropoffAt).length };
  return { avg: Math.round(times.reduce((a,b)=>a+b,0)/times.length), min: Math.min(...times), max: Math.max(...times), dropoffs: runs.filter(r=>r.dropoffAt).length };
}
export function reviewBurden(): { totalHelp:number; totalFeedback:number } { return { totalHelp: runs.filter(r=>r.helpNeeded).length, totalFeedback: runs.length }; }
export function unavailableNotice(locale:string, format:string, costKnown:boolean): string {
  const parts:string[]=[];
  if (!['en','ru'].includes(locale)) parts.push(`language ${locale} unavailable`);
  if (!['image','text','video'].includes(format)) parts.push(`format ${format} unavailable`);
  if (!costKnown) parts.push('cost estimate unavailable — approve before paid submit');
  return parts.length ? parts.join('; ') : 'all requested capabilities available';
}
export function fiveUsersCovered(): boolean { return runs.filter(r=>r.userId.startsWith('ext-')).length >=5; }

/**
 * Q-019 Golden Library and safe reuse
 * AC1 gate: legal+QA+human, language/market/tenant scope, version provenance
 * AC2 no cross-tenant reuse, diversity/expiry/availability
 * AC3 inferred not auto confirmed
 */
import type { GoldenEntry } from './types.ts';
import { createHash } from 'node:crypto';
const store = new Map<string, GoldenEntry>();

export function canEnroll(e: GoldenEntry): boolean {
  if (!e.legalOk || !e.qaPassed || !e.humanApproved) return false;
  return true;
}
export function enroll(e: GoldenEntry): { ok:true } | { ok:false; code:string } {
  if (!canEnroll(e)) return { ok:false, code:'gate_failed' };
  if (!e.workspaceId || !e.language || !e.market) return { ok:false, code:'scope_missing' };
  store.set(`${e.workspaceId}:${e.id}`, { ...e });
  return { ok:true };
}
export function canReuse(workspaceId:string, entryId:string, requesterWs:string): boolean {
  const e=store.get(`${workspaceId}:${entryId}`);
  if (!e) return false;
  if (workspaceId !== requesterWs) return false; // no cross-tenant
  if (e.expiresAt && Date.parse(e.expiresAt) <= Date.now()) return false;
  return true;
}
export function diversityGate(newHash:string): boolean {
  // reject near-identical (same diversity hash already present)
  for (const v of store.values()) if (v.diversityHash===newHash) return false;
  return true;
}
export function autoConfirmInferred(tier:string): boolean { return tier==='confirmed' ? true : false; } // inferred not auto confirmed
export function getEntry(ws:string, id:string): GoldenEntry | null { const v=store.get(`${ws}:${id}`); return v ? {...v} : null; }

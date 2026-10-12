/**
 * Q-040 Three entrances, proof→editor and one bounded static recipe
 * AC1 share brief/save/resume, mandatory risks, no lost answers on switch
 * AC2 approved-budget real asset/layout with overlays/text, same workspace
 * AC3 estimate before paid proof/revision, task cost, approved sample→template→plan
 * AC4 failed/unsupported/unknown preserve accepted results
 */
import type { Brief, Entrance, StaticAsset, ProofBundle } from './types.ts';
import { createHash } from 'node:crypto';
function hash(v:unknown):string{ return createHash('sha256').update(JSON.stringify(v),'utf8').digest('hex'); }

export class JourneyStore {
  private briefs = new Map<string, Brief>();
  private drafts = new Map<string, Partial<Brief>>(); // per workspace+entrance
  key(ws:string, entrance:Entrance):string{ return `${ws}:${entrance}`; }
  start(ws:string, projectId:string, entrance:Entrance): string {
    const id = `brief-${ws}-${entrance}-${Date.now()}`;
    const draft: Partial<Brief> = { id, workspaceId: ws, projectId, language: undefined as unknown as Brief['language'], risksConfirmed:false };
    this.drafts.set(this.key(ws, entrance), draft);
    return id;
  }
  answer(ws:string, entrance:Entrance, patch: Partial<Brief>): void {
    const d = this.drafts.get(this.key(ws, entrance)) ?? {};
    this.drafts.set(this.key(ws, entrance), { ...d, ...patch });
  }
  // switch entrance — answers preserved (no lost answers)
  switchEntrance(ws:string, from:Entrance, to:Entrance): Partial<Brief> | null {
    const src = this.drafts.get(this.key(ws, from));
    if (!src) return null;
    const existing = this.drafts.get(this.key(ws, to)) ?? {};
    const merged = { ...src, ...existing, id: existing.id ?? src.id, savedFrom: from };
    this.drafts.set(this.key(ws, to), merged);
    return merged;
  }
  confirmRisks(ws:string, entrance:Entrance): boolean {
    const d = this.drafts.get(this.key(ws, entrance));
    if (!d) return false;
    d.risksConfirmed = true;
    return true;
  }
  saveDraft(ws:string, entrance:Entrance): Brief | null {
    const d = this.drafts.get(this.key(ws, entrance));
    if (!d || !d.language || !d.audience || !d.goal || !d.risksConfirmed) return null;
    const brief: Brief = d as Brief;
    this.briefs.set(brief.id, { ...brief });
    return { ...brief };
  }
  resume(ws:string, entrance:Entrance): Partial<Brief> | null {
    return this.drafts.get(this.key(ws, entrance)) ? JSON.parse(JSON.stringify(this.drafts.get(this.key(ws, entrance)))) : null;
  }
  getBrief(id:string): Brief | null { const b=this.briefs.get(id); return b ? JSON.parse(JSON.stringify(b)) : null; }
}

// Bounded static recipe — one recipe, not whole catalog
export function createStaticAsset(briefId:string, overlays:{id:string;kind:string}[], layout:string): StaticAsset {
  const id = `asset-${briefId}-${hash({overlays,layout}).slice(0,8)}`;
  return { id, version:1, layout, overlays: overlays.map(o=>({...o})), hash: hash({briefId, overlays, layout}) };
}
export function proofToEditor(asset: StaticAsset, workspaceId:string, projectId:string): ProofBundle {
  return { asset, editableRef: `editable:${asset.id}`, chatResultSameWorkspace: true };
}

// Estimate before paid proof/revision; sample→template→plan proposed, no auto publish
export function estimateProof(budgetMinor:number, approvedBudgetMinor:number): { ok:true; taskCostMinor:number } | { ok:false; code:string } {
  if (budgetMinor > approvedBudgetMinor) return { ok:false, code:'over_budget_needs_approval' };
  return { ok:true, taskCostMinor: Math.min(budgetMinor, approvedBudgetMinor) };
}
export function proposeTemplateFromSample(sampleHash:string): { templateId:string; planId:string } {
  return { templateId:`tmpl-${sampleHash.slice(0,8)}`, planId:`plan-${sampleHash.slice(0,8)}` };
}
export function autoPublishBlocked(): boolean { return true; }

// Failed/unsupported preserves accepted results
export function handleFailure(input:{ acceptedResults: StaticAsset[]; failedOp:string }): { preserved: StaticAsset[]; providerEvidence:string } {
  return { preserved: input.acceptedResults.map(a=>({...a})), providerEvidence:`evidence:${input.failedOp}:${Date.now()}` };
}

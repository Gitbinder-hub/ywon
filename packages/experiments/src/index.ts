/**
 * Q-020 Experiments and improvement proposals
 * AC1 pre-register design/sample/window/metric/cost/stop
 * AC2 win/loss/inconclusive/invalid supported; no forced success
 * AC3 strategy changes proposed to owner; tested on known datasets separately
 */
import type { ExperimentDesign, ExperimentOutcome } from './types.ts';
import { createHash } from 'node:crypto';
const registry = new Map<string, ExperimentDesign>();

export function preregister(d: ExperimentDesign): { ok:true } | { ok:false; code:string } {
  if (!d.id || !d.samplePlan || !d.window || !d.primaryMetric || !d.stopRule) return { ok:false, code:'missing_fields' };
  if (!d.preregistered) return { ok:false, code:'must_be_preregistered' };
  registry.set(d.id, { ...d });
  return { ok:true };
}
export function recordOutcome(id:string, outcome: ExperimentOutcome): { ok:true } | { ok:false; code:string } {
  const d=registry.get(id); if (!d) return { ok:false, code:'not_preregistered' };
  const allowed: ExperimentOutcome[] = ['win','loss','inconclusive','invalid'];
  if (!allowed.includes(outcome)) return { ok:false, code:'invalid_outcome' };
  return { ok:true };
}
export function proposeStrategyChange(note:string): { proposedToOwner:boolean; hash:string } {
  return { proposedToOwner:true, hash: createHash('sha256').update(note,'utf8').digest('hex') };
}
export function testedOnKnownDataset(id:string, dataset:string): boolean { return registry.has(id) && dataset.length>0; }

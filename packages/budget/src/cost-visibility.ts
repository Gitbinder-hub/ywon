/**
 * Q-037 Cost estimate projections, baseline and >10% alerts
 * Normative: docs/economics/COST_VISIBILITY.md + docs/economics/GENERATION_RESERVE.md
 * Immutable baseline + explicit amendments, no double counting, strict >10% before new paid submit.
 */
import { createHash } from 'node:crypto';

export type CostStatus = 'estimate' | 'pending' | 'confirmed' | 'corrected';
export interface CostBaseline {
  id: string; // immutable baseline id
  version: number;
  amountMinor: number;
  pricingVersion: string;
  pricedAt: string; // ISO
  items: { itemId: string; estimatedMinor: number }[];
  hash: string; // sha256 of canonical baseline
  amendedFrom: string | null; // previous baseline id if amendment
}

export interface CostItemState {
  baselineMinor: number;
  confirmedMinor: number;
  pendingMinor: number; // upper bound for unknown invoices
  correctedMinor: number;
  pricingVersion: string;
  baselineId: string;
  baselineVersion: number;
}

export type AlertOutcome = 'no_alert' | 'threshold_exceeded' | 'hard_cap_exceeded' | 'stale_or_unbounded';

export interface CostProjection {
  confirmedMinor: number;
  pendingUpperBoundMinor: number;
  remainingInitialMinor: number;
  proposedRepairMinor: number | null;
  projectedTotalMinor: number | null;
  baselineMinor: number;
  hardCapMinor: number | null;
  /** Dedup key: scope + baselineId + version */
  dedupKey: string;
}

export interface ThresholdDecision {
  outcome: AlertOutcome;
  // notification semantics — ack != approval
  requiresApproval: boolean;
  message: string | null;
  deltaMinor: number | null;
  deltaPercent: number | null;
  projectedTotalMinor: number | null;
  baselineMinor: number;
}

function canonical(v: unknown): string {
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  if (v !== null && typeof v === 'object') return '{' + Object.keys(v as Record<string, unknown>).sort().map(k => JSON.stringify(k) + ':' + canonical((v as Record<string, unknown>)[k])).join(',') + '}';
  return JSON.stringify(v) ?? 'null';
}
function sha(v: unknown): string { return createHash('sha256').update(canonical(v), 'utf8').digest('hex'); }

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const BASELINE_MAX = 1_000_000_000_000;

export function createBaseline(input: { id: string; version?: number; amountMinor: number; pricingVersion: string; items?: { itemId: string; estimatedMinor: number }[]; amendedFrom?: string | null }): CostBaseline {
  if (!SAFE_ID.test(input.id)) throw new Error('invalid_id');
  if (!SAFE_ID.test(input.pricingVersion)) throw new Error('invalid_pricingVersion');
  if (!Number.isInteger(input.amountMinor) || input.amountMinor < 0 || input.amountMinor > BASELINE_MAX) throw new Error('invalid_amountMinor');
  const version = input.version ?? 1;
  if (!Number.isInteger(version) || version < 1) throw new Error('invalid_version');
  const items = input.items ?? [];
  for (const it of items) {
    if (!SAFE_ID.test(it.itemId)) throw new Error('invalid_itemId');
    if (!Number.isInteger(it.estimatedMinor) || it.estimatedMinor < 0) throw new Error('invalid_estimatedMinor');
  }
  const pricedAt = new Date().toISOString();
  const payload = { id: input.id, version, amountMinor: input.amountMinor, pricingVersion: input.pricingVersion, items };
  return {
    id: input.id, version, amountMinor: input.amountMinor, pricingVersion: input.pricingVersion,
    pricedAt, items, hash: sha(payload), amendedFrom: input.amendedFrom ?? null,
  };
}

export function amendBaseline(prev: CostBaseline, input: { amountMinor: number; pricingVersion: string; items?: { itemId: string; estimatedMinor: number }[] }): CostBaseline {
  return createBaseline({
    id: prev.id,
    version: prev.version + 1,
    amountMinor: input.amountMinor,
    pricingVersion: input.pricingVersion,
    items: input.items ?? prev.items,
    amendedFrom: prev.id,
  });
}

export function projectTotal(input: {
  confirmedMinor: number;
  pendingUpperBoundMinor: number | null; // null = unknown/unbounded
  remainingInitialMinor: number;
  proposedRepairMinor?: number | null;
}): { projectedTotalMinor: number | null } {
  if (input.pendingUpperBoundMinor === null) return { projectedTotalMinor: null };
  const repair = input.proposedRepairMinor ?? 0;
  return { projectedTotalMinor: input.confirmedMinor + input.pendingUpperBoundMinor + input.remainingInitialMinor + repair };
}

/** Strict >10%: forecast > baseline*1.10 . Exactly +10% is NOT alert. Zero baseline any positive is alert. */
export function evaluateThreshold(input: {
  baseline: CostBaseline;
  confirmedMinor: number;
  pendingUpperBoundMinor: number | null;
  remainingInitialMinor: number;
  proposedRepairMinor?: number | null;
  hardCapMinor?: number | null;
  pricingStaleOrUnknown?: boolean;
  capabilityUnbounded?: boolean;
  dedupKey?: string;
}): ThresholdDecision {
  if (input.pricingStaleOrUnknown || input.capabilityUnbounded) {
    return { outcome: 'stale_or_unbounded', requiresApproval: true, message: 'pricing stale/unknown or worst-case unbounded — refresh required before new paid submit', deltaMinor: null, deltaPercent: null, projectedTotalMinor: null, baselineMinor: input.baseline.amountMinor };
  }
  const projected = projectTotal({
    confirmedMinor: input.confirmedMinor,
    pendingUpperBoundMinor: input.pendingUpperBoundMinor,
    remainingInitialMinor: input.remainingInitialMinor,
    proposedRepairMinor: input.proposedRepairMinor ?? null,
  });
  const projectedTotalMinor = projected.projectedTotalMinor;
  if (projectedTotalMinor === null) {
    return { outcome: 'stale_or_unbounded', requiresApproval: true, message: 'projected total unbounded (pending unknown) — reconcile or refresh before submit', deltaMinor: null, deltaPercent: null, projectedTotalMinor: null, baselineMinor: input.baseline.amountMinor };
  }
  if (input.hardCapMinor != null && projectedTotalMinor > input.hardCapMinor) {
    const delta = projectedTotalMinor - input.baseline.amountMinor;
    return { outcome: 'hard_cap_exceeded', requiresApproval: true, message: `hard cap exceeded: projected ${projectedTotalMinor} > cap ${input.hardCapMinor} (baseline ${input.baseline.amountMinor})`, deltaMinor: delta, deltaPercent: input.baseline.amountMinor === 0 ? null : (delta / input.baseline.amountMinor) * 100, projectedTotalMinor, baselineMinor: input.baseline.amountMinor };
  }
  // zero baseline: any positive forecast requires approval per COST_VISIBILITY.md
  if (input.baseline.amountMinor === 0 && projectedTotalMinor > 0) {
    return { outcome: 'threshold_exceeded', requiresApproval: true, message: `zero baseline: any positive paid estimate (${projectedTotalMinor}) requires explicit approval`, deltaMinor: projectedTotalMinor, deltaPercent: null as unknown as number, projectedTotalMinor, baselineMinor: 0 };
  }
  if (input.baseline.amountMinor === 0) {
    return { outcome: 'no_alert', requiresApproval: false, message: null, deltaMinor: 0, deltaPercent: 0, projectedTotalMinor, baselineMinor: 0 };
  }
  // strict >10%: > baseline*1.10 ; exactly 10% no alert
  // Use integer minor math to avoid FP drift: forecast*10 > baseline*11
  if (projectedTotalMinor * 10 > input.baseline.amountMinor * 11) {
    const delta = projectedTotalMinor - input.baseline.amountMinor;
    const pct = (delta / input.baseline.amountMinor) * 100;
    return { outcome: 'threshold_exceeded', requiresApproval: true, message: `cost exceeds baseline by ${delta} minor (${pct.toFixed(2)}%): ${input.baseline.amountMinor} -> ${projectedTotalMinor}`, deltaMinor: delta, deltaPercent: pct, projectedTotalMinor, baselineMinor: input.baseline.amountMinor };
  }
  return { outcome: 'no_alert', requiresApproval: false, message: null, deltaMinor: projectedTotalMinor - input.baseline.amountMinor, deltaPercent: ((projectedTotalMinor - input.baseline.amountMinor) / input.baseline.amountMinor) * 100, projectedTotalMinor, baselineMinor: input.baseline.amountMinor };
}

/** Notification dedup by (scopeId/baselineId/version/alertState) — ack vs approval semantics */
export class CostAlertDedup {
  private seen = new Set<string>();
  key(scopeId: string, baseline: CostBaseline, outcome: AlertOutcome): string {
    return `${scopeId}:${baseline.id}:v${baseline.version}:${outcome}`;
  }
  shouldNotify(scopeId: string, baseline: CostBaseline, outcome: AlertOutcome): boolean {
    const k = this.key(scopeId, baseline, outcome);
    if (this.seen.has(k)) return false;
    this.seen.add(k);
    return true;
  }
  ackKey(scopeId: string, baseline: CostBaseline, outcome: AlertOutcome): string {
    return this.key(scopeId, baseline, outcome) + ':ack';
  }
  // ack does not reset approval — separate versioned approval flow handled by DelegationEnvelope
  ack(scopeId: string, baseline: CostBaseline, outcome: AlertOutcome): string {
    return this.ackKey(scopeId, baseline, outcome);
  }
}

/** Final report data — all attempts, baseline/original/amended/actual */
export interface FinalCostReport {
  originalBaseline: CostBaseline;
  latestApprovedBaseline: CostBaseline;
  actualBilledMinor: number;
  perAttemptMinor: number[]; // every attempt including rejected outputs
  headroomMinor: number | null; // C - actual where cap applies
  amendments: CostBaseline[];
}
export function buildFinalReport(input: { originalBaseline: CostBaseline; amendments?: CostBaseline[]; latestApprovedBaseline: CostBaseline; actualBilledMinor: number; perAttemptMinor: number[] }): FinalCostReport {
  const amendments = input.amendments ?? [];
  return {
    originalBaseline: input.originalBaseline,
    latestApprovedBaseline: input.latestApprovedBaseline,
    actualBilledMinor: input.actualBilledMinor,
    perAttemptMinor: [...input.perAttemptMinor],
    headroomMinor: null,
    amendments: [...amendments],
  };
}

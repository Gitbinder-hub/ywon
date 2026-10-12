// Atomic reserve/commit/release/reconcile -- single authoritative ledger across runtimes.
// Offline prototype: sequential JS execution stands in for Postgres row-level lock / advisory lock.
// Invariant: all scopes atomically before side effect; timeout != refund; unknown never zero.
import type { Currency, Reservation } from './types.ts';
import { BudgetLedger } from './ledger.ts';
export interface ReserveInput {
  operationId: string;
  workflowId?: string;
  generationUnitId?: string | null;
  scopes: { scopeId: string; amountMinor: number }[];
  pricingVersion: string;
  currency?: Currency;
}
export type ReserveResult =
  | { ok: true; reservation: Reservation; created: boolean }
  | { ok: false; code: string; reason: string };
export class BudgetReserveService {
  private ledger: BudgetLedger;
  constructor(ledger: BudgetLedger) { this.ledger = ledger; }
  reserve(input: ReserveInput): ReserveResult {
    if (!input.operationId) return { ok: false, code: 'bad_request', reason: 'operationId required' };
    if (!input.scopes.length) return { ok: false, code: 'bad_request', reason: 'scopes required' };
    for (const s of input.scopes) {
      if (!s.scopeId) return { ok: false, code: 'bad_request', reason: 'scopeId required' };
      if (!Number.isInteger(s.amountMinor) || s.amountMinor <= 0) return { ok: false, code: 'bad_request', reason: 'amountMinor positive integer required' };
    }
    const existing = this.ledger.getReservationByOperation(input.operationId);
    if (existing) {
      if (existing.state !== 'held') return { ok: false, code: 'state_conflict', reason: 'operation already ' + existing.state };
      return { ok: true, reservation: existing, created: false };
    }
    if (this.ledger.isKillSwitchActive()) return { ok: false, code: 'kill_switch', reason: 'kill switch active' };
    const toApply: { scopeId: string; amountMinor: number }[] = [];
    for (const s of input.scopes) {
      const scope = this.ledger._getMutable(s.scopeId);
      if (!scope) return { ok: false, code: 'scope_not_found', reason: 'scope ' + s.scopeId + ' not found' };
      if (scope.spentMinor + scope.reservedMinor + s.amountMinor > scope.limitMinor) {
        return { ok: false, code: 'cap_exceeded', reason: 'scope ' + s.scopeId + ' would exceed limit: ' + scope.spentMinor + '+' + scope.reservedMinor + '+' + s.amountMinor + '>' + scope.limitMinor };
      }
      toApply.push(s);
    }
    if (input.generationUnitId) {
      const unit = this.ledger.getGenerationUnit(input.generationUnitId);
      if (!unit) return { ok: false, code: 'unit_not_found', reason: 'unit ' + input.generationUnitId + ' not found' };
      const spent = this.ledger.spentForUnit(unit.id);
      const reserved = this.ledger.reservedForUnit(unit.id);
      const unitAmount = Math.max(...toApply.map(s => s.amountMinor), 0);
      if (spent + reserved + unitAmount > unit.capMinor) {
        return { ok: false, code: 'unit_cap_exceeded', reason: 'unit ' + unit.id + ' would exceed cap C=' + unit.capMinor + ' (B=' + unit.baselineMinor + ' R=' + unit.reserveMinor + ' spent=' + spent + ' reserved=' + reserved + ' +new=' + unitAmount + ')' };
      }
    }
    for (const s of toApply) {
      const scope = this.ledger._getMutable(s.scopeId)!;
      scope.reservedMinor += s.amountMinor;
    }
    const r: Reservation = {
      id: 'res_' + input.operationId,
      operationId: input.operationId,
      generationUnitId: input.generationUnitId ?? null,
      scopes: toApply.map(s => ({ ...s })),
      state: 'held',
      pricingVersion: input.pricingVersion,
      createdAt: new Date().toISOString(),
    };
    this.ledger._putReservation(r);
    const unitAmount2 = Math.max(...toApply.map(s => s.amountMinor), 0);
    this.ledger.appendEntry({
      operationId: input.operationId,
      generationUnitId: input.generationUnitId ?? null,
      attempt: 1,
      pricingVersion: input.pricingVersion,
      billedMinor: unitAmount2,
      status: 'pending',
      generatedSeconds: null,
      usedSeconds: null,
      createdAt: new Date().toISOString(),
    });
    const check = this.ledger.checkCaps();
    if (!check.ok) {
      for (const s of toApply) {
        const scope = this.ledger._getMutable(s.scopeId)!;
        scope.reservedMinor -= s.amountMinor;
      }
      return { ok: false, code: 'invariant_violation', reason: check.violations.join('; ') };
    }
    return { ok: true, reservation: { ...r, scopes: r.scopes.map(s => ({ ...s })) }, created: true };
  }
  // commit: move reserved -> spent, append confirmed + corrected if delta
  commit(operationId: string, actualBilledMinor: number, opts?: { pricingVersion?: string; generatedSeconds?: number | null; usedSeconds?: number | null }): ReserveResult {
    const r = this.ledger._getResMutable(operationId);
    if (!r) return { ok: false, code: 'not_found', reason: 'no reservation for ' + operationId };
    if (r.state !== 'held') return { ok: false, code: 'state_conflict', reason: 'reservation ' + r.state };
    if (!Number.isInteger(actualBilledMinor) || actualBilledMinor < 0) return { ok: false, code: 'bad_request', reason: 'actualBilledMinor integer >=0' };
    const unitAmount = Math.max(...r.scopes.map(s => s.amountMinor), 0);
    for (const s of r.scopes) {
      const scope = this.ledger._getMutable(s.scopeId)!;
      scope.reservedMinor -= s.amountMinor;
      scope.spentMinor += actualBilledMinor;
    }
    r.state = 'settled';
    r.settledBilledMinor = actualBilledMinor;
    if (opts?.pricingVersion) r.pricingVersion = opts.pricingVersion;
    const pendings = this.ledger.entriesByOperation(operationId).filter(e => e.status === 'pending');
    this.ledger.appendEntry({
      operationId,
      generationUnitId: r.generationUnitId,
      attempt: pendings.length + 1,
      pricingVersion: opts?.pricingVersion ?? r.pricingVersion,
      billedMinor: actualBilledMinor,
      status: 'confirmed',
      generatedSeconds: opts?.generatedSeconds ?? null,
      usedSeconds: opts?.usedSeconds ?? null,
      createdAt: new Date().toISOString(),
    });
    if (actualBilledMinor !== unitAmount) {
      this.ledger.appendEntry({
        operationId,
        generationUnitId: r.generationUnitId,
        attempt: pendings.length + 2,
        pricingVersion: opts?.pricingVersion ?? r.pricingVersion,
        billedMinor: actualBilledMinor - unitAmount,
        status: 'corrected',
        generatedSeconds: null,
        usedSeconds: null,
        createdAt: new Date().toISOString(),
      });
    }
    return { ok: true, reservation: { ...r, scopes: r.scopes.map(s => ({ ...s })) }, created: false };
  }
  release(operationId: string): ReserveResult {
    const r = this.ledger._getResMutable(operationId);
    if (!r) return { ok: false, code: 'not_found', reason: 'no reservation' };
    if (r.state !== 'held') return { ok: false, code: 'state_conflict', reason: 'reservation ' + r.state };
    for (const s of r.scopes) {
      const scope = this.ledger._getMutable(s.scopeId)!;
      scope.reservedMinor -= s.amountMinor;
      if (scope.reservedMinor < 0) scope.reservedMinor = 0;
    }
    r.state = 'released';
    return { ok: true, reservation: { ...r, scopes: r.scopes.map(s => ({ ...s })) }, created: false };
  }
  reconcile(operationId: string, provider: { status: 'succeeded' | 'failed' | 'running' | 'not_found' | 'unknown'; billedMinor?: number | null }): ReserveResult {
    const r = this.ledger._getResMutable(operationId);
    if (!r) return { ok: false, code: 'not_found', reason: 'no reservation' };
    if (provider.status === 'succeeded') {
      const billed = provider.billedMinor;
      if (billed == null) return { ok: false, code: 'unknown_billed', reason: 'provider succeeded but billed unknown -- keep pending' };
      return this.commit(operationId, billed);
    }
    if (provider.status === 'failed' || provider.status === 'not_found') return this.release(operationId);
    return { ok: true, reservation: { ...r, scopes: r.scopes.map(s => ({ ...s })) }, created: false };
  }
  setKillSwitch(active: boolean): void { this.ledger.setKillSwitch(active); }
}


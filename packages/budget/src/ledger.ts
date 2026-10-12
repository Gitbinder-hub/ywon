// Ledger — in-memory authoritative store (offline prototype, Postgres in 003)
import type { BudgetScopeState, Reservation, CostEntry, GenerationUnit, LedgerSnapshot, Currency } from './types.ts';
import { RESERVE_PERCENT_DEFAULT } from './types.ts';
export function calcReserveMinor(b: number, p: number): number {
  if (b < 0) throw new Error('baseline negative');
  if (p < 0 || p > 100) throw new Error('percent out of range');
  return Math.round((b * p) / 100);
}
export function calcCapMinor(b: number, r: number): number { return b + r; }
export function createGenerationUnit(i: { id: string; baselineMinor: number; reservePercent?: number; currency?: Currency; pricingVersion: string }): GenerationUnit {
  if (!i.id) throw new Error('id required');
  if (i.baselineMinor < 0) throw new Error('baseline negative');
  const pct = i.reservePercent ?? RESERVE_PERCENT_DEFAULT;
  const r = calcReserveMinor(i.baselineMinor, pct);
  return { id: i.id, baselineMinor: i.baselineMinor, reservePercent: pct, reserveMinor: r, capMinor: calcCapMinor(i.baselineMinor, r), currency: (i.currency ?? 'USD') as Currency, pricingVersion: i.pricingVersion, createdAt: new Date().toISOString() };
}
export function computeWasteRatio(g: number | null, u: number | null): number | null {
  if (g == null || u == null) return null;
  if (u === 0) return null;
  if (g < 0 || u < 0) throw new Error('negative');
  return g / u;
}
export class BudgetLedger {
  private scopes = new Map<string, BudgetScopeState>();
  private units = new Map<string, GenerationUnit>();
  private reservations = new Map<string, Reservation>();
  private entries: CostEntry[] = [];
  private killSwitch = false;
  createScope(i: { scopeId: string; limitMinor: number; currency?: Currency; pricingVersion?: string | null }): BudgetScopeState {
    if (!i.scopeId) throw new Error('scopeId required');
    if (i.limitMinor < 0) throw new Error('limit negative');
    if (this.scopes.has(i.scopeId)) throw new Error('scope exists');
    const s: BudgetScopeState = { scopeId: i.scopeId, limitMinor: i.limitMinor, spentMinor: 0, reservedMinor: 0, currency: (i.currency ?? 'USD') as Currency, pricingVersion: i.pricingVersion ?? null };
    this.scopes.set(i.scopeId, s); return { ...s };
  }
  getScope(id: string): BudgetScopeState | null { const s = this.scopes.get(id); return s ? { ...s } : null; }
  listScopes(): BudgetScopeState[] { return [...this.scopes.values()].map(s => ({ ...s })); }
  _getMutable(id: string): BudgetScopeState | undefined { return this.scopes.get(id); }
  putGenerationUnit(u: GenerationUnit): void { if (this.units.has(u.id)) throw new Error('unit exists'); this.units.set(u.id, { ...u }); }
  getGenerationUnit(id: string): GenerationUnit | null { const u = this.units.get(id); return u ? { ...u } : null; }
  getReservationByOperation(op: string): Reservation | null { const r = this.reservations.get(op); return r ? { ...r, scopes: r.scopes.map(s => ({ ...s })) } : null; }
  _putReservation(r: Reservation): void { this.reservations.set(r.operationId, r); }
  _getResMutable(op: string): Reservation | undefined { return this.reservations.get(op); }
  listReservations(): Reservation[] { return [...this.reservations.values()].map(r => ({ ...r, scopes: r.scopes.map(s => ({ ...s })) })); }
  reservedForUnit(unitId: string): number { let sum = 0; for (const r of this.reservations.values()) if (r.generationUnitId === unitId && r.state === 'held') { const mx = Math.max(...r.scopes.map(s => s.amountMinor), 0); sum += mx; } return sum; }
  spentForUnit(unitId: string): number { let sum = 0; for (const e of this.entries) if (e.generationUnitId === unitId && e.status === 'confirmed') sum += e.billedMinor ?? 0; return sum; }
  pendingForUnit(unitId: string): number { let sum = 0; for (const e of this.entries) if (e.generationUnitId === unitId && e.status === 'pending') sum += e.billedMinor ?? 0; return sum; }
  appendEntry(e: CostEntry): CostEntry { this.entries.push({ ...e }); return { ...e }; }
  listEntries(): CostEntry[] { return this.entries.map(e => ({ ...e })); }
  entriesByOperation(op: string): CostEntry[] { return this.entries.filter(e => e.operationId === op).map(e => ({ ...e })); }
  setKillSwitch(v: boolean): void { this.killSwitch = v; }
  isKillSwitchActive(): boolean { return this.killSwitch; }
  snapshot(): LedgerSnapshot { const scopes: Record<string, BudgetScopeState> = {}; for (const [k, v] of this.scopes) scopes[k] = { ...v }; return { scopes, reservations: this.listReservations(), entries: this.listEntries() }; }
  checkCaps(): { ok: boolean; violations: string[] } {
    const v: string[] = [];
    for (const s of this.scopes.values()) { if (s.spentMinor + s.reservedMinor > s.limitMinor) v.push('scope ' + s.scopeId + ' overspend: ' + s.spentMinor + '+' + s.reservedMinor + '>' + s.limitMinor); if (s.spentMinor < 0 || s.reservedMinor < 0) v.push('scope ' + s.scopeId + ' negative'); }
    for (const u of this.units.values()) { const spent = this.spentForUnit(u.id); const reserved = this.reservedForUnit(u.id); if (spent + reserved > u.capMinor) v.push('unit ' + u.id + ' cap exceeded: spent ' + spent + '+reserved ' + reserved + '>cap ' + u.capMinor + ' (B=' + u.baselineMinor + ' R=' + u.reserveMinor + ')'); }
    return { ok: v.length === 0, violations: v };
  }
}

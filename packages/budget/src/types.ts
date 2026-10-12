export const MINOR_PER_MAJOR = 100;
export type Currency = 'USD';

export type ReservationState = 'held' | 'settled' | 'released';

export interface BudgetScopeState {
  scopeId: string;
  limitMinor: number;
  spentMinor: number;
  reservedMinor: number;
  currency: Currency;
  pricingVersion: string | null;
}

export interface Reservation {
  id: string;
  operationId: string;
  generationUnitId: string | null;
  scopes: { scopeId: string; amountMinor: number }[];
  state: ReservationState;
  pricingVersion: string;
  createdAt: string;
  settledBilledMinor?: number;
}

export interface CostEntry {
  operationId: string;
  generationUnitId: string | null;
  attempt: number;
  pricingVersion: string;
  billedMinor: number | null;
  status: 'estimate' | 'pending' | 'confirmed' | 'corrected';
  generatedSeconds: number | null;
  usedSeconds: number | null;
  createdAt: string;
}

export interface GenerationUnit {
  id: string;
  baselineMinor: number; // B
  reservePercent: number; // r
  reserveMinor: number; // R = round(B*r/100)
  capMinor: number; // C = B+R
  currency: Currency;
  pricingVersion: string;
  createdAt: string;
}

export interface LedgerSnapshot {
  scopes: Record<string, BudgetScopeState>;
  reservations: Reservation[];
  entries: CostEntry[];
}

export const RESERVE_PERCENT_DEFAULT = 20;

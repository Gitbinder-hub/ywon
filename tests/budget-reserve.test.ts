import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BudgetLedger, calcReserveMinor, createGenerationUnit, computeWasteRatio } from '../packages/budget/src/ledger.ts';
import { BudgetReserveService } from '../packages/budget/src/reserve.ts';

function freshLedger() {
  const ledger = new BudgetLedger();
  ledger.createScope({ scopeId: 'project:A', limitMinor: 1000 });
  ledger.createScope({ scopeId: 'month:2026-10', limitMinor: 500 });
  return ledger;
}

test('20% reserve hold + cap frozen B/R/C + exactly C allowed, C+1 denied', () => {
  const ledger = freshLedger();
  const unit = createGenerationUnit({ id: 'unit-1', baselineMinor: 200, reservePercent: 20, pricingVersion: 'p1' });
  assert.equal(unit.reserveMinor, 40);
  assert.equal(unit.capMinor, 240);
  ledger.putGenerationUnit(unit);
  const svc = new BudgetReserveService(ledger);
  const r1 = svc.reserve({ operationId: 'op-c1', generationUnitId: unit.id, scopes: [{ scopeId: 'project:A', amountMinor: 120 }], pricingVersion: 'p1' });
  assert.equal(r1.ok, true);
  const r2 = svc.reserve({ operationId: 'op-c2', generationUnitId: unit.id, scopes: [{ scopeId: 'project:A', amountMinor: 120 }], pricingVersion: 'p1' });
  assert.equal(r2.ok, true);
  const r3 = svc.reserve({ operationId: 'op-c3', generationUnitId: unit.id, scopes: [{ scopeId: 'project:A', amountMinor: 1 }], pricingVersion: 'p1' });
  assert.equal(r3.ok, false);
  if (!r3.ok) assert.match(r3.reason, /cap/);
});

test('atomic scope reservations — parallel overspend denied, no partial apply', () => {
  const ledger = freshLedger();
  const svc = new BudgetReserveService(ledger);
  const a = svc.reserve({ operationId: 'op-a', scopes: [{ scopeId: 'project:A', amountMinor: 400 }, { scopeId: 'month:2026-10', amountMinor: 400 }], pricingVersion: 'p1' });
  assert.equal(a.ok, true);
  const b = svc.reserve({ operationId: 'op-b', scopes: [{ scopeId: 'project:A', amountMinor: 200 }, { scopeId: 'month:2026-10', amountMinor: 200 }], pricingVersion: 'p1' });
  assert.equal(b.ok, false);
  if (!b.ok) assert.equal(b.code, 'cap_exceeded');
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 400);
  assert.equal(ledger.getScope('month:2026-10')!.reservedMinor, 400);
});

test('pending->commit correction + release on cancel; pending liability kept append-only', () => {
  const ledger = freshLedger();
  const svc = new BudgetReserveService(ledger);
  const r = svc.reserve({ operationId: 'op-p', scopes: [{ scopeId: 'project:A', amountMinor: 100 }], pricingVersion: 'p1' });
  assert.equal(r.ok, true);
  assert.equal(ledger.entriesByOperation('op-p').length, 1);
  assert.equal(ledger.entriesByOperation('op-p')[0]!.status, 'pending');
  const c = svc.commit('op-p', 80);
  assert.equal(c.ok, true);
  const entries = ledger.entriesByOperation('op-p');
  assert.equal(entries.filter(e => e.status === 'confirmed').length, 1);
  assert.equal(entries.filter(e => e.status === 'corrected').length, 1);
  assert.equal(entries.find(e => e.status === 'corrected')!.billedMinor, -20);
  assert.equal(ledger.getScope('project:A')!.spentMinor, 80);
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 0);
  const r2 = svc.reserve({ operationId: 'op-r', scopes: [{ scopeId: 'project:A', amountMinor: 50 }], pricingVersion: 'p1' });
  assert.equal(r2.ok, true);
  const rel = svc.release('op-r');
  assert.equal(rel.ok, true);
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 0);
  assert.ok(ledger.entriesByOperation('op-r').some(e => e.status === 'pending'));
});

test('idempotency — same operationId does not double-spend', () => {
  const ledger = freshLedger();
  const svc = new BudgetReserveService(ledger);
  const first = svc.reserve({ operationId: 'op-idem', scopes: [{ scopeId: 'project:A', amountMinor: 100 }], pricingVersion: 'p1' });
  assert.equal(first.ok, true);
  if (first.ok) assert.equal(first.created, true);
  const second = svc.reserve({ operationId: 'op-idem', scopes: [{ scopeId: 'project:A', amountMinor: 100 }], pricingVersion: 'p1' });
  assert.equal(second.ok, true);
  if (second.ok) assert.equal(second.created, false);
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 100);
  assert.equal(ledger.listReservations().length, 1);
  assert.equal(ledger.listEntries().filter(e => e.operationId === 'op-idem' && e.status === 'pending').length, 1);
});

test('reconcile unknown — never zero, stays pending/reserved without provider evidence', () => {
  const ledger = freshLedger();
  const svc = new BudgetReserveService(ledger);
  svc.reserve({ operationId: 'op-unk', scopes: [{ scopeId: 'project:A', amountMinor: 60 }], pricingVersion: 'p1' });
  const stay = svc.reconcile('op-unk', { status: 'unknown' });
  assert.equal(stay.ok, true);
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 60);
  assert.ok(ledger.entriesByOperation('op-unk').some(e => e.status === 'pending'));
  const run = svc.reconcile('op-unk', { status: 'running' });
  assert.equal(run.ok, true);
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 60);
  const done = svc.reconcile('op-unk', { status: 'succeeded', billedMinor: 60 });
  assert.equal(done.ok, true);
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 0);
  assert.equal(ledger.getScope('project:A')!.spentMinor, 60);
  svc.reserve({ operationId: 'op-unk2', scopes: [{ scopeId: 'project:A', amountMinor: 30 }], pricingVersion: 'p1' });
  const unk2 = svc.reconcile('op-unk2', { status: 'succeeded', billedMinor: null });
  assert.equal(unk2.ok, false);
  if (!unk2.ok) assert.equal(unk2.code, 'unknown_billed');
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 30);
});

test('estimate/pending/confirmed/corrected + pricing versions + waste kept not 0', () => {
  assert.equal(computeWasteRatio(100, 0), null);
  assert.equal(computeWasteRatio(100, null), null);
  assert.equal(computeWasteRatio(100, 50), 2);
  const ledger = freshLedger();
  const svc = new BudgetReserveService(ledger);
  svc.reserve({ operationId: 'op-price', scopes: [{ scopeId: 'project:A', amountMinor: 20 }], pricingVersion: 'v1' });
  svc.commit('op-price', 20, { pricingVersion: 'v2' });
  const confirmed = ledger.entriesByOperation('op-price').find(e => e.status === 'confirmed')!;
  assert.equal(confirmed.pricingVersion, 'v2');
  assert.equal(ledger.getReservationByOperation('op-price')!.pricingVersion, 'v2');
  assert.equal(computeWasteRatio(confirmed.generatedSeconds, confirmed.usedSeconds), null);
});

test('operation/attempt changes do not reset limits; B=0 requires approval', () => {
  const ledger = freshLedger();
  const unit0 = createGenerationUnit({ id: 'unit-zero', baselineMinor: 0, reservePercent: 20, pricingVersion: 'p1' });
  assert.equal(unit0.capMinor, 0);
  ledger.putGenerationUnit(unit0);
  const svc = new BudgetReserveService(ledger);
  const z = svc.reserve({ operationId: 'op-zero', generationUnitId: unit0.id, scopes: [{ scopeId: 'project:A', amountMinor: 1 }], pricingVersion: 'p1' });
  assert.equal(z.ok, false);
  const unit = createGenerationUnit({ id: 'unit-n', baselineMinor: 100, reservePercent: 20, pricingVersion: 'p1' });
  ledger.putGenerationUnit(unit);
  const a = svc.reserve({ operationId: 'op-n1', generationUnitId: unit.id, scopes: [{ scopeId: 'project:A', amountMinor: 60 }], pricingVersion: 'p1' });
  assert.equal(a.ok, true);
  const b = svc.reserve({ operationId: 'op-n2', generationUnitId: unit.id, scopes: [{ scopeId: 'project:A', amountMinor: 60 }], pricingVersion: 'p1' });
  assert.equal(b.ok, true);
  const c = svc.reserve({ operationId: 'op-n3', generationUnitId: unit.id, scopes: [{ scopeId: 'project:A', amountMinor: 1 }], pricingVersion: 'p1' });
  assert.equal(c.ok, false);
});

test('single authoritative ledger across runtimes; kill switch outside agent denies new paid work', () => {
  const ledger = freshLedger();
  const svcA = new BudgetReserveService(ledger);
  svcA.reserve({ operationId: 'op-shared', scopes: [{ scopeId: 'project:A', amountMinor: 100 }], pricingVersion: 'p1' });
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 100);
  ledger.setKillSwitch(true);
  const denied = svcA.reserve({ operationId: 'op-denied', scopes: [{ scopeId: 'project:A', amountMinor: 10 }], pricingVersion: 'p1' });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.code, 'kill_switch');
  const stillReconcile = svcA.reconcile('op-shared', { status: 'failed' });
  assert.equal(stillReconcile.ok, true);
});

test('concurrent reserve fencing simulation — sequential atomicity prevents overspend', () => {
  const ledger = freshLedger();
  const svc = new BudgetReserveService(ledger);
  const results = [];
  for (let i = 0; i < 11; i++) results.push(svc.reserve({ operationId: 'op-conc-' + i, scopes: [{ scopeId: 'project:A', amountMinor: 100 }], pricingVersion: 'p1' }));
  const oks = results.filter(r => r.ok).length;
  assert.equal(oks, 10);
  assert.equal(ledger.getScope('project:A')!.reservedMinor, 1000);
  assert.equal(ledger.checkCaps().ok, true);
});

test('migration 003 budget ledger present + decimal/minor units', () => {
  const sql = readFileSync('infra/migrations/003_budget_ledger.sql', 'utf8');
  assert.ok(sql.includes('budget_scopes'));
  assert.ok(sql.includes('generation_units'));
  assert.ok(sql.includes('budget_reservations'));
  assert.ok(sql.includes('cost_ledger'));
  assert.ok(sql.includes('spent_minor + reserved_minor <= limit_minor'));
  assert.ok(sql.includes('UNIQUE'));
  const ledger = freshLedger();
  const svc = new BudgetReserveService(ledger);
  svc.reserve({ operationId: 'op-dec', scopes: [{ scopeId: 'project:A', amountMinor: 199 }], pricingVersion: 'p1' });
  svc.commit('op-dec', 199);
  assert.equal(ledger.getScope('project:A')!.spentMinor, 199);
  assert.equal(calcReserveMinor(199, 20), 40);
});


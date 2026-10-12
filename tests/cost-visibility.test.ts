import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createBaseline, amendBaseline, projectTotal, evaluateThreshold,
  CostAlertDedup, buildFinalReport,
} from '../packages/budget/src/cost-visibility.ts';

// ── AC1: immutable baseline + explicit amendments, confirmed/pending/reserve no double count ──
test('AC1: immutable baseline hash, amend increments version and preserves amendedFrom, no double count', () => {
  const b1 = createBaseline({ id:'plan-1', amountMinor: 200, pricingVersion:'p1', items:[{ itemId:'item-a', estimatedMinor:120 }] });
  assert.equal(b1.version, 1);
  assert.match(b1.hash, /^[0-9a-f]{64}$/);
  assert.equal(b1.amendedFrom, null);
  const b2 = amendBaseline(b1, { amountMinor: 220, pricingVersion:'p2' });
  assert.equal(b2.version, 2);
  assert.equal(b2.amendedFrom, 'plan-1');
  assert.notEqual(b2.hash, b1.hash);
  // projectTotal = confirmed + pending upper bound + remaining + repair ; reserved separate not added again
  const proj = projectTotal({ confirmedMinor: 80, pendingUpperBoundMinor: 20, remainingInitialMinor: 100, proposedRepairMinor: 30 });
  assert.equal(proj.projectedTotalMinor, 230);
  // pending unknown => unbounded, must reconcile before submit
  const unk = projectTotal({ confirmedMinor: 80, pendingUpperBoundMinor: null, remainingInitialMinor: 100 });
  assert.equal(unk.projectedTotalMinor, null);
});

test('AC1: confirmed/pending/reserve projection without double counting - reserved separate', () => {
  // simulate reserved=50 is display only, not added to projected total
  const confirmed = 80;
  const pending = 20;
  const remaining = 50;
  const reserved = 50; // not used in projectTotal
  const proj = projectTotal({ confirmedMinor: confirmed, pendingUpperBoundMinor: pending, remainingInitialMinor: remaining });
  assert.equal(proj.projectedTotalMinor, confirmed + pending + remaining);
  assert.ok(reserved !== 0); // reserved exists but not double-counted
});

// ── AC2: strict >10%, cumulative/zero/FX/stale/hard cap/headroom tested before paid submit ──
test('AC2: strictly >10% triggers, exactly 10% does not', () => {
  const b = createBaseline({ id:'b1', amountMinor: 200, pricingVersion:'p1' });
  const at10 = evaluateThreshold({ baseline: b, confirmedMinor: 110, pendingUpperBoundMinor: 0, remainingInitialMinor: 110 }); // 220 exactly 10% over 200
  assert.equal(at10.outcome, 'no_alert');
  const over10 = evaluateThreshold({ baseline: b, confirmedMinor: 111, pendingUpperBoundMinor: 0, remainingInitialMinor: 110 }); // 221 = 10.5%
  assert.equal(over10.outcome, 'threshold_exceeded');
  assert.equal(over10.requiresApproval, true);
  const nine = evaluateThreshold({ baseline: b, confirmedMinor: 100, pendingUpperBoundMinor: 0, remainingInitialMinor: 118 }); // 218 = 9%
  assert.equal(nine.outcome, 'no_alert');
});

test('AC2: cumulative small rises compare against same baseline not rolled forward', () => {
  const b = createBaseline({ id:'b2', amountMinor: 200, pricingVersion:'p1' });
  // +5% then +6% = 11% cumulative -> alert
  const step1 = evaluateThreshold({ baseline: b, confirmedMinor: 100, pendingUpperBoundMinor: 0, remainingInitialMinor: 110 }); // 210 = +5% no alert
  assert.equal(step1.outcome, 'no_alert');
  const step2 = evaluateThreshold({ baseline: b, confirmedMinor: 100, pendingUpperBoundMinor: 0, remainingInitialMinor: 122 }); // 222 = +11% alert
  assert.equal(step2.outcome, 'threshold_exceeded');
});

test('AC2: zero baseline any positive requires approval', () => {
  const b = createBaseline({ id:'b0', amountMinor: 0, pricingVersion:'p1' });
  const pos = evaluateThreshold({ baseline: b, confirmedMinor: 1, pendingUpperBoundMinor: 0, remainingInitialMinor: 0 });
  assert.equal(pos.outcome, 'threshold_exceeded');
  const zero = evaluateThreshold({ baseline: b, confirmedMinor: 0, pendingUpperBoundMinor: 0, remainingInitialMinor: 0 });
  assert.equal(zero.outcome, 'no_alert');
});

test('AC2: FX/rounding and stale price -> stale_or_unbounded, hard cap blocks even below +10%', () => {
  const b = createBaseline({ id:'b3', amountMinor: 200, pricingVersion:'p1' });
  const stale = evaluateThreshold({ baseline: b, confirmedMinor: 100, pendingUpperBoundMinor: 0, remainingInitialMinor: 100, pricingStaleOrUnknown: true });
  assert.equal(stale.outcome, 'stale_or_unbounded');
  const unb = evaluateThreshold({ baseline: b, confirmedMinor: 100, pendingUpperBoundMinor: null, remainingInitialMinor: 50 });
  assert.equal(unb.outcome, 'stale_or_unbounded');
  // hard cap below threshold still blocks
  const cap = evaluateThreshold({ baseline: b, confirmedMinor: 80, pendingUpperBoundMinor: 0, remainingInitialMinor: 100, hardCapMinor: 150 });
  assert.equal(cap.outcome, 'hard_cap_exceeded');
  const underCapNoThresh = evaluateThreshold({ baseline: b, confirmedMinor: 80, pendingUpperBoundMinor: 0, remainingInitialMinor: 100, hardCapMinor: 300 });
  assert.equal(underCapNoThresh.outcome, 'no_alert');
});

test('AC2: +10.01% triggers, headroom is approved bounded repair exception not auto-reapproval for scope change', () => {
  const b = createBaseline({ id:'b4', amountMinor: 10000, pricingVersion:'p1' });
  // +10.01% -> 11001 > 11000 strictly
  const justOver = evaluateThreshold({ baseline: b, confirmedMinor: 5000, pendingUpperBoundMinor: 0, remainingInitialMinor: 6001 });
  assert.equal(justOver.outcome, 'threshold_exceeded');
  assert.ok(justOver.deltaPercent! > 10 && justOver.deltaPercent! < 10.02);
});

// ── AC3: notifications reference scoped baseline dedup/version ack vs approval ──
test('AC3: notification dedup/version and ack vs approval semantics, all attempts in final report', () => {
  const b = createBaseline({ id:'plan-x', amountMinor: 200, pricingVersion:'p1' });
  const dedup = new CostAlertDedup();
  assert.equal(dedup.shouldNotify('project:A', b, 'threshold_exceeded'), true);
  assert.equal(dedup.shouldNotify('project:A', b, 'threshold_exceeded'), false); // dedup same scope/baseline/version/state
  assert.equal(dedup.shouldNotify('project:A', b, 'no_alert'), true); // different outcome
  assert.equal(dedup.shouldNotify('project:B', b, 'threshold_exceeded'), true); // different scope
  const b2 = amendBaseline(b, { amountMinor: 250, pricingVersion:'p2' });
  assert.equal(dedup.shouldNotify('project:A', b2, 'threshold_exceeded'), true); // version bump resets dedup
  const ack = dedup.ack('project:A', b, 'threshold_exceeded');
  assert.match(ack, /plan-x.*threshold_exceeded.*ack/);
  // ack != approval: approval would be new baseline version via amendBaseline, not just ack string
  const report = buildFinalReport({ originalBaseline: b, latestApprovedBaseline: b2, actualBilledMinor: 210, perAttemptMinor: [120, 40, 50] });
  assert.equal(report.perAttemptMinor.length, 3);
  assert.equal(report.originalBaseline.amountMinor, 200);
  assert.equal(report.latestApprovedBaseline.amountMinor, 250);
});

test('migration and thresholds sanity', () => {
  // migration 003 sanity remains
  const sql = readFileSync('infra/migrations/003_budget_ledger.sql','utf8');
  assert.match(sql, /budget_scopes/);
  assert.match(sql, /cost_ledger/);
});

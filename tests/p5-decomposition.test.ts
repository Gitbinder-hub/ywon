import test from 'node:test';
import assert from 'node:assert/strict';
import { decompose, verifyGateDepends, claimWithLimits } from '../packages/p5-decomposition/src/index.ts';

test('AC1: bounded tasks/evals with feature links and DAG', () => {
  const d=decompose();
  assert.ok(d.tasks.length>0);
  assert.ok(d.tasks.every(t=>t.featureId && t.budgetMinor>0 && t.rightsChecked));
  assert.ok(d.tasks.some(t=>t.dependsOn.length>0)); // DAG
});

test('AC2: Q-030G depends on implemented tasks not just planning', () => {
  const d=decompose();
  assert.equal(verifyGateDepends(d.gateDependsOn, d.tasks.map(t=>t.id)), true);
  assert.equal(verifyGateDepends([], ['Q-025-1']), false);
});

test('AC3: each claim has limits and verification', () => {
  assert.equal(claimWithLimits('orbit 60fps','geometry required', true), true);
  assert.equal(claimWithLimits('orbit','', true), false);
  assert.equal(claimWithLimits('','limits', true), false);
  assert.equal(claimWithLimits('claim','limits', false), false);
});

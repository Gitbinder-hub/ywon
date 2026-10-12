import test from 'node:test';
import assert from 'node:assert/strict';
import { preregister, recordOutcome, proposeStrategyChange, testedOnKnownDataset } from '../packages/experiments/src/index.ts';

test('AC1: pre-register design/sample/window/metric/cost/stop', () => {
  assert.equal(preregister({ id:'e1', samplePlan:'N=100', window:'7d', primaryMetric:'ctr', costMinor:100, stopRule:'fail after 2', preregistered:true }).ok, true);
  assert.equal(preregister({ id:'e2', samplePlan:'', window:'', primaryMetric:'', costMinor:0, stopRule:'', preregistered:true }).ok, false);
  assert.equal(preregister({ id:'e3', samplePlan:'x', window:'7d', primaryMetric:'ctr', costMinor:10, stopRule:'s', preregistered:false }).ok, false);
});

test('AC2: win/loss/inconclusive/invalid supported; no forced success', () => {
  preregister({ id:'e4', samplePlan:'s', window:'7d', primaryMetric:'ctr', costMinor:10, stopRule:'s', preregistered:true });
  assert.equal(recordOutcome('e4','win').ok, true);
  assert.equal(recordOutcome('e4','loss').ok, true);
  assert.equal(recordOutcome('e4','inconclusive').ok, true);
  assert.equal(recordOutcome('e4','invalid').ok, true);
  assert.equal(recordOutcome('not-registered','win').ok, false);
});

test('AC3: strategy proposed to owner; tested on known datasets separately', () => {
  const p=proposeStrategyChange('change recipe threshold');
  assert.equal(p.proposedToOwner, true);
  assert.equal(testedOnKnownDataset('e4','known-ds-1'), true);
  assert.equal(testedOnKnownDataset('e4',''), false);
});

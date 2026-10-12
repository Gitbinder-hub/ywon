import test from 'node:test';
import assert from 'node:assert/strict';
import { recordEpisode, aggregate, recordIncident, rootCauses, thresholdWithUncertainty, criticalResolved, formatReport } from '../packages/episode-eval/src/index.ts';

test('AC1: diverse real episodes without cherry-picking, all QA/cost/human pinned', () => {
  recordEpisode({ id:'ep1', qaOk:true, costMinor:50, humanMinutes:3, evidenceHash:'a'.repeat(64), attemptCount:1 });
  recordEpisode({ id:'ep2', qaOk:false, costMinor:80, humanMinutes:5, evidenceHash:'b'.repeat(64), attemptCount:2, failed:true, rootCause:'qa-motion-drift' });
  recordEpisode({ id:'ep3', qaOk:true, costMinor:40, humanMinutes:2, evidenceHash:'c'.repeat(64), attemptCount:1 });
  const a=aggregate();
  assert.equal(a.total, 3); assert.equal(a.failed, 1); assert.equal(a.allEvidencePinned, true);
  assert.ok(a.totalHumanMin>=0);
});

test('AC2: root causes/repair cost and threshold with uncertainty', () => {
  const rc=rootCauses();
  assert.ok(rc.some(x=>x.cause==='qa-motion-drift'));
  const t=thresholdWithUncertainty();
  assert.equal(t.decision, 'rework'); assert.match(t.uncertainty, /failures/);
  assert.match(formatReport(), /total:3/);
});

test('AC3: critical budget/privacy/publish incidents separate and resolved before expansion', () => {
  recordIncident('budget','over-cap retry blocked', true);
  recordIncident('privacy','no cross-tenant leak', true);
  recordIncident('publish','manual package only', true);
  assert.equal(criticalResolved(), true);
  recordIncident('budget','pending invoice unknown', false);
  assert.equal(criticalResolved(), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-b-roll-planning-holdout-2026-10-11.json');
test('canary b-roll-planning 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('b-roll-planning', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { script_beats: ['beat1','beat2'], available_stock_ids: ['stock1'], allow_generation: true }, expectedOutcome: 'supported' as const, reason: 'plan_ready' },
    { id: 'c2', input: { script_beats: [], allow_generation: true }, expectedOutcome: 'unsupported' as const, reason: 'no_source_for_protected_entity / empty beats' },
    { id: 'c3', input: { script_beats: ['beat1'], available_stock_ids: [], allow_generation: false }, expectedOutcome: 'degraded' as const, reason: 'placeholder_for_uncovered_beat' },
    { id: 'c4', input: { script_beats: ['beat1','beat2','beat3'], available_stock_ids: ['stock1'], allow_generation: true }, expectedOutcome: 'supported' as const, reason: 'plan_ready multi' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 50 };
  const mech = lab.addMechanicalEval('b-roll-planning', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);
  const realBudget = { approved: true, approvedMinor: 4000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('b-roll-planning', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('b-roll-planning','1.0.0'), true);
  const canary = lab.promoteToCanary('b-roll-planning','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) { assert.equal(canary.canary.scope, 'small'); assert.equal(canary.canary.active, true); }
  assert.equal(lab.activate('b-roll-planning','1.0.0', false).ok, false);
  assert.equal(lab.get('b-roll-planning','1.0.0')?.stage, 'canary');
  const lab2 = new SkillLab();
  lab2.registerDraft('b-roll-planning','1.0.1');
  lab2.addMechanicalEval('b-roll-planning','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 20 });
  lab2.addRealEval('b-roll-planning','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 20 }, null);
  lab2.promoteToCanary('b-roll-planning','1.0.1');
  lab2.activate('b-roll-planning','1.0.1', true);
  const rb = lab2.rollback('b-roll-planning','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({ skillId: 'b-roll-planning', version: '1.0.0', labStage: 'canary', scope: 'small', holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' }, mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash }, real: { outcome: real.outcome, budgetApproved: true, approvedMinor: 4000, reportHash: real.reportHash }, canary: canary.ok ? canary.canary : null, rollbackProof: { previousStage: 'active', billedRefund: false }, gateNote: 'draft→canary→active only via evidence/approval; rights gate synthetic_testimonial_as_stock forbidden', at: new Date().toISOString() }, null, 2), 'utf8');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-video-shorts-holdout-2026-10-11.json');

test('canary video-shorts 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('video-shorts', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { hook: 'Hook text', voice: 'neutral', durationSec: 30, source_material_ids: ['mat1'] }, expectedOutcome: 'supported' as const, reason: 'duration_ok + hook_present + source_sufficient' },
    { id: 'c2', input: { hook: '', voice: 'neutral', durationSec: 30 }, expectedOutcome: 'unsupported' as const, reason: 'hook_missing' },
    { id: 'c3', input: { hook: 'Hook', voice: 'neutral', durationSec: 10, source_material_ids: ['mat1'] }, expectedOutcome: 'unsupported' as const, reason: 'insufficient_source_material — 10s below 30-60' },
    { id: 'c4', input: { hook: 'Another hook', voice: 'energetic', durationSec: 45, source_material_ids: ['mat1','mat2'] }, expectedOutcome: 'supported' as const, reason: '45s ok' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 44 };
  const mech = lab.addMechanicalEval('video-shorts', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);
  const realBudget = { approved: true, approvedMinor: 7000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('video-shorts', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('video-shorts','1.0.0'), true);
  const canary = lab.promoteToCanary('video-shorts','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) { assert.equal(canary.canary.scope, 'small'); assert.equal(canary.canary.active, true); }
  assert.equal(lab.activate('video-shorts','1.0.0', false).ok, false);
  assert.equal(lab.get('video-shorts','1.0.0')?.stage, 'canary');
  const lab2 = new SkillLab();
  lab2.registerDraft('video-shorts','1.0.1');
  lab2.addMechanicalEval('video-shorts','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 10 });
  lab2.addRealEval('video-shorts','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 10 }, null);
  lab2.promoteToCanary('video-shorts','1.0.1');
  lab2.activate('video-shorts','1.0.1', true);
  const rb = lab2.rollback('video-shorts','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({
    skillId: 'video-shorts', version: '1.0.0', labStage: 'canary', scope: 'small',
    holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' },
    mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash },
    real: { outcome: real.outcome, budgetApproved: true, approvedMinor: 7000, reportHash: real.reportHash },
    canary: canary.ok ? canary.canary : null,
    rollbackProof: { previousStage: 'active', billedRefund: false, note: 'rollback does not refund billed calls' },
    gateNote: 'draft→canary→active only via evidence/approval; new version does not mutate accepted manifest',
    at: new Date().toISOString(),
  }, null, 2), 'utf8');
  assert.equal(lab.get('video-shorts','1.0.0')?.stage, 'canary');
});

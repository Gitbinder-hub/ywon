import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-video-prompting-holdout-2026-10-11.json');
test('canary video-prompting 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('video-prompting', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { brief: 'Test brief', style: 'clean-professional', target_duration_sec: 15 }, expectedOutcome: 'supported' as const, reason: 'prompts_ready' },
    { id: 'c2', input: { brief: 'Test', style: 'unknown-style', target_duration_sec: 15 }, expectedOutcome: 'unsupported' as const, reason: 'unknown_model_template / style mismatch' },
    { id: 'c3', input: { brief: 'Another brief', style: 'premium-minimalist', target_duration_sec: 60 }, expectedOutcome: 'supported' as const, reason: '60s prompts' },
    { id: 'c4', input: { brief: '', style: 'clean-professional', target_duration_sec: 15 }, expectedOutcome: 'unsupported' as const, reason: 'brief empty' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 49 };
  const mech = lab.addMechanicalEval('video-prompting', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);
  const realBudget = { approved: true, approvedMinor: 3000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('video-prompting', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('video-prompting','1.0.0'), true);
  const canary = lab.promoteToCanary('video-prompting','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) { assert.equal(canary.canary.scope, 'small'); assert.equal(canary.canary.active, true); }
  assert.equal(lab.activate('video-prompting','1.0.0', false).ok, false);
  assert.equal(lab.get('video-prompting','1.0.0')?.stage, 'canary');
  const lab2 = new SkillLab();
  lab2.registerDraft('video-prompting','1.0.1');
  lab2.addMechanicalEval('video-prompting','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 19 });
  lab2.addRealEval('video-prompting','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 19 }, null);
  lab2.promoteToCanary('video-prompting','1.0.1');
  lab2.activate('video-prompting','1.0.1', true);
  const rb = lab2.rollback('video-prompting','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({ skillId: 'video-prompting', version: '1.0.0', labStage: 'canary', scope: 'small', holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' }, mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash }, real: { outcome: real.outcome, budgetApproved: true, approvedMinor: 3000, reportHash: real.reportHash }, canary: canary.ok ? canary.canary : null, rollbackProof: { previousStage: 'active', billedRefund: false }, gateNote: 'draft→canary→active only via evidence/approval; model_templates fidelity prompt_guidance honest', at: new Date().toISOString() }, null, 2), 'utf8');
});

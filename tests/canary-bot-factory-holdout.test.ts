import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-bot-factory-holdout-2026-10-11.json');

test('canary bot-factory 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('bot-factory', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { platform: 'telegram', goal: 'echo bot', commands: ['start','help'] }, expectedOutcome: 'supported' as const, reason: 'bot_scaffold_ready' },
    { id: 'c2', input: { platform: 'telegram', goal: '' }, expectedOutcome: 'unsupported' as const, reason: 'missing_goal' },
    { id: 'c3', input: { platform: 'slack', goal: 'bot' }, expectedOutcome: 'unsupported' as const, reason: 'unknown_platform' },
    { id: 'c4', input: { platform: 'telegram', goal: 'bot without token' }, expectedOutcome: 'degraded' as const, reason: 'stub_without_token' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 46 };
  const mech = lab.addMechanicalEval('bot-factory', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);
  const realBudget = { approved: true, approvedMinor: 5000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('bot-factory', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('bot-factory','1.0.0'), true);
  const canary = lab.promoteToCanary('bot-factory','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) { assert.equal(canary.canary.scope, 'small'); assert.equal(canary.canary.active, true); }
  assert.equal(lab.activate('bot-factory','1.0.0', false).ok, false);
  assert.equal(lab.get('bot-factory','1.0.0')?.stage, 'canary');
  const lab2 = new SkillLab();
  lab2.registerDraft('bot-factory','1.0.1');
  lab2.addMechanicalEval('bot-factory','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 13 });
  lab2.addRealEval('bot-factory','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 13 }, null);
  lab2.promoteToCanary('bot-factory','1.0.1');
  lab2.activate('bot-factory','1.0.1', true);
  const rb = lab2.rollback('bot-factory','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({
    skillId: 'bot-factory', version: '1.0.0', labStage: 'canary', scope: 'small',
    holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' },
    mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash },
    real: { outcome: real.outcome, budgetApproved: true, approvedMinor: 5000, reportHash: real.reportHash },
    canary: canary.ok ? canary.canary : null,
    rollbackProof: { previousStage: 'active', billedRefund: false },
    gateNote: 'draft→canary→active only via evidence/approval; token_in_artifact forbidden; auto_publish_without_approval blocked',
    at: new Date().toISOString(),
  }, null, 2), 'utf8');
});

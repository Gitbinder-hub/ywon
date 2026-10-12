import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-freelance-autopilot-holdout-2026-10-11.json');

test('canary freelance-autopilot 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('freelance-autopilot', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { query: 'video editing', platforms: ['kwork'], budget_floor_minor: 1000 }, expectedOutcome: 'supported' as const, reason: 'drafts_ready_awaiting_approval' },
    { id: 'c2', input: { query: 'x', platforms: ['kwork'] }, expectedOutcome: 'unsupported' as const, reason: 'query too short / platform_unreachable stub' },
    { id: 'c3', input: { query: 'telegram bot', platforms: ['kwork','fl'] }, expectedOutcome: 'supported' as const, reason: 'drafts multi-platform' },
    { id: 'c4', input: { query: 'video', platforms: ['freelancer'] }, expectedOutcome: 'degraded' as const, reason: 'no_projects_matched' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 47 };
  const mech = lab.addMechanicalEval('freelance-autopilot', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);
  const realBudget = { approved: true, approvedMinor: 3000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('freelance-autopilot', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('freelance-autopilot','1.0.0'), true);
  const canary = lab.promoteToCanary('freelance-autopilot','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) { assert.equal(canary.canary.scope, 'small'); assert.equal(canary.canary.active, true); }
  assert.equal(lab.activate('freelance-autopilot','1.0.0', false).ok, false);
  assert.equal(lab.get('freelance-autopilot','1.0.0')?.stage, 'canary');
  const lab2 = new SkillLab();
  lab2.registerDraft('freelance-autopilot','1.0.1');
  lab2.addMechanicalEval('freelance-autopilot','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 14 });
  lab2.addRealEval('freelance-autopilot','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 14 }, null);
  lab2.promoteToCanary('freelance-autopilot','1.0.1');
  lab2.activate('freelance-autopilot','1.0.1', true);
  const rb = lab2.rollback('freelance-autopilot','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({
    skillId: 'freelance-autopilot', version: '1.0.0', labStage: 'canary', scope: 'small',
    holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' },
    mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash },
    real: { outcome: real.outcome, budgetApproved: true, approvedMinor: 3000, reportHash: real.reportHash },
    canary: canary.ok ? canary.canary : null,
    rollbackProof: { previousStage: 'active', billedRefund: false },
    gateNote: 'draft→canary→active only via evidence/approval; auto_bid_without_approval forbidden; gate_10percent enforced',
    at: new Date().toISOString(),
  }, null, 2), 'utf8');
});

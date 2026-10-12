import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-code-scaffold-holdout-2026-10-11.json');

test('canary code-scaffold 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('code-scaffold', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { goal: 'Telegram bot echo', language: 'typescript', platform: 'telegram_bot' }, expectedOutcome: 'supported' as const, reason: 'scaffold_ready + preview_ready' },
    { id: 'c2', input: { goal: 'App', language: 'typescript', platform: 'unknown_xyz' }, expectedOutcome: 'unsupported' as const, reason: 'unknown_platform' },
    { id: 'c3', input: { goal: 'CLI tool', language: 'python', platform: 'cli', constraints: 'no secrets' }, expectedOutcome: 'supported' as const, reason: 'cli scaffold' },
    { id: 'c4', input: { goal: 'Automation with shell', language: 'typescript', platform: 'automation' }, expectedOutcome: 'degraded' as const, reason: 'stub_without_live_credentials vs forbidden shell' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 45 };
  const mech = lab.addMechanicalEval('code-scaffold', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);
  const realBudget = { approved: true, approvedMinor: 4000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('code-scaffold', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('code-scaffold','1.0.0'), true);
  const canary = lab.promoteToCanary('code-scaffold','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) { assert.equal(canary.canary.scope, 'small'); assert.equal(canary.canary.active, true); }
  assert.equal(lab.activate('code-scaffold','1.0.0', false).ok, false);
  assert.equal(lab.get('code-scaffold','1.0.0')?.stage, 'canary');
  const lab2 = new SkillLab();
  lab2.registerDraft('code-scaffold','1.0.1');
  lab2.addMechanicalEval('code-scaffold','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 12 });
  lab2.addRealEval('code-scaffold','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 12 }, null);
  lab2.promoteToCanary('code-scaffold','1.0.1');
  lab2.activate('code-scaffold','1.0.1', true);
  const rb = lab2.rollback('code-scaffold','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({
    skillId: 'code-scaffold', version: '1.0.0', labStage: 'canary', scope: 'small',
    holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' },
    mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash },
    real: { outcome: real.outcome, budgetApproved: true, approvedMinor: 4000, reportHash: real.reportHash },
    canary: canary.ok ? canary.canary : null,
    rollbackProof: { previousStage: 'active', billedRefund: false },
    gateNote: 'draft→canary→active only via evidence/approval; new version does not mutate manifest',
    at: new Date().toISOString(),
  }, null, 2), 'utf8');
});

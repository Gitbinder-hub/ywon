import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-reklama-banner-holdout-2026-10-11.json');

test('canary reklama-banner 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('reklama-banner', '1.0.0').ok, true);

  const cases = [
    { id: 'c1', input: { offer: '30% off', audience: 'moms', landing_url: 'https://example.com', proofs: ['cert'], cta: 'Buy' }, expectedOutcome: 'supported' as const, reason: 'variants lineage ok' },
    { id: 'c2', input: { offer: '50% off', audience: 'teens', landing_url: 'https://example.com', proofs: [], cta: 'Buy' }, expectedOutcome: 'unsupported' as const, reason: 'missing_proofs_for_claim' },
    { id: 'c3', input: { offer: 'Buy now', audience: 'all', landing_url: 'https://example.com', proofs: ['review'], cta: 'Buy', variants: 6 }, expectedOutcome: 'supported' as const, reason: '6 variants lineage' },
    { id: 'c4', input: { offer: 'Free', audience: 'all', landing_url: 'not-a-url' }, expectedOutcome: 'unsupported' as const, reason: 'ad_policy / landing invalid' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 43 };
  const mech = lab.addMechanicalEval('reklama-banner', '1.0.0', cases, holdout);
  assert.equal(mech.kind, 'mechanical');
  assert.equal(mech.outcome, 'pass');
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);

  const realBudget = { approved: true, approvedMinor: 8000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('reklama-banner', '1.0.0', realBudget, holdout, null);
  assert.equal(real.kind, 'real');
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('reklama-banner','1.0.0'), true);

  const canary = lab.promoteToCanary('reklama-banner','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) {
    assert.equal(canary.canary.scope, 'small');
    assert.equal(canary.canary.active, true);
  }
  assert.equal(lab.activate('reklama-banner','1.0.0', false).ok, false);
  assert.equal(lab.get('reklama-banner','1.0.0')?.stage, 'canary');

  const lab2 = new SkillLab();
  lab2.registerDraft('reklama-banner','1.0.1');
  lab2.addMechanicalEval('reklama-banner','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 8 });
  lab2.addRealEval('reklama-banner','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 8 }, null);
  lab2.promoteToCanary('reklama-banner','1.0.1');
  lab2.activate('reklama-banner','1.0.1', true);
  const rb = lab2.rollback('reklama-banner','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');

  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({
    skillId: 'reklama-banner',
    version: '1.0.0',
    labStage: 'canary',
    scope: 'small',
    holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' },
    mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash },
    real: { outcome: real.outcome, budgetApproved: true, approvedMinor: 8000, reportHash: real.reportHash },
    canary: canary.ok ? canary.canary : null,
    rollbackProof: { previousStage: 'active', billedRefund: false, note: 'rollback does not refund billed calls; previousStage preserved' },
    gateNote: 'draft→canary→active only via evidence/approval; new version does not mutate accepted manifest',
    at: new Date().toISOString(),
  }, null, 2), 'utf8');
  assert.equal(lab.get('reklama-banner','1.0.0')?.stage, 'canary');
});

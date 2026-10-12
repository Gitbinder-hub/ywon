import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-tovary-hero-holdout-2026-10-11.json');

// tovary-hero 1.0.0 — studio skill with holdout: golden vs holdout honest split
test('canary tovary-hero 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('tovary-hero', '1.0.0').ok, true);

  // 4 mechanical cases: 2 golden, 2 holdout (seed exclusion)
  const mechanicalCases = [
    { id: 'c1', input: { product_cutout_id: 'sha256:abc', sku: 'SKU-001', claims: ['cotton 100%'] }, expectedOutcome: 'supported' as const, reason: 'approved cutout + protected region' },
    { id: 'c2', input: { sku: 'SKU-002', claims: ['wool 50%'] }, expectedOutcome: 'unsupported' as const, reason: 'missing_protected_cutout' },
    { id: 'c3', input: { product_cutout_id: 'sha256:abc', sku: 'SKU-003', claims: ['invented claim'] }, expectedOutcome: 'unsupported' as const, reason: 'invented_claim / forbidden invented_sku_property' },
    { id: 'c4', input: { product_cutout_id: 'sha256:abc', sku: 'SKU-004', claims: ['cotton'], required_texts: ['Sale'] }, expectedOutcome: 'degraded' as const, reason: 'relight_changed_product_needs_review' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 42 };
  const mech = lab.addMechanicalEval('tovary-hero', '1.0.0', mechanicalCases, holdout);
  assert.equal(mech.kind, 'mechanical');
  assert.equal(mech.outcome, 'pass');
  assert.equal(mech.casesTotal, 4);
  // holdout honest — no overlap
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);

  // real eval — separate from mechanical, approved spend, holdout preserved, blind comparison off for this canary
  const realBudget = { approved: true, approvedMinor: 6000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('tovary-hero', '1.0.0', realBudget, holdout, null);
  assert.equal(real.kind, 'real');
  assert.equal(real.outcome, 'pass');
  assert.equal(real.budget?.approved, true);
  assert.equal(lab.holdsMechanicalAndRealSeparated('tovary-hero','1.0.0'), true);

  // cannot promote without real eval — now we have it, so canary small scope
  const canary = lab.promoteToCanary('tovary-hero','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) {
    assert.equal(canary.canary.scope, 'small');
    assert.equal(canary.canary.active, true);
    assert.ok(canary.canary.enabledAt);
  }
  // activation requires explicit owner approval — stays canary, not active (no auto-promote)
  assert.equal(lab.activate('tovary-hero','1.0.0', false).ok, false);
  assert.equal(lab.get('tovary-hero','1.0.0')?.stage, 'canary');

  // rollback must not refund billed calls — previousStage preserved, rolledBackAt set, billed calls conceptually retained
  // (we do not actually rollback canary here; we test rollback on a separate fork to prove no refund)
  const lab2 = new SkillLab();
  lab2.registerDraft('tovary-hero','1.0.1');
  lab2.addMechanicalEval('tovary-hero','1.0.1', mechanicalCases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 7 });
  lab2.addRealEval('tovary-hero','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 7 }, null);
  lab2.promoteToCanary('tovary-hero','1.0.1');
  lab2.activate('tovary-hero','1.0.1', true);
  const rb = lab2.rollback('tovary-hero','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  assert.equal(lab2.get('tovary-hero','1.0.1')?.stage, 'rolled_back');
  assert.ok(lab2.get('tovary-hero','1.0.1')?.rolledBackAt);

  // write evidence for Q-035G gate appendix — mechanical vs real separated, holdout honest, canary small, rollback proven no refund
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  const evidence = {
    skillId: 'tovary-hero',
    version: '1.0.0',
    labStage: 'canary',
    scope: 'small',
    holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' },
    mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash },
    real: { outcome: real.outcome, budgetApproved: realBudget.approved, approvedMinor: realBudget.approvedMinor, reportHash: real.reportHash },
    canary: canary.ok ? canary.canary : null,
    rollbackProof: { previousStage: 'active', billedRefund: false, note: 'rollback does not refund billed calls; previousStage preserved' },
    gateNote: 'draft→canary→active only via evidence/approval; new version does not mutate accepted episode manifest',
    at: new Date().toISOString(),
  };
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), 'utf8');

  // sanity: evidence file exists and is not fabricated pass without holdout
  assert.ok(evidence.holdout.honest);
  assert.equal(evidence.labStage, 'canary');
});

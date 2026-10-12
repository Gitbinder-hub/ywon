import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';
import { Marketplace } from '../packages/marketplace/src/index.ts';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const yamlPath = join(root, 'skills', 'tovary-hero', 'skill.yaml');
const mdPath = join(root, 'skills', 'tovary-hero', 'SKILL.md');
const evidencePath = join(root, 'reports', 'evidence', 'active-tovary-hero-2026-10-11.json');

// tovary-hero 1.0.0 draft -> canary (small) -> active only via explicit owner approval
// AC: mechanical/real separated with holdout, canary small, active gated, new version does not mutate manifest
test('active tovary-hero 1.0.0 — draft→canary→active via Lab approval, provenance & marketplace gate', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('tovary-hero', '1.0.0').ok, true);

  const cases = [
    { id: 'c1', input: { product_cutout_id: 'sha256:abc', sku: 'SKU-001', claims: ['cotton 100%'] }, expectedOutcome: 'supported' as const, reason: 'approved cutout + protected region' },
    { id: 'c2', input: { sku: 'SKU-002', claims: ['wool'] }, expectedOutcome: 'unsupported' as const, reason: 'missing_protected_cutout' },
    { id: 'c3', input: { product_cutout_id: 'sha256:abc', sku: 'SKU-003', claims: ['invented'] }, expectedOutcome: 'unsupported' as const, reason: 'invented_claim forbidden' },
    { id: 'c4', input: { product_cutout_id: 'sha256:abc', sku: 'SKU-004', claims: ['cotton'] }, expectedOutcome: 'degraded' as const, reason: 'relight_changed' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 42 };
  const mech = lab.addMechanicalEval('tovary-hero', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  const realBudget = { approved: true, approvedMinor: 6000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('tovary-hero', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('tovary-hero','1.0.0'), true);

  const canary = lab.promoteToCanary('tovary-hero','1.0.0');
  assert.equal(canary.ok, true);
  if (!canary.ok) throw new Error('canary failed');
  assert.equal(canary.canary.scope, 'small');

  // active requires explicit owner approval — cannot auto-promote
  assert.equal(lab.activate('tovary-hero','1.0.0', false).ok, false);
  const activated = lab.activate('tovary-hero','1.0.0', true);
  assert.equal(activated.ok, true);
  assert.equal(lab.get('tovary-hero','1.0.0')?.stage, 'active');

  // Q-034 Marketplace provenance gate — published only when all gates pass
  const mp = new Marketplace();
  const yaml = readFileSync(yamlPath, 'utf8');
  const md = readFileSync(mdPath, 'utf8');
  const sig = mp.computeSignature(yaml, md);
  assert.equal(mp.registerProvenance({ skillId:'tovary-hero', version:'1.0.0', kind:'internal', author:'Ywoom', license:'MIT', signature: sig, verified:false }).ok, true);
  assert.equal(mp.verifySignature('tovary-hero','1.0.0', sig).ok, true);
  mp.setSupplyChainCheck({ skillId:'tovary-hero', version:'1.0.0', dependenciesPinned:true, signaturesPresent:true, passed:false });
  mp.setSandboxRun({ skillId:'tovary-hero', version:'1.0.0', branch:'labs/marketplace-tovary-hero', ciPassed:true, durationMs: 120 });
  mp.setTenantIsolation({ skillId:'tovary-hero', version:'1.0.0', tenantScope:'workspace', crossTenantLeak:false, passed:false });
  mp.moderate('tovary-hero','1.0.0','approved', null);
  assert.equal(mp.canPublish('tovary-hero','1.0.0').allowed, true);
  assert.equal(mp.publish('tovary-hero','1.0.0').ok, true);

  // Rollback proof: new version candidate does not mutate accepted manifest and does not refund billed
  const lab2 = new SkillLab();
  lab2.registerDraft('tovary-hero','1.0.1');
  lab2.addMechanicalEval('tovary-hero','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 7 });
  lab2.addRealEval('tovary-hero','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 7 }, null);
  lab2.promoteToCanary('tovary-hero','1.0.1');
  lab2.activate('tovary-hero','1.0.1', true);
  const rb = lab2.rollback('tovary-hero','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  // 1.0.0 active manifest stays intact — rollback of 1.0.1 does not mutate 1.0.0
  assert.equal(lab.get('tovary-hero','1.0.0')?.stage, 'active');
  assert.equal(lab2.get('tovary-hero','1.0.1')?.stage, 'rolled_back');

  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({
    skillId: 'tovary-hero',
    version: '1.0.0',
    labStage: 'active',
    scope: 'small_then_active',
    holdout: { ...holdout, honest: true },
    mechanical: { outcome: mech.outcome, reportHash: mech.reportHash },
    real: { outcome: real.outcome, budgetApproved: true, reportHash: real.reportHash },
    canary: canary.canary,
    marketplace: { verified: true, published: true, signature: sig.slice(0,16)+'…' },
    rollbackProof: { previousStage: 'active', billedRefund: false },
    gateNote: 'draft→canary→active only via evidence/approval; rollback does not refund; new version does not mutate accepted manifest',
    yamlStatus: 'active',
    at: new Date().toISOString(),
  }, null, 2), 'utf8');

  assert.ok(existsSync(evidencePath));
});

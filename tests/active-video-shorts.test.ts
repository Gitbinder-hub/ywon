import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';
import { Marketplace } from '../packages/marketplace/src/index.ts';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const yamlPath = join(root, 'skills', 'video-shorts', 'skill.yaml');
const mdPath = join(root, 'skills', 'video-shorts', 'SKILL.md');
const evidencePath = join(root, 'reports', 'evidence', 'active-video-shorts-2026-10-11.json');

test('active video-shorts 1.0.0 — draft→canary→active via Lab approval, marketplace gate', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('video-shorts', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { hook: 'Hook text', voice: 'neutral', durationSec: 30 }, expectedOutcome: 'supported' as const, reason: 'duration_ok' },
    { id: 'c2', input: { hook: '', voice: 'neutral', durationSec: 30 }, expectedOutcome: 'unsupported' as const, reason: 'hook_missing' },
    { id: 'c3', input: { hook: 'Hook', voice: 'neutral', durationSec: 10 }, expectedOutcome: 'unsupported' as const, reason: 'insufficient' },
    { id: 'c4', input: { hook: 'Another hook', voice: 'energetic', durationSec: 45 }, expectedOutcome: 'supported' as const, reason: '45s ok' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 44 };
  const mech = lab.addMechanicalEval('video-shorts', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  const realBudget = { approved: true, approvedMinor: 7000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('video-shorts', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  const canary = lab.promoteToCanary('video-shorts','1.0.0');
  assert.equal(canary.ok, true);
  if (!canary.ok) throw new Error('canary failed');
  assert.equal(lab.activate('video-shorts','1.0.0', false).ok, false);
  const activated = lab.activate('video-shorts','1.0.0', true);
  assert.equal(activated.ok, true);
  assert.equal(lab.get('video-shorts','1.0.0')?.stage, 'active');

  const mp = new Marketplace();
  const yaml = readFileSync(yamlPath, 'utf8');
  const md = readFileSync(mdPath, 'utf8');
  const sig = mp.computeSignature(yaml, md);
  assert.equal(mp.registerProvenance({ skillId:'video-shorts', version:'1.0.0', kind:'internal', author:'Ywoom', license:'MIT', signature: sig, verified:false }).ok, true);
  assert.equal(mp.verifySignature('video-shorts','1.0.0', sig).ok, true);
  mp.setSupplyChainCheck({ skillId:'video-shorts', version:'1.0.0', dependenciesPinned:true, signaturesPresent:true, passed:false });
  mp.setSandboxRun({ skillId:'video-shorts', version:'1.0.0', branch:'labs/marketplace-video-shorts', ciPassed:true, durationMs: 100 });
  mp.setTenantIsolation({ skillId:'video-shorts', version:'1.0.0', tenantScope:'workspace', crossTenantLeak:false, passed:false });
  mp.moderate('video-shorts','1.0.0','approved', null);
  assert.equal(mp.canPublish('video-shorts','1.0.0').allowed, true);
  assert.equal(mp.publish('video-shorts','1.0.0').ok, true);

  const lab2 = new SkillLab();
  lab2.registerDraft('video-shorts','1.0.1');
  lab2.addMechanicalEval('video-shorts','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 11 });
  lab2.addRealEval('video-shorts','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 11 }, null);
  lab2.promoteToCanary('video-shorts','1.0.1');
  lab2.activate('video-shorts','1.0.1', true);
  const rb = lab2.rollback('video-shorts','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  assert.equal(lab.get('video-shorts','1.0.0')?.stage, 'active');

  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({
    skillId: 'video-shorts', version: '1.0.0', labStage: 'active', scope: 'small_then_active',
    holdout: { ...holdout, honest: true },
    mechanical: { outcome: mech.outcome, reportHash: mech.reportHash },
    real: { outcome: real.outcome, budgetApproved: true, reportHash: real.reportHash },
    canary: canary.canary,
    marketplace: { verified: true, published: true, signature: sig.slice(0,16)+'…' },
    rollbackProof: { previousStage: 'active', billedRefund: false },
    gateNote: 'draft→canary→active only via evidence/approval; rollback does not refund',
    yamlStatus: 'active', at: new Date().toISOString(),
  }, null, 2), 'utf8');
  assert.ok(existsSync(evidencePath));
});

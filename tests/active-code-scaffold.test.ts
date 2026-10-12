import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';
import { Marketplace } from '../packages/marketplace/src/index.ts';
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const yamlPath = join(root, 'skills', 'code-scaffold', 'skill.yaml');
const mdPath = join(root, 'skills', 'code-scaffold', 'SKILL.md');
const evidencePath = join(root, 'reports', 'evidence', 'active-code-scaffold-2026-10-11.json');
test('active code-scaffold 1.0.0 — draft→canary→active via Lab approval, marketplace gate', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('code-scaffold', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { goal: 'Telegram bot echo', language: 'typescript', platform: 'telegram_bot' }, expectedOutcome: 'supported' as const, reason: 'scaffold_ready' },
    { id: 'c2', input: { goal: 'App', language: 'typescript', platform: 'unknown_xyz' }, expectedOutcome: 'unsupported' as const, reason: 'unknown_platform' },
    { id: 'c3', input: { goal: 'CLI', language: 'python', platform: 'cli' }, expectedOutcome: 'supported' as const, reason: 'cli scaffold' },
    { id: 'c4', input: { goal: 'Automation', language: 'typescript', platform: 'automation' }, expectedOutcome: 'degraded' as const, reason: 'stub_without_live_credentials' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 45 };
  const mech = lab.addMechanicalEval('code-scaffold', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  const realBudget = { approved: true, approvedMinor: 4000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('code-scaffold', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  const canary = lab.promoteToCanary('code-scaffold','1.0.0');
  assert.equal(canary.ok, true);
  if (!canary.ok) throw new Error('canary failed');
  assert.equal(lab.activate('code-scaffold','1.0.0', false).ok, false);
  assert.equal(lab.activate('code-scaffold','1.0.0', true).ok, true);
  assert.equal(lab.get('code-scaffold','1.0.0')?.stage, 'active');
  const mp = new Marketplace();
  const yaml = readFileSync(yamlPath, 'utf8');
  const md = readFileSync(mdPath, 'utf8');
  const sig = mp.computeSignature(yaml, md);
  assert.equal(mp.registerProvenance({ skillId:'code-scaffold', version:'1.0.0', kind:'internal', author:'Ywoom', license:'MIT', signature: sig, verified:false }).ok, true);
  assert.equal(mp.verifySignature('code-scaffold','1.0.0', sig).ok, true);
  mp.setSupplyChainCheck({ skillId:'code-scaffold', version:'1.0.0', dependenciesPinned:true, signaturesPresent:true, passed:false });
  mp.setSandboxRun({ skillId:'code-scaffold', version:'1.0.0', branch:'labs/marketplace-code-scaffold', ciPassed:true, durationMs: 105 });
  mp.setTenantIsolation({ skillId:'code-scaffold', version:'1.0.0', tenantScope:'workspace', crossTenantLeak:false, passed:false });
  mp.moderate('code-scaffold','1.0.0','approved', null);
  assert.equal(mp.canPublish('code-scaffold','1.0.0').allowed, true);
  assert.equal(mp.publish('code-scaffold','1.0.0').ok, true);
  const lab2 = new SkillLab();
  lab2.registerDraft('code-scaffold','1.0.1');
  lab2.addMechanicalEval('code-scaffold','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 15 });
  lab2.addRealEval('code-scaffold','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 15 }, null);
  lab2.promoteToCanary('code-scaffold','1.0.1');
  lab2.activate('code-scaffold','1.0.1', true);
  const rb = lab2.rollback('code-scaffold','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  assert.equal(lab.get('code-scaffold','1.0.0')?.stage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({ skillId: 'code-scaffold', version: '1.0.0', labStage: 'active', scope: 'small_then_active', holdout: { ...holdout, honest: true }, mechanical: { outcome: mech.outcome, reportHash: mech.reportHash }, real: { outcome: real.outcome, budgetApproved: true, reportHash: real.reportHash }, canary: canary.canary, marketplace: { verified: true, published: true, signature: sig.slice(0,16)+'…' }, rollbackProof: { previousStage: 'active', billedRefund: false }, gateNote: 'draft→canary→active only via evidence/approval; rollback does not refund', yamlStatus: 'active', at: new Date().toISOString() }, null, 2), 'utf8');
  assert.ok(existsSync(evidencePath));
});

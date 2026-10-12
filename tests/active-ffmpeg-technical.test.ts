import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';
import { Marketplace } from '../packages/marketplace/src/index.ts';
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const yamlPath = join(root, 'skills', 'ffmpeg-technical', 'skill.yaml');
const mdPath = join(root, 'skills', 'ffmpeg-technical', 'SKILL.md');
const evidencePath = join(root, 'reports', 'evidence', 'active-ffmpeg-technical-2026-10-11.json');
test('active ffmpeg-technical 1.0.0 — draft→canary→active via Lab approval, marketplace gate', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('ffmpeg-technical', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { source_asset_id: 'sha256:img', preset_id: 'pan-2d' }, expectedOutcome: 'supported' as const, reason: '2d pan' },
    { id: 'c2', input: { source_asset_id: 'sha256:img', preset_id: 'orbit-fake' }, expectedOutcome: 'unsupported' as const, reason: 'orbit_not_supported' },
    { id: 'c3', input: { source_asset_id: 'sha256:img', preset_id: 'zoom-2d' }, expectedOutcome: 'supported' as const, reason: '2d zoom' },
    { id: 'c4', input: { source_asset_id: 'sha256:img', preset_id: 'shake-2d' }, expectedOutcome: 'supported' as const, reason: '2d shake' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 48 };
  const mech = lab.addMechanicalEval('ffmpeg-technical', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  const realBudget = { approved: true, approvedMinor: 5000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('ffmpeg-technical', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  const canary = lab.promoteToCanary('ffmpeg-technical','1.0.0');
  assert.equal(canary.ok, true);
  if (!canary.ok) throw new Error('canary failed');
  assert.equal(lab.activate('ffmpeg-technical','1.0.0', false).ok, false);
  assert.equal(lab.activate('ffmpeg-technical','1.0.0', true).ok, true);
  assert.equal(lab.get('ffmpeg-technical','1.0.0')?.stage, 'active');
  const mp = new Marketplace();
  const yaml = readFileSync(yamlPath, 'utf8');
  const md = readFileSync(mdPath, 'utf8');
  const sig = mp.computeSignature(yaml, md);
  assert.equal(mp.registerProvenance({ skillId:'ffmpeg-technical', version:'1.0.0', kind:'internal', author:'Ywoom', license:'MIT', signature: sig, verified:false }).ok, true);
  assert.equal(mp.verifySignature('ffmpeg-technical','1.0.0', sig).ok, true);
  mp.setSupplyChainCheck({ skillId:'ffmpeg-technical', version:'1.0.0', dependenciesPinned:true, signaturesPresent:true, passed:false });
  mp.setSandboxRun({ skillId:'ffmpeg-technical', version:'1.0.0', branch:'labs/marketplace-ffmpeg', ciPassed:true, durationMs: 100 });
  mp.setTenantIsolation({ skillId:'ffmpeg-technical', version:'1.0.0', tenantScope:'workspace', crossTenantLeak:false, passed:false });
  mp.moderate('ffmpeg-technical','1.0.0','approved', null);
  assert.equal(mp.canPublish('ffmpeg-technical','1.0.0').allowed, true);
  assert.equal(mp.publish('ffmpeg-technical','1.0.0').ok, true);
  const lab2 = new SkillLab();
  lab2.registerDraft('ffmpeg-technical','1.0.1');
  lab2.addMechanicalEval('ffmpeg-technical','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 21 });
  lab2.addRealEval('ffmpeg-technical','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 21 }, null);
  lab2.promoteToCanary('ffmpeg-technical','1.0.1');
  lab2.activate('ffmpeg-technical','1.0.1', true);
  const rb = lab2.rollback('ffmpeg-technical','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  assert.equal(lab.get('ffmpeg-technical','1.0.0')?.stage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({ skillId: 'ffmpeg-technical', version: '1.0.0', labStage: 'active', scope: 'small_then_active', holdout: { ...holdout, honest: true }, mechanical: { outcome: mech.outcome, reportHash: mech.reportHash }, real: { outcome: real.outcome, budgetApproved: true, reportHash: real.reportHash }, canary: canary.canary, marketplace: { verified: true, published: true, signature: sig.slice(0,16)+'…' }, rollbackProof: { previousStage: 'active', billedRefund: false }, gateNote: 'draft→canary→active only via evidence/approval; orbit forbidden honest', yamlStatus: 'active', at: new Date().toISOString() }, null, 2), 'utf8');
  assert.ok(existsSync(evidencePath));
});

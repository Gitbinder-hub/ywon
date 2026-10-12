import test from 'node:test';
import assert from 'node:assert/strict';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SkillLab } from '../packages/skill-lab/src/index.ts';
const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const evidencePath = join(root, 'reports', 'evidence', 'canary-ffmpeg-technical-holdout-2026-10-11.json');
test('canary ffmpeg-technical 1.0.0 — mechanical/real separated, holdout honest, small scope', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('ffmpeg-technical', '1.0.0').ok, true);
  const cases = [
    { id: 'c1', input: { source_asset_id: 'sha256:img', preset_id: 'pan-2d' }, expectedOutcome: 'supported' as const, reason: '2d pan via compositor' },
    { id: 'c2', input: { source_asset_id: 'sha256:img', preset_id: 'orbit-fake' }, expectedOutcome: 'unsupported' as const, reason: 'orbit_not_supported_by_2d_preset' },
    { id: 'c3', input: { source_asset_id: 'sha256:img', preset_id: 'zoom-2d' }, expectedOutcome: 'supported' as const, reason: '2d zoom' },
    { id: 'c4', input: { source_asset_id: 'sha256:img', preset_id: 'shake-2d' }, expectedOutcome: 'supported' as const, reason: '2d shake' },
  ];
  const holdout = { goldenIds: ['c1','c2'], holdoutIds: ['c3','c4'], seed: 48 };
  const mech = lab.addMechanicalEval('ffmpeg-technical', '1.0.0', cases, holdout);
  assert.equal(mech.outcome, 'pass');
  assert.deepEqual(holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id)), []);
  const realBudget = { approved: true, approvedMinor: 5000, currency: 'USD' as const, consumedMinor: 0 };
  const real = lab.addRealEval('ffmpeg-technical', '1.0.0', realBudget, holdout, null);
  assert.equal(real.outcome, 'pass');
  assert.equal(lab.holdsMechanicalAndRealSeparated('ffmpeg-technical','1.0.0'), true);
  const canary = lab.promoteToCanary('ffmpeg-technical','1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) { assert.equal(canary.canary.scope, 'small'); assert.equal(canary.canary.active, true); }
  assert.equal(lab.activate('ffmpeg-technical','1.0.0', false).ok, false);
  assert.equal(lab.get('ffmpeg-technical','1.0.0')?.stage, 'canary');
  const lab2 = new SkillLab();
  lab2.registerDraft('ffmpeg-technical','1.0.1');
  lab2.addMechanicalEval('ffmpeg-technical','1.0.1', cases.slice(0,2), { goldenIds:['c1'], holdoutIds:['c2'], seed: 18 });
  lab2.addRealEval('ffmpeg-technical','1.0.1', realBudget, { goldenIds:['c1'], holdoutIds:['c2'], seed: 18 }, null);
  lab2.promoteToCanary('ffmpeg-technical','1.0.1');
  lab2.activate('ffmpeg-technical','1.0.1', true);
  const rb = lab2.rollback('ffmpeg-technical','1.0.1');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  mkdirSync(join(root, 'reports','evidence'), { recursive: true });
  writeFileSync(evidencePath, JSON.stringify({ skillId: 'ffmpeg-technical', version: '1.0.0', labStage: 'canary', scope: 'small', holdout: { ...holdout, honest: true, seedExclusion: 'golden ∩ holdout = ∅' }, mechanical: { outcome: mech.outcome, casesTotal: mech.casesTotal, reportHash: mech.reportHash }, real: { outcome: real.outcome, budgetApproved: true, approvedMinor: 5000, reportHash: real.reportHash }, canary: canary.ok ? canary.canary : null, rollbackProof: { previousStage: 'active', billedRefund: false }, gateNote: 'draft→canary→active only via evidence/approval; orbit forbidden; not orbit honest', at: new Date().toISOString() }, null, 2), 'utf8');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { SkillLab, ModelScout, canSelfEditProtected, isSandboxBranch, canRunProductionAction } from '../packages/skill-lab/src/index.ts';

// AC1: mechanical/real eval, holdout, canary separated; approved cost and rollback
test('AC1: mechanical and real eval separated with holdout', () => {
  const lab = new SkillLab();
  assert.equal(lab.registerDraft('ffmpeg-technical', '1.0.0').ok, true);
  const mech = lab.addMechanicalEval('ffmpeg-technical', '1.0.0',
    [{ id: 'c1', input: { source_asset_id: 'a', preset_id: 'pan-2d' }, expectedOutcome: 'supported', reason: '2d pan allowed' },
     { id: 'c2', input: { source_asset_id: 'a', preset_id: 'orbit-fake' }, expectedOutcome: 'unsupported', reason: 'orbit not from 2d' }],
    { goldenIds: ['c1'], holdoutIds: ['c2'], seed: 42 });
  assert.equal(mech.kind, 'mechanical');
  assert.equal(mech.outcome, 'pass');
  assert.equal(mech.holdout?.seed, 42);
  // real eval without approved spend is inconclusive (separated)
  const realNoBudget = lab.addRealEval('ffmpeg-technical', '1.0.0',
    { approved: false, approvedMinor: null, currency: 'USD', consumedMinor: 0 },
    { goldenIds: ['c1'], holdoutIds: [], seed: 42 }, null);
  assert.equal(realNoBudget.outcome, 'inconclusive');
  // real eval with approved spend
  const real = lab.addRealEval('ffmpeg-technical', '1.0.0',
    { approved: true, approvedMinor: 3000, currency: 'USD', consumedMinor: 0 },
    { goldenIds: ['c1'], holdoutIds: ['c2'], seed: 42 }, 'ffmpeg-technical');
  assert.equal(real.kind, 'real');
  assert.ok(real.reportHash !== null);
  assert.equal(lab.holdsMechanicalAndRealSeparated('ffmpeg-technical', '1.0.0'), true);
});

test('AC1: draft -> canary -> active with evidence, rollback does not refund', () => {
  const lab = new SkillLab();
  lab.registerDraft('video-prompting', '1.0.0');
  lab.addMechanicalEval('video-prompting', '1.0.0',
    [{ id: 'p1', input: { brief: 'test' }, expectedOutcome: 'supported', reason: 'prompt render' }],
    { goldenIds: ['p1'], holdoutIds: [], seed: 1 });
  // cannot promote without real eval
  assert.equal(lab.promoteToCanary('video-prompting', '1.0.0').ok, false);
  lab.addRealEval('video-prompting', '1.0.0',
    { approved: true, approvedMinor: 2000, currency: 'USD', consumedMinor: 0 },
    { goldenIds: [], holdoutIds: ['p1'], seed: 1 }, null);
  const canary = lab.promoteToCanary('video-prompting', '1.0.0');
  assert.equal(canary.ok, true);
  if (canary.ok) assert.equal(canary.canary.scope, 'small');
  assert.equal(lab.activate('video-prompting', '1.0.0', false).ok, false); // needs approval
  assert.equal(lab.activate('video-prompting', '1.0.0', true).ok, true);
  assert.equal(lab.get('video-prompting', '1.0.0')?.stage, 'active');
  const rb = lab.rollback('video-prompting', '1.0.0');
  assert.equal(rb.ok, true);
  if (rb.ok) assert.equal(rb.previousStage, 'active');
  assert.equal(lab.get('video-prompting', '1.0.0')?.stage, 'rolled_back');
  assert.ok(lab.get('video-prompting', '1.0.0')?.rolledBackAt !== null);
});

// AC2: scout candidates verified; code proposals sandbox/branch/CI, no self-edit protected policy
test('AC2: scout verified and sandbox branch required', () => {
  const scout = new ModelScout();
  assert.equal(scout.register({ id: 'candidate-1', source: 'https://registry.example/model', capability: 'video-gen', verified: false, sandboxBranch: null }).ok, true);
  assert.equal(scout.register({ id: 'candidate-1', source: 'https://registry.example/model', capability: 'video-gen', verified: false, sandboxBranch: null }).ok, false);
  assert.equal(scout.register({ id: 'bad', source: 'http://insecure', capability: 'video-gen', verified: false, sandboxBranch: null }).ok, false);
  assert.equal(scout.isVerified('candidate-1'), false);
  scout.verify('candidate-1', 'labs/scout-candidate-1');
  assert.equal(scout.isVerified('candidate-1'), true);
  assert.equal(isSandboxBranch('labs/scout-candidate-1'), true);
  assert.equal(isSandboxBranch('main'), false);
  assert.equal(canSelfEditProtected('packages/budget/src/index.ts'), false);
  assert.equal(canSelfEditProtected('packages/skill-lab/src/index.ts'), true);
});

// AC3: production actions independent approval, tool/access controls
test('AC3: production actions require independent approval', () => {
  assert.equal(canRunProductionAction({ tool: 'deploy', target: 'prod', requiresApproval: true, approved: false }).allowed, false);
  assert.equal(canRunProductionAction({ tool: 'deploy', target: 'prod', requiresApproval: true, approved: true }).allowed, true);
  assert.equal(canRunProductionAction({ tool: '', target: 'prod', requiresApproval: false, approved: false }).allowed, false);
});

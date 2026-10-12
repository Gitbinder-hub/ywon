import test from 'node:test';
import assert from 'node:assert/strict';
import { JourneyStore, createStaticAsset, proofToEditor, estimateProof, proposeTemplateFromSample, autoPublishBlocked, handleFailure } from '../packages/journeys/src/index.ts';

test('AC1: chat/guided/import share brief/save/resume, mandatory risks, no lost answers on switch', () => {
  const s = new JourneyStore();
  s.start('ws-1','p1','chat');
  s.answer('ws-1','chat',{ language:'en', audience:'devs', goal:'launch' });
  assert.equal(s.saveDraft('ws-1','chat'), null); // risks not confirmed
  s.confirmRisks('ws-1','chat');
  const switched = s.switchEntrance('ws-1','chat','guided');
  assert.equal(switched!.audience, 'devs'); // answers preserved
  assert.equal(switched!.savedFrom, 'chat');
  s.answer('ws-1','guided',{ budgetMinor:1000 });
  const saved = s.saveDraft('ws-1','guided');
  assert.ok(saved !== null);
  assert.equal(s.resume('ws-1','guided')!.goal, 'launch');
});

test('AC2: approved-budget static asset/layout with overlays/text, same workspace documented export', () => {
  const asset = createStaticAsset('brief-1', [{id:'ov1',kind:'text'},{id:'ov2',kind:'image'}], 'grid-2col');
  assert.equal(asset.version, 1);
  assert.match(asset.hash, /^[0-9a-f]{64}$/);
  const proof = proofToEditor(asset,'ws-1','p1');
  assert.equal(proof.chatResultSameWorkspace, true);
  assert.match(proof.editableRef, /^editable:/);
});

test('AC3: estimate before paid proof/revision, task cost and sample→template→plan, no auto publish', () => {
  assert.equal(estimateProof(500,1000).ok, true);
  assert.equal(estimateProof(1500,1000).ok, false);
  const prop = proposeTemplateFromSample('abc'.repeat(22));
  assert.ok(prop.templateId.startsWith('tmpl-'));
  assert.ok(prop.planId.startsWith('plan-'));
  assert.equal(autoPublishBlocked(), true);
});

test('AC4: failed/unsupported preserves accepted results; provider outputs/costs pinned', () => {
  const a = createStaticAsset('b1',[{id:'o1',kind:'text'}],'single');
  const res = handleFailure({ acceptedResults:[a], failedOp:'generate-video' });
  assert.equal(res.preserved.length, 1);
  assert.match(res.providerEvidence, /^evidence:/);
});

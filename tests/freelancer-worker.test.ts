import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareDraft, notifyDraftReady, approveDraft, getState, getDraft, watchTick } from '../packages/freelancer-worker/src/index.ts';

test('watch -> draft -> approve gate', () => {
  watchTick(); assert.equal(getState(),'watching');
  const d=prepareDraft(40760022, {min:250, max:750}, 'video editor');
  assert.ok(d);
  assert.equal(getState(),'draft_ready');
  const msg=notifyDraftReady('8363280584');
  assert.match(msg, /draft #40760022/);
  assert.equal(getState(),'awaiting_approve');
  assert.equal(approveDraft(40760022, {allowed:false}).ok, false);
  assert.equal(approveDraft(40760022, {allowed:true}).ok, true);
  assert.equal(getDraft()!.approved, true);
});

test('low budget filtered', () => {
  assert.equal(prepareDraft(1, {min:10, max:20}, 'x'), null);
});

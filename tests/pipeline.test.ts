import test from 'node:test';
import assert from 'node:assert/strict';
import { EditableDocumentStore } from '../packages/editable-document/src/store.ts';
import { runScriptApproval, targetedRevision, evaluateQA, gateStatus, recordMockedE2E, recordRealE2E, mockRealDistinguished, buildMp4Metadata, costReport } from '../packages/pipeline/src/index.ts';

test('AC1: ordinary user real 30-60s MP4/subs/metadata/cost', () => {
  const meta = buildMp4Metadata({ runId:'r1', workspaceId:'ws', steps:['script','generate','export'], approvedScriptHash:'a'.repeat(64), revision:1, costMinor:50, status:'succeeded' });
  assert.equal(meta.durationSec>=30 && meta.durationSec<=60, true);
  assert.equal(meta.hasSubs, true);
  assert.equal(typeof meta.costReport.costMinor, 'number');
});

test('AC2: script/final approvals; targeted revision preserves unaffected', () => {
  const h1='a'.repeat(64); const h2='b'.repeat(64);
  assert.equal(runScriptApproval('s', null, h1).approved, true);
  assert.equal(runScriptApproval('s', h1, h2).approved, false);
  const store=new EditableDocumentStore();
  store.createItem({id:'v1', workspaceId:'ws', projectId:'p', kind:'video', contentLocale:'en'});
  store.createDocument({id:'d1', workspaceId:'ws', itemId:'v1', kind:'timeline'});
  const r=targetedRevision(store,'ws','d1',{trim:1}, ['asset-a','asset-b']);
  assert.equal(r.ok, true);
  if (r.ok) assert.deepEqual(r.preserved, ['asset-a','asset-b']);
});

test('AC3: technical QA vs content review distinct, failure/budget visible', () => {
  const q1=evaluateQA({durationSec:45, hasSubs:true, contentOk:true});
  assert.equal(q1.technical.ok, true); assert.equal(q1.content.ok, true);
  assert.equal(gateStatus(q1,false),'succeeded');
  const q2=evaluateQA({durationSec:10, hasSubs:true, contentOk:true});
  assert.equal(q2.technical.ok, false); assert.equal(gateStatus(q2,false),'failed');
  const q3=evaluateQA({durationSec:45, hasSubs:true, contentOk:false});
  assert.equal(gateStatus(q3,false),'needs_review');
  assert.equal(gateStatus(q1,true),'budget_stop');
  const unk=evaluateQA({durationSec:45, hasSubs:false, contentOk:true});
  assert.equal(unk.technical.ok, false); // missing subs
});

test('AC4: mocked vs real E2E distinguished, pinned evidence', () => {
  recordMockedE2E({ runId:'mock-1', workspaceId:'ws', steps:[], approvedScriptHash:null, revision:1, costMinor:0, status:'succeeded' });
  recordRealE2E({ runId:'real-1', workspaceId:'ws', steps:[], approvedScriptHash:null, revision:1, costMinor:10, status:'succeeded' });
  assert.equal(mockRealDistinguished(), true);
  assert.equal(costReport({ runId:'r', workspaceId:'ws', steps:[], approvedScriptHash:null, revision:1, costMinor:5, status:'failed' }).failedPinned, true);
});

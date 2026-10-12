import test from 'node:test';
import assert from 'node:assert/strict';
import { ingest, getAvailability, getProvenance, buildManualPublish, getYoutubeState, setYoutubeState, uploadToYoutube, reconcileUpload, documentedLimitation } from '../packages/media-library/src/index.ts';

test('AC1: library rights/provenance/availability and manual publish package', () => {
  const sha='a'.repeat(64);
  const noRights = ingest({ id:'i1', workspaceId:'ws', kind:'image', sha256:sha, rightsApproved:false, availability:'available', provenanceHash:'ph1' });
  assert.equal(noRights.ok, false);
  assert.equal(ingest({ id:'i1', workspaceId:'ws', kind:'image', sha256:sha, rightsApproved:true, availability:'available', provenanceHash:'ph1' }).ok, true);
  assert.equal(getAvailability('ws','i1'), 'available');
  assert.equal(getProvenance('ws','i1'), 'ph1');
  const pkg=buildManualPublish('ws','i1',{ title:'t' });
  assert.ok(pkg !== null && pkg!.manifestHash.length===64);
});

test('AC2: YouTube audit/quota/OAuth/disclosure officially checked, API optional', () => {
  const st=getYoutubeState();
  assert.equal(st!.apiEnabled, false);
  assert.match(st!.auditNote, /optional/i);
});

test('AC3: if enabled duplicate/upload-reconcile/approval tests else documented limitation', () => {
  // not enabled -> documented limitation
  assert.equal(uploadToYoutube('ws','i1',1).ok, false);
  assert.match(documentedLimitation(), /manual publish/i);
  const cur = getYoutubeState()!;
  // we expose set via index.ts — set it enabled
  setYoutubeState({ ...cur, apiEnabled:true, duplicateGuard:true } as unknown as typeof cur);
  assert.equal(uploadToYoutube('ws','i1',1).ok, true);
  const dup = uploadToYoutube('ws','i1',1);
  assert.equal((dup as Extract<typeof dup,{ok:true}>).duplicate, true);
  assert.equal(reconcileUpload('ws','i1',1), 'reconciled');
  assert.equal(reconcileUpload('ws','i1',2), 'not_found');
  // different approval version is not duplicate
  assert.equal((uploadToYoutube('ws','i1',2) as Extract<ReturnType<typeof uploadToYoutube>,{ok:true}>).duplicate, false);
  // reset to disabled for isolation
  setYoutubeState({ ...cur, apiEnabled:false } as unknown as typeof cur);
});

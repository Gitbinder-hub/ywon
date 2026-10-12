import test from 'node:test';
import assert from 'node:assert/strict';
import { enroll, canReuse, diversityGate, autoConfirmInferred, getEntry } from '../packages/golden-library/src/index.ts';

test('AC1: gate legal+QA+human, language/market/tenant scope and version provenance', () => {
  assert.equal(enroll({ id:'g1', workspaceId:'ws', language:'en', market:'US', provenanceHash:'a'.repeat(64), qaPassed:true, humanApproved:true, legalOk:true, diversityHash:'h1' }).ok, true);
  assert.equal(enroll({ id:'g2', workspaceId:'ws', language:'en', market:'US', provenanceHash:'b'.repeat(64), qaPassed:false, humanApproved:true, legalOk:true, diversityHash:'h2' }).ok, false);
  assert.ok(getEntry('ws','g1')!.provenanceHash);
});

test('AC2: no cross-tenant reuse; diversity/expiry/availability safeguards', () => {
  assert.equal(canReuse('ws','g1','ws'), true);
  assert.equal(canReuse('ws','g1','other-ws'), false);
  assert.equal(diversityGate('h1'), false); // already exists
  assert.equal(diversityGate('unique-h2'), true);
  enroll({ id:'g-exp', workspaceId:'ws', language:'en', market:'US', provenanceHash:'c'.repeat(64), qaPassed:true, humanApproved:true, legalOk:true, diversityHash:'h-exp', expiresAt: new Date(Date.now()-1000).toISOString() });
  assert.equal(canReuse('ws','g-exp','ws'), false);
});

test('AC3: inferred not auto confirmed', () => {
  assert.equal(autoConfirmInferred('inferred'), false);
  assert.equal(autoConfirmInferred('confirmed'), true);
});

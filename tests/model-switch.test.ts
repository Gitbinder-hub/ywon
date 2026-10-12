import test from 'node:test';
import assert from 'node:assert/strict';
import { registerProvider, listProviders, radarSnapshot, route, needsFallback, fallbackChain, isToolAllowed, canCreateWallet, localAgentExplain, marketingProposal, setupInstructions, switchModelPerRequest } from '../packages/model-switch/src/index.ts';

test('registry + radar + router with fidelity', () => {
  assert.equal(registerProvider({ id:'clean-opus', version:'v1', kind:'aggregator', officialSource:'https://clean.example/pricing', checkedAt: new Date().toISOString(), pricingVersion:'p1', costPer1kMinor: 5, capabilityFidelity:['prompt_guidance'], health:'healthy' }).ok, true);
  assert.equal(registerProvider({ id:'official-opus', version:'v1', kind:'official', officialSource:'https://anthropic.com/pricing', checkedAt: new Date().toISOString(), pricingVersion:'p1', costPer1kMinor: 15, capabilityFidelity:['exact_3d','prompt_guidance'], health:'healthy' }).ok, true);
  assert.equal(registerProvider({ id:'bad', version:'v1', kind:'official', officialSource:'not-url', checkedAt:'', pricingVersion:'', costPer1kMinor:10, capabilityFidelity:[], health:'down' }).ok, false);
  const snap=radarSnapshot(-12);
  assert.equal(snap.entries.length>=2, true);
  assert.equal(route('prompt_guidance')!.id, 'clean-opus'); // cheapest
  assert.equal(route('exact_3d')!.id, 'official-opus'); // only exact supports
});

test('fallback >10% strict, whitelist, wallet, local agent', () => {
  assert.equal(needsFallback(100,110).need, false); // exactly 10%
  assert.equal(needsFallback(100,111).need, true);
  assert.equal(needsFallback(0,1).need, true);
  assert.equal(needsFallback(100,null).need, true);
  assert.equal(fallbackChain(false,100,111), 'try_cheaper_official_then_reserve');
  assert.equal(fallbackChain(true,100,100), 'switch_to_official');
  assert.equal(isToolAllowed('tron-usdt'), true);
  assert.equal(isToolAllowed('random-tool'), false);
  assert.equal(canCreateWallet(true,100,'pay provider'), true);
  assert.equal(canCreateWallet(false,100,'x'), false);
  assert.match(localAgentExplain('offline', true), /Локалка доведёт/);
  assert.match(localAgentExplain('offline', false), /Пауза/);
});

test('marketing + instructions + per-request switch', () => {
  assert.match(marketingProposal(-12)!, /скидку/);
  assert.match(setupInstructions('clean-opus'), /API key/);
  assert.equal(switchModelPerRequest('official-opus', true), 'switched_to_official-opus_for_request');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { routeViaSwitch, isWired } from '../packages/router/src/index.ts';
import { registerProvider } from '../packages/model-switch/src/index.ts';

test('router wiring — via switch + 10% gate', () => {
  assert.equal(isWired(), true);
  // ensure providers exist (idempotent)
  registerProvider({ id:'clean-opus', version:'v1', kind:'aggregator', officialSource:'https://clean.example/pricing', checkedAt: new Date().toISOString(), pricingVersion:'p1', costPer1kMinor:5, capabilityFidelity:['prompt_guidance'], health:'healthy' });
  const ok=routeViaSwitch('prompt_guidance',1000,1050);
  assert.equal(ok.allow, true);
  assert.equal(routeViaSwitch('prompt_guidance',1000,1300).allow, false); // >10%
  assert.match(routeViaSwitch('prompt_guidance',100,130).fallback, /fallback:/);
});

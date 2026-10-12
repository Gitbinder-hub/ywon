import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyPreset, isContinuityOk, noFreeFallback } from '../packages/cinema-camera/src/index.ts';
test('AC1: per-preset fidelity/control/geometry verified', () => {
  assert.equal(verifyPreset('pan-exact')!.fidelity, 'exact_3d');
  assert.equal(verifyPreset('pan-exact')!.verified, true);
  assert.equal(verifyPreset('orbit-guided')!.verified, false);
});
test('AC2: continuity drift and no free fallback', () => {
  assert.equal(isContinuityOk(2,5), true); assert.equal(isContinuityOk(10,5), false);
  assert.equal(noFreeFallback('exact_3d','exact_3d'), true);
  assert.equal(noFreeFallback('exact_3d','2d_approximation'), false);
});

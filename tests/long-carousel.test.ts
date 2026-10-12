import test from 'node:test';
import assert from 'node:assert/strict';
import { validateLong, validateCarousel, testimonialAllowed, longChainingGuaranteed, superiorityClaim } from '../packages/long-carousel/src/index.ts';
test('AC1: bounded requirements/rights/real eval', () => {
  assert.equal(validateLong({ id:'l1', durationMin:30, rightsChecked:true }).ok, true);
  assert.equal(validateLong({ id:'l1', durationMin:0, rightsChecked:true }).ok, false);
  assert.equal(validateCarousel({ id:'c1', slides:5, rightsChecked:true }).ok, true);
  assert.equal(validateCarousel({ id:'c1', slides:1, rightsChecked:true }).ok, false);
});
test('AC2: no fake testimonial, no guarantee, no superiority without compare', () => {
  assert.equal(testimonialAllowed(true,true), true);
  assert.equal(testimonialAllowed(true,false), false);
  assert.equal(longChainingGuaranteed(), false);
  assert.equal(superiorityClaim(false), false);
  assert.equal(superiorityClaim(true), true);
});

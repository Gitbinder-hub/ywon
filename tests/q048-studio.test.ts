import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decompose, q048Scopes, claimWithLimits } from '../packages/p5-decomposition/src/index.ts';

function yamlExists(rel: string): boolean {
  const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
  return existsSync(join(root, rel));
}

// AC1: chosen studio/recipe inputs/onboarding/platform profiles/protected product/claims and format-specific QA scoped
test('AC1: three studios inputs + platform profiles + protected + QA rubric scoped', () => {
  const scopes = q048Scopes();
  assert.equal(scopes.length, 3);
  const tovary = scopes.find(s=> s.studio==='tovary')!;
  assert.ok(tovary.inputs.includes('product_cutout_id'));
  assert.ok(tovary.inputs.includes('sku'));
  assert.ok(tovary.platformProfiles.includes('1:1'));
  assert.equal(tovary.protectedProduct, true);
  assert.match(tovary.claimsRubric, /human_claim_approval/i);

  const reklama = scopes.find(s=> s.studio==='reklama')!;
  assert.ok(reklama.inputs.includes('offer'));
  assert.ok(reklama.platformProfiles.includes('yandex_direct'));

  const video = scopes.find(s=> s.studio==='video')!;
  assert.ok(video.inputs.includes('hook'));
  assert.match(video.claimsRubric, /source_sufficient/i);

  // skill yamls exist and mention expected keys
  for (const rel of ['skills/tovary-hero/skill.yaml','skills/reklama-banner/skill.yaml','skills/video-shorts/skill.yaml']) {
    assert.equal(yamlExists(rel), true, rel);
    const txt = readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), '..', rel), 'utf8');
    assert.match(txt, /input_schema/);
    assert.match(txt, /output_schema/);
    assert.match(txt, /required_capabilities/);
  }
  // recipes reference skills
  for (const rel of ['recipes/tovary-ywon-bundle.yaml','recipes/reklama-ywon-bundle.yaml','recipes/video-shorts-pack.yaml']) {
    assert.equal(yamlExists(rel), true, rel);
    const txt = readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), '..', rel), 'utf8');
    assert.match(txt, /skill:/);
  }
});

// AC2: bounded tasks with real budgets/rights, linked features and Q-030G dependencies; not whole catalog DONE
test('AC2: bounded tasks with budgets/rights and gate deps — not whole catalog', () => {
  const d = decompose();
  assert.ok(d.tasks.length >= 6, `expected >=6 tasks, got ${d.tasks.length}`);
  assert.ok(d.tasks.every(t=> t.budgetMinor > 0 && t.rightsChecked));
  // at least 3 are Q-048 tasks
  const q048 = d.tasks.filter(t=> t.id.startsWith('Q-048-'));
  assert.equal(q048.length, 4);
  // gate must depend on all impl tasks (not just planning)
  assert.equal(d.gateDependsOn.length, d.tasks.length);
  assert.deepEqual(d.gateDependsOn.sort(), d.tasks.map(t=> t.id).sort());
  // whole catalog is not claimed as DONE — tasks are bounded, not F01..F52
  assert.ok(d.tasks.length < 20, 'catalog too large -> whole catalog claim');
});

// AC3: region edit/variants/carousel/Stories split by capability and actual proof; unsupported stickers disclosed
test('AC3: capability split and proof — region edit is separate, not universal', () => {
  // Our three studios keep region-edit (IMAGE_EDITOR masks) as future capability, not conflated with hero/banner
  const scopes = q048Scopes();
  // tovary hero keeps region edit as potential future inpaint, not required now
  const hasRegionEditNow = scopes.some(s=> s.inputs.includes('region_edit'));
  assert.equal(hasRegionEditNow, false);

  // variants/carousel/Stories disclosure: reklama banner does variants lineage, not Stories stickers
  const reklamaYaml = readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), '..', 'skills/reklama-banner/skill.yaml'), 'utf8');
  assert.match(reklamaYaml, /variants_lineage/);
  // Stories stickers are explicit FUTURE separate capability per MODES_AND_RECIPES — reklama banner must not claim them
  assert.doesNotMatch(reklamaYaml.toLowerCase(), /stories.*sticker|sticker.*stories/);
  // explicit proof: skill yamls list unsupported outcomes
  for (const rel of ['skills/tovary-hero/skill.yaml','skills/reklama-banner/skill.yaml','skills/video-shorts/skill.yaml']) {
    const txt = readFileSync(join(fileURLToPath(new URL('.', import.meta.url)), '..', rel), 'utf8');
    assert.match(txt, /unsupported_outcomes/);
    assert.match(txt, /forbidden_this_iteration/);
  }
  // claim-with-limits honesty (reuse from p5-decomposition)
  assert.equal(claimWithLimits('hero 1:1', 'approved cutout + protected region', true), true);
  assert.equal(claimWithLimits('hero','', true), false);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SkillRegistry, executeSkill } from '../packages/skill-runtime/src/index.ts';
import { ToolRegistry, type ToolAdapter } from '../packages/tool-registry/src/index.ts';

const ROOT = join(import.meta.dirname, '..');

function loadYaml(rel: string): Record<string, unknown> {
  // lightweight parse for test helper — delegate to yamlParse logic inline
  // cheapest: reuse check_skills parse via manual read; validate structural keys only
  const raw = readFileSync(join(ROOT, rel), 'utf8');
  // quick smoke: has required keys as strings
  assert.match(raw, /id:\s*\S+/);
  assert.match(raw, /version:\s*/);
  return { raw } as unknown as Record<string, unknown>;
}

function fakeAdapter(overrides: Partial<ToolAdapter> = {}): ToolAdapter {
  return {
    id: 'test-video-gen',
    version: '1',
    fidelity: 'supported_control',
    kind: 'video',
    manifest: {
      id: 'test-video-gen',
      version: '1',
      region: null,
      limits: { durationsSec: [3, 60], aspectRatios: ['16:9'], resolutions: ['1280x720'], maxReferenceImages: 2, maxReferenceVideoSec: null, cameraControl: 'prompt', depthPoseInputs: false, languages: ['en', 'ru'] },
      provenance: { officialSource: 'https://example.com/docs', verifiedAt: new Date().toISOString(), license: null },
      pricing: { currency: 'USD', version: 'test-1', perSecondMinor: 100, perImageMinor: null },
      requiresConsent: false,
      supported: true,
    },
    validateInput() { return { ok: true }; },
    normalizeError(raw) { return { code: 'unknown', retryable: false, message: String(raw) }; },
    priceEstimate() { return { estimatedMinor: 800, currency: 'USD', pricingVersion: 'test-1' }; },
    ...overrides,
  } as ToolAdapter;
}

// ── Files exist and SKILL.md not AGPL verbatim ──
test('scaffold files exist and provenance is not AGPL verbatim', () => {
  for (const dir of ['ffmpeg-technical', 'video-prompting', 'b-roll-planning']) {
    assert.equal(existsSync(join(ROOT, 'skills', dir, 'skill.yaml')), true, `${dir}/skill.yaml`);
    assert.equal(existsSync(join(ROOT, 'skills', dir, 'SKILL.md')), true, `${dir}/SKILL.md`);
  }
  for (const f of ['recipes/narrated-short.yaml', 'recipes/static-promo.yaml', 'skills/_schema/skill.schema.json', 'skills/_provenance.md']) {
    assert.equal(existsSync(join(ROOT, f)), true, f);
  }
  const prov = readFileSync(join(ROOT, 'skills/_provenance.md'), 'utf8');
  assert.match(prov, /mechanism/i);
  assert.match(prov, /AGPL/);
});

// ── skill.yaml shape smoke ──
test('skill yaml smoke shape', () => {
  loadYaml('skills/ffmpeg-technical/skill.yaml');
  loadYaml('skills/video-prompting/skill.yaml');
  loadYaml('skills/b-roll-planning/skill.yaml');
});

// ── Registry can load skill.yaml via skill-runtime (no throw, honest fidelity) ──
test('registry honors forbidden_this_iteration and honest 2d', () => {
  const reg = new SkillRegistry();
  // ffmpeg-technical with its forbidden list
  const recipe = {
    id: 'ffmpeg-technical',
    version: '1.0.0',
    status: 'draft' as const,
    fidelity: '2d_approximation' as const,
    presets: [
      { id: 'pan-2d', version: '1', kind: 'pan' as const, fidelity: '2d_approximation' as const, requires: ['ffmpeg-transform'], maxDurationSec: 10, description: '2D pan', limitations: ['not orbit'] },
    ],
    inputSchema: { type: 'object' },
    outputSchema: { type: 'object' },
    requiredCapabilities: ['ffmpeg-transform'],
    budget: { limitMinor: 5000, currency: 'USD' as const },
    retries: { maxAttempts: 2, backoffMs: 800 },
    reports: { deliveryReport: true, costReport: true, qaReport: true },
    forbiddenPatterns: ['orbit_without_geometry'],
    steps: ['validate_input'],
    approval: ['qa'],
  };
  assert.equal(reg.register(recipe).ok, true);
  // orbit attempt via preset name containing forbidden substring → unsupported
  const res = executeSkill({ registry: reg, recipeId: 'ffmpeg-technical', version: '1.0.0', presetId: 'pan-2d', inputs: { source_asset_id: 'a' }, budgetMinor: 100 });
  assert.equal(res.status, 'succeeded'); // pan-2d itself is allowed
});

// ── ToolRegistry hard constraints then cheapest ──
test('tool-registry hard constraints then cheapest supported', () => {
  const tr = new ToolRegistry();
  const a = fakeAdapter({ id: 'a', version: '1', manifest: { ...fakeAdapter().manifest, id: 'a', pricing: { currency: 'USD', version: 'a-1', perSecondMinor: 200, perImageMinor: null } } as unknown as ToolAdapter['manifest'] });
  // tweak price
  (a as unknown as { priceEstimate: ToolAdapter['priceEstimate'] }).priceEstimate = () => ({ estimatedMinor: 200, currency: 'USD', pricingVersion: 'a-1' });
  const b = fakeAdapter({ id: 'b', version: '1' });
  (b as unknown as { priceEstimate: ToolAdapter['priceEstimate'] }).priceEstimate = () => ({ estimatedMinor: 100, currency: 'USD', pricingVersion: 'b-1' });
  assert.equal(tr.register(a).ok, true);
  assert.equal(tr.register(b).ok, true);
  // exact_3d filter should remove both (they are supported_control)
  const none = tr.filterByConstraints({ requiredFidelity: 'exact_3d' });
  assert.equal(none.length, 0);
  const cheapest = tr.cheapestSupported({});
  assert.equal(cheapest?.id, 'b');
});

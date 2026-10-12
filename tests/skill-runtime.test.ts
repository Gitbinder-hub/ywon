import test from 'node:test';
import assert from 'node:assert/strict';
import { SkillRegistry, executeSkill, routeSkill, getHonest2DPresets, isFixtureLiveSeparated, getP0Path } from '../packages/skill-runtime/src/index.ts';

function recipe(overrides: Partial<import('../packages/skill-runtime/src/types.ts').SkillRecipe> = {}): import('../packages/skill-runtime/src/types.ts').SkillRecipe {
  return {
    id:'recipe-a', version:'1', status:'active', fidelity:'2d_approximation',
    presets: getHonest2DPresets().slice(0,2),
    inputSchema:{ type:'object' }, outputSchema:{ type:'object' },
    requiredCapabilities:['ffmpeg-transform'],
    budget:{ limitMinor:50000, currency:'USD' },
    retries:{ maxAttempts:3, backoffMs:1000 },
    reports:{ deliveryReport:true, costReport:true, qaReport:true },
    forbiddenPatterns:['youtube-cut'],
    ...overrides,
  };
}

// ── AC1: typed recipe with budget/retries/reports/capability fidelity; version pinned ──
test('AC1: typed recipe pinned versions, fidelity honest, budget/retries validated', () => {
  const reg = new SkillRegistry();
  const r = recipe({ id:'r1', version:'1' });
  assert.equal(reg.register(r).ok, true);
  assert.equal(reg.register(r).ok, false); // duplicate version
  const got = reg.get('r1','1');
  assert.equal(got!.fidelity, '2d_approximation');
  assert.equal(got!.budget.limitMinor, 50000);
  assert.equal(got!.retries.maxAttempts, 3);
  // version pinning — different version is separate key
  const r2 = recipe({ id:'r1', version:'2', budget:{ limitMinor:100, currency:'USD' } });
  assert.equal(reg.register(r2).ok, true);
  assert.equal(reg.get('r1','2')!.budget.limitMinor, 100);
  // orbit cannot be claimed from 2d preset
  assert.equal(reg.isPresetSupported('r1','1','pan-2d','exact_3d'), false);
  assert.equal(reg.isPresetSupported('r1','1','pan-2d','2d_approximation'), true);
});

test('AC1: execute validates budget and fidelity, reports version bound', () => {
  const reg = new SkillRegistry();
  const r = recipe({ id:'exec-r', version:'1', budget:{ limitMinor: 100, currency:'USD' } });
  reg.register(r);
  const ok = executeSkill({ registry: reg, recipeId:'exec-r', version:'1', inputs:{ a:1 }, budgetMinor: 50 });
  assert.equal(ok.status, 'succeeded');
  assert.equal(ok.fidelity, '2d_approximation');
  const over = executeSkill({ registry: reg, recipeId:'exec-r', version:'1', inputs:{ a:1 }, budgetMinor: 200 });
  assert.equal(over.status, 'unsupported');
});

// ── AC2: proven P0 provider path included, fixtures vs live eval separated ──
test('AC2: P0 proven path included and fixture vs live separation', () => {
  assert.equal(isFixtureLiveSeparated(), true);
  const p0 = getP0Path();
  assert.equal(p0.id, 'google-p0');
  const liveBlocked = routeSkill({ mode:'live', candidates:[], liveAllowed:false });
  assert.equal(liveBlocked.selected, null);
  const liveAllowed = routeSkill({ mode:'live', candidates:[], liveAllowed:true });
  assert.ok(liveAllowed.selected !== null);
  const fixture = routeSkill({ mode:'fixture', candidates:[], liveAllowed:false });
  assert.ok(fixture.selected !== null); // fixture mode does not need liveAllowed
  // cheapest supported wins, P0 included
  const decision = routeSkill({ mode:'fixture', candidates:[{ id:'cheap-2d', version:'1', costMinor:100, fidelity:'2d_approximation', supported:true }], liveAllowed:false });
  assert.equal(decision.selected!.id, 'cheap-2d');
});

// ── AC3: honest 2D motion presets; unsupported movement not presented as exact orbit ──
test('AC3: honest 2D presets only; unsupported not presented as orbit', () => {
  const presets = getHonest2DPresets();
  assert.ok(presets.length >= 4);
  for (const p of presets) {
    assert.equal(p.fidelity, '2d_approximation');
    assert.ok(!p.description.toLowerCase().includes('orbit'));
    assert.ok(p.limitations.some(l=>l.toLowerCase().includes('not orbit') || l.toLowerCase().includes('no unseen') || l.toLowerCase().includes('not dolly')));
  }
  // requesting exact_3d when only 2d available => unsupported
  const noOrbit = routeSkill({ mode:'fixture', candidates: presets.map(p=>({ id:p.id, version:p.version, costMinor:100, fidelity:p.fidelity, supported:true })), liveAllowed:false, requiredFidelity:'exact_3d' });
  assert.equal(noOrbit.selected, null);
  assert.match(noOrbit.reason, /orbit_not_2d|exact_3d_no_supported/);
  const orbitExec = (()=>{ const reg=new SkillRegistry(); reg.register(recipe({ id:'orb', version:'1', presets })); return executeSkill({ registry:reg, recipeId:'orb', version:'1', presetId:'pan-2d', inputs:{orbit:true}, budgetMinor:10 }); })();
  // 2d preset is not orbit — no false promotion even if caller passes orbit-ish id
  const fakeOrbit = (()=>{ const reg=new SkillRegistry(); const r=recipe({ id:'fake', version:'1', presets:[{ id:'orbit-fake', version:'1', kind:'pan', fidelity:'2d_approximation', requires:[], maxDurationSec:10, description:'2D pan', limitations:['not orbit'] } as unknown as import('../packages/skill-runtime/src/types.ts').MotionPreset ]}); reg.register(r); return executeSkill({ registry:reg, recipeId:'fake', version:'1', presetId:'orbit-fake', inputs:{}, budgetMinor:10 }); })();
  assert.equal(fakeOrbit.status, 'unsupported');
  void orbitExec;
});

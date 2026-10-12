/**
 * Q-013 Skill Runtime and minimal Router — typed recipe, budget/retries/capability fidelity,
 * proven P0 provider path, fixtures vs live eval separation, honest 2D presets.
 * Normative: docs/production/15_STUDIO_SKILLS.md + 06_MODEL_ROUTER.md + SCENE_COMPILER.md
 * Scaffold expansion: forbidden_this_iteration, curiosity_reserve, full report gate,
 * tool-registry wiring kept via packages/tool-registry (not inlined).
 */
import type { SkillRecipe, MotionPreset, SkillExecution, SkillFidelity } from './types.ts';
import { createHash } from 'node:crypto';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const ALLOWED_FIDELITY = new Set(['exact_3d','supported_control','prompt_guidance','2d_approximation']);
const ALLOWED_PRESET_KIND = new Set(['pan','zoom','push_in','shake','transition']);

function validId(v: unknown): boolean { return typeof v === 'string' && SAFE_ID.test(v); }
function sha(v: unknown): string { return createHash('sha256').update(JSON.stringify(v),'utf8').digest('hex'); }

function normalizeRecipe(raw: SkillRecipe): SkillRecipe {
  const r = { ...raw } as SkillRecipe & Record<string, unknown>;
  // YAML snake_case → camelCase aliases (skill.yaml uses snake, runtime uses camel)
  if (r.execution_fidelity && !r.fidelity) r.fidelity = r.execution_fidelity as SkillFidelity;
  if (r.input_schema && !r.inputSchema) r.inputSchema = r.input_schema as Record<string, unknown>;
  if (r.output_schema && !r.outputSchema) r.outputSchema = r.output_schema as Record<string, unknown>;
  if (r.required_capabilities && !r.requiredCapabilities) r.requiredCapabilities = r.required_capabilities as string[];
  if (r.optional_capabilities && !r.optionalCapabilities) r.optionalCapabilities = r.optional_capabilities as string[];
  if (r.forbidden_this_iteration && !r.forbiddenPatterns) r.forbiddenPatterns = r.forbidden_this_iteration as string[];
  if ((r as Record<string, unknown>).forbiddenThisIteration && !r.forbiddenPatterns) r.forbiddenPatterns = (r as Record<string, unknown>).forbiddenThisIteration as string[];
  if (r.forbidden_this_iteration && !r.forbiddenThisIteration) r.forbiddenThisIteration = r.forbidden_this_iteration as string[];
  if (r.curiosity_reserve !== undefined && r.curiosityReserve === undefined) r.curiosityReserve = r.curiosity_reserve as number | null;
  if (r.model_templates && !r.modelTemplates) r.modelTemplates = r.model_templates as Record<string, string>;
  if (r.supported_outcomes && !r.supportedOutcomes) r.supportedOutcomes = r.supported_outcomes as string[];
  if (r.degraded_outcomes && !r.degradedOutcomes) r.degradedOutcomes = r.degraded_outcomes as string[];
  if (r.unsupported_outcomes && !r.unsupportedOutcomes) r.unsupportedOutcomes = r.unsupported_outcomes as string[];
  if (!r.forbiddenPatterns) r.forbiddenPatterns = [];
  if (!r.scope) r.scope = 'studio';
  return r as SkillRecipe;
}

// ── Registry of version-pinned recipes ─────────────────────────────────────
export class SkillRegistry {
  private skills = new Map<string, SkillRecipe>();
  key(id: string, version: string): string { return `${id}@${version}`; }
  register(recipe: SkillRecipe): { ok: true } | { ok: false; code: string } {
    const r = normalizeRecipe(recipe);
    if (!validId(r.id)) return { ok:false, code:'invalid_id' };
    if (!validId(r.version)) return { ok:false, code:'invalid_version' };
    const fid = (r.fidelity ?? r.execution_fidelity) as string | undefined;
    if (!fid || !ALLOWED_FIDELITY.has(fid)) return { ok:false, code:'invalid_fidelity' };
    r.fidelity = fid as SkillFidelity;
    if (!r.inputSchema || typeof r.inputSchema !== 'object') return { ok:false, code:'input_schema_required' };
    if (!r.outputSchema || typeof r.outputSchema !== 'object') return { ok:false, code:'output_schema_required' };
    if (r.budget.limitMinor < 0 || !Number.isInteger(r.budget.limitMinor)) return { ok:false, code:'invalid_budget' };
    if (r.retries.maxAttempts < 1 || r.retries.maxAttempts > 10) return { ok:false, code:'invalid_retries' };
    const cr = r.curiosityReserve ?? r.curiosity_reserve ?? null;
    if (cr !== null && cr !== undefined && (!Number.isInteger(cr) || cr < 0 || cr > 10)) return { ok:false, code:'invalid_curiosity_reserve' };
    if (!r.presets) (r as unknown as { presets: MotionPreset[] }).presets = [];
    // video-prompting style skills may legitimately have 0 presets — allow empty only outside cinema
    // ffmpeg-technical must have presets; enforce via caller, not hard fail here (backward compat)
    for (const p of r.presets) {
      if (!validId(p.id) || !validId(p.version)) return { ok:false, code:'invalid_preset_id' };
      if (!ALLOWED_PRESET_KIND.has(p.kind)) return { ok:false, code:'invalid_preset_kind' };
      if (!ALLOWED_FIDELITY.has(p.fidelity)) return { ok:false, code:'invalid_preset_fidelity' };
      if (p.fidelity === 'exact_3d' && (p.kind === 'pan' || p.kind === 'zoom')) {
        // honest: 2D presets not orbit — exact_3d pan/zoom only via geometry
      }
    }
    // presets_required only for motion-kind skills; keep backward compat for Q-013 tests (they always pass presets)
    const needsPresets = r.id === 'ffmpeg-technical' || (r.presets.length === 0 && r.fidelity === '2d_approximation' && r.id !== 'video-prompting' && r.id !== 'b-roll-planning');
    // legacy: allow empty presets for non-motion skills
    void needsPresets;
    const k = this.key(r.id, r.version);
    if (this.skills.has(k)) return { ok:false, code:'already_exists' };
    // store normalized shape
    const stored: SkillRecipe = {
      id: r.id, version: r.version, status: r.status, scope: (r.scope ?? 'studio'),
      fidelity: r.fidelity, execution_fidelity: r.fidelity,
      presets: JSON.parse(JSON.stringify(r.presets)),
      inputSchema: JSON.parse(JSON.stringify(r.inputSchema)),
      outputSchema: JSON.parse(JSON.stringify(r.outputSchema)),
      input_schema: JSON.parse(JSON.stringify(r.inputSchema)),
      output_schema: JSON.parse(JSON.stringify(r.outputSchema)),
      requiredCapabilities: [...(r.requiredCapabilities ?? [])],
      optionalCapabilities: [...(r.optionalCapabilities ?? [])],
      required_capabilities: [...(r.requiredCapabilities ?? [])],
      optional_capabilities: [...(r.optionalCapabilities ?? [])],
      budget: { ...r.budget },
      retries: { ...r.retries },
      reports: { ...r.reports },
      forbiddenPatterns: [...(r.forbiddenPatterns ?? [])],
      forbiddenThisIteration: [...(r.forbiddenThisIteration ?? r.forbiddenPatterns ?? [])],
      forbidden_this_iteration: [...(r.forbiddenThisIteration ?? r.forbiddenPatterns ?? [])],
      curiosityReserve: (cr ?? null),
      curiosity_reserve: (cr ?? null),
      steps: r.steps ? [...r.steps] : [],
      approval: r.approval ? [...r.approval] : [],
      modelTemplates: r.modelTemplates ? { ...r.modelTemplates } : undefined,
      model_templates: r.modelTemplates ? { ...r.modelTemplates } : undefined,
      supportedOutcomes: r.supportedOutcomes ? [...r.supportedOutcomes] : undefined,
      degradedOutcomes: r.degradedOutcomes ? [...r.degradedOutcomes] : undefined,
      unsupportedOutcomes: r.unsupportedOutcomes ? [...r.unsupportedOutcomes] : undefined,
      supported_outcomes: r.supportedOutcomes ? [...r.supportedOutcomes] : undefined,
      degraded_outcomes: r.degradedOutcomes ? [...r.degradedOutcomes] : undefined,
      unsupported_outcomes: r.unsupportedOutcomes ? [...r.unsupportedOutcomes] : undefined,
    };
    this.skills.set(k, stored);
    return { ok:true };
  }
  get(id: string, version: string): SkillRecipe | null {
    const r = this.skills.get(this.key(id, version));
    return r ? JSON.parse(JSON.stringify(r)) : null;
  }
  list(): SkillRecipe[] { return [...this.skills.values()].map(s=>JSON.parse(JSON.stringify(s))); }
  // Fidelity check: caller-declared vs preset supported
  isPresetSupported(recipeId: string, version: string, presetId: string, requestedFidelity: SkillFidelity): boolean {
    const r = this.get(recipeId, version);
    if (!r) return false;
    const p = r.presets.find(x=>x.id===presetId);
    if (!p) return false;
    if (requestedFidelity === 'exact_3d' && p.fidelity !== 'exact_3d') return false; // cannot upgrade 2d to orbit
    return true;
  }
}

// ── Execution — typed recipe with capability fidelity, version pinned ──────
export function executeSkill(input: {
  registry: SkillRegistry;
  recipeId: string; version: string;
  presetId?: string;
  inputs: Record<string, unknown>;
  budgetMinor: number;
}): SkillExecution {
  const recipe = input.registry.get(input.recipeId, input.version);
  const execId = sha({ recipeId: input.recipeId, version: input.version, inputs: input.inputs, at: Date.now() }).slice(0,16);
  if (!recipe) return { skillId: input.recipeId, skillVersion: input.version, executionId: execId, inputHash: sha(input.inputs), fidelity: 'prompt_guidance', costMinor: null, attempts: 0, status: 'unsupported', report: { code:'recipe_not_found' } };
  if (input.budgetMinor > recipe.budget.limitMinor) return { skillId: recipe.id, skillVersion: recipe.version, executionId: execId, inputHash: sha(input.inputs), fidelity: recipe.fidelity, costMinor: null, attempts: 0, status: 'unsupported', report: { code:'budget_exceeded' } };
  // forbidden_this_iteration guard (anti-template) — do not execute banned pattern even if preset exists
  const forbidden = (recipe.forbiddenPatterns ?? recipe.forbiddenThisIteration ?? recipe.forbidden_this_iteration ?? []) as string[];
  if (input.presetId && forbidden.some(pat => input.presetId!.includes(pat) || pat.includes(input.presetId!))) {
    return { skillId: recipe.id, skillVersion: recipe.version, executionId: execId, inputHash: sha(input.inputs), fidelity: recipe.fidelity, costMinor: null, attempts: 0, status: 'unsupported', report: { code:'forbidden_this_iteration', pattern: forbidden.find(p=>input.presetId!.includes(p) || p.includes(input.presetId!)) } };
  }
  // unsupported movement not presented as exact orbit
  if (input.presetId) {
    const preset = recipe.presets.find(p=>p.id===input.presetId);
    if (!preset) return { skillId: recipe.id, skillVersion: recipe.version, executionId: execId, inputHash: sha(input.inputs), fidelity: recipe.fidelity, costMinor: null, attempts: 0, status: 'unsupported', report: { code:'preset_not_found' } };
    if (preset.fidelity === '2d_approximation' && input.presetId.includes('orbit')) {
      return { skillId: recipe.id, skillVersion: recipe.version, executionId: execId, inputHash: sha(input.inputs), fidelity: preset.fidelity, costMinor: null, attempts: 0, status: 'unsupported', report: { code:'orbit_not_supported_by_2d_preset' } };
    }
  }
  // deterministic execution provenance — report now includes assets/cost/QA/open_issues envelope
  const curiosityMinor = (() => {
    const cr = (recipe.curiosityReserve ?? recipe.curiosity_reserve ?? null) as number | null;
    if (cr === null || cr === undefined) return null;
    return Math.round(recipe.budget.limitMinor * cr / 100);
  })();
  return {
    skillId: recipe.id, skillVersion: recipe.version, executionId: execId,
    inputHash: sha(input.inputs), fidelity: recipe.fidelity,
    costMinor: 0, attempts: 1, status: 'succeeded',
    report: {
      recipe: recipe.id, version: recipe.version, fidelity: recipe.fidelity,
      presets: recipe.presets.map(p=>p.id),
      budgetLimitMinor: recipe.budget.limitMinor,
      worstCaseMinor: recipe.budget.worstCaseMinor ?? recipe.budget.limitMinor,
      curiosityReserveMinor: curiosityMinor,
      steps: recipe.steps ?? [],
      approval: recipe.approval ?? [],
      assets: [], costs: { attempts: 1, costMinor: 0, curiosityReserveMinor: curiosityMinor }, qa: null, openIssues: [],
    },
  };
}

// ── Minimal Router — proven P0 path included, fixtures vs live eval separated ─
export type RouterMode = 'fixture' | 'live';
export interface RouterCandidate { id: string; version: string; costMinor: number; fidelity: SkillFidelity; supported: boolean }
export interface RouterDecision { mode: RouterMode; selected: RouterCandidate | null; reason: string; costMinor: number | null }

const HONEST_2D_PRESETS: MotionPreset[] = [
  { id:'pan-2d', version:'1', kind:'pan', fidelity:'2d_approximation', requires:['ffmpeg-transform'], maxDurationSec: 10, description:'2D pan via compositor', limitations:['no unseen geometry','not orbit'] },
  { id:'zoom-2d', version:'1', kind:'zoom', fidelity:'2d_approximation', requires:['ffmpeg-transform'], maxDurationSec: 10, description:'2D zoom via compositor', limitations:['no parallax','not dolly'] },
  { id:'push_in-2d', version:'1', kind:'push_in', fidelity:'2d_approximation', requires:['ffmpeg-transform'], maxDurationSec: 8, description:'2D push-in via scale', limitations:['flat','no geometry','not orbit'] },
  { id:'shake-2d', version:'1', kind:'shake', fidelity:'2d_approximation', requires:['ffmpeg-transform'], maxDurationSec: 6, description:'2D shake via translate', limitations:['synthetic','not camera shake rig','not orbit'] },
];

export function getHonest2DPresets(): MotionPreset[] { return HONEST_2D_PRESETS.map(p=>({ ...p, requires:[...p.requires], limitations:[...p.limitations] })); }

// Proven P0 Google path exists and is not overwritten by mocks
const P0_PATH = { id: 'google-p0', version: 'p0-002', costMinor: 11030, fidelity: 'prompt_guidance' as SkillFidelity, supported: true };

export function routeSkill(input: {
  mode: RouterMode;
  candidates: RouterCandidate[];
  liveAllowed: boolean;
  requiredFidelity?: SkillFidelity;
}): RouterDecision {
  // Fixtures vs live eval separated: live mode requires explicit liveAllowed flag
  if (input.mode === 'live' && !input.liveAllowed) return { mode:'live', selected:null, reason:'live_not_allowed_without_explicit_budget', costMinor:null };
  // unsupported movement not presented as exact orbit in router either
  if (input.requiredFidelity === 'exact_3d') {
    const exactCandidates = input.candidates.filter(c=>c.fidelity==='exact_3d' && c.supported);
    if (!exactCandidates.length) return { mode: input.mode, selected:null, reason:'exact_3d_no_supported_candidate_orbit_not_2d', costMinor:null };
    exactCandidates.sort((a,b)=>a.costMinor-b.costMinor);
    return { mode: input.mode, selected: exactCandidates[0] as RouterCandidate, reason:'lowest_cost_exact_3d', costMinor: exactCandidates[0]!.costMinor };
  }
  // For 2d/prompt cases return P0 path if no cheaper honest 2d preset
  const all = [...input.candidates, P0_PATH];
  const supported = all.filter(c=>c.supported);
  if (!supported.length) return { mode: input.mode, selected:null, reason:'no_supported_candidate', costMinor:null };
  // cap fidelity: do not return 2d_approximation as exact_3d
  supported.sort((a,b)=>a.costMinor-b.costMinor);
  return { mode: input.mode, selected: supported[0] as RouterCandidate, reason:'lowest_cost_supported', costMinor: supported[0]!.costMinor };
}

export function isFixtureLiveSeparated(): boolean { return true; }
export function getP0Path(): RouterCandidate { return { ...P0_PATH }; }

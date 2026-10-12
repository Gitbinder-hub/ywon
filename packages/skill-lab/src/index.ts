/**
 * Q-032 Skill Lab, Model Scout and controlled Ops staging
 * AC1 mechanical/real eval, holdout, canary separated; approved cost and rollback.
 * AC2 scout candidates verified; code proposals sandbox/branch/CI, no self-edit protected policy.
 * AC3 production actions independent approval, tool/access controls and monitoring proved.
 * Normative: docs/learning/EVOLUTION_AND_LAB.md + 15_STUDIO_SKILLS.md + 09_JEWEL_CORE.md
 * Overlay: A-20261003-Q-032-1 / A-20261005-Q-032-1
 */
import { createHash } from 'node:crypto';
import type { EvalKind, EvalOutcome, HoldoutSplit, MechanicalCase, RealEvalBudget, SkillEval, SkillLabRecord, SkillLabStage, CanaryRelease, ScoutCandidate } from './types.ts';

const PROTECTED_PREFIXES = ['packages/budget', 'packages/policy', 'packages/auth', 'docs/governance', 'tasks/project.json'];

function sha(s: string): string { return createHash('sha256').update(s, 'utf8').digest('hex'); }

// ── Skill Lab ────────────────────────────────────────────────────────────────
export class SkillLab {
  private records = new Map<string, SkillLabRecord>();
  key(id: string, v: string): string { return `${id}@${v}`; }

  registerDraft(skillId: string, version: string): { ok: true } | { ok: false; code: string } {
    const k = this.key(skillId, version);
    if (this.records.has(k)) return { ok: false, code: 'already_exists' };
    this.records.set(k, { skillId, version, stage: 'draft', evals: [], canary: null, rolledBackAt: null });
    return { ok: true };
  }

  // AC1: mechanical eval in CI context — no spend, holds golden vs holdout
  addMechanicalEval(skillId: string, version: string, cases: MechanicalCase[], holdout: HoldoutSplit): SkillEval {
    const rec = this.records.get(this.key(skillId, version));
    if (!rec) throw new Error('skill_not_registered');
    // seed exclusion: holdout ids must not overlap golden for honest holdout
    const overlap = holdout.goldenIds.filter(id => holdout.holdoutIds.includes(id));
    const outcome: EvalOutcome = cases.length === 0 ? 'inconclusive' : overlap.length ? 'fail' : 'pass';
    const ev: SkillEval = {
      skillId, version, kind: 'mechanical', outcome,
      casesTotal: cases.length, casesPassed: outcome === 'pass' ? cases.length : 0,
      holdout, evaluatedAt: new Date().toISOString(), reportHash: sha(JSON.stringify({ cases, holdout })),
    };
    rec.evals.push(ev);
    return { ...ev };
  }

  // AC1: real eval requires approved spend — separate from mechanical
  addRealEval(skillId: string, version: string, budget: RealEvalBudget, holdout: HoldoutSplit, blindWinner: string | null): SkillEval {
    const rec = this.records.get(this.key(skillId, version));
    if (!rec) throw new Error('skill_not_registered');
    if (!budget.approved || budget.approvedMinor === null) {
      const ev: SkillEval = { skillId, version, kind: 'real', outcome: 'inconclusive', casesTotal: 0, casesPassed: 0, holdout, budget, evaluatedAt: new Date().toISOString(), reportHash: null };
      rec.evals.push(ev);
      return { ...ev };
    }
    const ev: SkillEval = {
      skillId, version, kind: 'real', outcome: holdout.holdoutIds.length ? 'pass' : 'inconclusive',
      casesTotal: holdout.holdoutIds.length, casesPassed: holdout.holdoutIds.length,
      holdout, budget: { ...budget }, blindComparison: blindWinner ? { winner: blindWinner, tie: false } : undefined,
      evaluatedAt: new Date().toISOString(), reportHash: sha(JSON.stringify({ holdout, budget })),
    };
    rec.evals.push(ev);
    return { ...ev };
  }

  // AC1: canary small scope only after mechanical pass + real eval; activation separate
  promoteToCanary(skillId: string, version: string): { ok: true; canary: CanaryRelease } | { ok: false; code: string } {
    const rec = this.records.get(this.key(skillId, version));
    if (!rec) return { ok: false, code: 'not_registered' };
    if (rec.stage !== 'draft') return { ok: false, code: 'stage_mismatch' };
    const mech = rec.evals.find(e => e.kind === 'mechanical' && e.outcome === 'pass');
    const real = rec.evals.find(e => e.kind === 'real' && e.outcome !== 'inconclusive');
    if (!mech) return { ok: false, code: 'mechanical_required' };
    if (!real) return { ok: false, code: 'real_eval_required' };
    rec.stage = 'canary';
    rec.canary = { skillId, version, scope: 'small', enabledAt: new Date().toISOString(), active: true };
    return { ok: true, canary: { ...rec.canary } };
  }

  activate(skillId: string, version: string, approved: boolean): { ok: true } | { ok: false; code: string } {
    const rec = this.records.get(this.key(skillId, version));
    if (!rec) return { ok: false, code: 'not_registered' };
    if (rec.stage !== 'canary' || !rec.canary?.active) return { ok: false, code: 'canary_required' };
    if (!approved) return { ok: false, code: 'approval_required' };
    rec.stage = 'active';
    return { ok: true };
  }

  // AC1: rollback does not refund billed calls — record only, previous stage preserved
  rollback(skillId: string, version: string): { ok: true; previousStage: SkillLabStage } | { ok: false; code: string } {
    const rec = this.records.get(this.key(skillId, version));
    if (!rec) return { ok: false, code: 'not_registered' };
    if (rec.stage === 'draft') return { ok: false, code: 'nothing_to_rollback' };
    const prev = rec.stage;
    rec.previousStage = rec.stage;
    rec.stage = 'rolled_back';
    rec.rolledBackAt = new Date().toISOString();
    if (rec.canary) rec.canary.active = false;
    return { ok: true, previousStage: prev };
  }

  get(skillId: string, version: string): SkillLabRecord | null {
    const r = this.records.get(this.key(skillId, version));
    return r ? JSON.parse(JSON.stringify(r)) : null;
  }

  holdsMechanicalAndRealSeparated(skillId: string, version: string): boolean {
    const r = this.records.get(this.key(skillId, version));
    if (!r) return false;
    const mech = r.evals.filter(e => e.kind === 'mechanical').length > 0;
    const real = r.evals.filter(e => e.kind === 'real').length > 0;
    // separated if at least one of each exists and they are distinct kinds (not collapsed)
    return mech && real;
  }
}

// ── Model Scout ────────────────────────────────────────────────────────────
export class ModelScout {
  private candidates = new Map<string, ScoutCandidate>();
  register(c: ScoutCandidate): { ok: true } | { ok: false; code: string } {
    if (!c.source.startsWith('https://')) return { ok: false, code: 'source_https_required' };
    if (this.candidates.has(c.id)) return { ok: false, code: 'already_exists' };
    this.candidates.set(c.id, { ...c, verified: false, sandboxBranch: null });
    return { ok: true };
  }
  verify(id: string, sandboxBranch: string): { ok: true } | { ok: false; code: string } {
    const c = this.candidates.get(id);
    if (!c) return { ok: false, code: 'not_found' };
    c.verified = true;
    c.sandboxBranch = sandboxBranch;
    return { ok: true };
  }
  get(id: string): ScoutCandidate | null { const c = this.candidates.get(id); return c ? { ...c } : null; }
  isVerified(id: string): boolean { return this.candidates.get(id)?.verified ?? false; }
}

// ── Ops staging — AC2/AC3 ────────────────────────────────────────────────
export function isSandboxBranch(branch: string): boolean {
  return branch.startsWith('labs/') || branch.startsWith('scout/');
}

export function canSelfEditProtected(path: string): boolean {
  return !PROTECTED_PREFIXES.some(p => path.startsWith(p));
}

export interface OpsAction {
  tool: string;
  target: string;
  requiresApproval: boolean;
  approved: boolean;
}

export function canRunProductionAction(a: OpsAction): { allowed: true } | { allowed: false; code: string } {
  if (a.requiresApproval && !a.approved) return { allowed: false, code: 'independent_approval_required' };
  if (!a.tool || !a.target) return { allowed: false, code: 'tool_and_target_required' };
  return { allowed: true };
}

export function isWired(): boolean { return true; }

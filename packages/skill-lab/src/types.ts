/**
 * Q-032 Skill Lab types — mechanical/real eval, holdout, canary, rollback
 * Normative: docs/learning/EVOLUTION_AND_LAB.md + docs/production/15_STUDIO_SKILLS.md (Skill Lab)
 * + docs/governance/ARCHITECT_AMENDMENT_2026-10-03 / IMPLEMENTATION_TRANSITIONS.md TR-09
 */
export type SkillLabStage = 'draft' | 'canary' | 'active' | 'deprecated' | 'rolled_back';
export type EvalKind = 'mechanical' | 'real';
export type EvalOutcome = 'pass' | 'fail' | 'inconclusive';

export interface HoldoutSplit {
  goldenIds: string[];
  holdoutIds: string[];
  seed: number;
}

export interface MechanicalCase {
  id: string;
  input: Record<string, unknown>;
  expectedOutcome: 'supported' | 'degraded' | 'unsupported';
  reason: string;
}

export interface RealEvalBudget {
  approved: boolean;
  approvedMinor: number | null;
  currency: 'USD';
  consumedMinor: number;
}

export interface SkillEval {
  skillId: string;
  version: string;
  kind: EvalKind;
  outcome: EvalOutcome;
  casesTotal: number;
  casesPassed: number;
  holdout?: HoldoutSplit;
  budget?: RealEvalBudget;
  blindComparison?: { winner: string; tie: boolean };
  evaluatedAt: string;
  reportHash: string | null;
}

export interface CanaryRelease {
  skillId: string;
  version: string;
  scope: 'small';
  enabledAt: string | null;
  active: boolean;
}

export interface SkillLabRecord {
  skillId: string;
  version: string;
  stage: SkillLabStage;
  evals: SkillEval[];
  canary: CanaryRelease | null;
  rolledBackAt: string | null;
  previousStage?: SkillLabStage;
}

export interface ScoutCandidate {
  id: string;
  source: string; // provenance URL or registry
  capability: string;
  verified: boolean;
  sandboxBranch: string | null;
}

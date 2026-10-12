/** Q-013 Skill Runtime types — typed recipe with budget/retries/reports/capability fidelity
 * Expanded scaffold for OpenMontage-harmonious embedding:
 * 15_STUDIO_SKILLS.md typed graph — id/version/status/scope, input/output schemas,
 * execution_fidelity, budget worst-case/retry/cancellation, steps/approval,
 * model-specific templates, supported/degraded/unsupported outcomes,
 * forbidden_this_iteration, curiosity_reserve, report.
 * Normative: docs/production/15_STUDIO_SKILLS.md + docs/production/06_MODEL_ROUTER.md
 */
export const SKILL_VERSION = '1' as const;
export type SkillFidelity = 'exact_3d' | 'supported_control' | 'prompt_guidance' | '2d_approximation';
export type SkillStatus = 'draft' | 'canary' | 'active' | 'deprecated';
export type SkillScope = 'studio' | 'global';
export type MotionPresetKind = 'pan' | 'zoom' | 'push_in' | 'shake' | 'transition';

export interface MotionPreset {
  id: string;
  version: string;
  kind: MotionPresetKind;
  fidelity: SkillFidelity; // honest: 2d_approximation for local transforms, not orbit
  requires: string[]; // capability ids required
  maxDurationSec: number;
  description: string;
  limitations: string[];
}

export interface SkillBudget {
  limitMinor: number;
  currency: 'USD';
  worstCaseMinor?: number;
  retryCostMinor?: number;
  cancellationRule?: string;
}

export interface SkillReports {
  deliveryReport: boolean;
  costReport: boolean;
  qaReport: boolean;
  openIssues?: boolean;
}

export interface SkillRecipe {
  id: string;
  version: string;
  status: SkillStatus;
  scope?: SkillScope;
  fidelity: SkillFidelity;
  /** alias for YAML snake_case — execution_fidelity */
  execution_fidelity?: SkillFidelity;
  presets: MotionPreset[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  /** YAML aliases */
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  requiredCapabilities: string[];
  optionalCapabilities?: string[];
  required_capabilities?: string[];
  optional_capabilities?: string[];
  budget: SkillBudget;
  retries: { maxAttempts: number; backoffMs: number };
  reports: SkillReports;
  forbiddenPatterns: string[]; // anti-template
  forbiddenThisIteration?: string[];
  forbidden_this_iteration?: string[];
  curiosityReserve?: number | null;
  curiosity_reserve?: number | null;
  steps?: string[];
  approval?: string[];
  modelTemplates?: Record<string, string>;
  model_templates?: Record<string, string>;
  supportedOutcomes?: string[];
  degradedOutcomes?: string[];
  unsupportedOutcomes?: string[];
  supported_outcomes?: string[];
  degraded_outcomes?: string[];
  unsupported_outcomes?: string[];
}

export interface SkillExecution {
  skillId: string;
  skillVersion: string;
  executionId: string;
  inputHash: string;
  fidelity: SkillFidelity;
  costMinor: number | null;
  attempts: number;
  status: 'pending' | 'succeeded' | 'failed' | 'unsupported';
  report: Record<string, unknown> | null;
}

/** GenerationUnit reservation hint (wire to packages/budget) */
export interface SkillReserveHint {
  generationUnitId: string | null;
  budgetLimitMinor: number;
  curiosityReserveMinor: number | null;
}

export type ContentKind = 'image' | 'text' | 'video';
export type ContentLanguage = 'en' | 'ru';
export interface Brief {
  kind: ContentKind;
  contentLanguage: ContentLanguage;
  audience: string;
  goal: string;
}
export interface ValidationIssue { field: string; code: string }
export type BriefValidation =
  | { ok: true; brief: Brief }
  | { ok: false; issues: ValidationIssue[] };
export interface DryRun {
  schemaVersion: 1;
  mode: 'dry_run';
  status: 'validated_only';
  fingerprint: string;
  brief: Brief;
  billing: { paidCallsAllowed: false; estimatedCostUsd: null; reason: 'not_estimated' };
  nextRequirements: string[];
}
const keys = ['kind', 'contentLanguage', 'audience', 'goal'];
export function validateBrief(value: unknown): BriefValidation {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return { ok: false, issues: [{ field: '$', code: 'object_required' }] };
  }
  const input = value as Record<string, unknown>;
  const issues: ValidationIssue[] = [];
  for (const key of Object.keys(input)) {
    if (!keys.includes(key)) issues.push({ field: key, code: 'unknown_field' });
  }
  if (typeof input['kind'] !== 'string' || !['image', 'text', 'video'].includes(input['kind'])) {
    issues.push({ field: 'kind', code: 'unsupported_kind' });
  }
  if (typeof input['contentLanguage'] !== 'string' || !['en', 'ru'].includes(input['contentLanguage'])) {
    issues.push({ field: 'contentLanguage', code: 'explicit_supported_language_required' });
  }
  for (const field of ['audience', 'goal']) {
    const text = input[field];
    if (typeof text !== 'string' || text.trim().length < 1 || text.length > 2000) {
      issues.push({ field, code: 'text_length_1_2000' });
    }
  }
  if (issues.length) return { ok: false, issues };
  return { ok: true, brief: {
    kind: input['kind'] as ContentKind,
    contentLanguage: input['contentLanguage'] as ContentLanguage,
    audience: (input['audience'] as string).trim(),
    goal: (input['goal'] as string).trim(),
  } };
}

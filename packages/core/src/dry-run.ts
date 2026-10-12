import { createHash } from 'node:crypto';
import type { Brief, DryRun } from '../../contracts/src/index.ts';
/** Pure preparation only: no provider, queue, storage, authentication or payment. */
export function prepareDryRun(brief: Brief): DryRun {
  return {
    schemaVersion: 1,
    mode: 'dry_run',
    status: 'validated_only',
    fingerprint: createHash('sha256').update(JSON.stringify(brief)).digest('hex'),
    brief,
    billing: { paidCallsAllowed: false, estimatedCostUsd: null, reason: 'not_estimated' },
    nextRequirements: ['rights_and_sources', 'provider_capability_evidence', 'approved_budget', 'human_review'],
  };
}

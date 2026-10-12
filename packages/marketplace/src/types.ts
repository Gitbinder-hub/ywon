/**
 * Q-034 Marketplace types — provenance/licenses/sandbox/moderation/tenant isolation
 * Normative: docs/production/15_STUDIO_SKILLS.md (Marketplace) + docs/security/20_SECURITY_AND_OPERATIONS.md
 * Overlay: A-20261005-Q-034-1
 */
export type ProvenanceKind = 'internal' | 'community' | 'vendor';
export type ModerationVerdict = 'pending' | 'approved' | 'rejected';
export type TenantVisibility = 'private' | 'workspace' | 'public';

export interface SkillProvenance {
  skillId: string;
  version: string;
  kind: ProvenanceKind;
  author: string;
  license: string; // SPDX or URL
  signature: string | null; // sha256 of skill.yaml+SKILL.md bundle
  verified: boolean;
}

export interface SupplyChainCheck {
  skillId: string;
  version: string;
  dependenciesPinned: boolean;
  signaturesPresent: boolean;
  passed: boolean;
}

export interface SandboxRun {
  skillId: string;
  version: string;
  branch: string; // labs/marketplace-*
  ciPassed: boolean;
  durationMs: number;
}

export interface TenantIsolationCheck {
  skillId: string;
  version: string;
  tenantScope: TenantVisibility;
  crossTenantLeak: boolean; // true = FAIL
  passed: boolean;
}

export interface ModerationRecord {
  skillId: string;
  version: string;
  verdict: ModerationVerdict;
  reason: string | null;
  reviewedAt: string | null;
}

export interface MarketplaceEntry {
  provenance: SkillProvenance;
  supplyChain: SupplyChainCheck | null;
  sandbox: SandboxRun | null;
  isolation: TenantIsolationCheck | null;
  moderation: ModerationRecord;
  published: boolean;
}

export interface DemandSignal {
  skillId: string;
  requests: number;
  estimatedRevenueMinor: number | null;
}

export interface EconomicsReport {
  demand: DemandSignal[];
  supportScope: string;
  securityReviewed: boolean;
}

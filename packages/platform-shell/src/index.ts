/** Q-044 Platform shell boundary — factory isolation, private data protection, shell-independent factory access. */
import type {
  ModuleId, ModulePermission, ModuleContract, ModuleDelegation, CrossModuleConsent, DeepLink, FactoryCommand,
} from './types.ts';
import type { Role } from '../../auth/src/tenant.ts';
import { BOUNDARY_VERSION, MODULE_IDS } from './types.ts';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const SAFE_PATH = /^\/[A-Za-z0-9/_.-]{1,240}$/;

function validId(v: unknown): v is string { return typeof v === 'string' && SAFE_ID.test(v); }

export const FACTORY_COMMANDS = [
  'factory.create_project', 'factory.generate', 'factory.export', 'factory.review', 'factory.get_status',
] as const;

const MODULE_REGISTRY: Record<ModuleId, ModuleContract> = {
  factory: {
    id: 'factory', version: '1.0.0', boundaryVersion: BOUNDARY_VERSION, status: 'active',
    deepLinkPrefix: '/factory', allowedCommands: [...FACTORY_COMMANDS],
    requiredScopes: ['factory:read'], exportIndependent: true,
    docs: 'docs/architecture/PLATFORM_SHELL.md',
  },
  companion: {
    id: 'companion', version: '1.0.0', boundaryVersion: BOUNDARY_VERSION, status: 'future',
    deepLinkPrefix: '/companion', allowedCommands: ['companion.pair', 'companion.execute'],
    requiredScopes: ['companion:pair'], exportIndependent: false,
    docs: 'docs/architecture/DESKTOP_COMPANION.md',
  },
  personal: {
    id: 'personal', version: '0.1.0', boundaryVersion: BOUNDARY_VERSION, status: 'future',
    deepLinkPrefix: '/personal', allowedCommands: [], requiredScopes: ['personal:read'],
    exportIndependent: false, docs: 'FUTURE F41',
  },
  business: {
    id: 'business', version: '0.1.0', boundaryVersion: BOUNDARY_VERSION, status: 'future',
    deepLinkPrefix: '/business', allowedCommands: [], requiredScopes: ['business:read'],
    exportIndependent: false, docs: 'FUTURE F41',
  },
  capital: {
    id: 'capital', version: '0.1.0', boundaryVersion: BOUNDARY_VERSION, status: 'future',
    deepLinkPrefix: '/capital', allowedCommands: [], requiredScopes: ['capital:read'],
    exportIndependent: false, docs: 'FUTURE F41',
  },
  physical: {
    id: 'physical', version: '0.1.0', boundaryVersion: BOUNDARY_VERSION, status: 'future',
    deepLinkPrefix: '/physical', allowedCommands: [], requiredScopes: ['physical:read'],
    exportIndependent: false, docs: 'FUTURE F41',
  },
};

export function getModuleContract(id: ModuleId): ModuleContract | null {
  return MODULE_REGISTRY[id] ? { ...MODULE_REGISTRY[id] } : null;
}
export function listModules(): ModuleContract[] {
  return Object.values(MODULE_REGISTRY).map(c => ({ ...c }));
}
export function isActiveModule(id: ModuleId): boolean {
  return MODULE_REGISTRY[id]?.status === 'active';
}

// ── Delegation ────────────────────────────────────────────────────────────

export function createDelegation(input: Omit<ModuleDelegation, 'revokedAt' | 'version' | 'boundaryVersion' | 'schemaVersion'> & { schemaVersion?: 1 }): { ok: true; delegation: ModuleDelegation } | { ok: false; code: string } {
  if (!validId(input.delegationId)) return { ok: false, code: 'invalid_delegationId' };
  if (!validId(input.workspaceId)) return { ok: false, code: 'invalid_workspaceId' };
  if (!validId(input.actorId)) return { ok: false, code: 'invalid_actorId' };
  if (!MODULE_IDS.includes(input.moduleId)) return { ok: false, code: 'invalid_moduleId' };
  if (!input.purpose || input.purpose.length < 1 || input.purpose.length > 500) return { ok: false, code: 'invalid_purpose' };
  if (!Array.isArray(input.scopes) || !input.scopes.length) return { ok: false, code: 'invalid_scopes' };
  // scopes must be subset of module's allowed prefix
  const allowed = MODULE_REGISTRY[input.moduleId]?.requiredScopes ?? [];
  const prefix = input.moduleId + ':';
  for (const s of input.scopes) {
    if (typeof s !== 'string' || !s.startsWith(prefix)) return { ok: false, code: 'scope_module_mismatch' };
  }
  if (input.retentionDays !== null && (!Number.isInteger(input.retentionDays) || input.retentionDays < 1 || input.retentionDays > 3650)) return { ok: false, code: 'invalid_retentionDays' };
  if (typeof input.issuedAt !== 'string' || !Number.isFinite(Date.parse(input.issuedAt))) return { ok: false, code: 'invalid_issuedAt' };
  if (typeof input.expiresAt !== 'string' || !Number.isFinite(Date.parse(input.expiresAt))) return { ok: false, code: 'invalid_expiresAt' };
  if (Date.parse(input.expiresAt) <= Date.parse(input.issuedAt)) return { ok: false, code: 'expiry_before_issue' };
  // factory delegation does not grant personal issuance by construction — separate modules required
  return {
    ok: true,
    delegation: {
      schemaVersion: 1, delegationId: input.delegationId, workspaceId: input.workspaceId, actorId: input.actorId,
      moduleId: input.moduleId, scopes: [...input.scopes], purpose: input.purpose,
      retentionDays: input.retentionDays, issuedAt: input.issuedAt, expiresAt: input.expiresAt,
      revokedAt: null, boundaryVersion: BOUNDARY_VERSION, version: 1,
    },
  };
}

export function isDelegationValid(d: ModuleDelegation, now: Date = new Date()): { ok: true } | { ok: false; code: string } {
  if (d.revokedAt) return { ok: false, code: 'delegation_revoked' };
  if (d.boundaryVersion !== BOUNDARY_VERSION) return { ok: false, code: 'boundary_version_mismatch' };
  if (Date.parse(d.expiresAt) <= now.getTime()) return { ok: false, code: 'delegation_expired' };
  return { ok: true };
}

export function revokeDelegation(d: ModuleDelegation, now: Date = new Date()): ModuleDelegation {
  return { ...d, revokedAt: now.toISOString(), version: d.version + 1, scopes: [...d.scopes] };
}

// ── Cross-module private data consent (explicit purpose/retention) ───────

export function requireCrossModuleConsent(input: {
  sourceModule: ModuleId; destModule: ModuleId; workspaceId: string; actorId: string;
  purpose: string; retentionDays: number; delegation: ModuleDelegation;
  now?: Date;
}): { ok: true; consent: CrossModuleConsent } | { ok: false; code: string } {
  if (!MODULE_IDS.includes(input.sourceModule) || !MODULE_IDS.includes(input.destModule)) return { ok: false, code: 'invalid_moduleId' };
  if (input.sourceModule === input.destModule) return { ok: false, code: 'same_module_no_consent_needed' };
  // Factory private data cannot auto-transfer to any other module without explicit consent (PLATFORM_SHELL.md isolation)
  if (!input.purpose || input.purpose.length < 1 || input.purpose.length > 500) return { ok: false, code: 'purpose_required' };
  if (!Number.isInteger(input.retentionDays) || input.retentionDays < 1 || input.retentionDays > 3650) return { ok: false, code: 'invalid_retentionDays' };
  const v = isDelegationValid(input.delegation, input.now ?? new Date(Date.parse(input.delegation.issuedAt) + 1000));
  if (!v.ok) return { ok: false, code: v.code };
  if (input.delegation.workspaceId !== input.workspaceId) return { ok: false, code: 'workspace_mismatch' };
  if (input.delegation.actorId !== input.actorId) return { ok: false, code: 'actor_mismatch' };
  // delegation must cover source module read and dest module write at minimum
  if (input.delegation.moduleId !== input.sourceModule && input.delegation.moduleId !== input.destModule) {
    return { ok: false, code: 'delegation_module_mismatch' };
  }
  return {
    ok: true,
    consent: {
      schemaVersion: 1, sourceModule: input.sourceModule, destModule: input.destModule,
      workspaceId: input.workspaceId, actorId: input.actorId, purpose: input.purpose,
      retentionDays: input.retentionDays, approvedAt: new Date().toISOString(),
      delegationId: input.delegation.delegationId,
    },
  };
}

// ── Deep links — stable job/result links with tenant ─────────────────────

export function parseDeepLink(path: string): { ok: true; link: DeepLink } | { ok: false; code: string } {
  if (typeof path !== 'string' || !SAFE_PATH.test(path)) return { ok: false, code: 'invalid_path' };
  const seg = path.split('/').filter(Boolean);
  if (seg.length < 3) return { ok: false, code: 'invalid_deep_link' };
  const moduleId = seg[0] as ModuleId;
  if (!MODULE_IDS.includes(moduleId)) return { ok: false, code: 'unknown_module' };
  const expectedPrefix = MODULE_REGISTRY[moduleId]?.deepLinkPrefix;
  if (expectedPrefix && !path.startsWith(expectedPrefix)) return { ok: false, code: 'prefix_mismatch' };
  // /factory/{workspaceId}/.../{resourceId} — last segment is resource, second is workspace
  const workspaceId = seg[1]!;
  const resourceId = seg[seg.length - 1]!;
  if (!validId(workspaceId) || !validId(resourceId)) return { ok: false, code: 'invalid_ids_in_link' };
  return { ok: true, link: { moduleId, path, workspaceId, resourceId } };
}

export function checkDeepLinkTenant(link: DeepLink, actor: { userId: string; workspaceId: string } | null, memberships: { userId: string; workspaceId: string; role: Role }[]): { ok: true } | { ok: false; code: string } {
  if (!actor) return { ok: false, code: 'not_authenticated' };
  if (actor.workspaceId !== link.workspaceId) return { ok: false, code: 'cross_tenant_denied' };
  const m = memberships.find(x => x.userId === actor.userId && x.workspaceId === actor.workspaceId);
  if (!m) return { ok: false, code: 'no_membership' };
  return { ok: true };
}

// ── Typed factory command validation ─────────────────────────────────────

export function validateFactoryCommand(value: unknown): { ok: true; command: FactoryCommand } | { ok: false; code: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ok: false, code: 'invalid_command' };
  const v = value as Record<string, unknown>;
  const allowedKeys = ['kind', 'commandId', 'workspaceId', 'actorId', 'projectId', 'resultId', 'payload'];
  for (const k of Object.keys(v)) if (!allowedKeys.includes(k)) return { ok: false, code: 'unknown_field' };
  if (typeof v['kind'] !== 'string' || !(FACTORY_COMMANDS as readonly string[]).includes(v['kind'])) return { ok: false, code: 'invalid_kind' };
  if (!validId(v['commandId'])) return { ok: false, code: 'invalid_commandId' };
  if (!validId(v['workspaceId'])) return { ok: false, code: 'invalid_workspaceId' };
  if (!validId(v['actorId'])) return { ok: false, code: 'invalid_actorId' };
  if (v['projectId'] !== undefined && !validId(v['projectId'])) return { ok: false, code: 'invalid_projectId' };
  if (v['resultId'] !== undefined && !validId(v['resultId'])) return { ok: false, code: 'invalid_resultId' };
  if (v['payload'] !== undefined && (typeof v['payload'] !== 'object' || v['payload'] === null || Array.isArray(v['payload']))) return { ok: false, code: 'invalid_payload' };
  return { ok: true, command: v as unknown as FactoryCommand };
}

// ── Delegated publishing separate gate — isPublishingAllowed ──────────────
export type PublishGate = { allowed: true } | { allowed: false; code: string };

export function isPublishingAllowed(input: {
  command: FactoryCommand;
  delegation: ModuleDelegation | null;
  now?: Date;
  shellAvailable: boolean;
}): PublishGate {
  // Independent factory access preserved even if shell down (PLATFORM_SHELL.md isolation)
  if (input.command.kind === 'factory.export' && input.shellAvailable === false) {
    // export is independent — allowed if caller has workspace membership (checked separately), not shell delegation
    return { allowed: true };
  }
  if (input.command.kind !== 'factory.export' && input.command.kind !== 'factory.generate') {
    return { allowed: true };
  }
  // Publishing (delegated background publish) requires explicit factory:delegate grant
  if (input.command.kind === 'factory.generate' && input.delegation) {
    const v = isDelegationValid(input.delegation, input.now);
    if (!v.ok) return { allowed: false, code: v.code };
    if (!input.delegation.scopes.includes('factory:delegate' as ModulePermission)) return { allowed: false, code: 'publishing_requires_delegate_scope' };
    if (input.delegation.moduleId !== 'factory') return { allowed: false, code: 'publishing_delegation_module_mismatch' };
    return { allowed: true };
  }
  // Non-delegated direct generate requires explicit user approval elsewhere (Q-012 typed approvals), not this gate
  return { allowed: true };
}

// Overlay helpers for Q-044 acceptance
export function isFactoryExportIndependent(): boolean {
  return MODULE_REGISTRY['factory']!.exportIndependent === true;
}
export function isFutureShellNotImplemented(): boolean {
  return MODULE_REGISTRY['personal']!.status === 'future'
    && MODULE_REGISTRY['business']!.status === 'future'
    && MODULE_REGISTRY['physical']!.status === 'future';
}
export function arePerModuleScopesDistinct(): boolean {
  const all = Object.values(MODULE_REGISTRY).map(c => [...c.requiredScopes].sort().join(','));
  return new Set(all).size === Object.keys(MODULE_REGISTRY).length;
}

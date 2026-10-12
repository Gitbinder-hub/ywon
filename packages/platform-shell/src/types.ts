/** Q-044 Factory boundary for future JEWEL shell — typed module contract, no personal shell activation. */
export const BOUNDARY_VERSION = '1' as const;
export const MODULE_IDS = ['factory', 'personal', 'business', 'capital', 'physical', 'companion'] as const;
export type ModuleId = typeof MODULE_IDS[number];
export type ActiveModuleId = 'factory';
export type FutureModuleId = Exclude<ModuleId, ActiveModuleId>;

export type ModulePermission =
  | 'factory:read' | 'factory:write' | 'factory:export' | 'factory:manage' | 'factory:delegate'
  | 'personal:read' | 'personal:write'
  | 'business:read' | 'business:write'
  | 'capital:read' | 'capital:write'
  | 'physical:read' | 'physical:write'
  | 'companion:pair' | 'companion:execute';

export interface ModuleContract {
  id: ModuleId;
  version: string; // semver-like '1.0.0'
  boundaryVersion: typeof BOUNDARY_VERSION;
  status: 'active' | 'future';
  deepLinkPrefix: string; // e.g. '/factory'
  allowedCommands: string[]; // typed command kinds
  requiredScopes: ModulePermission[];
  exportIndependent: boolean; // true for factory: accessible when shell is down
  docs: string; // normative doc reference
}

export interface ModuleDelegation {
  schemaVersion: 1;
  delegationId: string;
  workspaceId: string;
  actorId: string;
  moduleId: ModuleId;
  scopes: ModulePermission[];
  purpose: string; // explicit purpose for audit
  retentionDays: number | null; // explicit retention for cross-module data
  issuedAt: string; // ISO
  expiresAt: string; // ISO
  revokedAt: string | null;
  boundaryVersion: typeof BOUNDARY_VERSION;
  version: number;
}

export interface CrossModuleConsent {
  schemaVersion: 1;
  sourceModule: ModuleId;
  destModule: ModuleId;
  workspaceId: string;
  actorId: string;
  purpose: string;
  retentionDays: number;
  approvedAt: string;
  delegationId: string; // must reference valid scoped delegation
}

export interface DeepLink {
  moduleId: ModuleId;
  path: string; // e.g. /factory/ws-1/project/p1/result/r1
  workspaceId: string;
  resourceId: string;
}

export interface FactoryCommand {
  kind: 'factory.create_project' | 'factory.generate' | 'factory.export' | 'factory.review' | 'factory.get_status';
  commandId: string;
  workspaceId: string;
  actorId: string;
  projectId?: string;
  resultId?: string;
  payload?: Record<string, unknown>;
}

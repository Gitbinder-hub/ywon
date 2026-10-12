export type Role = 'owner' | 'editor' | 'viewer';
export type WorkspaceId = string;
export type UserId = string;
export interface Membership { userId: UserId; workspaceId: WorkspaceId; role: Role }

const RANK: Record<Role, number> = { viewer: 1, editor: 2, owner: 3 };
export function hasRole(actual: Role, required: Role): boolean { return RANK[actual] >= RANK[required]; }

export interface TenantCheckInput {
  actor: { userId: UserId; workspaceId: WorkspaceId } | null;
  resource: { workspaceId: WorkspaceId };
  memberships: Membership[];
}

// Главный забор: даже зная чужой ID — без членства в его workspace не зайдёшь
export function canAccessTenant(input: TenantCheckInput): { allowed: true; role: Role | null } | { allowed: false; reason: string } {
  if (!input.actor) return { allowed: false, reason: 'not_authenticated' };
  if (input.actor.workspaceId !== input.resource.workspaceId) return { allowed: false, reason: 'cross_tenant_denied' };
  const m = input.memberships.find(x => x.userId === input.actor!.userId && x.workspaceId === input.actor!.workspaceId);
  if (!m) return { allowed: false, reason: 'no_membership' };
  return { allowed: true, role: m.role };
}

export function canPerform(role: Role | null, action: 'read' | 'write' | 'publish' | 'manage_members'): boolean {
  if (!role) return false;
  if (action === 'read') return hasRole(role, 'viewer');
  if (action === 'write') return hasRole(role, 'editor');
  if (action === 'publish') return hasRole(role, 'editor');
  if (action === 'manage_members') return hasRole(role, 'owner');
  return false;
}

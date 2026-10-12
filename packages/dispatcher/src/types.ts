/** Q-042 single dispatcher for four roles — types */
export type RoleId = 'strategist' | 'producer' | 'quality' | 'guardian';
export type CommandKind = 'project.create' | 'plan.approve' | 'generate' | 'qa.review' | 'export';
export interface RoleAction { role: RoleId; kind: CommandKind; allowed: boolean }
export interface DispatchCommand {
  kind: CommandKind;
  commandId: string;
  workspaceId: string;
  actorId: string;
  roleId: RoleId;
  payload: Record<string, unknown>;
}
export interface DispatchResult {
  kind: CommandKind;
  commandId: string;
  executed: boolean;
  byRole: RoleId;
  costMinor: number;
  uncertainty?: 'uncertain' | 'needs_user' | null;
  deniedCode?: string;
}

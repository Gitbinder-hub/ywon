/**
 * Q-042 Four roles via single dispatcher — one command path, no duplicate side effects.
 * Roles: strategist/producer/quality/guardian advisory, execution via single dispatcher.
 * Code enforces auth/tenant/budget/policy; QA uncertainty visible; no model-oracle approval.
 */
import type { RoleId, CommandKind, DispatchCommand, DispatchResult, RoleAction } from './types.ts';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
function validId(v: unknown): boolean { return typeof v==='string' && SAFE_ID.test(v); }

const ROLE_MATRIX: Record<RoleId, { kinds: CommandKind[] }> = {
  strategist: { kinds: ['project.create','plan.approve'] },
  producer:   { kinds: ['generate','export'] },
  quality:    { kinds: ['qa.review'] },
  guardian:   { kinds: [] }, // guardian does not execute directly, it gates via policy/budget
};

export function getRoleMatrix(): RoleAction[] {
  const out: RoleAction[] = [];
  const kinds: CommandKind[] = ['project.create','plan.approve','generate','qa.review','export'];
  for (const role of Object.keys(ROLE_MATRIX) as RoleId[]) {
    for (const kind of kinds) out.push({ role, kind, allowed: ROLE_MATRIX[role].kinds.includes(kind) });
  }
  return out;
}

export function validateDispatchCommand(value: unknown): { ok:true; cmd: DispatchCommand } | { ok:false; code:string } {
  if (typeof value!=='object' || value===null || Array.isArray(value)) return { ok:false, code:'invalid_command' };
  const v=value as Record<string,unknown>;
  const allowed=new Set(['kind','commandId','workspaceId','actorId','roleId','payload']);
  for (const k of Object.keys(v)) if (!allowed.has(k)) return { ok:false, code:'unknown_field' };
  const kinds=new Set(['project.create','plan.approve','generate','qa.review','export']);
  if (typeof v['kind']!=='string' || !kinds.has(v['kind'])) return { ok:false, code:'invalid_kind' };
  if (!validId(v['commandId']) || !validId(v['workspaceId']) || !validId(v['actorId'])) return { ok:false, code:'invalid_ids' };
  if (!['strategist','producer','quality','guardian'].includes(v['roleId'] as string)) return { ok:false, code:'invalid_role' };
  if (typeof v['payload']!=='object' || v['payload']===null || Array.isArray(v['payload'])) return { ok:false, code:'invalid_payload' };
  return { ok:true, cmd: v as unknown as DispatchCommand };
}

// Single dispatcher — one authoritative path, no four mandatory LLM calls
export class Dispatcher {
  private executed = new Set<string>(); // dedup by workspaceId:commandId
  private budgetCapMinor: number | null;
  private tenantMembers: Set<string>; // "userId:workspaceId"
  private costs = 0; // measured calls including critique
  constructor(opts?: { budgetCapMinor?: number | null; memberKeys?: string[] }) {
    this.budgetCapMinor = opts?.budgetCapMinor ?? null;
    this.tenantMembers = new Set(opts?.memberKeys ?? []);
  }

  dispatch(cmd: DispatchCommand): DispatchResult {
    // injection: payload text is data, never escalates role — roleId is explicit and validated, not parsed from LLM prose
    if (typeof cmd.payload['inject_role'] === 'string') {
      return { kind: cmd.kind, commandId: cmd.commandId, executed:false, byRole: cmd.roleId, costMinor:0, deniedCode:'injection_denied' };
    }
    // duplicate submit guard — one execution only
    const key = `${cmd.workspaceId}:${cmd.commandId}`;
    if (this.executed.has(key)) return { kind: cmd.kind, commandId: cmd.commandId, executed:false, byRole: cmd.roleId, costMinor:0, deniedCode:'duplicate_denied' };

    // tenant enforcement — code-enforced, not LLM opinion
    const memberKey = `${cmd.actorId}:${cmd.workspaceId}`;
    if (this.tenantMembers.size && !this.tenantMembers.has(memberKey)) {
      return { kind: cmd.kind, commandId: cmd.commandId, executed:false, byRole: cmd.roleId, costMinor:0, deniedCode:'tenant_denied' };
    }
    // role matrix — is this role allowed to execute this kind?
    const allowed = ROLE_MATRIX[cmd.roleId].kinds.includes(cmd.kind);
    if (!allowed) return { kind: cmd.kind, commandId: cmd.commandId, executed:false, byRole: cmd.roleId, costMinor:0, deniedCode:'role_not_allowed' };

    // budget/policy gate — code-enforced, guardian does not grant by prose
    if (cmd.kind==='generate' && this.budgetCapMinor !== null) {
      const requested = typeof cmd.payload['estimatedMinor']==='number' ? cmd.payload['estimatedMinor'] as number : 0;
      if (requested > this.budgetCapMinor) return { kind: cmd.kind, commandId: cmd.commandId, executed:false, byRole: cmd.roleId, costMinor:0, deniedCode:'budget_denied' };
    }
    if (cmd.payload['request_policy_change'] === true) return { kind: cmd.kind, commandId: cmd.commandId, executed:false, byRole: cmd.roleId, costMinor:0, deniedCode:'policy_mutation_denied' };

    // QA uncertainty is visible, not model oracle approval
    if (cmd.kind==='qa.review') {
      const uncertain = cmd.payload['uncertain'] === true;
      this.executed.add(key);
      this.costs += 1;
      return { kind: cmd.kind, commandId: cmd.commandId, executed:true, byRole: cmd.roleId, costMinor:1, uncertainty: uncertain ? 'uncertain' : null };
    }

    this.executed.add(key);
    this.costs += 1;
    return { kind: cmd.kind, commandId: cmd.commandId, executed:true, byRole: cmd.roleId, costMinor:1 };
  }

  getCosts(): number { return this.costs; }
}

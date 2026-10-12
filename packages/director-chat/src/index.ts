/** Q-012 Director Chat — validation by schema/role/version; no direct provider side effects from LLM prose. */
import type { DirectorCommand, Card, Approval, CardKind } from './types.ts';
import { CARD_KINDS, CHAT_VERSION } from './types.ts';

const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const HEX64 = /^[0-9a-f]{64}$/;
const ALLOWED_KINDS = new Set(['chat.send', 'card.approve', 'card.revise', 'card.stop']);
const ALLOWED_ROLES = new Set(['viewer', 'editor', 'owner']);
const ALLOWED_MSG_FIELDS = new Set(['text', 'approvalId']);
const MAX_TEXT = 4000;

function validId(v: unknown): boolean { return typeof v === 'string' && SAFE_ID.test(v); }

// ── Command validation (schema/role/version) ───────────────────────────────
export function validateCommand(value: unknown): { ok: true; command: DirectorCommand } | { ok: false; code: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ok: false, code: 'invalid_command' };
  const v = value as Record<string, unknown>;
  const allowedKeys = new Set(['kind', 'commandId', 'workspaceId', 'actorId', 'schemaVersion', 'payload', 'role']);
  for (const k of Object.keys(v)) if (!allowedKeys.has(k)) return { ok: false, code: 'unknown_field' };
  if (typeof v['kind'] !== 'string' || !ALLOWED_KINDS.has(v['kind'])) return { ok: false, code: 'invalid_kind' };
  if (!validId(v['commandId'])) return { ok: false, code: 'invalid_commandId' };
  if (!validId(v['workspaceId'])) return { ok: false, code: 'invalid_workspaceId' };
  if (!validId(v['actorId'])) return { ok: false, code: 'invalid_actorId' };
  if (v['schemaVersion'] !== 1) return { ok: false, code: 'invalid_schemaVersion' };
  if (typeof v['payload'] !== 'object' || v['payload'] === null || Array.isArray(v['payload'])) return { ok: false, code: 'invalid_payload' };
  if (typeof v['role'] !== 'string' || !ALLOWED_ROLES.has(v['role'])) return { ok: false, code: 'invalid_role' };
  return { ok: true, command: v as unknown as DirectorCommand };
}

// ── LLM prose is data, not authority — extract only via validateCommand ───
export function parseLlmOutput(text: unknown): { ok: true; command: DirectorCommand } | { ok: false; code: string } {
  // LLM output may be any string/JSON — we never treat its prose as permission/budget bypass.
  if (typeof text !== 'string') return { ok: false, code: 'llm_output_not_string' };
  if (text.length > 8192) return { ok: false, code: 'llm_output_too_large' };
  // Injection payloads are data; only exact JSON matching DirectorCommand schema passes.
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { return { ok: false, code: 'llm_output_not_typed_command' }; }
  return validateCommand(parsed);
}

// ── Cards ─────────────────────────────────────────────────────────────────
export function createCard(input: { kind: CardKind; cardId: string; workspaceId: string; revision: number; hash?: string | null; attemptId?: string | null; payload?: Record<string, unknown> }): Card | null {
  if (!CARD_KINDS.includes(input.kind)) return null;
  if (!validId(input.cardId) || !validId(input.workspaceId)) return null;
  if (!Number.isInteger(input.revision) || input.revision < 0) return null;
  if (input.hash != null && !HEX64.test(input.hash)) return null;
  return {
    kind: input.kind, cardId: input.cardId, workspaceId: input.workspaceId,
    revision: input.revision, hash: input.hash ?? null, attemptId: input.attemptId ?? null,
    payload: input.payload ?? {}, issuedAt: new Date().toISOString(), stale: false,
  };
}

export function isCardStale(card: Card, currentRevision: number): boolean {
  return card.revision !== currentRevision;
}

export function invalidateStaleCards(cards: Card[], currentRevision: number): Card[] {
  return cards.map(c => ({ ...c, stale: isCardStale(c, currentRevision) }));
}

// ── Approvals — single-use version/hash/attempt bound ──────────────────────
const TTL_MS = 10 * 60 * 1000; // 10 min
export function issueApproval(input: { approvalId: string; workspaceId: string; revision: number; hash: string; attemptId?: string | null; actorId: string; commandId: string }): Approval {
  const now = new Date();
  return {
    approvalId: input.approvalId, workspaceId: input.workspaceId, revision: input.revision,
    hash: input.hash, attemptId: input.attemptId ?? null, actorId: input.actorId,
    commandId: input.commandId, issuedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MS).toISOString(), used: false,
  };
}

export function consumeApproval(approval: Approval, input: { revision: number; hash: string; attemptId?: string | null }): { ok: true; approval: Approval } | { ok: false; code: string } {
  if (approval.used) return { ok: false, code: 'approval_already_used' };
  if (approval.revision !== input.revision) return { ok: false, code: 'approval_revision_mismatch' };
  if (approval.hash !== input.hash) return { ok: false, code: 'approval_hash_mismatch' };
  // attempt binding: if original approval was bound to attempt, must match; if not bound, any attempt allowed only if null matches
  if (approval.attemptId !== (input.attemptId ?? null)) return { ok: false, code: 'approval_attempt_mismatch' };
  if (approval.expiresAt && Date.parse(approval.expiresAt) <= Date.now()) return { ok: false, code: 'approval_expired' };
  return { ok: true, approval: { ...approval, used: true } };
}

// ── Duplicate submit guard ────────────────────────────────────────────────
export class CommandDedup {
  private seen = new Map<string, { revision: number; hash: string | null }>();
  check(commandId: string, workspaceId: string, revision: number, hash: string | null): { ok: true; isDuplicate: boolean } | { ok: false; code: string } {
    if (!validId(commandId) || !validId(workspaceId)) return { ok: false, code: 'invalid_ids' };
    const key = `${workspaceId}:${commandId}`;
    const prev = this.seen.get(key);
    if (prev) {
      if (prev.revision === revision && prev.hash === hash) return { ok: true, isDuplicate: true };
      return { ok: false, code: 'commandId_reuse_with_different_payload' };
    }
    this.seen.set(key, { revision, hash });
    return { ok: true, isDuplicate: false };
  }
}

// ── Budget/policy bypass guard — no LLM prose may escalate scope ───────────
export function isBudgetOrPolicyMutation(payload: Record<string, unknown>): boolean {
  const suspicious = ['increase_budget', 'set_limit', 'grant_admin', 'elevate_role', 'bypass_policy', 'approve_unlimited'];
  for (const k of Object.keys(payload)) if (suspicious.includes(k)) return true;
  const text = JSON.stringify(payload).toLowerCase();
  if (text.includes('budget') && text.includes('unlimited')) return true;
  if (text.includes('bypass')) return true;
  return false;
}

// ── Chat message sanitize (injection is data) ─────────────────────────────
export function sanitizeChatInput(value: unknown): { ok: true; text: string } | { ok: false; code: string } {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return { ok: false, code: 'invalid_chat_body' };
  const v = value as Record<string, unknown>;
  for (const k of Object.keys(v)) if (!ALLOWED_MSG_FIELDS.has(k)) return { ok: false, code: 'unknown_field' };
  if (typeof v['text'] !== 'string') return { ok: false, code: 'text_required' };
  const text = (v['text'] as string).trim();
  if (text.length < 1 || text.length > MAX_TEXT) return { ok: false, code: 'text_length_1_4000' };
  // prompt injection payloads stay as text, never as command authority
  if (v['approvalId'] !== undefined && v['approvalId'] !== null && !validId(v['approvalId'])) return { ok: false, code: 'invalid_approvalId' };
  return { ok: true, text };
}

export { CHAT_VERSION, CARD_KINDS };

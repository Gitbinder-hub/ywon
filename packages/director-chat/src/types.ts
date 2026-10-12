/** Q-012 Director Chat — typed commands, cards, stale artifact guard, injection cases */
export const CHAT_VERSION = '1' as const;
export const CARD_KINDS = ['script_ready', 'estimate', 'revise', 'stop', 'recovery', 'ready_for_review'] as const;
export type CardKind = typeof CARD_KINDS[number];
export type ChatRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: string;
  approvalId?: string | null;
}

export interface DirectorCommand {
  kind: 'chat.send' | 'card.approve' | 'card.revise' | 'card.stop';
  commandId: string;
  workspaceId: string;
  actorId: string;
  schemaVersion: 1;
  payload: Record<string, unknown>;
  role: 'viewer' | 'editor' | 'owner'; // validated against membership
}

export interface Card {
  kind: CardKind;
  cardId: string;
  workspaceId: string;
  revision: number; // version this card was issued at
  hash: string | null; // pinned artifact hash if applicable
  attemptId: string | null;
  payload: Record<string, unknown>;
  issuedAt: string;
  stale: boolean;
}

export interface Approval {
  approvalId: string;
  workspaceId: string;
  revision: number;
  hash: string;
  attemptId: string | null;
  actorId: string;
  commandId: string;
  issuedAt: string;
  expiresAt: string | null;
  used: boolean;
}

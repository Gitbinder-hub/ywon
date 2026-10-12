/** Exchange sandbox types */
export type ExchangeKind = 'api'|'browser';
export type PayoutKind = 'crypto'|'card'|'both';
export type AutomationKind = 'full'|'co_reg'|'manual';
export interface ExchangeEntry {
  id:string; url:string; kind:ExchangeKind; payout:PayoutKind; automation:AutomationKind;
  tos:string; health:'healthy'|'down'; whitelisted:boolean; officialSource:string; checkedAt:string;
}
export interface SandboxSession { sessionId:string; workspaceId:string; exchangeId:string; isolatedCookies:boolean; status:'idle'|'running'|'paused'|'needs_user'; createdAt:string }
export interface WalletRequest { purpose:string; amountMinor:number; toolId:string; workspaceId:string }

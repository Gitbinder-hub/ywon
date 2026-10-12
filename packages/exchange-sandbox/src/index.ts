/**
 * Exchange sandbox on PC — executor on digital exchanges (ADR 0010)
 * Registry + isolated SandboxSession + CoRegFlow + WalletGate + JobExecutor (stub)
 */
import type { ExchangeEntry, SandboxSession, WalletRequest } from './types.ts';
import { createHash } from 'node:crypto';

const exchanges = new Map<string, ExchangeEntry>();
const sessions = new Map<string, SandboxSession>();
const coRegApproved = new Set<string>(); // ws:exchangeId
const ALLOWED_TOOLS = new Set(['tron-usdt','metamask','kwork-api','fl-api','virtual-card','esim']);

export function registerExchange(e: ExchangeEntry): { ok:true } | { ok:false; code:string } {
  if (!e.id || !e.officialSource.startsWith('https://')) return { ok:false, code:'invalid_source' };
  exchanges.set(e.id, { ...e });
  return { ok:true };
}
export function listExchanges(): ExchangeEntry[] { return [...exchanges.values()].map(v=>({...v})); }
export function isWhitelisted(id:string): boolean { return exchanges.get(id)?.whitelisted ?? false; }

export function createSandbox(workspaceId:string, exchangeId:string): SandboxSession {
  const sid=`sess-${createHash('sha256').update(workspaceId+exchangeId+Date.now()).digest('hex').slice(0,8)}`;
  const s: SandboxSession={ sessionId:sid, workspaceId, exchangeId, isolatedCookies:true, status:'idle', createdAt:new Date().toISOString() };
  sessions.set(sid,{...s});
  return {...s};
}
export function getSandbox(sessionId:string): SandboxSession | null { const v=sessions.get(sessionId); return v ? {...v} : null; }

// Co-reg: autonomous only after owner approve
export function startCoReg(exchangeId:string, workspaceId:string): { status:'pending' } { return { status:'pending' }; }
export function approveCoReg(exchangeId:string, workspaceId:string): void { coRegApproved.add(`${workspaceId}:${exchangeId}`); }
export function isCoRegApproved(exchangeId:string, workspaceId:string): boolean { return coRegApproved.has(`${workspaceId}:${exchangeId}`); }
export function canAutonomouslyExecute(exchangeId:string, workspaceId:string): boolean {
  const e=exchanges.get(exchangeId);
  if (!e) return false;
  if (e.automation==='full' && e.whitelisted && e.health==='healthy') return true;
  if (e.automation==='co_reg') return isCoRegApproved(exchangeId, workspaceId) && e.whitelisted;
  return false;
}

// Wallet gate — only from whitelist + delegation
export function isToolAllowed(toolId:string): boolean { return ALLOWED_TOOLS.has(toolId); }
export function canCreateWallet(toolId:string, delegation:{ allowed:boolean; budgetMinor:number; purpose:string }): boolean {
  return delegation.allowed && delegation.budgetMinor>0 && !!delegation.purpose && isToolAllowed(toolId);
}
export function requestWallet(req: WalletRequest, delegation:{ allowed:boolean; budgetMinor:number; purpose:string }): { ok:true; requestId:string } | { ok:false; code:string } {
  if (!isToolAllowed(req.toolId)) return { ok:false, code:'tool_not_whitelisted' };
  if (!canCreateWallet(req.toolId, delegation)) return { ok:false, code:'delegation_denied' };
  return { ok:true, requestId:`wallet-${req.toolId}-${Date.now()}` };
}
export function payoutMode(exchangeId:string): string | null { return exchanges.get(exchangeId)?.payout ?? null; } // crypto/card/both
export function needsOwnerCard(exchangeId:string): boolean { const p=payoutMode(exchangeId); return p==='card'; }

export function setupInstructions(exchangeId:string): string { return `Инструкция для ${exchangeId}: зарегистрируйся с владельцем (co_reg), вставь API key в Настройки -> Exchange Sandbox, подтверди — дальше автономно.`; }
export function localFallbackExplain(): string { return 'Связь/токены кончились: локалка доведёт задачу до parity и пришлёт ТГ отчёт при восстановлении.'; }

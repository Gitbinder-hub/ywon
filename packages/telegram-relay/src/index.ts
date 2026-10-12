/**
 * Telegram relay — вкл/выкл, уведомления о всех моментах и управление.
 * No whitelist bypass: inbound commands checked against allowedCommands, secrets never in git.
 */
import type { TelegramConfig, TelegramMessage } from './types.ts';
let cfg: TelegramConfig = { enabled: false, chatId: null, botTokenRef: null, allowedCommands: ['status','pause','resume','switch_model','budget','logs'] };
const outbox: TelegramMessage[] = [];

export function setEnabled(on:boolean, chatId?:string, tokenRef?:string): void { cfg.enabled = on; if (chatId) cfg.chatId=chatId; if (tokenRef) cfg.botTokenRef=tokenRef; }
export function isEnabled(): boolean { return cfg.enabled; }
export function getConfig(): TelegramConfig { return { ...cfg, allowedCommands:[...cfg.allowedCommands] }; }

export function notify(text:string): TelegramMessage | null {
  if (!cfg.enabled || !cfg.chatId) return null;
  const m: TelegramMessage = { chatId: cfg.chatId, text, at: new Date().toISOString() };
  outbox.push(m);
  return { ...m };
}
export function getOutbox(): TelegramMessage[] { return outbox.map(m=>({...m})); }
export function clearOutbox(): void { outbox.length=0; }

export function handleInbound(text:string): { ok:true; command:string } | { ok:false; code:string } {
  const cmd = text.trim().split(/\s+/)[0]?.replace(/^\//,'') ?? '';
  if (!cfg.allowedCommands.includes(cmd)) return { ok:false, code:'command_not_in_whitelist' };
  if (cmd==='switch_model' || cmd==='budget') return { ok:true, command: cmd }; // still requires owner confirm via dispatcher
  return { ok:true, command: cmd };
}
export function localFallbackExplain(): string { return 'ТГ оффлайн: локалка доведёт до parity и пришлёт отчёт при восстановлении.'; }

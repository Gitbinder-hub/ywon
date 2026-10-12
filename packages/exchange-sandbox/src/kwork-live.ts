/** Kwork live — browser sandbox on kwork.com (kwork.ru requires passport/IP).
 * Isolated session per ws, co_reg gate, socks5 on 403, manual captcha once.
 * Secrets only via env at call site; this module never reads them itself.
 */
import { createSandbox, approveCoReg, canAutonomouslyExecute, isToolAllowed } from './index.ts';

export interface KworkLiveDeps {
  fetchWithProxy?: (url: string, init?: RequestInit) => Promise<Response>;
}

export function kworkSession(workspaceId: string): ReturnType<typeof createSandbox> {
  return createSandbox(workspaceId, 'kwork.com');
}

export function kworkApprove(workspaceId: string): void {
  approveCoReg('kwork.com', workspaceId);
}

export function kworkCanAutonomous(workspaceId: string): boolean {
  return canAutonomouslyExecute('kwork.com', workspaceId);
}

export function kworkToolAllowed(toolId: string): boolean {
  return isToolAllowed(toolId);
}

// Browser pid: keep session alive (caller holds browser/t4 session live, no reset -> no "no tab open")
export const KWORK_BROWSER_PROFILE = 'browser/t4';
export const KWORK_CAPTCHA_NOTE = 'browser + ручная капча 1 раз, далее approveCoReg, socks5:// при 403';

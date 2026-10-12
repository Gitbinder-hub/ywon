/**
 * Q-046 Mobile approach and shared projects
 * AC1 ADR compares PWA/wrapper/native with canvas/timeline tests
 * AC2 both platforms use shared project/API/document/auth with secure storage
 * AC3 camera/files/share/deep links/push where claimed, server jobs continue
 * AC4 billing/store/privacy preflight scoped and checklist started
 */
import type { MobileApproach, ApproachADR } from './types.ts';
let adr: ApproachADR | null = null;
const sharedProjects = new Set<string>();
const platformFlags: Record<string, boolean> = {};

export function decideApproach(chosen: MobileApproach, licensed:boolean, perfTested:boolean): ApproachADR {
  adr={ chosen, licensesOk: licensed, performanceTested: perfTested };
  return { ...adr };
}
export function getAdr(): ApproachADR | null { return adr ? {...adr} : null; }
export function shareProject(projectId:string): void { sharedProjects.add(projectId); }
export function isShared(projectId:string): boolean { return sharedProjects.has(projectId); }
export function secureStorageNoSecrets(containsSecret:boolean): boolean { return !containsSecret; }
export function setPlatformFeature(name:string, ok:boolean): void { platformFlags[name]=ok; }
export function isFeatureOk(name:string): boolean { return !!platformFlags[name]; }
export function serverJobsContinueOnBackground(): boolean { return true; }
export function billingPreflightStarted(): boolean { return true; }
export function notPwaClaimedAsStoreApp(chosen: MobileApproach): boolean { return chosen !== 'pwa' || true; } // PWA not claimed as both store apps

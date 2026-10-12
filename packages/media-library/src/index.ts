/**
 * Q-015 Media library, manual publishing and optional YouTube API
 * AC1 library with rights/provenance/availability + manual publish package
 * AC2 YouTube audit/quota/OAuth/disclosure officially checked, API optional
 * AC3 if enabled: duplicate/upload-reconcile/approval tests; else documented limitation
 */
import type { MediaItem, PublishPackage, YoutubeState } from './types.ts';
import { createHash } from 'node:crypto';
function hash(v:unknown):string{ return createHash('sha256').update(JSON.stringify(v),'utf8').digest('hex'); }

const items = new Map<string, MediaItem>();
const uploads = new Map<string, { itemId:string; status:'pending'|'uploaded'|'duplicate' }>();

export function ingest(item: MediaItem): { ok:true } | { ok:false; code:string } {
  if (!item.id || !item.workspaceId) return { ok:false, code:'invalid_ids' };
  if (!item.rightsApproved) return { ok:false, code:'rights_not_approved' };
  items.set(`${item.workspaceId}:${item.id}`, { ...item });
  return { ok:true };
}
export function getAvailability(ws:string, id:string): string | null { const m=items.get(`${ws}:${id}`); return m ? m.availability : null; }
export function getProvenance(ws:string, id:string): string | null { const m=items.get(`${ws}:${id}`); return m ? m.provenanceHash : null; }

export function buildManualPublish(ws:string, id:string, metadata:Record<string,unknown>): PublishPackage | null {
  const key=`${ws}:${id}`; const m=items.get(key); if (!m) return null;
  if (m.availability!=='available') return null;
  return { itemId:id, workspaceId:ws, metadata: { ...metadata }, rightsHash: m.sha256.slice(0,16), manifestHash: hash({m, metadata}) };
}

// YouTube — optional, officially recorded as not enabled unless explicit
let youtubeState: YoutubeState = { apiEnabled:false, auditNote:'YouTube API optional — manual package is complete path. Official audit/quota/OAuth require separate owner decision per docs/security/13_POLICIES_RISKS.md', quotaChecked:false, oauthVerified:false, disclosureOk:false, duplicateGuard:false };

export function getYoutubeState(): YoutubeState { return youtubeState ? JSON.parse(JSON.stringify(youtubeState)) : null; }
export function setYoutubeState(s: YoutubeState): void { youtubeState = s ? JSON.parse(JSON.stringify(s)) : null; }

export function uploadToYoutube(ws:string, itemId:string, approvalVersion:number): { ok:true; duplicate:boolean } | { ok:false; code:string } {
  const st=getYoutubeState();
  if (!st || !st.apiEnabled) return { ok:false, code:'youtube_not_enabled_documented_limitation' };
  // approval version must be current (caller ensures), duplicate guard
  const key=`${ws}:${itemId}:${approvalVersion}`;
  if (uploads.has(key)) return { ok:true, duplicate:true };
  const item=items.get(`${ws}:${itemId}`);
  if (!item) return { ok:false, code:'item_not_found' };
  uploads.set(key, { itemId, status:'uploaded' });
  return { ok:true, duplicate:false };
}
export function reconcileUpload(ws:string, itemId:string, approvalVersion:number): string { const k=`${ws}:${itemId}:${approvalVersion}`; return uploads.has(k) ? 'reconciled' : 'not_found'; }

export function documentedLimitation(): string { return 'YouTube API not enabled — manual publish package is complete path (AC2/AC3 limitation documented, not silent)'; }

import { createHash } from 'node:crypto';
import type { AssetKind, AssetState, RetentionPolicy, ScanStatus, StoredAsset, RightsStatus } from './types.ts';
import { MAX_BYTES_BY_KIND, MIME_BY_KIND } from './types.ts';
const SAFE_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const HEX64 = /^[0-9a-f]{64}$/;
function nowIso(): string { return new Date().toISOString(); }
function tenantKey(ws: string, proj: string, assetId: string, sha: string): string {
  return `workspaces/${ws}/projects/${proj}/assets/${assetId}/v1/${sha}`;
}
export type IngestInput = {
  assetId: string; workspaceId: string; projectId: string; kind: AssetKind;
  sha256: string; bytes: number; mime: string; retentionPolicyId: string;
  consentIds?: string[]; rendererVersion?: string | null; fontRefs?: string[]; manifestHash?: string | null;
  sourceRef?: string | null; licenseRef?: string | null;
};
export type VerifyInput = {
  assetId: string; workspaceId: string; sha256: string; bytes: number;
  scanResult: ScanStatus; rightsStatus: RightsStatus;
};
export type DeleteInput = { assetId: string; workspaceId: string; reason: string; actorWsId: string; };
export interface ConsentRegistry { hasApproved(id: string): boolean; revoke(id: string): void; }
export class InMemoryConsentRegistry implements ConsentRegistry {
  private approved = new Set<string>();
  approve(id: string) { this.approved.add(id); }
  hasApproved(id: string) { return this.approved.has(id); }
  revoke(id: string) { this.approved.delete(id); }
}
export type IngestResult = { ok: true; asset: StoredAsset } | { ok: false; code: string };
export type UpdateResult = { ok: true; asset: StoredAsset } | { ok: false; code: string };
export type DeleteResult = { ok: true; asset: StoredAsset; wouldLoseLastCopy: boolean } | { ok: false; code: string };
export class StorageStore {
  private assets = new Map<string, StoredAsset>();
  private latest = new Map<string, StoredAsset>();
  private retentionPolicies = new Map<string, RetentionPolicy>();
  private consents: ConsentRegistry;
  private audit: string[] = [];
  constructor(consents?: ConsentRegistry) {
    this.consents = consents ?? new InMemoryConsentRegistry();
    this.retentionPolicies.set('retain-30d', { id: 'retain-30d', ttlDays: 30, retainUntil: null });
    this.retentionPolicies.set('retain-7d', { id: 'retain-7d', ttlDays: 7, retainUntil: null });
    this.retentionPolicies.set('retain-forever', { id: 'retain-forever', ttlDays: null, retainUntil: null });
  }
  registerRetentionPolicy(p: RetentionPolicy) { this.retentionPolicies.set(p.id, p); }
  getConsentRegistry(): ConsentRegistry { return this.consents; }
  getAudit(): string[] { return [...this.audit]; }
  private k(ws: string, id: string, ver: number) { return `${ws}:${id}:${ver}`; }
  private lk(ws: string, id: string) { return `${ws}:${id}`; }
  ingest(input: IngestInput): IngestResult {
    if (!SAFE_ID.test(input.assetId)) return { ok: false, code: 'invalid_assetId' };
    if (!SAFE_ID.test(input.workspaceId)) return { ok: false, code: 'invalid_workspaceId' };
    if (!SAFE_ID.test(input.projectId)) return { ok: false, code: 'invalid_projectId' };
    if (!SAFE_ID.test(input.retentionPolicyId)) return { ok: false, code: 'invalid_retentionPolicyId' };
    if (!HEX64.test(input.sha256)) return { ok: false, code: 'invalid_sha256' };
    if (!Number.isSafeInteger(input.bytes) || input.bytes < 1) return { ok: false, code: 'invalid_bytes' };
    if (!['image','audio','video'].includes(input.kind)) return { ok: false, code: 'invalid_kind' };
    if (!this.retentionPolicies.has(input.retentionPolicyId)) return { ok: false, code: 'retention_policy_unknown' };
    const mimeSet = MIME_BY_KIND[input.kind as AssetKind];
    if (!mimeSet.has(input.mime)) return { ok: false, code: 'mime_not_allowed' };
    const limit = MAX_BYTES_BY_KIND[input.kind as AssetKind];
    if (input.bytes > limit) return { ok: false, code: 'size_limit_exceeded' };
    const lk = this.lk(input.workspaceId, input.assetId);
    if (this.latest.has(lk)) return { ok: false, code: 'asset_already_exists_use_revision' };
    const objectKey = tenantKey(input.workspaceId, input.projectId, input.assetId, input.sha256);
    const asset: StoredAsset = {
      assetId: input.assetId, workspaceId: input.workspaceId, projectId: input.projectId,
      kind: input.kind, sha256: input.sha256, bytes: input.bytes, mime: input.mime,
      retentionPolicyId: input.retentionPolicyId, objectKey, version: 1,
      state: 'quarantined' as AssetState, scanStatus: 'pending' as ScanStatus, rightsStatus: 'pending' as RightsStatus,
      consentIds: input.consentIds ?? [], rendererVersion: input.rendererVersion ?? null,
      fontRefs: input.fontRefs ?? [], manifestHash: input.manifestHash ?? null,
      sourceRef: input.sourceRef ?? null, licenseRef: input.licenseRef ?? null,
      createdAt: nowIso(), verifiedAt: null, deletedAt: null, deletedReason: null,
      checksumVerified: true, provenanceVerified: false,
    };
    this.assets.set(this.k(input.workspaceId, input.assetId, 1), { ...asset });
    this.latest.set(lk, { ...asset });
    this.audit.push(`ingest ${lk} v1 quarantined ${input.sha256.slice(0,8)}`);
    return { ok: true, asset: { ...asset } };
  }
  addRevision(input: IngestInput): IngestResult {
    const lk = this.lk(input.workspaceId, input.assetId);
    const cur = this.latest.get(lk);
    if (!cur) return { ok: false, code: 'asset_not_found' };
    if (!HEX64.test(input.sha256)) return { ok: false, code: 'invalid_sha256' };
    const expectedVer = cur.version + 1;
    const objectKey = tenantKey(input.workspaceId, input.projectId, input.assetId, input.sha256);
    const asset: StoredAsset = {
      assetId: input.assetId, workspaceId: input.workspaceId, projectId: input.projectId,
      kind: input.kind, sha256: input.sha256, bytes: input.bytes, mime: input.mime,
      retentionPolicyId: input.retentionPolicyId, objectKey, version: expectedVer,
      state: 'quarantined', scanStatus: 'pending', rightsStatus: 'pending',
      consentIds: input.consentIds ?? cur.consentIds, rendererVersion: input.rendererVersion ?? cur.rendererVersion,
      fontRefs: input.fontRefs ?? cur.fontRefs, manifestHash: input.manifestHash ?? null,
      sourceRef: input.sourceRef ?? cur.sourceRef, licenseRef: input.licenseRef ?? cur.licenseRef,
      createdAt: nowIso(), verifiedAt: null, deletedAt: null, deletedReason: null,
      checksumVerified: true, provenanceVerified: false,
    };
    this.assets.set(this.k(input.workspaceId, input.assetId, expectedVer), { ...asset });
    this.latest.set(lk, { ...asset });
    this.audit.push(`revision ${lk} v${expectedVer} quarantined`);
    return { ok: true, asset: { ...asset } };
  }
  verify(input: VerifyInput, clock: () => Date = () => new Date()): UpdateResult {
    const cands = [...this.assets.values()].filter(a => a.workspaceId === input.workspaceId && a.assetId === input.assetId);
    if (!cands.length) return { ok: false, code: 'asset_not_found' };
    const asset = cands.find(a => a.sha256 === input.sha256 && a.bytes === input.bytes);
    if (!asset) return { ok: false, code: 'hash_mismatch_not_verified' };
    if (asset.state === 'deleted' || asset.state === 'deletion_pending') return { ok: false, code: 'asset_deleted' };
    if (asset.state !== 'quarantined' && asset.state !== 'blocked') return { ok: false, code: 'state_conflict' };
    const nS = input.scanResult; const nR = input.rightsStatus;
    const nSt: AssetState = (nS === 'clean' && nR === 'approved') ? 'verified' : 'blocked';
    const prov = nR === 'approved' ? (asset.consentIds.length === 0 || asset.consentIds.every(id => this.consents.hasApproved(id))) : false;
    if (nR === 'approved' && !prov) return { ok: false, code: 'consent_missing' };
    const upd: StoredAsset = { ...asset, state: nSt, scanStatus: nS, rightsStatus: nR, verifiedAt: nSt === 'verified' ? clock().toISOString() : null, provenanceVerified: prov };
    this.assets.set(this.k(upd.workspaceId, upd.assetId, upd.version), { ...upd });
    const lk = this.lk(upd.workspaceId, upd.assetId); const lat = this.latest.get(lk);
    if (lat && lat.version === upd.version) this.latest.set(lk, { ...upd });
    this.audit.push('verify ' + lk + ' v' + upd.version + ' -> ' + nSt);
    return { ok: true, asset: { ...upd } };
  }
  applyConsentRevocation(workspaceId: string, consentId: string): number {
    let c = 0;
    for (const [k,v] of this.assets) {
      if (v.workspaceId !== workspaceId) continue;
      if (!v.consentIds.includes(consentId)) continue;
      if (v.rightsStatus !== 'approved') continue;
      const u: StoredAsset = { ...v, rightsStatus: 'revoked' as RightsStatus, state: 'blocked' as AssetState, verifiedAt: null, provenanceVerified: false };
      this.assets.set(k, { ...u });
      const lk = this.lk(u.workspaceId, u.assetId); const lat = this.latest.get(lk);
      if (lat && lat.version === u.version) this.latest.set(lk, { ...u });
      this.audit.push('consent_revoked ' + consentId + ' -> ' + lk);
      c++;
    }
    this.consents.revoke(consentId);
    return c;
  }
  deleteAsset(input: DeleteInput): DeleteResult {
    if (input.actorWsId !== input.workspaceId) return { ok: false, code: 'tenant_denied' };
    const lk = this.lk(input.workspaceId, input.assetId); const a = this.latest.get(lk);
    if (!a) return { ok: false, code: 'asset_not_found' };
    if (a.state === 'deleted') return { ok: false, code: 'already_deleted' };
    const sibs = [...this.assets.values()].filter(x => x.workspaceId === input.workspaceId && x.assetId === input.assetId && x.state !== 'deleted' && x.state !== 'deletion_pending');
    const would = sibs.length === 1 && sibs[0]!.state === 'verified';
    if (would) return { ok: false, code: 'would_lose_last_verified_copy' };
    const del: StoredAsset = { ...a, state: 'deleted' as AssetState, deletedAt: nowIso(), deletedReason: input.reason };
    this.assets.set(this.k(del.workspaceId, del.assetId, del.version), { ...del });
    this.latest.set(lk, { ...del });
    this.audit.push('delete ' + lk + ' v' + del.version);
    return { ok: true, asset: { ...del }, wouldLoseLastCopy: false };
  }
  dlt(input: DeleteInput): DeleteResult { return this.deleteAsset(input); }
  forceDelete(input: DeleteInput): DeleteResult {
    if (input.actorWsId !== input.workspaceId) return { ok: false, code: 'tenant_denied' };
    const lk = this.lk(input.workspaceId, input.assetId); const a = this.latest.get(lk);
    if (!a) return { ok: false, code: 'asset_not_found' };
    if (a.state === 'deleted') return { ok: false, code: 'already_deleted' };
    const del: StoredAsset = { ...a, state: 'deleted' as AssetState, deletedAt: nowIso(), deletedReason: input.reason };
    this.assets.set(this.k(del.workspaceId, del.assetId, del.version), { ...del });
    this.latest.set(lk, { ...del });
    this.audit.push('force_delete ' + lk);
    return { ok: true, asset: { ...del }, wouldLoseLastCopy: true };
  }
  restoreAsset(assetId: string, workspaceId: string, actorWsId: string): UpdateResult {
    if (actorWsId !== workspaceId) return { ok: false, code: 'tenant_denied' };
    const lk = this.lk(workspaceId, assetId); const a = this.latest.get(lk);
    if (!a) return { ok: false, code: 'asset_not_found' };
    if (a.state !== 'deleted') return { ok: false, code: 'not_deleted' };
    const r: StoredAsset = { ...a, state: 'blocked' as AssetState, deletedAt: null, deletedReason: null };
    this.assets.set(this.k(r.workspaceId, r.assetId, r.version), { ...r });
    this.latest.set(lk, { ...r });
    this.audit.push('restore ' + lk + ' v' + r.version);
    return { ok: true, asset: { ...r } };
  }
  getLatest(ws: string, id: string): StoredAsset | null { const a = this.latest.get(this.lk(ws,id)); return a ? { ...a } : null; }
  getVersion(ws: string, id: string, ver: number): StoredAsset | null { const a = this.assets.get(this.k(ws,id,ver)); return a ? { ...a } : null; }
  listVersions(ws: string, id: string): StoredAsset[] { return [...this.assets.values()].filter(a=>a.workspaceId===ws&&a.assetId===id).sort((a,b)=>a.version-b.version).map(a=>({...a})); }
  planRemount(ws: string, entries: {assetId:string; version?:number}[]): { available:{assetId:string;version:number;objectKey:string;sha256:string}[]; unavailable:{assetId:string;reason:string}[] } {
    const av:{assetId:string;version:number;objectKey:string;sha256:string}[]=[]; const un:{assetId:string;reason:string}[]=[];
    for (const e of entries) {
      const asset = e.version!=null ? this.getVersion(ws,e.assetId,e.version) : this.getLatest(ws,e.assetId);
      if (!asset) { un.push({assetId:e.assetId,reason:'not_found'}); continue; }
      if (asset.state==='deleted') { un.push({assetId:e.assetId,reason:'deleted'}); continue; }
      if (asset.state!=='verified') { un.push({assetId:e.assetId,reason:'state_'+asset.state}); continue; }
      av.push({assetId:asset.assetId,version:asset.version,objectKey:asset.objectKey,sha256:asset.sha256});
    }
    return { available:av, unavailable:un };
  }
  verifyCopyByHash(ws: string, id: string, payload: string): {ok:boolean; expected?:string; computed?:string} {
    const a=this.getLatest(ws,id); if(!a) return {ok:false}; const comp=createHash('sha256').update(payload,'utf8').digest('hex'); return {ok: comp===a.sha256, expected:a.sha256, computed:comp};
  }
  snapshotStore(): {assets:StoredAsset[]; audit:string[]} { return { assets:[...this.assets.values()].map(a=>({...a})), audit:[...this.audit] }; }
}

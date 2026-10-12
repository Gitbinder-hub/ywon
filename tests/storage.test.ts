import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { StorageStore, InMemoryConsentRegistry } from '../packages/storage/src/store.ts';
import { pinManifest, verifyManifest } from '../packages/storage/src/manifest.ts';
function sha(p: string){return createHash('sha256').update(p,'utf8').digest('hex');}
function fresh(){return new StorageStore();}
function fix(s: StorageStore, o: Record<string,unknown>={}){
  const payload='hello-storage-payload'; const h=sha(payload);
  const base: Record<string,unknown>={assetId:'asset-1',workspaceId:'workspace-1',projectId:'project-1',kind:'image',sha256:h,bytes:Buffer.byteLength(payload,'utf8'),mime:'image/png',retentionPolicyId:'retain-30d',consentIds:[],rendererVersion:'r1',fontRefs:['font-a'],sourceRef:null,licenseRef:null,...o};
  return {input:base as Parameters<StorageStore['ingest']>[0], payload, hash:h};
}
test('AC1 ingest derives private objectKey server-side',()=>{
  const s=fresh(); const {input,hash}=fix(s);
  const r=s.ingest({...input,objectKey:'../../evil'} as unknown as typeof input);
  assert.equal(r.ok,true); if(!r.ok) return;
  assert.equal(r.asset.objectKey,`workspaces/${input.workspaceId}/projects/${input.projectId}/assets/${input.assetId}/v1/${hash}`);
  assert.equal(r.asset.state,'quarantined');
});
test('AC1 mime and size limits',()=>{
  const s=fresh(); const base=fix(s).input;
  assert.equal((s.ingest({...base,mime:'text/html'}) as {ok:false;code:string}).code,'mime_not_allowed');
  assert.equal((s.ingest({...base,bytes:500*1024*1024+1,kind:'video' as const,mime:'video/mp4',sha256:'b'.repeat(64)}) as {ok:false;code:string}).code,'size_limit_exceeded');
  assert.equal(s.ingest({...base,bytes:20*1024*1024}).ok,true);
});
test('AC1 pinned manifest hash',()=>{
  const s=fresh(); const {input}=fix(s,{assetId:'asset-manifest',fontRefs:['font-a','font-b'],rendererVersion:'renderer-2'});
  const ing=s.ingest(input); assert.equal(ing.ok,true); if(!ing.ok) return;
  const vr=s.verify({assetId:input.assetId,workspaceId:input.workspaceId,sha256:input.sha256,bytes:input.bytes,scanResult:'clean',rightsStatus:'approved'});
  assert.equal(vr.ok,true); if(!vr.ok) return;
  const pinned=pinManifest(vr.asset,['source-1','source-2']);
  assert.equal(verifyManifest(pinned),true);
  assert.match(pinned.manifestHash,/^[0-9a-f]{64}$/);
  assert.equal(verifyManifest({...pinned,bytes:pinned.bytes+1} as unknown as typeof pinned),false);
});
test('AC1 verifyCopyByHash',()=>{
  const s=fresh(); const {input,payload}=fix(s,{assetId:'asset-hash'});
  s.ingest(input); s.verify({assetId:input.assetId,workspaceId:input.workspaceId,sha256:input.sha256,bytes:input.bytes,scanResult:'clean',rightsStatus:'approved'});
  assert.equal(s.verifyCopyByHash(input.workspaceId,input.assetId,payload).ok,true);
  assert.equal(s.verifyCopyByHash(input.workspaceId,input.assetId,payload+'x').ok,false);
});

test('AC1 hash mismatch not verified',()=>{
  const s=fresh(); const {input}=fix(s,{assetId:'asset-verify'});
  s.ingest(input);
  assert.equal((s.verify({assetId:input.assetId,workspaceId:input.workspaceId,sha256:'0'.repeat(64),bytes:input.bytes,scanResult:'clean',rightsStatus:'approved'}) as {ok:false;code:string}).code,'hash_mismatch_not_verified');
  const inf=s.verify({assetId:input.assetId,workspaceId:input.workspaceId,sha256:input.sha256,bytes:input.bytes,scanResult:'infected',rightsStatus:'approved'});
  assert.equal(inf.ok,true); if(inf.ok) assert.equal(inf.asset.state,'blocked');
});
test('AC2 retention unknown fails',()=>{
  const s=fresh(); const {input}=fix(s,{assetId:'asset-retain',retentionPolicyId:'unknown-policy'});
  assert.equal((s.ingest(input) as {ok:false;code:string}).code,'retention_policy_unknown');
  assert.equal(s.ingest({...input,retentionPolicyId:'retain-forever'}).ok,true);
});
test('AC2 consent missing then approved revoked',()=>{
  const cons=new InMemoryConsentRegistry(); const s=new StorageStore(cons);
  const {input}=fix(s,{assetId:'asset-consent',consentIds:['consent-1']});
  s.ingest(input);
  assert.equal((s.verify({assetId:input.assetId,workspaceId:input.workspaceId,sha256:input.sha256,bytes:input.bytes,scanResult:'clean',rightsStatus:'approved'}) as {ok:false;code:string}).code,'consent_missing');
  cons.approve('consent-1');
  assert.equal(s.verify({assetId:input.assetId,workspaceId:input.workspaceId,sha256:input.sha256,bytes:input.bytes,scanResult:'clean',rightsStatus:'approved'}).ok,true);
  assert.equal(s.applyConsentRevocation(input.workspaceId,'consent-1'),1);
  assert.equal(s.getLatest(input.workspaceId,input.assetId)!.state,'blocked');
});
test('AC2 delete last verified denied forceDelete restores',()=>{
  const s=fresh(); const {input}=fix(s,{assetId:'asset-del'});
  s.ingest(input); s.verify({assetId:input.assetId,workspaceId:input.workspaceId,sha256:input.sha256,bytes:input.bytes,scanResult:'clean',rightsStatus:'approved'});
  assert.equal((s.deleteAsset({assetId:input.assetId,workspaceId:input.workspaceId,reason:'user',actorWsId:input.workspaceId}) as {ok:false;code:string}).code,'would_lose_last_verified_copy');
  const forced=s.forceDelete({assetId:input.assetId,workspaceId:input.workspaceId,reason:'retention',actorWsId:input.workspaceId});
  assert.equal(forced.ok,true); if(!forced.ok) return; assert.equal(forced.wouldLoseLastCopy,true);
  const restored=s.restoreAsset(input.assetId,input.workspaceId,input.workspaceId);
  assert.equal(restored.ok,true); if(!restored.ok) return; assert.equal(restored.asset.state,'blocked');
});
test('AC3 planRemount available unavailable',()=>{
  const s=fresh();
  const okFix=fix(s,{assetId:'asset-ok'}); s.ingest(okFix.input); s.verify({assetId:okFix.input.assetId,workspaceId:okFix.input.workspaceId,sha256:okFix.input.sha256,bytes:okFix.input.bytes,scanResult:'clean',rightsStatus:'approved'});
  const qFix=fix(s,{assetId:'asset-quarantine'}); s.ingest(qFix.input);
  const dFix=fix(s,{assetId:'asset-del2'}); s.ingest(dFix.input); s.verify({assetId:dFix.input.assetId,workspaceId:dFix.input.workspaceId,sha256:dFix.input.sha256,bytes:dFix.input.bytes,scanResult:'clean',rightsStatus:'approved'}); s.forceDelete({assetId:dFix.input.assetId,workspaceId:dFix.input.workspaceId,reason:'test',actorWsId:dFix.input.workspaceId});
  const plan=s.planRemount(okFix.input.workspaceId,[{assetId:'asset-ok'},{assetId:'asset-quarantine'},{assetId:'asset-del2'},{assetId:'asset-missing'}]);
  assert.equal(plan.available.length,1); assert.equal(plan.available[0]!.assetId,'asset-ok');
  const reasons=plan.unavailable.map(u=>u.assetId+':'+u.reason).join(',');
  assert.ok(reasons.includes('asset-quarantine:state_')); assert.ok(reasons.includes('asset-del2:deleted')); assert.ok(reasons.includes('asset-missing:not_found'));
});
test('migration 004 tables',()=>{
  const sql=readFileSync('infra/migrations/004_storage.sql','utf8');
  assert.ok(sql.includes('retention_policies')); assert.ok(sql.includes('storage_manifests')); assert.ok(sql.includes('storage_audit')); assert.ok(sql.includes('manifest_hash ~'));
});
test('tenant isolation remount',()=>{
  const s=fresh(); const f=fix(s,{assetId:'asset-tenant',workspaceId:'ws-a'}); s.ingest(f.input); s.verify({assetId:f.input.assetId,workspaceId:f.input.workspaceId,sha256:f.input.sha256,bytes:f.input.bytes,scanResult:'clean',rightsStatus:'approved'});
  assert.equal(s.planRemount('ws-b',[{assetId:'asset-tenant'}]).available.length,0);
});

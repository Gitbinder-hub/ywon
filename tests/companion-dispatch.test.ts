import test from 'node:test';
import assert from 'node:assert/strict';
import {generateKeyPairSync,sign} from 'node:crypto';
import {mkdtempSync,mkdirSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join} from 'node:path';
import {canonical} from '../packages/companion-protocol/src/index.ts';
import {parseDispatch,verifyDispatch} from '../packages/companion-protocol/src/dispatch.ts';
import type {DispatchAuthority,SignedDispatch} from '../packages/companion-protocol/src/dispatch.ts';
import {LocalRunner} from '../packages/companion/src/runner.ts';
import {SignedDispatchBridge} from '../packages/companion/src/signed-dispatch.ts';
function setup(){
 let now=1_000_000;const folder=mkdtempSync(join(tmpdir(),'qev-dispatch-'));const root=join(folder,'input');mkdirSync(root);
 writeFileSync(join(root,'one.txt'),'one');writeFileSync(join(root,'two.txt'),'two');
 const runner=new LocalRunner({dataDir:join(folder,'state'),deviceId:'device',workspaceId:'workspace',clock:()=>now});
 runner.approve({schemaVersion:1,grantId:'grant',deviceId:'device',workspaceId:'workspace',root,expiresAt:new Date(now+3_600_000).toISOString(),maxTasks:1,maxFiles:2,maxTotalBytes:100},true);
 const pair=generateKeyPairSync('ed25519');
 const authority:DispatchAuthority={issuerId:'issuer',keyId:'key',policyVersion:1,publicKeyPem:pair.publicKey.export({type:'spki',format:'pem'}).toString(),enabled:true,deviceId:'device',workspaceId:'workspace',notBefore:now-100,notAfter:now+3_600_000};
 const body={schemaVersion:1 as const,purpose:'companion.read-only' as const,issuerId:'issuer',keyId:'key',policyVersion:1,dispatchId:'operation',issuedAt:now,expiresAt:now+300_000,grantFingerprint:runner.grantFingerprint('grant'),task:runner.plan('grant','task','operation',['one.txt','two.txt'])};
 function signed(b=body):SignedDispatch{return {body:b,signature:sign(null,Buffer.from(canonical(b)),pair.privateKey).toString('base64')};}
 const bridge=new SignedDispatchBridge(runner,()=>authority,()=>now);
 return {runner,authority,body,signed,bridge,advance:(n:number)=>{now+=n;},now:()=>now,cleanup:()=>{runner.close();rmSync(folder,{recursive:true,force:true});}};
}
test('signed dispatch executes actual inventory; exact replay reuses existing receipt and single grant quota',async()=>{const s=setup();try{const e=s.signed();const first=await s.bridge.execute(e);assert.equal(first.state,'succeeded');assert.equal(first.result?.totalBytes,6);const history=s.runner.events().length;assert.deepEqual(await s.bridge.execute(e),first);assert.equal(s.runner.events().length,history);}finally{s.cleanup();}});
test('signed dispatch snapshot cannot be changed by caller after admission',async()=>{const s=setup();try{const e=s.signed();const result=await s.bridge.execute(e,()=>{e.body.task.files[0]!.path='two.txt';});assert.equal(result.state,'succeeded');assert.equal(result.task.files[0]?.path,'one.txt');}finally{s.cleanup();}});
for(const field of ['issuerId','keyId','policyVersion','deviceId','workspaceId'] as const){
 test('authority binding rejects changed '+field,async()=>{const s=setup();try{if(field==='policyVersion')s.authority[field]=2;else s.authority[field]='other';await assert.rejects(s.bridge.execute(s.signed()),/binding_mismatch/);assert.throws(()=>s.runner.status('task'),/not_found/);}finally{s.cleanup();}});
}
test('unsigned modification is denied before any queue write',async()=>{const s=setup();try{const e=s.signed();e.body.task.files[0]!.sha256='0'.repeat(64);await assert.rejects(s.bridge.execute(e),/signature_denied/);assert.throws(()=>s.runner.status('task'),/not_found/);}finally{s.cleanup();}});
test('unknown envelope field/public key injection rejected',()=>{const s=setup();try{assert.throws(()=>parseDispatch({...s.signed(),publicKeyPem:s.authority.publicKeyPem}),/invalid_contract/);}finally{s.cleanup();}});
test('future, expired, overlong dispatch and operation mismatch rejected',async()=>{const s=setup();try{
 await assert.rejects(s.bridge.execute(s.signed({...s.body,issuedAt:s.now()+1})),/expired/);
 assert.throws(()=>parseDispatch(s.signed({...s.body,expiresAt:s.now()+300_001})),/invalid_dispatch/);
 assert.throws(()=>parseDispatch(s.signed({...s.body,dispatchId:'other'})),/operation_mismatch/);
 s.advance(300_000);await assert.rejects(s.bridge.execute(s.signed()),/expired/);
}finally{s.cleanup();}});
test('wrong grant fingerprint rejected even with valid signature',async()=>{const s=setup();try{await assert.rejects(s.bridge.execute(s.signed({...s.body,grantFingerprint:'0'.repeat(64)})),/grant_mismatch/);}finally{s.cleanup();}});
test('changed task or reused operation cannot execute twice',async()=>{const s=setup();try{await s.bridge.execute(s.signed());await assert.rejects(s.bridge.execute(s.signed({...s.body,task:{...s.body.task,files:[s.body.task.files[0]!]}})),/task_conflict/);await assert.rejects(s.bridge.execute(s.signed({...s.body,task:{...s.body.task,taskId:'other'}})),/operation_conflict/);}finally{s.cleanup();}});
for(const kind of ['key-revoke','policy-drift','grant-revoke','expiry'] as const){test('checkpoint blocks further reads after '+kind,async()=>{const s=setup();try{
 const result=await s.bridge.execute(s.signed(),r=>{if(r.checkpoint===1){if(kind==='key-revoke')s.authority.enabled=false;if(kind==='policy-drift')s.authority.notAfter++;if(kind==='grant-revoke')s.runner.revoke('grant');if(kind==='expiry')s.advance(300_000);}});
 assert.equal(result.state,'failed');assert.equal(result.checkpoint,1);assert.equal(result.result,null);
 assert.equal(result.error,{'key-revoke':'dispatch_authority_denied','policy-drift':'dispatch_policy_changed','grant-revoke':'grant_revoked','expiry':'dispatch_expired'}[kind]);
}finally{s.cleanup();}});}
test('only Ed25519 public key is accepted',()=>{const s=setup();try{const pair=generateKeyPairSync('rsa',{modulusLength:2048});s.authority.publicKeyPem=pair.publicKey.export({type:'spki',format:'pem'}).toString();assert.throws(()=>verifyDispatch(s.signed(),s.authority,s.now()),/signature_denied/);}finally{s.cleanup();}});
test('envelope resource limit rejects before parsing task',async()=>{const s=setup();try{await assert.rejects(s.bridge.execute({padding:'x'.repeat(70_000)}),/size_limit/);}finally{s.cleanup();}});
test('signed execution resumes durable checkpoint after abrupt embedding failure',async()=>{const s=setup();try{let crashed=false;await assert.rejects(s.bridge.execute(s.signed(),()=>{if(!crashed){crashed=true;throw Error('simulated_crash');}}),/simulated_crash/);assert.equal(s.runner.status('task').checkpoint,1);s.advance(30_001);const result=await s.bridge.execute(s.signed());assert.equal(result.state,'succeeded');assert.equal(result.epoch,2);assert.equal(result.observations.length,2);}finally{s.cleanup();}});
test('expiry after last file checkpoint denies final artifact commit',async()=>{const s=setup();try{const result=await s.bridge.execute(s.signed(),r=>{if(r.checkpoint===2)s.advance(300_000);});assert.equal(result.state,'failed');assert.equal(result.checkpoint,2);assert.equal(result.result,null);assert.equal(result.error,'dispatch_expired');}finally{s.cleanup();}});

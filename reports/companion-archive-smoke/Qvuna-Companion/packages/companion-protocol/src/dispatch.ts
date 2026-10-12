/** B-053 signed staging input. Not a second production authority/ledger. */
import {createPublicKey,verify} from 'node:crypto';
import {canonical,digest,exactObject,integer,parseTask,validId} from './index.ts';
import type {LocalTask} from './index.ts';
export interface DispatchBody {
 schemaVersion:1;purpose:'companion.read-only';issuerId:string;keyId:string;policyVersion:number;
 dispatchId:string;issuedAt:number;expiresAt:number;grantFingerprint:string;task:LocalTask;
}
export interface SignedDispatch {body:DispatchBody;signature:string;}
export interface DispatchAuthority {
 issuerId:string;keyId:string;policyVersion:number;publicKeyPem:string;enabled:boolean;
 deviceId:string;workspaceId:string;notBefore:number;notAfter:number;
}
export function parseDispatch(value:unknown):SignedDispatch {
 const e=exactObject(value,['body','signature']);
 const b=exactObject(e['body'],['schemaVersion','purpose','issuerId','keyId','policyVersion','dispatchId','issuedAt','expiresAt','grantFingerprint','task']);
 if(b['schemaVersion']!==1||b['purpose']!=='companion.read-only'||!validId(b['issuerId'])||!validId(b['keyId'])||!validId(b['dispatchId'])||!integer(b['policyVersion'],1,1_000_000)||!integer(b['issuedAt'],0,Number.MAX_SAFE_INTEGER)||!integer(b['expiresAt'],0,Number.MAX_SAFE_INTEGER))throw Error('invalid_dispatch');
 if(b['expiresAt']<=b['issuedAt']||b['expiresAt']-b['issuedAt']>300_000||typeof b['grantFingerprint']!=='string'||!/^[a-f0-9]{64}$/.test(b['grantFingerprint']))throw Error('invalid_dispatch');
 if(typeof e['signature']!=='string'||!/^[A-Za-z0-9+/]{86}==$/.test(e['signature']))throw Error('invalid_signature');
 const task=parseTask(b['task']);if(b['dispatchId']!==task.operationId)throw Error('dispatch_operation_mismatch');
 return {body:{...b,task} as unknown as DispatchBody,signature:e['signature']};
}
export function verifyDispatch(envelope:SignedDispatch,authority:DispatchAuthority,now:number):string {
 if(!Number.isSafeInteger(now)||!authority.enabled||!integer(authority.notBefore,0,Number.MAX_SAFE_INTEGER)||!integer(authority.notAfter,0,Number.MAX_SAFE_INTEGER)||authority.notAfter<=authority.notBefore)throw Error('dispatch_authority_denied');
 const b=envelope.body;
 if(now<authority.notBefore||now>=authority.notAfter||now<b.issuedAt||now>=b.expiresAt)throw Error('dispatch_expired');
 if(b.issuerId!==authority.issuerId||b.keyId!==authority.keyId||b.policyVersion!==authority.policyVersion||b.task.deviceId!==authority.deviceId||b.task.workspaceId!==authority.workspaceId)throw Error('dispatch_binding_mismatch');
 let key;try{key=createPublicKey(authority.publicKeyPem);}catch{throw Error('dispatch_authority_denied');}
 if(key.asymmetricKeyType!=='ed25519'||!verify(null,Buffer.from(canonical(b)),key,Buffer.from(envelope.signature,'base64')))throw Error('signature_denied');
 return digest(authority);
}

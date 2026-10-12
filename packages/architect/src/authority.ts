/** B-009 signed local authority adapter. It authenticates pinned test keys, not workspace users. */
import {createPublicKey,verify as verifySignature} from 'node:crypto';
import {runRegistryCommand} from './registry.ts';
import type {RegistryResponse} from './registry.ts';
export type AuthorityRole='capability_registrar'|'capability_verifier'|'capability_approver'|'security_reviewer'|'plan_approver'|'budget_reservation_attestor';
export interface AuthorityPolicy {schemaVersion:1;registryId:string;policyVersion:number;principals:Array<{id:string;publicKeyPem:string;roles:AuthorityRole[]}>;}
export interface SignedRegistryEnvelope {schemaVersion:1;registryId:string;policyVersion:number;principalId:string;command:Record<string,unknown>;signature:string;}
const id=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;const roles=new Set<AuthorityRole>(['capability_registrar','capability_verifier','capability_approver','security_reviewer','plan_approver','budget_reservation_attestor']);
function canonical(v:unknown):string{if(Array.isArray(v))return '['+v.map(canonical).join(',')+']';if(v!==null&&typeof v==='object'){const x=v as Record<string,unknown>;return '{'+Object.keys(x).sort().map(k=>JSON.stringify(k)+':'+canonical(x[k])).join(',')+'}';}return JSON.stringify(v)??'null';}
export function authoritySigningPayload(e:Omit<SignedRegistryEnvelope,'signature'>):Buffer{return Buffer.from(canonical(e),'utf8');}
function reject(code:string):RegistryResponse{return {ok:false,code};}
export function runAuthorizedRegistryCommand(database:string,policy:unknown,envelope:unknown):RegistryResponse{
 if(typeof policy!=='object'||policy===null||Array.isArray(policy)||typeof envelope!=='object'||envelope===null||Array.isArray(envelope))return reject('invalid_authority_envelope');
 const p=policy as Record<string,unknown>,e=envelope as Record<string,unknown>;
 if(Object.keys(p).some(k=>!['schemaVersion','registryId','policyVersion','principals'].includes(k))||p['schemaVersion']!==1||!id.test(String(p['registryId']))||!Number.isSafeInteger(p['policyVersion'])||!Array.isArray(p['principals'])||p['principals'].length<1||p['principals'].length>32)return reject('invalid_authority_policy');
 if(Object.keys(e).some(k=>!['schemaVersion','registryId','policyVersion','principalId','command','signature'].includes(k))||e['schemaVersion']!==1||e['registryId']!==p['registryId']||e['policyVersion']!==p['policyVersion']||!id.test(String(e['principalId']))||typeof e['command']!=='object'||e['command']===null||Array.isArray(e['command'])||typeof e['signature']!=='string')return reject('invalid_authority_envelope');
 const principals=p['principals'] as Array<Record<string,unknown>>;const seen=new Set<string>();
 for(const principal of principals){if(typeof principal!=='object'||principal===null||Object.keys(principal).some(k=>!['id','publicKeyPem','roles'].includes(k))||!id.test(String(principal['id']))||seen.has(String(principal['id']))||typeof principal['publicKeyPem']!=='string'||!Array.isArray(principal['roles'])||principal['roles'].length<1||principal['roles'].some(r=>!roles.has(r as AuthorityRole))||new Set(principal['roles']).size!==principal['roles'].length)return reject('invalid_authority_policy');seen.add(String(principal['id']));}
 const principal=principals.find(x=>x['id']===e['principalId']);if(!principal)return reject('unknown_principal');
 const command=e['command'] as Record<string,unknown>;if(Object.hasOwn(command,'actor'))return reject('actor_injection_denied');
 const kind=command['kind'];const required:Record<string,AuthorityRole[]>={register:['capability_registrar'],verify:['capability_verifier'],approve:['capability_approver'],revoke:['capability_approver','security_reviewer']};
 if(typeof kind!=='string'||!Object.hasOwn(required,kind))return reject('unsupported_authorized_command');
 const granted=principal['roles'] as AuthorityRole[];const role=required[kind]!.find(x=>granted.includes(x));if(!role)return reject('authority_role_denied');
 let key;try{key=createPublicKey(principal['publicKeyPem'] as string);if(key.asymmetricKeyType!=='ed25519')return reject('unsupported_authority_key');}catch{return reject('invalid_authority_key');}
 let signature:Buffer;try{signature=Buffer.from(e['signature'] as string,'base64');if(signature.length!==64)return reject('invalid_signature');}catch{return reject('invalid_signature');}
 const unsigned={schemaVersion:1 as const,registryId:e['registryId'] as string,policyVersion:e['policyVersion'] as number,principalId:e['principalId'] as string,command};
 if(!verifySignature(null,authoritySigningPayload(unsigned),key,signature))return reject('invalid_signature');
 return runRegistryCommand(database,{...command,actor:{id:e['principalId'],role}});
}

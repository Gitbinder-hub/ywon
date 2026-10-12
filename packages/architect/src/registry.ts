/** B-006/B-007 offline capability registry and planner binding. No production auth or execution. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { fingerprint, planProduction } from './index.ts';
import type { Capability, PlanInput, PlanReport, Result } from './index.ts';

export type CapabilityLifecycle = 'candidate'|'verified'|'approved'|'revoked';
export interface EvidenceRecord {id:string;sourceType:'fixture'|'official_document'|'benchmark';sourceUri:string;sha256:string;observedAt:string;expiresAt:string;}
export interface RegistryCapability extends Omit<Capability,'status'> {status:CapabilityLifecycle;recordVersion:number;evidence:EvidenceRecord[];verifiedBy:string|null;approvedBy:string|null;revokedBy:string|null;reason:string|null;updatedAt:string;}
export type RegistryResponse={ok:true;record:RegistryCapability;replayed:boolean}|{ok:true;records:RegistryCapability[]}|{ok:false;code:string};
const worker=fileURLToPath(new URL('../../../workers/architect/registry.py',import.meta.url));
const id=/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
function validId(v:unknown):v is string{return typeof v==='string'&&id.test(v);}
export function runRegistryCommand(database:string,value:unknown):RegistryResponse{
  if(!database||database.length>4096||typeof value!=='object'||value===null||Array.isArray(value))return {ok:false,code:'invalid_command'};
  const text=JSON.stringify(value);if(Buffer.byteLength(text)>256*1024)return {ok:false,code:'command_too_large'};
  const r=spawnSync('python3',[worker,database],{input:text,encoding:'utf8',timeout:10000,maxBuffer:2*1024*1024});
  if(r.error||r.status!==0)return {ok:false,code:'worker_outcome_unknown_check_registry'};
  try{const out:unknown=JSON.parse(r.stdout);if(typeof out!=='object'||out===null||!Object.hasOwn(out,'ok'))return {ok:false,code:'invalid_worker_response'};return out as RegistryResponse;}catch{return {ok:false,code:'invalid_worker_response'};}
}
export interface RegisteredPlanInput {schemaVersion:1;unitId:string;revision:number;scenes:PlanInput['scenes'];assets:PlanInput['assets'];capabilityPins:Array<{id:string;version:string}>;budget:PlanInput['budget'];localCost:PlanInput['localCost'];asOf:string;}
export interface RegistryPlanReport extends PlanReport {registrySnapshotHash:string;registryPins:Array<{id:string;version:string;recordVersion:number;evidenceIds:string[]}>;admissionAsOf:string;admissionHash:string;}
function iso(v:string):number {const n=Date.parse(v);return Number.isFinite(n)?n:NaN;}
export function planWithRegistry(database:string,value:unknown):Result<RegistryPlanReport>{
  if(typeof value!=='object'||value===null||Array.isArray(value))return {ok:false,issues:[{path:'$',code:'object_required'}]};
  const v=value as Record<string,unknown>;
  const allowed=['schemaVersion','unitId','revision','scenes','assets','capabilityPins','budget','localCost','asOf'];
  if(Object.keys(v).some(k=>!allowed.includes(k))||allowed.some(k=>!Object.hasOwn(v,k)))return {ok:false,issues:[{path:'$',code:'invalid_registered_plan'}]};
  if(v['schemaVersion']!==1||typeof v['asOf']!=='string'||!Number.isFinite(iso(v['asOf']))||!Array.isArray(v['capabilityPins'])||v['capabilityPins'].length>32)return {ok:false,issues:[{path:'$',code:'invalid_registered_plan'}]};
  const pins=v['capabilityPins'] as Array<Record<string,unknown>>;
  if(pins.some(p=>!p||Object.keys(p).length!==2||!validId(p['id'])||!validId(p['version'])))return {ok:false,issues:[{path:'capabilityPins',code:'invalid_pin'}]};
  const unique=new Set(pins.map(p=>`${p['id']}@${p['version']}`));if(unique.size!==pins.length)return {ok:false,issues:[{path:'capabilityPins',code:'duplicate'}]};
  const resolved:RegistryCapability[]=[];const registryIssues:Array<{path:string;code:string}>=[];
  for(const p of pins){const q=runRegistryCommand(database,{kind:'get',id:p['id'],version:p['version']});
    if(!q.ok){registryIssues.push({path:`capabilityPins.${String(p['id'])}`,code:q.code==='not_found'?'registry_pin_missing':'registry_unavailable'});continue;}
    if(!('record'in q)){registryIssues.push({path:`capabilityPins.${String(p['id'])}`,code:'registry_invalid_response'});continue;}
    const c=q.record;const now=iso(v['asOf'] as string);
    if(c.status==='revoked')registryIssues.push({path:`capabilityPins.${c.id}`,code:'registry_capability_revoked'});
    else if(c.status!=='approved')registryIssues.push({path:`capabilityPins.${c.id}`,code:'registry_capability_unapproved'});
    else if(c.evidence.length===0||c.evidence.some(e=>iso(e.expiresAt)<=now))registryIssues.push({path:`capabilityPins.${c.id}`,code:'registry_evidence_expired'});
    else resolved.push(c);
  }
  const caps:Capability[]=resolved.map(c=>({id:c.id,version:c.version,status:'verified_fixture',fidelities:c.fidelities,controls:c.controls,requiredAssetKinds:c.requiredAssetKinds,maxDurationSec:c.maxDurationSec,price:c.price}));
  const base=planProduction({schemaVersion:1,unitId:v['unitId'],revision:v['revision'],scenes:v['scenes'],assets:v['assets'],capabilities:caps,budget:v['budget'],localCost:v['localCost']});
  if(!base.ok)return base;
  const registryPins=resolved.map(c=>({id:c.id,version:c.version,recordVersion:c.recordVersion,evidenceIds:c.evidence.map(e=>e.id).sort()})).sort((a,b)=>(a.id+'@'+a.version).localeCompare(b.id+'@'+b.version));
  const issues=[...registryIssues,...base.report.issues];const registrySnapshotHash=fingerprint(registryPins);const admissionAsOf=v['asOf'] as string;const admissionHash=fingerprint({unitId:base.report.unitId,revision:base.report.revision,planFingerprint:base.report.fingerprint,registrySnapshotHash,asOf:admissionAsOf});
  return {ok:true,report:{...base.report,status:issues.length?'blocked':base.report.status,issues,registrySnapshotHash,registryPins,admissionAsOf,admissionHash,limitations:[...base.report.limitations,'Registry actors are trusted local claims, not authenticated production identities.','Approved here means local offline review only; it is not live provider or legal certification.']}};
}
export interface AdmissionRevalidationReport {schemaVersion:1;mode:'offline_admission_revalidation';executionAllowed:false;budgetReserved:false;status:'valid_for_review'|'blocked';unitId:string;revision:number;admissionHash:string;issues:Array<{path:string;code:string}>;}
export function revalidateRegistryAdmission(database:string,value:unknown,asOf:string):Result<AdmissionRevalidationReport>{
 if(typeof value!=='object'||value===null||Array.isArray(value)||!Number.isFinite(iso(asOf)))return {ok:false,issues:[{path:'$',code:'invalid_admission'}]};const report=value as Partial<RegistryPlanReport>;
 if(report.schemaVersion!==1||typeof report.unitId!=='string'||typeof report.revision!=='number'||typeof report.fingerprint!=='string'||typeof report.registrySnapshotHash!=='string'||typeof report.admissionAsOf!=='string'||typeof report.admissionHash!=='string'||!Array.isArray(report.registryPins))return {ok:false,issues:[{path:'$',code:'invalid_admission'}]};
 const issues:Array<{path:string;code:string}>=[];const expected=fingerprint({unitId:report.unitId,revision:report.revision,planFingerprint:report.fingerprint,registrySnapshotHash:report.registrySnapshotHash,asOf:report.admissionAsOf});if(expected!==report.admissionHash)issues.push({path:'admissionHash',code:'admission_hash_mismatch'});
 if(fingerprint(report.registryPins)!==report.registrySnapshotHash)issues.push({path:'registryPins',code:'registry_snapshot_mismatch'});const now=iso(asOf);
 for(const pin of report.registryPins){if(typeof pin!=='object'||pin===null||!validId(pin.id)||!validId(pin.version)||!Number.isSafeInteger(pin.recordVersion)||!Array.isArray(pin.evidenceIds)){issues.push({path:'registryPins',code:'invalid_pin'});continue;}const current=runRegistryCommand(database,{kind:'get',id:pin.id,version:pin.version});if(!current.ok||!('record'in current)){issues.push({path:`registryPins.${pin.id}`,code:'registry_pin_missing'});continue;}const c=current.record;if(c.recordVersion!==pin.recordVersion)issues.push({path:`registryPins.${pin.id}`,code:'registry_record_changed'});if(c.status==='revoked')issues.push({path:`registryPins.${pin.id}`,code:'registry_capability_revoked'});else if(c.status!=='approved')issues.push({path:`registryPins.${pin.id}`,code:'registry_capability_unapproved'});if(c.evidence.length===0||c.evidence.some(e=>iso(e.expiresAt)<=now))issues.push({path:`registryPins.${pin.id}`,code:'registry_evidence_expired'});if(fingerprint([...c.evidence.map(e=>e.id)].sort())!==fingerprint([...pin.evidenceIds].sort()))issues.push({path:`registryPins.${pin.id}`,code:'registry_evidence_changed'});}
 return {ok:true,report:{schemaVersion:1,mode:'offline_admission_revalidation',executionAllowed:false,budgetReserved:false,status:issues.length?'blocked':'valid_for_review',unitId:report.unitId,revision:report.revision,admissionHash:report.admissionHash,issues}};
}

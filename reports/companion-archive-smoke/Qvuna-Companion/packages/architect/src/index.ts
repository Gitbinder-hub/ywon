/** B-004 deterministic OFFLINE planner. No runner, auth, ledger or provider client. */
import { createHash } from 'node:crypto';
export type Fidelity = 'exact_3d' | 'supported_control' | 'prompt_guidance' | '2d_approximation';
export type Control = 'text' | 'reference_image' | 'video' | 'depth' | 'pose' | 'camera' | 'keyframes';
export type AssetKind = 'image' | 'video' | 'depth' | 'pose' | 'audio';
export interface Asset { id: string; kind: AssetKind; sha256: string }
export interface Scene { id: string; durationSec: number; fidelity: Fidelity; controls: Control[]; assetIds: string[]; protectedAssetIds: string[] }
export interface Price { currency: 'USD'; fixedMinor: number; perSecondMinor: number; minimumSeconds: number; roundingSeconds: number }
export interface Capability { id: string; version: string; status: 'verified_fixture' | 'candidate'; fidelities: Fidelity[]; controls: Control[]; requiredAssetKinds: AssetKind[]; maxDurationSec: number; price: Price | null }
export interface Budget { baselineMinor: number; repairPercent: number; projectRemainingMinor: number; monthRemainingMinor: number }
export interface PlanInput { schemaVersion: 1; unitId: string; revision: number; scenes: Scene[]; assets: Asset[]; capabilities: Capability[]; budget: Budget; localCost: { assemblyMinor: number | null; qaMinor: number | null } }
export interface Issue { path: string; code: string }
export interface NodePlan { id: string; sceneId: string | null; kind: 'produce' | 'assemble' | 'qa'; dependsOn: string[]; capabilityId: string | null; capabilityVersion: string | null; inputHash: string; estimatedMinor: number | null }
export interface PlanReport {
  schemaVersion: 1; mode: 'offline_preflight'; executionAllowed: false; budgetReserved: false;
  status: 'ready_for_review' | 'blocked'; fingerprint: string; unitId: string; revision: number;
  currency: 'USD'; baselineMinor: number; repairReserveMinor: number; unitCapMinor: number; effectiveCapMinor: number;
  estimatedInitialMinor: number | null; nodes: NodePlan[]; issues: Issue[];
  limitations: string[];
}
export type Result<T> = { ok: true; report: T } | { ok: false; issues: Issue[] };
const fidelities: readonly string[] = ['exact_3d','supported_control','prompt_guidance','2d_approximation'];
const controls: readonly string[] = ['text','reference_image','video','depth','pose','camera','keyframes'];
const kinds: readonly string[] = ['image','video','depth','pose','audio'];
const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,63}$/;
const MONEY_MAX = 1_000_000_000_000;
function object(value: unknown, keys: readonly string[], path: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(path + ':object_required');
  const v = value as Record<string, unknown>;
  for (const key of Object.keys(v)) if (!keys.includes(key)) throw new Error(path + ':unknown_field');
  for (const key of keys) if (!Object.hasOwn(v,key)) throw new Error(path + '.' + key + ':required');
  return v;
}
function integer(value: unknown, min: number, max: number, path: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) throw new Error(path + ':bounded_integer_required');
  return value;
}
function id(value: unknown, path: string): string {
  if (typeof value !== 'string' || !idPattern.test(value)) throw new Error(path + ':safe_id_required');
  return value;
}
function list<T>(value: unknown, min: number, max: number, path: string, parse: (x: unknown,p: string)=>T): T[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) throw new Error(path + ':bounded_array_required');
  return value.map((x: unknown,i: number)=>parse(x,path+'.'+i));
}
function unique<T>(values: T[], path: string): T[] {
  if (new Set(values).size !== values.length) throw new Error(path + ':duplicate');
  return values;
}
function choice(value: unknown, options: readonly string[], path: string): string {
  if (typeof value !== 'string' || !options.includes(value)) throw new Error(path + ':unsupported');
  return value;
}
function strings(value: unknown, options: readonly string[] | null, path: string): string[] {
  return unique(list(value,0,128,path,(x,p)=>options ? choice(x,options,p) : id(x,p)),path);
}
function parseBudget(value: unknown): Budget {
  const p='budget'; const v=object(value,['baselineMinor','repairPercent','projectRemainingMinor','monthRemainingMinor'],p);
  return {baselineMinor:integer(v['baselineMinor'],0,MONEY_MAX,p+'.baselineMinor'),repairPercent:integer(v['repairPercent'],0,100,p+'.repairPercent'),projectRemainingMinor:integer(v['projectRemainingMinor'],0,MONEY_MAX,p+'.projectRemainingMinor'),monthRemainingMinor:integer(v['monthRemainingMinor'],0,MONEY_MAX,p+'.monthRemainingMinor')};
}
function parsePlan(value: unknown): PlanInput {
  const v=object(value,['schemaVersion','unitId','revision','scenes','assets','capabilities','budget','localCost'],'$');
  if (v['schemaVersion']!==1) throw new Error('schemaVersion:unsupported');
  const assets=list(v['assets'],0,128,'assets',(x,p): Asset=>{
    const a=object(x,['id','kind','sha256'],p);
    if (typeof a['sha256']!=='string' || !/^[a-f0-9]{64}$/.test(a['sha256'])) throw new Error(p+'.sha256:hash_required');
    return {id:id(a['id'],p+'.id'),kind:choice(a['kind'],kinds,p+'.kind') as AssetKind,sha256:a['sha256']};
  }); unique(assets.map(a=>a.id),'assets.id');
  const scenes=list(v['scenes'],1,24,'scenes',(x,p): Scene=>{
    const s=object(x,['id','durationSec','fidelity','controls','assetIds','protectedAssetIds'],p);
    return {id:id(s['id'],p+'.id'),durationSec:integer(s['durationSec'],1,600,p+'.durationSec'),fidelity:choice(s['fidelity'],fidelities,p+'.fidelity') as Fidelity,controls:strings(s['controls'],controls,p+'.controls') as Control[],assetIds:strings(s['assetIds'],null,p+'.assetIds'),protectedAssetIds:strings(s['protectedAssetIds'],null,p+'.protectedAssetIds')};
  }); unique(scenes.map(s=>s.id),'scenes.id');
  const capabilities=list(v['capabilities'],0,32,'capabilities',(x,p): Capability=>{
    const c=object(x,['id','version','status','fidelities','controls','requiredAssetKinds','maxDurationSec','price'],p);
    let price: Price | null=null;
    if (c['price']!==null) {
      const a=object(c['price'],['currency','fixedMinor','perSecondMinor','minimumSeconds','roundingSeconds'],p+'.price');
      if(a['currency']!=='USD') throw new Error(p+'.price.currency:unsupported');
      price={currency:'USD',fixedMinor:integer(a['fixedMinor'],0,1_000_000,p+'.fixedMinor'),perSecondMinor:integer(a['perSecondMinor'],0,1_000_000,p+'.perSecondMinor'),minimumSeconds:integer(a['minimumSeconds'],1,600,p+'.minimumSeconds'),roundingSeconds:integer(a['roundingSeconds'],1,600,p+'.roundingSeconds')};
    }
    return {id:id(c['id'],p+'.id'),version:id(c['version'],p+'.version'),status:choice(c['status'],['verified_fixture','candidate'],p+'.status') as Capability['status'],fidelities:strings(c['fidelities'],fidelities,p+'.fidelities') as Fidelity[],controls:strings(c['controls'],controls,p+'.controls') as Control[],requiredAssetKinds:strings(c['requiredAssetKinds'],kinds,p+'.requiredAssetKinds') as AssetKind[],maxDurationSec:integer(c['maxDurationSec'],1,600,p+'.maxDurationSec'),price};
  }); unique(capabilities.map(c=>c.id),'capabilities.id');
  const local=object(v['localCost'],['assemblyMinor','qaMinor'],'localCost');
  const assemblyMinor=local['assemblyMinor']===null?null:integer(local['assemblyMinor'],0,MONEY_MAX,'localCost.assemblyMinor');
  const qaMinor=local['qaMinor']===null?null:integer(local['qaMinor'],0,MONEY_MAX,'localCost.qaMinor');
  return {schemaVersion:1,unitId:id(v['unitId'],'unitId'),revision:integer(v['revision'],1,1_000_000,'revision'),scenes,assets,capabilities,budget:parseBudget(v['budget']),localCost:{assemblyMinor,qaMinor}};
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value!==null && typeof value==='object') {
    const v=value as Record<string,unknown>;
    return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical(v[k])).join(',')+'}';
  }
  return JSON.stringify(value) ?? 'null';
}
export function fingerprint(value: unknown): string { return createHash('sha256').update(canonical(value)).digest('hex'); }
function invalid(error: unknown): { ok: false; issues: Issue[] } {
  const text=error instanceof Error ? error.message : '$:invalid';const at=text.lastIndexOf(':');
  return {ok:false,issues:[{path:at<0?'$':text.slice(0,at),code:at<0?'invalid':text.slice(at+1)}]};
}
export function monetaryPreview(b: Budget): { reserve: number; unitCap: number; effectiveCap: number } {
  // Bounded safe integers; quotient/remainder avoids imprecise percentage multiplication.
  const reserve=Math.floor(b.baselineMinor/100)*b.repairPercent+Math.floor(((b.baselineMinor%100)*b.repairPercent+50)/100);
  const unitCap=b.baselineMinor+reserve;
  return {reserve,unitCap,effectiveCap:Math.min(unitCap,b.projectRemainingMinor,b.monthRemainingMinor)};
}
function estimate(c: Capability, duration: number): number | null {
  if (!c.price) return null;
  const seconds=Math.max(c.price.minimumSeconds,Math.ceil(duration/c.price.roundingSeconds)*c.price.roundingSeconds);
  return c.price.fixedMinor+seconds*c.price.perSecondMinor;
}
export function planProduction(value: unknown): Result<PlanReport> {
  let input: PlanInput;try {input=parsePlan(value);} catch(e){return invalid(e);}
  const issues: Issue[]=[]; const nodes: NodePlan[]=[];
  const available=new Map(input.assets.map(a=>[a.id,a]));let total=0;let complete=true;
  for (const s of input.scenes) {
    const path='scenes.'+s.id;
    if (s.assetIds.some(a=>!available.has(a)) || s.protectedAssetIds.some(a=>!s.assetIds.includes(a))) {
      issues.push({path,code:'missing_or_unbound_asset'});complete=false;continue;
    }
    const assetKinds=s.assetIds.map(a=>available.get(a)!.kind);
    const matches=input.capabilities.filter(c=>c.status==='verified_fixture' && c.maxDurationSec>=s.durationSec && c.fidelities.includes(s.fidelity) && s.controls.every(k=>c.controls.includes(k)) && c.requiredAssetKinds.every(k=>assetKinds.includes(k)));
    const priced=matches.map(c=>({c,cost:estimate(c,s.durationSec)})).filter((x): x is {c:Capability;cost:number}=>x.cost!==null);
    priced.sort((a,b)=>a.cost-b.cost || (a.c.id<b.c.id?-1:a.c.id>b.c.id?1:0));
    const selected=priced[0];
    if (!selected) {issues.push({path,code:matches.length?'price_unknown':'unsupported_scene'});complete=false;continue;}
    total+=selected.cost;
    nodes.push({id:'produce.'+s.id,sceneId:s.id,kind:'produce',dependsOn:[],capabilityId:selected.c.id,capabilityVersion:selected.c.version,inputHash:fingerprint({scene:s,assets:s.assetIds.map(a=>available.get(a)),capability:selected.c}),estimatedMinor:selected.cost});
  }
  const preview=monetaryPreview(input.budget);
  const localKnown=input.localCost.assemblyMinor!==null && input.localCost.qaMinor!==null;
  if(!localKnown)issues.push({path:'localCost',code:'local_cost_unknown'});
  if(localKnown)total+=input.localCost.assemblyMinor!+input.localCost.qaMinor!;
  if (complete && localKnown && total>input.budget.baselineMinor) issues.push({path:'budget',code:'initial_reprice_required'});
  if (complete && localKnown && total>preview.effectiveCap) issues.push({path:'budget',code:'ancestor_or_unit_cap_exceeded'});
  if (complete) {
    nodes.push({id:'assemble',sceneId:null,kind:'assemble',dependsOn:nodes.map(n=>n.id),capabilityId:null,capabilityVersion:null,inputHash:fingerprint(input.scenes),estimatedMinor:input.localCost.assemblyMinor});
    nodes.push({id:'qa',sceneId:null,kind:'qa',dependsOn:['assemble'],capabilityId:null,capabilityVersion:null,inputHash:fingerprint({scenes:input.scenes,assets:input.assets}),estimatedMinor:input.localCost.qaMinor});
  }
  return {ok:true,report:{schemaVersion:1,mode:'offline_preflight',executionAllowed:false,budgetReserved:false,status:issues.length?'blocked':'ready_for_review',fingerprint:fingerprint(input),unitId:input.unitId,revision:input.revision,currency:'USD',baselineMinor:input.budget.baselineMinor,repairReserveMinor:preview.reserve,unitCapMinor:preview.unitCap,effectiveCapMinor:preview.effectiveCap,estimatedInitialMinor:complete&&localKnown?total:null,nodes,issues,limitations:['Fixture-declared capabilities/prices, not verified live provider terms.','Production auth/reservations/pending liabilities are NOT implemented.','Assembly/QA are planned nodes; supplied local cost estimates are not measured compute charges.','No model/Blender/renderer invocation or quality guarantee.']}};
}
export interface RecoveryReport {
  schemaVersion:1;mode:'offline_recovery';executionAllowed:false;budgetReserved:false;
  state:'repair_proposed'|'needs_user'|'reconciling'|'stopped'; reason:string;
  repairPlanHash:string;unitId:string;revision:number;projectedMinor:number|null;effectiveCapMinor:number;
  requiresApproval:true;affectedSceneIds:string[];retainedAssetIds:string[];
  suggestedAction:string;changedStrategy:boolean;limitations:string[];
}
export function planRecovery(value: unknown): Result<RecoveryReport> {
  try {
    const v=object(value,['schemaVersion','unitId','revision','budget','defect','unsuccessfulAttempts','confirmedMinor','pendingUpperBoundMinor','remainingInitialMinor','repairEstimateMinor','changedStrategy','affectedSceneIds','retainedAssetIds'],'$');
    if(v['schemaVersion']!==1) throw new Error('schemaVersion:unsupported');
    const unitId=id(v['unitId'],'unitId');const revision=integer(v['revision'],1,1_000_000,'revision');const budget=parseBudget(v['budget']);
    const defect=choice(v['defect'],['artifact','identity','camera','timing','provider_transient','unknown_paid','rights','budget'],'defect');
    const attempts=integer(v['unsuccessfulAttempts'],0,1_000_000,'unsuccessfulAttempts');
    if(typeof v['changedStrategy']!=='boolean') throw new Error('changedStrategy:boolean_required');
    const confirmed=integer(v['confirmedMinor'],0,MONEY_MAX,'confirmedMinor');
    const pending=v['pendingUpperBoundMinor']===null?null:integer(v['pendingUpperBoundMinor'],0,MONEY_MAX,'pendingUpperBoundMinor');
    const remaining=integer(v['remainingInitialMinor'],0,MONEY_MAX,'remainingInitialMinor');
    const repair=integer(v['repairEstimateMinor'],0,MONEY_MAX,'repairEstimateMinor');
    const scenes=strings(v['affectedSceneIds'],null,'affectedSceneIds');const retained=strings(v['retainedAssetIds'],null,'retainedAssetIds');
    if(!scenes.length) throw new Error('affectedSceneIds:nonempty_required');
    const cap=monetaryPreview(budget).effectiveCap;const projected=pending===null?null:confirmed+pending+remaining+repair;
    let state: RecoveryReport['state']='repair_proposed';let reason='changed_bounded_strategy';
    if(defect==='rights'){state='stopped';reason='rights_review_required';}
    else if(defect==='unknown_paid'||pending===null){state='reconciling';reason='unknown_paid_outcome';}
    else if(defect==='budget'||projected!>cap){state='needs_user';reason='money_limit';}
    else if(attempts>=2){state='needs_user';reason='pause_before_third';}
    else if(!v['changedStrategy']){state='needs_user';reason='strategy_change_required';}
    const actions: Record<string,string>={artifact:'repair_affected_region_or_shot',identity:'strengthen_identity_reference',camera:'verify_control_and_change_supported_route',timing:'local_timeline_or_audio_edit',provider_transient:'reconcile_provider_and_prepare_bounded_retry',unknown_paid:'poll_or_lookup_existing_operation',rights:'quarantine_and_review_rights',budget:'reestimate_or_stop'};
    return {ok:true,report:{schemaVersion:1,mode:'offline_recovery',executionAllowed:false,budgetReserved:false,state,reason,repairPlanHash:fingerprint(v),unitId,revision,projectedMinor:projected,effectiveCapMinor:cap,requiresApproval:true,affectedSceneIds:scenes,retainedAssetIds:retained,suggestedAction:actions[defect]!,changedStrategy:v['changedStrategy'],limitations:['Proposal only; no authenticated approval or production enforcement.','Input attempt/cost/retained-asset statements are not verified against a ledger/store.','Budget caps assumed cumulative for this preview; production reservations must resolve live scope balances.','No next-output improvement guarantee.']}};
  } catch(e){return invalid(e);}
}

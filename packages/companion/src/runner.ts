/** B-051 local owner pilot. Actual file reads, no cloud pairing/auth, network, paid calls or shell. */
import {createRequire} from 'node:module';
import {mkdirSync,existsSync,lstatSync,chmodSync} from 'node:fs';
import {join,resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {setImmediate as immediate} from 'node:timers/promises';
import {canonical,digest,parseGrant,parseTask,validId} from '../../companion-protocol/src/index.ts';
import type {LocalGrantInput,LocalTask} from '../../companion-protocol/src/index.ts';
import {plainPath,rootIdentity,observeFile,inside} from './files.ts';
import type {FileObservation} from './files.ts';
type SqlValue=string|number|null;type Row=Record<string,SqlValue>;
interface Statement {get(...args:SqlValue[]):Row|undefined;all(...args:SqlValue[]):Row[];run(...args:SqlValue[]):unknown;}
interface Database {exec(sql:string):void;prepare(sql:string):Statement;close():void;}
const require=createRequire(import.meta.url);
const APP=0x51564350;
export type TaskState='queued'|'running'|'succeeded'|'failed'|'cancelled';
interface StoredGrant {input:LocalGrantInput;rootIdentity:string;revoked:boolean;used:number;}
export interface TaskRecord {task:LocalTask;state:TaskState;epoch:number;leaseUntil:number;owner:string|null;checkpoint:number;observations:FileObservation[];result:InventoryResult|null;error:string|null;}
export interface InventoryResult {schemaVersion:1;kind:'file_inventory';taskId:string;operationId:string;files:FileObservation[];totalBytes:number;artifactHash:string;productionReady:false;cloudExecutionAllowed:false;paidCalls:false;}
export interface RunnerOptions {dataDir:string;deviceId:string;workspaceId:string;clock?:()=>number;leaseMs?:number;}
const FLAGS={mode:'offline_local_companion',productionReady:false,cloudExecutionAllowed:false,networkCalls:false,paidCalls:false} as const;
export class LocalRunner {
 private db:Database;private now:()=>number;private leaseMs:number;private dir:string;private deviceId:string;private workspaceId:string;
 constructor(options:RunnerOptions){
  if(Number(process.versions.node.split('.')[0])!==24)throw Error('node_24_required');
  if(!validId(options.deviceId)||!validId(options.workspaceId)||!options.dataDir||options.dataDir.length>4096)throw Error('invalid_runner_config');
  this.now=options.clock??Date.now;this.leaseMs=options.leaseMs??30_000;
  if(!Number.isSafeInteger(this.leaseMs)||this.leaseMs<100||this.leaseMs>60_000)throw Error('invalid_lease');
  this.deviceId=options.deviceId;this.workspaceId=options.workspaceId;this.dir=resolve(options.dataDir);
  // Every existing ancestor is checked before creating the final local state directory.
  let parent=this.dir;while(!existsSync(parent)){const next=resolve(parent,'..');if(next===parent)throw Error('unsafe_state_path');parent=next;}plainPath(parent,true);
  mkdirSync(this.dir,{recursive:true,mode:0o700});plainPath(this.dir,true);
  const path=join(this.dir,'companion.sqlite');
  for(const candidate of [path,path+'-wal',path+'-shm',path+'-journal']){
   let stat;try{stat=lstatSync(candidate);}catch(error){if((error as {code?:string}).code==='ENOENT')continue;throw error;}
   if(stat.isSymbolicLink()||stat.nlink>1)throw Error('unsafe_database_path');plainPath(candidate,false);
  }
  const SQLite=require('node:sqlite') as {DatabaseSync:new(path:string)=>Database};this.db=new SQLite.DatabaseSync(path);
  try{
   this.db.exec('PRAGMA busy_timeout=5000; PRAGMA synchronous=FULL;');
   this.tx(()=>{
    const app=this.db.prepare('PRAGMA application_id').get()?.['application_id'];
    const version=this.db.prepare('PRAGMA user_version').get()?.['user_version'];
    if(app===0&&version===0){
     if(this.db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%'").all().length)throw Error('foreign_database');
     this.db.exec(`CREATE TABLE meta(id INTEGER PRIMARY KEY CHECK(id=1),json TEXT NOT NULL,hash TEXT NOT NULL);
      CREATE TABLE grants(id TEXT PRIMARY KEY,json TEXT NOT NULL,hash TEXT NOT NULL);
      CREATE TABLE tasks(id TEXT PRIMARY KEY,operation_id TEXT NOT NULL UNIQUE,json TEXT NOT NULL,hash TEXT NOT NULL);
      CREATE TABLE events(seq INTEGER PRIMARY KEY AUTOINCREMENT,json TEXT NOT NULL,previous_hash TEXT NOT NULL,hash TEXT NOT NULL);
      CREATE TRIGGER events_no_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT,'append_only'); END;
      CREATE TRIGGER events_no_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT,'append_only'); END;
      PRAGMA application_id=${APP}; PRAGMA user_version=1;`);
     const meta={schemaVersion:1,deviceId:this.deviceId,workspaceId:this.workspaceId};this.db.prepare('INSERT INTO meta VALUES(1,?,?)').run(canonical(meta),digest(meta));
    }else if(app!==APP||version!==1)throw Error('foreign_database');
    const meta=this.decode<{deviceId:string;workspaceId:string}>(this.db.prepare('SELECT json,hash FROM meta WHERE id=1').get());
    if(meta.deviceId!==this.deviceId||meta.workspaceId!==this.workspaceId)throw Error('device_binding_mismatch');
    this.verifyEvents();
   });
   this.db.exec('PRAGMA journal_mode=WAL;');if(process.platform!=='win32')chmodSync(path,0o600);
  }catch(error){this.db.close();throw error;}
 }
 close():void{this.db.close();}
 info():Record<string,unknown>{return {...FLAGS,schemaVersion:1,protocolVersion:1,deviceId:this.deviceId,workspaceId:this.workspaceId,platform:process.platform,architecture:process.arch,nodeVersion:process.version,localExecutionAllowed:true,skill:{id:'local.file-inventory',version:'1'},limitations:['Trusted local owner process, not production auth or OS sandbox.','Native node:sqlite is experimental in the required Node 24 toolchain.','Cloud pairing, GUI/browser tools, payments and publishing not implemented.','Windows10/11 and macOS/Linux distribution require separate device evidence.']};}
 private tx<T>(fn:()=>T):T{this.db.exec('BEGIN IMMEDIATE');try{const result=fn();this.db.exec('COMMIT');return result;}catch(error){this.db.exec('ROLLBACK');throw error;}}
 private decode<T>(row:Row|undefined):T{
  if(!row||typeof row['json']!=='string')throw Error('not_found');const value:unknown=JSON.parse(row['json']);if(digest(value)!==row['hash'])throw Error('integrity_failure');return value as T;
 }
 private save(table:'grants'|'tasks',id:string,value:unknown):void{this.db.prepare(`UPDATE ${table} SET json=?,hash=? WHERE id=?`).run(canonical(value),digest(value),id);}
 private emit(kind:string,entityId:string,payload:unknown):void{
  const last=this.db.prepare('SELECT seq,hash FROM events ORDER BY seq DESC LIMIT 1').get();if(Number(last?.['seq']??0)>=4096)throw Error('pilot_event_limit');
  const previous=String(last?.['hash']??'0'.repeat(64));const value={kind,entityId,payload,at:this.now()};this.db.prepare('INSERT INTO events(json,previous_hash,hash) VALUES(?,?,?)').run(canonical(value),previous,digest({previous,value}));
 }
 private verifyEvents():void{
  let previous='0'.repeat(64);for(const row of this.db.prepare('SELECT seq,json,previous_hash,hash FROM events ORDER BY seq').all()){
   const value:unknown=JSON.parse(String(row['json']));if(row['previous_hash']!==previous||row['hash']!==digest({previous,value}))throw Error('event_integrity_failure');previous=String(row['hash']);
  }
 }
 events():unknown[]{this.verifyEvents();return this.db.prepare('SELECT seq,json,hash FROM events ORDER BY seq').all().map(r=>({seq:r['seq'],event:JSON.parse(String(r['json'])) as unknown,hash:r['hash']}));}
 private binding(input:{deviceId:string;workspaceId:string}):void{if(input.deviceId!==this.deviceId||input.workspaceId!==this.workspaceId)throw Error('device_binding_mismatch');}
 private grant(id:string):StoredGrant{return this.decode<StoredGrant>(this.db.prepare('SELECT json,hash FROM grants WHERE id=?').get(id));}
 private effectiveGrant(id:string):StoredGrant{
  const g=this.grant(id);this.binding(g.input);if(g.revoked)throw Error('grant_revoked');if(this.now()>=Date.parse(g.input.expiresAt))throw Error('grant_expired');
  if(rootIdentity(g.input.root)!==g.rootIdentity)throw Error('root_changed');return g;
 }
 grantFingerprint(id:string):string{const g=this.effectiveGrant(id);return digest({input:g.input,rootIdentity:g.rootIdentity});}
 approve(value:unknown,confirmLocalFolder:boolean):{grantId:string;replayed:boolean}{
  if(confirmLocalFolder!==true)throw Error('local_folder_confirmation_required');const raw=parseGrant(value);this.binding(raw);
  const expires=Date.parse(raw.expiresAt),now=this.now();if(expires<=now||expires-now>86_400_000)throw Error('grant_time_limit');
  const root=plainPath(raw.root,true);if(inside(root,this.dir)||inside(this.dir,root))throw Error('state_input_overlap');
  const input={...raw,root},identity=rootIdentity(root);
  return this.tx(()=>{
   const existing=this.db.prepare('SELECT json,hash FROM grants WHERE id=?').get(input.grantId);
   if(existing){const g=this.decode<StoredGrant>(existing);if(digest(g.input)!==digest(input)||g.rootIdentity!==identity)throw Error('grant_conflict');if(g.revoked)throw Error('grant_revoked');return {grantId:input.grantId,replayed:true};}
   const grant:StoredGrant={input,rootIdentity:identity,revoked:false,used:0};this.db.prepare('INSERT INTO grants VALUES(?,?,?)').run(input.grantId,canonical(grant),digest(grant));this.emit('grant_approved',input.grantId,{rootHash:digest(root),expiresAt:input.expiresAt});return {grantId:input.grantId,replayed:false};
  });
 }
 revoke(grantId:string):void{
  if(!validId(grantId))throw Error('invalid_id');this.tx(()=>{const g=this.grant(grantId);if(g.revoked)return;g.revoked=true;this.save('grants',grantId,g);this.emit('grant_revoked',grantId,{});});
 }
 plan(grantId:string,taskId:string,operationId:string,paths:unknown):LocalTask{
  if(!validId(grantId)||!validId(taskId)||!validId(operationId)||!Array.isArray(paths)||paths.length<1||paths.length>32)throw Error('invalid_plan');
  const g=this.effectiveGrant(grantId);if(paths.length>g.input.maxFiles)throw Error('file_limit');
  let totalBytes=0;const files=paths.map(p=>{if(typeof p!=='string')throw Error('invalid_file_ref');const f=observeFile(g.input.root,p);totalBytes+=f.bytes;if(totalBytes>g.input.maxTotalBytes)throw Error('total_bytes_limit');return {path:f.path,sha256:f.sha256};});
  return parseTask({schemaVersion:1,protocolVersion:1,taskId,operationId,deviceId:this.deviceId,workspaceId:this.workspaceId,grantId,revision:1,skillId:'local.file-inventory',skillVersion:'1',files,costMinor:0});
 }
 enqueue(value:unknown):{record:TaskRecord;replayed:boolean}{
  const task=parseTask(value);this.binding(task);
  return this.tx(()=>{
   const old=this.db.prepare('SELECT json,hash FROM tasks WHERE id=?').get(task.taskId);
   if(old){const record=this.decode<TaskRecord>(old);if(digest(record.task)!==digest(task))throw Error('task_conflict');return {record,replayed:true};}
   if(this.db.prepare('SELECT id FROM tasks WHERE operation_id=?').get(task.operationId))throw Error('operation_conflict');
   const g=this.effectiveGrant(task.grantId);if(g.used>=g.input.maxTasks)throw Error('grant_task_limit');if(task.files.length>g.input.maxFiles)throw Error('file_limit');
   const record:TaskRecord={task,state:'queued',epoch:0,leaseUntil:0,owner:null,checkpoint:0,observations:[],result:null,error:null};
   this.db.prepare('INSERT INTO tasks VALUES(?,?,?,?)').run(task.taskId,task.operationId,canonical(record),digest(record));g.used++;this.save('grants',task.grantId,g);this.emit('task_queued',task.taskId,{operationId:task.operationId,inputHash:digest(task)});return {record,replayed:false};
  });
 }
 status(taskId:string):TaskRecord{if(!validId(taskId))throw Error('invalid_id');return this.decode<TaskRecord>(this.db.prepare('SELECT json,hash FROM tasks WHERE id=?').get(taskId));}
 stop(taskId:string):TaskRecord{
  return this.tx(()=>{const r=this.status(taskId);if(r.state==='succeeded'||r.state==='failed'||r.state==='cancelled')return r;r.state='cancelled';r.epoch++;r.leaseUntil=0;r.owner=null;r.error='owner_stopped';this.save('tasks',taskId,r);this.emit('task_cancelled',taskId,{});return r;});
 }
 private current(taskId:string,owner:string,epoch:number):TaskRecord{
  const r=this.status(taskId);if(r.state!=='running'||r.owner!==owner||r.epoch!==epoch)throw Error('lease_lost');if(this.now()>=r.leaseUntil)throw Error('lease_expired');this.effectiveGrant(r.task.grantId);return r;
 }
 async run(taskId:string,onCheckpoint?:(record:TaskRecord)=>void|Promise<void>,admissionGuard?:()=>void):Promise<TaskRecord>{
  const owner=randomUUID();let record=this.tx(()=>{
   admissionGuard?.();
   const r=this.status(taskId);if(r.state==='succeeded'||r.state==='cancelled'||r.state==='failed')return r;
   this.effectiveGrant(r.task.grantId);if(r.state==='running'&&this.now()<r.leaseUntil)throw Error('task_busy');
   r.state='running';r.epoch++;r.owner=owner;r.leaseUntil=this.now()+this.leaseMs;this.save('tasks',taskId,r);this.emit('task_claimed',taskId,{epoch:r.epoch,resumed:r.checkpoint>0});return r;
  });
  if(record.state!=='running')return record;const epoch=record.epoch;
  while(record.checkpoint<record.task.files.length){
   try{
    admissionGuard?.();record=this.current(taskId,owner,epoch);const grant=this.effectiveGrant(record.task.grantId);const ref=record.task.files[record.checkpoint]!;const observation=observeFile(grant.input.root,ref.path);
    if(observation.sha256!==ref.sha256)throw Error('input_hash_changed');
    if(record.observations.reduce((sum,f)=>sum+f.bytes,0)+observation.bytes>grant.input.maxTotalBytes)throw Error('total_bytes_limit');
    record=this.tx(()=>{admissionGuard?.();const r=this.current(taskId,owner,epoch);r.observations.push(observation);r.checkpoint++;r.leaseUntil=this.now()+this.leaseMs;this.save('tasks',taskId,r);this.emit('file_checked',taskId,{checkpoint:r.checkpoint,sha256:observation.sha256});return r;});
   }catch(error){return this.failOwned(taskId,owner,epoch,error);}
   // Trusted embedding callback only; throw simulates abrupt crash AFTER durable checkpoint.
   if(onCheckpoint)await onCheckpoint(record);await immediate();
  }
  try{
   admissionGuard?.();const grant=this.effectiveGrant(record.task.grantId);
   for(const ref of record.task.files){admissionGuard?.();this.current(taskId,owner,epoch);if(observeFile(grant.input.root,ref.path).sha256!==ref.sha256)throw Error('input_hash_changed');await immediate();}
   return this.tx(()=>{
    admissionGuard?.();const r=this.current(taskId,owner,epoch);const core={schemaVersion:1 as const,kind:'file_inventory' as const,taskId,operationId:r.task.operationId,files:r.observations,totalBytes:r.observations.reduce((n,f)=>n+f.bytes,0),productionReady:false as const,cloudExecutionAllowed:false as const,paidCalls:false as const};
    r.result={...core,artifactHash:digest(core)};r.state='succeeded';r.owner=null;r.leaseUntil=0;this.save('tasks',taskId,r);this.emit('task_succeeded',taskId,{artifactHash:r.result.artifactHash});return r;
   });
  }catch(error){return this.failOwned(taskId,owner,epoch,error);}
 }
 private failOwned(taskId:string,owner:string,epoch:number,error:unknown):TaskRecord{
  return this.tx(()=>{const r=this.status(taskId);if(r.state!=='running'||r.owner!==owner||r.epoch!==epoch)return r;
   r.state='failed';r.owner=null;r.leaseUntil=0;const code=error instanceof Error?error.message:'local_execution_failed';
   r.error=/^[a-z][a-z0-9_]{1,63}$/.test(code)?code:'local_io_failure';this.save('tasks',taskId,r);this.emit('task_failed',taskId,{code:r.error});return r;
  });
 }
}

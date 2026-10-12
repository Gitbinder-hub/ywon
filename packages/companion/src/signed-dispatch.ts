/** Trusted embedding supplies pinned authority + clock; no HTTP/cloud authentication here. */
import {parseDispatch,verifyDispatch} from '../../companion-protocol/src/dispatch.ts';
import type {DispatchAuthority} from '../../companion-protocol/src/dispatch.ts';
import type {TaskRecord} from './runner.ts';
import {LocalRunner} from './runner.ts';
export class SignedDispatchBridge {
 private runner:LocalRunner;private authority:()=>DispatchAuthority;private clock:()=>number;
 constructor(runner:LocalRunner,authority:()=>DispatchAuthority,clock:()=>number=Date.now){this.runner=runner;this.authority=authority;this.clock=clock;}
 async execute(value:unknown,onCheckpoint?:(record:TaskRecord)=>void|Promise<void>):Promise<TaskRecord>{
  // Snapshot caller input: mutation during asynchronous execution cannot alter admitted bytes.
  const wire=JSON.stringify(value);if(typeof wire!=='string'||Buffer.byteLength(wire)>65_536)throw Error('dispatch_size_limit');
  const envelope=parseDispatch(JSON.parse(wire) as unknown);
  const pinnedPolicy=verifyDispatch(envelope,this.authority(),this.clock());
  const guard=():void=>{
   if(verifyDispatch(envelope,this.authority(),this.clock())!==pinnedPolicy)throw Error('dispatch_policy_changed');
   if(this.runner.grantFingerprint(envelope.body.task.grantId)!==envelope.body.grantFingerprint)throw Error('dispatch_grant_mismatch');
  };
  guard();this.runner.enqueue(envelope.body.task);
  // LocalRunner's existing operation/task IDs are the durable replay boundary. No second DB.
  return this.runner.run(envelope.body.task.taskId,onCheckpoint,guard);
 }
}

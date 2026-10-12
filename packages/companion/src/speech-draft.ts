/** Transient review lane; draft/voice confidence never authorizes tools or model spend. */
import {randomUUID} from 'node:crypto';import {fingerprint} from '../../architect/src/index.ts';
import {reviewCompanionIntent} from '../../architect/src/companion-intent.ts';import type {CompanionIntent} from '../../architect/src/companion-intent.ts';
import {validId} from '../../companion-protocol/src/index.ts';import type {LocalAsr} from './asr-process.ts';
export interface SpeechDraft {draftId:string;sessionId:string;text:string;fingerprint:string;engine:'vosk';modelFingerprint:string;executionAllowed:false;requiresReview:true;}
export class SpeechDraftLane {
 private epoch=0;private sid:string|null=null;private enabled=false;private busy=false;private abort:AbortController|null=null;private draft:SpeechDraft|null=null;private clips=new Set<string>();
 constructor(privateEngine?:LocalAsr){this.engine=privateEngine;}
 private engine:LocalAsr|undefined;
 info():{available:boolean;enabled:boolean;busy:boolean;draft:SpeechDraft|null}{return {available:!!this.engine,enabled:this.enabled,busy:this.busy,draft:this.draft?{...this.draft}:null};}
 close():void{this.cancel();this.sid=null;this.enabled=false;this.clips.clear();}
 cancel():void{this.epoch++;this.abort?.abort();this.abort=null;this.busy=false;this.draft=null;}
 enable(sid:string):void{if(!this.engine||!validId(sid))throw Error('asr_unavailable');if(this.sid!==sid){this.close();this.sid=sid;}this.enabled=true;}
 disable():void{this.cancel();this.enabled=false;}
 async decode(sid:string,clipId:string,pcm:Uint8Array):Promise<SpeechDraft>{
  if(!this.enabled||sid!==this.sid||!this.engine)throw Error('asr_not_enabled');if(!validId(clipId)||pcm.byteLength<8000||pcm.byteLength>480000||pcm.byteLength%2)throw Error('asr_pcm_limit');
  if(this.busy)throw Error('asr_busy');if(this.clips.has(clipId))throw Error('asr_clip_replayed');if(this.clips.size>=10)throw Error('asr_clip_limit');this.clips.add(clipId);
  this.cancel();const epoch=this.epoch,abort=new AbortController();this.abort=abort;this.busy=true;
  try{
   const result=await this.engine.recognize(pcm,abort.signal);if(abort.signal.aborted||epoch!==this.epoch||sid!==this.sid||!this.enabled)throw Error('asr_cancelled');
   const body={sessionId:sid,text:result.text,engine:result.engine,modelFingerprint:result.modelFingerprint,audioSha256:result.audioSha256};
   const draft:SpeechDraft={draftId:randomUUID(),sessionId:sid,text:result.text,fingerprint:fingerprint(body),engine:'vosk',modelFingerprint:result.modelFingerprint,executionAllowed:false,requiresReview:true};this.draft=draft;return {...draft};
  }finally{pcm.fill(0);if(epoch===this.epoch){this.busy=false;this.abort=null;}}
 }
 review(sid:string,draftId:string,hash:string,text:unknown,selectedFiles:unknown):CompanionIntent{
  const d=this.draft;if(!this.enabled||sid!==this.sid||!d||d.sessionId!==sid||d.draftId!==draftId||d.fingerprint!==hash)throw Error('asr_draft_stale');
  const intent=reviewCompanionIntent({schemaVersion:1,text,selectedFiles});if(intent.status!=='needs_context')this.draft=null;return intent;
 }
}

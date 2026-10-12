/** B-054 deterministic control plane ONLY. No microphone, ASR/TTS, speaker proof or paid adapter. */
import {randomUUID} from 'node:crypto';
import {exactObject,integer,validId,validRelativeFile} from '../../companion-protocol/src/index.ts';
export type VoiceEffect=
 |{kind:'start_capture';sessionId:string}
 |{kind:'stop_capture'|'close_transport'|'flush_playback'}
 |{kind:'cancel_response';responseId:string}
 |{kind:'request_model';sessionId:string;responseId:string;text:string}
 |{kind:'play_chunk';responseId:string;chunkId:string}
 |{kind:'intent_proposed';responseId:string};
export interface VoiceProposal {kind:'file-inventory-request';files:string[];executionAllowed:false;requiresLocalGrant:true;}
export interface SpeechInput {sessionId:string;turnId:string;text:string;addressee:'owner-directed'|'background'|'uncertain';echo:boolean;}
export function voiceControl(text:string):'close'|'mute'|null{const control=text.trim().toLowerCase().replace(/[.!?]+$/,'').trim();if(['это не тебе','не тебе','спи','закончи разговор'].includes(control))return 'close';if(['выключи микрофон','не слушай'].includes(control))return 'mute';return null;}
export interface VoiceOptions {clock?:()=>number;idleMs?:number;maxSessionMs?:number;}
export class VoiceSession {
 private now:()=>number;private idleMs:number;private maxMs:number;private lastClock=-1;
 private sessionId:string|null=null;private responseId:string|null=null;private started=0;private lastActivity=0;
 private state:'closed'|'active'|'muted'='closed';private phase:'listening'|'thinking'|'speaking'='listening';
 private turns=new Set<string>();private chunks=new Set<string>();private proposal:VoiceProposal|null=null;private responseEnded=false;
 constructor(options:VoiceOptions={}){
  this.now=options.clock??Date.now;this.idleMs=options.idleMs??45_000;this.maxMs=options.maxSessionMs??300_000;
  if(!integer(this.idleMs,1000,120_000)||!integer(this.maxMs,this.idleMs,900_000))throw Error('invalid_voice_config');
 }
 private time():number{const t=this.now();if(!Number.isSafeInteger(t)||t<0||t<this.lastClock)throw Error('invalid_voice_clock');this.lastClock=t;return t;}
 private resetResponse():VoiceEffect[]{
  const effects:VoiceEffect[]=[];if(this.responseId)effects.push({kind:'cancel_response',responseId:this.responseId});
  effects.push({kind:'flush_playback'});this.responseId=null;this.chunks.clear();this.proposal=null;this.responseEnded=false;this.phase='listening';return effects;
 }
 private close(muted=false):VoiceEffect[]{
  const effects=this.resetResponse();effects.push({kind:'stop_capture'},{kind:'close_transport'});
  this.sessionId=null;this.turns.clear();this.state=muted?'muted':'closed';return effects;
 }
 tick():VoiceEffect[]{
  const now=this.time();if(this.state==='active'&&(now-this.lastActivity>=this.idleMs||now-this.started>=this.maxMs))return this.close();return [];
 }
 open(source:'button'|'hotkey'|'local-wake'):VoiceEffect[]{
  if(!['button','hotkey','local-wake'].includes(source))throw Error('invalid_voice_activation');
  // Muted cannot be awakened by a local wake detector. Physical user activation is required.
  if(this.state==='muted'&&source==='local-wake')return [];
  const now=this.time();const effects=this.state==='active'?this.close():[];
  this.state='active';this.sessionId=randomUUID();this.started=now;this.lastActivity=now;this.phase='listening';
  effects.push({kind:'start_capture',sessionId:this.sessionId});return effects;
 }
 stop(muted=false):VoiceEffect[]{return this.close(muted);}
 snapshot():Readonly<{state:string;phase:string;sessionId:string|null;responseId:string|null;hasProposal:boolean}>{
  // Call tick() in the embedding event loop even when no speech arrives.
  return {state:this.state,phase:this.phase,sessionId:this.sessionId,responseId:this.responseId,hasProposal:this.proposal!==null};
 }
 beginSpeech(sessionId:string,addressee:SpeechInput['addressee'],echo=false):VoiceEffect[]{
  const expiry=this.tick();if(this.state!=='active')return expiry;
  if(sessionId!==this.sessionId||echo||addressee!=='owner-directed')return [];
  this.lastActivity=this.time();return this.resetResponse();
 }
 speech(value:SpeechInput):VoiceEffect[]{
  const expiry=this.tick();if(this.state!=='active')return expiry;
  const input=exactObject(value,['sessionId','turnId','text','addressee','echo']);
  if(!validId(input['sessionId'])||!validId(input['turnId'])||typeof input['text']!=='string'||input['text'].length>4096||typeof input['echo']!=='boolean'||!['owner-directed','background','uncertain'].includes(String(input['addressee'])))throw Error('invalid_voice_input');
  if(value.sessionId!==this.sessionId||value.echo||value.addressee!=='owner-directed'||!value.text.trim()||this.turns.has(value.turnId))return [];
  if(this.turns.size>=128)return this.close();this.turns.add(value.turnId);
  const text=value.text.trim();const control=voiceControl(text);if(control)return this.close(control==='mute');
  const effects=this.resetResponse();this.lastActivity=this.time();this.responseId=randomUUID();this.phase='thinking';
  effects.push({kind:'request_model',sessionId:this.sessionId!,responseId:this.responseId,text});return effects;
 }
 output(sessionId:string,responseId:string,chunkId:string):VoiceEffect[]{
  const expiry=this.tick();if(this.state!=='active')return expiry;
  if(sessionId!==this.sessionId||responseId!==this.responseId||this.responseEnded)return [];
  if(!validId(chunkId))throw Error('invalid_voice_chunk');if(this.chunks.has(chunkId))return [];
  if(this.chunks.size>=512)return this.close();this.chunks.add(chunkId);this.phase='speaking';
  // Assistant speech does not prolong the owner's idle window.
  return [{kind:'play_chunk',responseId,chunkId}];
 }
 finished(sessionId:string,responseId:string):VoiceEffect[]{
  const expiry=this.tick();if(this.state!=='active')return expiry;
  if(sessionId===this.sessionId&&responseId===this.responseId){this.phase='listening';this.responseEnded=true;}return [];
 }
 propose(sessionId:string,responseId:string,value:unknown):VoiceEffect[]{
  const expiry=this.tick();if(this.state!=='active')return expiry;
  if(sessionId!==this.sessionId||responseId!==this.responseId||this.responseEnded)return [];
  const p=exactObject(value,['kind','files']);
  if(p['kind']!=='file-inventory-request'||!Array.isArray(p['files'])||p['files'].length<1||p['files'].length>32||!p['files'].every(validRelativeFile)||new Set(p['files'].map((s:string)=>s.toLowerCase())).size!==p['files'].length)throw Error('invalid_voice_proposal');
  if(this.proposal)throw Error('voice_proposal_pending');
  this.proposal={kind:'file-inventory-request',files:[...p['files']] as string[],executionAllowed:false,requiresLocalGrant:true};return [{kind:'intent_proposed',responseId}];
 }
 pending():VoiceProposal|null{
  // Not an execution method. Physical UI/core must separately parse, grant, sign and dispatch.
  if(this.state!=='active'||this.time()-this.lastActivity>=this.idleMs||this.lastClock-this.started>=this.maxMs)return null;
  return this.proposal?{...this.proposal,files:[...this.proposal.files]}:null;
 }
}

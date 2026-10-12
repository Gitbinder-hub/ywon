/** B-056 explicit trusted-owner offline process adapter. No shell/provider/user input in argv. */
import {spawn} from 'node:child_process';import {readFileSync,statSync} from 'node:fs';import {isAbsolute} from 'node:path';import {fileURLToPath} from 'node:url';import {createHash} from 'node:crypto';
import type {ChildProcessWithoutNullStreams} from 'node:child_process';
import {exactObject,integer} from '../../companion-protocol/src/index.ts';
export interface AsrTranscript {schemaVersion:1;engine:'vosk';engineVersion:'0.3.45';modelId:'vosk-model-small-ru-0.22';modelFingerprint:string;sampleRate:16000;text:string;audioSha256:string;durationMs:number;words:Array<{word:string;start:number;end:number;conf:number}>;executionAllowed:false;}
export interface LocalAsr {recognize(pcm:Uint8Array,signal:AbortSignal):Promise<AsrTranscript>;}
export interface AsrConfig {schemaVersion:1;pythonExecutable:string;modelRoot:string;manifestPath:string;manifestSha256:string;timeoutMs:number;}
export function loadAsrConfig(path:string):AsrConfig {
 if(!isAbsolute(path)||statSync(path).size>16_384)throw Error('asr_config_denied');const v=exactObject(JSON.parse(readFileSync(path,'utf8')),['schemaVersion','pythonExecutable','modelRoot','manifestPath','manifestSha256','timeoutMs']);
 if(v['schemaVersion']!==1||!integer(v['timeoutMs'],1000,60_000)||typeof v['manifestSha256']!=='string'||!/^[a-f0-9]{64}$/.test(v['manifestSha256']))throw Error('asr_config_denied');
 for(const key of ['pythonExecutable','modelRoot','manifestPath'])if(typeof v[key]!=='string'||!isAbsolute(v[key] as string)||(v[key] as string).length>4096)throw Error('asr_config_denied');return v as unknown as AsrConfig;
}
export class VoskProcess implements LocalAsr {
 private config:AsrConfig;private busy=false;
 constructor(config:AsrConfig){this.config={...config};}
 private async invoke(pcm:Uint8Array,signal:AbortSignal,probe=false):Promise<unknown>{
  if(signal.aborted)throw Error('asr_cancelled');if(this.busy)throw Error('asr_busy');this.busy=true;
  // -I ignores PYTHONUTF8; request UTF-8 explicitly for the JSON pipe on Windows.
  const c=this.config;const args=['-I','-X','utf8',fileURLToPath(new URL('../../../workers/companion/asr_worker.py',import.meta.url)),'--model-root',c.modelRoot,'--manifest',c.manifestPath,'--manifest-sha256',c.manifestSha256,...(probe?['--probe']:[])];
  const env:Record<string,string>={OPENBLAS_NUM_THREADS:'1',OMP_NUM_THREADS:'1',MKL_NUM_THREADS:'1'};for(const key of ['PATH','SystemRoot','WINDIR','TEMP','TMP','HOME'])if(process.env[key])env[key]=process.env[key]!;
  try{return await new Promise<unknown>((resolve,reject)=>{
   let child:ChildProcessWithoutNullStreams;
   try{child=spawn(c.pythonExecutable,args,{shell:false,windowsHide:true,env,stdio:['pipe','pipe','pipe']});}
   catch{reject(Error('asr_process_failed'));return;}
   let output=Buffer.alloc(0),failure:string|null=null,done=false;
   const stop=(code:string):void=>{failure=code;child.kill();};const cancel=():void=>stop('asr_cancelled');signal.addEventListener('abort',cancel,{once:true});if(signal.aborted)cancel();
   const timer=setTimeout(()=>stop('asr_timeout'),c.timeoutMs);child.stdin.on('error',()=>{});
   child.stdout.on('data',(chunk:Buffer)=>{if(output.length+chunk.length>65_536)stop('asr_output_limit');else output=Buffer.concat([output,chunk]);});child.stderr.on('data',()=>{}); // Never log transcript/model paths/native messages.
   const finish=():void=>{clearTimeout(timer);signal.removeEventListener('abort',cancel);};
   child.once('error',()=>{if(done)return;done=true;finish();reject(Error('asr_process_failed'));});
   child.once('close',code=>{if(done)return;done=true;finish();if(failure){reject(Error(failure));return;}try{const v:unknown=JSON.parse(output.toString('utf8'));if(code!==0)throw Error('asr_worker_denied');resolve(v);}catch{reject(Error('asr_worker_denied'));}});
   child.stdin.end(pcm);
  });}finally{this.busy=false;}
 }
 async probe():Promise<void>{const v=exactObject(await this.invoke(new Uint8Array(),new AbortController().signal,true),['schemaVersion','engine','engineVersion','modelId','modelFingerprint','sampleRate','ready']);if(v['ready']!==true||v['engine']!=='vosk'||v['engineVersion']!=='0.3.45'||v['modelId']!=='vosk-model-small-ru-0.22'||v['modelFingerprint']!==this.config.manifestSha256||v['sampleRate']!==16000||v['schemaVersion']!==1)throw Error('asr_probe_denied');}
 async recognize(pcm:Uint8Array,signal:AbortSignal):Promise<AsrTranscript>{
  if(pcm.byteLength<8000||pcm.byteLength>480000||pcm.byteLength%2)throw Error('asr_pcm_limit');const hash=createHash('sha256').update(pcm).digest('hex');
  const v=exactObject(await this.invoke(pcm,signal),['schemaVersion','engine','engineVersion','modelId','modelFingerprint','sampleRate','text','audioSha256','durationMs','words','executionAllowed']);
  if(v['schemaVersion']!==1||v['engine']!=='vosk'||v['engineVersion']!=='0.3.45'||v['modelId']!=='vosk-model-small-ru-0.22'||v['modelFingerprint']!==this.config.manifestSha256||v['sampleRate']!==16000||v['audioSha256']!==hash||v['durationMs']!==Math.floor(pcm.byteLength*1000/32000)||v['executionAllowed']!==false||typeof v['text']!=='string'||v['text'].length>4096||!Array.isArray(v['words'])||v['words'].length>256)throw Error('asr_result_denied');
  for(const word of v['words']){const w=exactObject(word,['word','start','end','conf']);if(typeof w['word']!=='string'||w['word'].length>128||!['start','end','conf'].every(k=>typeof w[k]==='number'&&Number.isFinite(w[k]))||(w['start'] as number)<0||(w['end'] as number)<(w['start'] as number)||(w['end'] as number)>pcm.byteLength/32000+0.1||(w['conf'] as number)<0||(w['conf'] as number)>1)throw Error('asr_result_denied');}
  return v as unknown as AsrTranscript;
 }
}

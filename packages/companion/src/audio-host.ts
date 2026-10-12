/** B-055 isolated loopback audio pilot. No account auth, PCM ingress, model or task execution. */
import {createServer} from 'node:http';import type {IncomingMessage,ServerResponse} from 'node:http';
import {randomBytes,timingSafeEqual} from 'node:crypto';import {readFileSync} from 'node:fs';
import {SpeechDraftLane} from './speech-draft.ts';import type {LocalAsr} from './asr-process.ts';import type {VoskStreamProcess} from './asr-stream-process.ts';import {validId} from '../../companion-protocol/src/index.ts';
import {VoiceSession,voiceControl} from './voice-session.ts';import type {VoiceEffect} from './voice-session.ts';
export interface AudioHostOptions {port?:number;idleMs?:number;maxSessionMs?:number;heartbeatMs?:number;asr?:LocalAsr;asrStream?:VoskStreamProcess;}
export interface AudioHost {origin:string;close:()=>Promise<void>;}
function equal(a:string,b:string):boolean {const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y);}
export async function startAudioHost(options:AudioHostOptions={}):Promise<AudioHost>{
 const port=options.port??0,heartbeatMs=options.heartbeatMs??5000;
 if(!Number.isInteger(port)||port<0||port>65535||!Number.isInteger(heartbeatMs)||heartbeatMs<500||heartbeatMs>10_000)throw Error('invalid_audio_host');
 const idleMs=options.idleMs??45_000,maxMs=options.maxSessionMs??300_000;
 const voice=new VoiceSession({idleMs,maxSessionMs:maxMs});const lane=new SpeechDraftLane(options.asr);let csrf=randomBytes(32).toString('hex');
 let lastSequence=0;let cookie=randomBytes(32).toString('hex'),cookieExpires=Date.now()+1_800_000,revision=0,lastContact=Date.now(),idleDeadline=0,maxDeadline=0,origin='';
 const assets=new Map<string,{body:Buffer;type:string}>([
 ['/audio-client.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/audio-client.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],
 ['/audio-device.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/audio-device.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],
 ['/pcm16-resampler.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/pcm16-resampler.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],
 ['/pcm-capture.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/pcm-capture.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],
 ['/pcm-stream-capture.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/pcm-stream-capture.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],
 ['/utterance-capture.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/utterance-capture.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],
 ['/audio.css',{body:readFileSync(new URL('../../../apps/desktop-companion/audio.css',import.meta.url)),type:'text/css; charset=utf-8'}]
 ]);
 const template=readFileSync(new URL('../../../apps/desktop-companion/audio.html',import.meta.url),'utf8');
 function headers(res:ServerResponse):void{
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'; object-src 'none'");
  res.setHeader('Permissions-Policy','microphone=(self), camera=(), geolocation=()');res.setHeader('Cross-Origin-Resource-Policy','same-origin');
 }
 function json(res:ServerResponse,status:number,body:unknown):void{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(body));}
 function status(effects:VoiceEffect[]=[]):unknown {return {ok:true,mode:'local_audio_pilot',productionReady:false,modelConnected:false,asrConnected:lane.info().available,localAsr:lane.info(),paidCalls:false,audioUploaded:false,cloudAudioUploaded:false,taskExecutionAllowed:false,revision,snapshot:voice.snapshot(),remainingMs:voice.snapshot().state==='active'?Math.max(0,Math.min(idleDeadline,maxDeadline)-Date.now()):0,effects};}
 function stop():void{lane.close();voice.stop(true);revision++;idleDeadline=0;maxDeadline=0;}
 function authorized(req:IncomingMessage):boolean{
  const candidate=/(?:^|;\s*)Ywon_audio=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie??'')?.[1]??'';
  return Date.now()<cookieExpires&&equal(candidate,cookie)&&equal(String(req.headers['x-Ywon-csrf']??''),csrf);
 }
 async function readBody(req:IncomingMessage,res:ServerResponse,limit:number):Promise<Buffer|null>{
  const size=Number(req.headers['content-length']);if(Number.isFinite(size)&&size>limit){json(res,413,{ok:false,code:'body_limit'});req.resume();return null;}
  const parts:Buffer[]=[];let bytes=0;for await(const raw of req){const b=Buffer.isBuffer(raw)?raw:Buffer.from(raw as string);bytes+=b.length;if(bytes>limit){json(res,413,{ok:false,code:'body_limit'});req.resume();return null;}parts.push(b);}return Buffer.concat(parts);
 }
 function tick():VoiceEffect[]{const effects=voice.tick();if(effects.length){lane.close();revision++;}return effects;}
 function requestSequence(req:IncomingMessage,res:ServerResponse):number|null{
  const n=Number(req.headers['x-Ywon-sequence']);if(!Number.isSafeInteger(n)||n<1||n>10_000){json(res,400,{ok:false,code:'invalid_sequence'});return null;}if(n<=lastSequence){json(res,409,{ok:false,code:'stale_command'});return null;}return n;
 }
 async function route(req:IncomingMessage,res:ServerResponse):Promise<void>{
  headers(res);const method=req.method??'GET';
  if(req.headers.host!==origin.slice('http://'.length)){json(res,403,{ok:false,code:'host_denied'});return;}
  const site=req.headers['sec-fetch-site'];
  if((site&&site!=='same-origin'&&site!=='none')||(req.headers.origin&&req.headers.origin!==origin)){json(res,403,{ok:false,code:'origin_denied'});return;}
  const path=req.url??'/';
  if(method==='GET'&&path==='/'){
   // Owner navigation creates fresh short-lived local browser binding; never an account principal.
   stop();lastSequence=0;csrf=randomBytes(32).toString('hex');cookie=randomBytes(32).toString('hex');cookieExpires=Date.now()+1_800_000;lastContact=Date.now();
   res.setHeader('Set-Cookie',`Ywon_audio=${cookie}; HttpOnly; SameSite=Strict; Path=/; Max-Age=1800`);
   res.setHeader('Content-Type','text/html; charset=utf-8');res.end(template.replace('{{CSRF}}',csrf));return;
  }
  if(method==='GET'&&assets.has(path)){const a=assets.get(path)!;res.setHeader('Content-Type',a.type);res.end(a.body);return;}
  if(!['/api/audio/state','/api/audio/command','/api/audio/asr','/api/audio/review'].includes(path)){json(res,404,{ok:false,code:'not_found'});return;}
  if(!authorized(req)){json(res,403,{ok:false,code:'local_binding_denied'});return;}
  lastContact=Date.now();
  if(path==='/api/audio/state'&&method==='GET'){const effects=tick();json(res,200,status(effects));return;}
  if(path==='/api/audio/asr'||path==='/api/audio/review'){
   if(method!=='POST'||req.headers.origin!==origin){json(res,403,{ok:false,code:'request_denied'});return;}
   const seq=requestSequence(req,res);if(seq===null)return;
   if(path==='/api/audio/asr'){
    if(req.headers['content-type']!=='application/octet-stream'||req.headers['x-Ywon-sample-rate']!=='16000'){json(res,400,{ok:false,code:'asr_format_denied'});return;}
    const sid=String(req.headers['x-Ywon-session']??''),clip=String(req.headers['x-Ywon-clip']??'');
    tick();if(!lane.info().enabled||voice.snapshot().state!=='active'||voice.snapshot().sessionId!==sid){json(res,400,{ok:false,code:'asr_not_enabled'});req.resume();return;}
    const pcm=await readBody(req,res,480000);if(!pcm)return;
    try{
     if(!authorized(req)){json(res,403,{ok:false,code:'local_binding_denied'});return;}
     tick();if(seq<=lastSequence){json(res,409,{ok:false,code:'stale_command'});return;}lastSequence=seq;
     if(!validId(sid)||voice.snapshot().state!=='active'||voice.snapshot().sessionId!==sid){json(res,409,{ok:false,code:'asr_session_stale'});return;}
     revision++;const draft=await lane.decode(sid,clip,pcm);
     tick();if(!authorized(req)||voice.snapshot().sessionId!==sid||voice.snapshot().state!=='active'){json(res,409,{ok:false,code:'asr_cancelled'});return;}
     const control=voiceControl(draft.text);if(control){lane.close();const effects=voice.stop(control==='mute');revision++;json(res,200,{...status(effects) as object,speechStop:true});return;}
     revision++;json(res,200,{...status() as object,draft});return;
    }catch(error){const code=error instanceof Error&&/^asr_[a-z_]+$/.test(error.message)?error.message:'asr_failed';json(res,code==='asr_cancelled'||code==='asr_busy'?409:400,{ok:false,code});return;}finally{pcm.fill(0);}
   }
   if(req.headers['content-type']!=='application/json'){json(res,400,{ok:false,code:'request_denied'});return;}
   const raw=await readBody(req,res,32768);if(!raw)return;
   if(!authorized(req)){json(res,403,{ok:false,code:'local_binding_denied'});return;}
   tick();if(seq<=lastSequence){json(res,409,{ok:false,code:'stale_command'});return;}
   try{
    const v:unknown=JSON.parse(raw.toString('utf8'));if(typeof v!=='object'||v===null||Array.isArray(v)||Object.keys(v).sort().join(',')!=='draftId,fingerprint,selectedFiles,sessionId,text')throw Error('asr_review_invalid');
    const p=v as {draftId:string;fingerprint:string;selectedFiles:unknown;sessionId:string;text:unknown};if(voice.snapshot().state!=='active'||voice.snapshot().sessionId!==p.sessionId)throw Error('asr_draft_stale');
    lastSequence=seq;const intent=lane.review(p.sessionId,p.draftId,p.fingerprint,p.text,p.selectedFiles);
    const generated=voice.speech({sessionId:p.sessionId,turnId:randomBytes(16).toString('hex'),text:p.text as string,addressee:'owner-directed',echo:false});
    const effects:VoiceEffect[]=generated.filter(e=>e.kind!=='request_model');const responseId=voice.snapshot().responseId;
    if(intent.status==='proposal'&&responseId)effects.push(...voice.propose(p.sessionId,responseId,{kind:'file-inventory-request',files:intent.files}));
    if(voice.snapshot().state!=='active')lane.close();idleDeadline=Date.now()+idleMs;revision++;json(res,200,{...status(effects) as object,intent});return;
   }catch{json(res,400,{ok:false,code:'asr_review_denied'});return;}
  }
  if(path==='/api/audio/asr-stream'){
   if(!options.asrStream){json(res,404,{ok:false,code:'asr_stream_unavailable'});return;}
   if(method!=='POST'||req.headers.origin!==origin){json(res,403,{ok:false,code:'request_denied'});return;}
   const seq=requestSequence(req,res);if(seq===null)return;
   if(req.headers['content-type']!=='application/octet-stream'||req.headers['x-Ywon-sample-rate']!=='16000'){json(res,400,{ok:false,code:'asr_format_denied'});req.resume();return;}
   const sid=String(req.headers['x-Ywon-session']??''),isLast=String(req.headers['x-Ywon-last']??'')==='1';
   tick();if(!lane.info().enabled||voice.snapshot().state!=='active'||voice.snapshot().sessionId!==sid){json(res,400,{ok:false,code:'asr_not_enabled'});req.resume();return;}
   // stream: read chunked body (up to 32000) and proxy to persistent worker, SSE-like JSON lines
   const pcm=await readBody(req,res,32000);if(!pcm)return;
   try{
    if(!authorized(req)){json(res,403,{ok:false,code:'local_binding_denied'});return;}
    tick();if(seq<=lastSequence){json(res,409,{ok:false,code:'stale_command'});return;}lastSequence=seq;
    if(!validId(sid)||voice.snapshot().state!=='active'||voice.snapshot().sessionId!==sid){json(res,409,{ok:false,code:'asr_session_stale'});return;}
    let ev;
    if(isLast){
      // last chunk or explicit finalize (empty with isLast)
      if(pcm.byteLength>0){
        if(pcm.byteLength%2===1||pcm.byteLength>32000) throw Error('asr_pcm_limit');
        // send last PCM then finalize in worker
        const tmp=await options.asrStream!.sendChunk(new Uint8Array(pcm));
        // if mid-stream final already, use it; else finalize
        if(tmp.type==='final' && pcm.byteLength<32000) ev=tmp; else ev=await options.asrStream!.finalize();
      } else {
        ev=await options.asrStream!.finalize();
      }
      // produce draft from final text
      const body={sessionId:sid,text:ev.text,engine:ev.engine,modelFingerprint:ev.modelFingerprint,audioSha256:''};
      // use lane.decode path for draft? instead directly push draft logic via lane internals
      // fallback: create draft via lane by calling private via any - simplified: return event
      revision++;
      // include draft-like shape for client
      json(res,200,{...status() as object,stream:ev});return;
    } else {
      if(pcm.byteLength===0||pcm.byteLength%2===1||pcm.byteLength>32000) throw Error('asr_pcm_limit');
      ev=await options.asrStream!.sendChunk(new Uint8Array(pcm));
      tick();if(!authorized(req)||voice.snapshot().sessionId!==sid||voice.snapshot().state!=='active'){json(res,409,{ok:false,code:'asr_cancelled'});return;}
      revision++;
      json(res,200,{...status() as object,stream:ev});return;
    }
   }catch(error){const code=error instanceof Error&&/^asr_[a-z_]+$/.test(error.message)?error.message:'asr_failed';json(res,code==='asr_cancelled'||code==='asr_busy'?409:400,{ok:false,code});return;}finally{pcm?.fill(0);}
  }
 if(path!=='/api/audio/command'||method!=='POST'){json(res,405,{ok:false,code:'method_denied'});return;}
  if(req.headers.origin!==origin||req.headers['content-type']!=='application/json'){json(res,403,{ok:false,code:'request_denied'});return;}
  const length=Number(req.headers['content-length']);if(Number.isFinite(length)&&length>256){json(res,413,{ok:false,code:'body_limit'});req.resume();return;}
  const chunks:Buffer[]=[];let bytes=0;
  for await(const raw of req){const part=Buffer.isBuffer(raw)?raw:Buffer.from(raw as string);bytes+=part.length;if(bytes>256){json(res,413,{ok:false,code:'body_limit'});req.resume();return;}chunks.push(part);}
  if(!authorized(req)){json(res,403,{ok:false,code:'local_binding_denied'});return;}
  let command:unknown;try{command=JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;}catch{json(res,400,{ok:false,code:'invalid_command'});return;}
  if(typeof command!=='object'||command===null||Array.isArray(command)||Object.keys(command).length!==2||!Object.hasOwn(command,'command')||!Object.hasOwn(command,'sequence')){json(res,400,{ok:false,code:'invalid_command'});return;}
  const {command:name,sequence}=(command as {command:unknown;sequence:unknown});
  if(typeof sequence!=='number'||!Number.isSafeInteger(sequence)||sequence<1||sequence>10_000){json(res,400,{ok:false,code:'invalid_sequence'});return;}
  if(sequence<=lastSequence){json(res,409,{ok:false,code:'stale_command'});return;}
  if(!['activate','mute','close','interrupt','diagnostic','capture-failed','asr-enable','asr-disable','utterance-start'].includes(String(name))){json(res,400,{ok:false,code:'unsupported_command'});return;}
  // Expiry may happen while a bounded request body is arriving. Never renew an expired session via audio events.
  lastSequence=sequence;const expired=tick();let effects:VoiceEffect[]=[...expired];
  if(name==='activate'){lane.close();effects.push(...voice.open('button'));idleDeadline=Date.now()+idleMs;maxDeadline=Date.now()+maxMs;}
  else if(name==='mute'||name==='capture-failed'){lane.close();effects.push(...voice.stop(true));}
  else if(name==='close'){lane.close();effects.push(...voice.stop());}
  else if(voice.snapshot().state==='active'){
   const sid=voice.snapshot().sessionId!;idleDeadline=Date.now()+idleMs;
   if(name==='asr-enable'){try{lane.enable(sid);}catch{json(res,400,{ok:false,code:'asr_unavailable'});return;}}
   else if(name==='asr-disable')lane.disable();
   else if(name==='utterance-start'){if(!lane.info().enabled){json(res,400,{ok:false,code:'asr_not_enabled'});return;}lane.cancel();effects.push(...voice.beginSpeech(sid,'owner-directed'));}
   else if(name==='interrupt'){lane.cancel();effects.push(...voice.beginSpeech(sid,'owner-directed'));}
   else if(name==='diagnostic'){
    lane.cancel();const generated=voice.speech({sessionId:sid,turnId:randomBytes(16).toString('hex'),text:'local speaker diagnostic',addressee:'owner-directed',echo:false});
    // No request_model event leaves this offline adapter. The fixed diagnostic tone is not an AI answer.
    for(const effect of generated){if(effect.kind!=='request_model')effects.push(effect);else effects.push(...voice.output(sid,effect.responseId,'tone'));}
   }
  }
  revision++;json(res,200,status(effects));
 }
 const server=createServer((req,res)=>{void route(req,res).catch(()=>{stop();if(!res.headersSent)json(res,500,{ok:false,code:'audio_host_error'});else res.destroy();});});
 server.requestTimeout=3000;server.headersTimeout=5000;server.keepAliveTimeout=1000;server.maxHeadersCount=32;
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 const address=server.address();if(!address||typeof address==='string')throw Error('audio_host_failed');origin=`http://127.0.0.1:${address.port}`;
 const timer=setInterval(()=>{try{tick();if(voice.snapshot().state==='active'&&Date.now()-lastContact>=heartbeatMs)stop();}catch{stop();}},250);timer.unref();
 return {origin,close:async()=>{clearInterval(timer);stop();server.closeAllConnections();await new Promise<void>((resolve,reject)=>server.close(err=>err?reject(err):resolve()));}};
}

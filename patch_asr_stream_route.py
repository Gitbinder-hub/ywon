import pathlib, re
p = pathlib.Path("packages/companion/src/audio-host.ts")
t = p.read_text(encoding="utf-8")
# 1. add import for VoskStreamProcess and pcm-stream assets
old_import = "import {SpeechDraftLane} from './speech-draft.ts';import type {LocalAsr} from './asr-process.ts';import {validId} from '../../companion-protocol/src/index.ts';"
new_import = "import {SpeechDraftLane} from './speech-draft.ts';import type {LocalAsr} from './asr-process.ts';import type {VoskStreamProcess} from './asr-stream-process.ts';import {validId} from '../../companion-protocol/src/index.ts';"
if old_import in t:
    t = t.replace(old_import, new_import)
    print("import patched")
else:
    print("import not found")

# 2. extend AudioHostOptions to allow streaming
old_opt = "export interface AudioHostOptions {port?:number;idleMs?:number;maxSessionMs?:number;heartbeatMs?:number;asr?:LocalAsr;}"
new_opt = "export interface AudioHostOptions {port?:number;idleMs?:number;maxSessionMs?:number;heartbeatMs?:number;asr?:LocalAsr;asrStream?:VoskStreamProcess;}"
if old_opt in t:
    t = t.replace(old_opt, new_opt)
    print("options patched")

# 3. add asset for pcm-stream-capture.mjs
old_assets = " ['/pcm-capture.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/pcm-capture.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],"
new_assets = " ['/pcm-capture.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/pcm-capture.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],\n ['/pcm-stream-capture.mjs',{body:readFileSync(new URL('../../../apps/desktop-companion/pcm-stream-capture.mjs',import.meta.url)),type:'text/javascript; charset=utf-8'}],"
if old_assets in t:
    t = t.replace(old_assets, new_assets)
    print("assets patched")
else:
    print("assets not found char", repr(t[800:1200]))

# 4. add streaming route before the existing /api/audio/command check - inject after /api/audio/review handling
# Find the line: if(path!=='/api/audio/command'...
old_check = " if(path!=='/api/audio/command'||method!=='POST'){json(res,405,{ok:false,code:'method_denied'});return;}"
stream_route = """ if(path==='/api/audio/asr-stream'){
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
  }"""
if old_check in t:
    t = t.replace(old_check, stream_route + "\n" + old_check)
    print("stream route patched")
else:
    print("old_check not found")

p.write_text(t, encoding="utf-8")
print("written", p.stat().st_size)
import hashlib
print(hashlib.sha256(p.read_bytes()).hexdigest()[:16])

import pathlib, hashlib
p = pathlib.Path("apps/desktop-companion/audio-client.mjs")
t = p.read_text(encoding="utf-8")
# Add import for stream capture + streaming fetch loop
# We will append live streaming handlers after existing handlers

# Patch 1: ensure finishPhrase streaming variant added, and new button handler for stream mode
insertion = """
// ---- B-060 live streaming support ----
import {PcmStreamCapture as _StreamCheck} from './pcm-stream-capture.mjs'; // ensure bundler knows about stream module
let streamAbort=null, streamSession=null;
async function startLiveStream(){
 if(!state?.localAsr?.enabled||!$('asr-consent').checked||!audio.facts().capturing) return;
 const sid=state.snapshot.sessionId;
 // Use utterance-capture in chunked mode via /api/audio/asr-stream
 // For live partials, we open an AudioWorkletNode directly here (stream variant)
 try{
  await audio.context.audioWorklet.addModule('/pcm-stream-capture.mjs');
 }catch(e){ $('intent').textContent='Live stream worklet not available: '+e; return; }
 const id=crypto.randomUUID();
 const node=new AudioWorkletNode(audio.context,'Ywon-pcm-stream',{numberOfInputs:1,numberOfOutputs:1});
 let closed=false;
 const abort=new AbortController(); streamAbort=abort; streamSession=sid;
 let seqLocal=sequence;
 node.port.onmessage=async event=>{
  const e=event.data;
  if(e?.id!==id) return;
  if(e.kind==='chunk' && e.buffer instanceof ArrayBuffer){
   const bytes=new Uint8Array(e.buffer);
   if(bytes.byteLength===0) return;
   // send chunk immediately
   try{
    const res=await fetch('/api/audio/asr-stream',{method:'POST',credentials:'same-origin',headers:{'X-Ywon-CSRF':csrf,'Content-Type':'application/octet-stream','X-Ywon-Sample-Rate':'16000','X-Ywon-Session':sid,'X-Ywon-Sequence':String(++sequence),'X-Ywon-Last':'0'},body:bytes,signal:abort.signal});
    const next=await res.json();
    if(!res.ok){ if(!abort.signal.aborted) $('intent').textContent='Stream chunk failed: '+(next.code||res.status); return; }
    if(next.stream){
     if(next.stream.type==='partial') $('transcript').value=next.stream.text;
     else if(next.stream.type==='final'){ $('transcript').value=next.stream.text; await apply(next); }
     renderSpeech();
    }
   }catch(err){ if(!abort.signal.aborted) $('intent').textContent='Stream error: '+err; }
  }
  if(e.kind==='end'){
   closed=true;
   try{ node.disconnect(); }catch{}
   try{
    const res=await fetch('/api/audio/asr-stream',{method:'POST',credentials:'same-origin',headers:{'X-Ywon-CSRF':csrf,'Content-Type':'application/octet-stream','X-Ywon-Sample-Rate':'16000','X-Ywon-Session':sid,'X-Ywon-Sequence':String(++sequence),'X-Ywon-Last':'1'},body:new Uint8Array(),signal:abort.signal});
    const next=await res.json();
    if(res.ok && next.stream){ $('transcript').value=next.stream.text; await apply(next); renderSpeech(); }
   }catch{}
   if(streamAbort===abort) streamAbort=null;
  }
 };
 try{ audio.source.connect(node); node.connect(audio.context.destination); }catch(e){ $('intent').textContent='Stream connect failed'; return; }
 node.port.postMessage({kind:'start',id});
 // expose stop
 window.YwonStopStream=()=>{
  if(closed) return;
  closed=true;
  try{ node.port.postMessage({kind:'finish',id}); }catch{}
  abort.abort();
 };
 $('intent').textContent='Live stream active — partials updating';
}
window.YwonStartLiveStream=startLiveStream;
"""

if "YwonStartLiveStream" not in t:
    t = t + insertion
    print("live stream appended")
else:
    print("already exists")

p.write_text(t, encoding="utf-8")
print(p.stat().st_size, hashlib.sha256(p.read_bytes()).hexdigest()[:12])

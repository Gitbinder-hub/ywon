import pathlib
p = pathlib.Path("apps/desktop-companion/pcm-stream-capture.mjs")
p.write_text("""import {Pcm16Resampler} from './pcm16-resampler.mjs';
/** Streaming variant: emits frequent chunks for live ASR partials. 1.5s utterance max, chunk 1024-2048 bytes. */
class PcmStreamCapture extends AudioWorkletProcessor {
 constructor(){super();this.id=null;this.resampler=null;this.pending=new Uint8Array(2048);this.at=0;this.disposed=false;this.port.onmessage=event=>{
  const e=event.data;
  if(e?.kind==='start'&&typeof e.id==='string'&&e.id.length<=64){this.at=0;this.id=e.id;this.resampler=new Pcm16Resampler(sampleRate, 24000*16);this.disposed=false;}
  else if(e?.kind==='finish'&&e.id===this.id) this.finish();
  else if(e?.kind==='cancel'&&e.id===this.id){this.disposed=true;this.id=null;this.resampler=null;this.pending.fill(0);this.at=0;}
 };}
 flush(){if(this.id&&this.at){const bytes=this.pending.slice(0,this.at);this.at=0;this.port.postMessage({kind:'chunk',id:this.id,buffer:bytes.buffer},[bytes.buffer]);}}
 finish(){this.flush();if(this.id) this.port.postMessage({kind:'end',id:this.id});this.id=null;this.resampler=null;this.disposed=true;this.pending.fill(0);}
 process(inputs,outputs){
  for(const ch of outputs) for(const out of ch) out.fill(0);
  if(this.disposed) return false;
  if(this.id&&this.resampler&&inputs[0]?.[0]){
   const bytes=this.resampler.feed(inputs[0][0]);
   for(const b of bytes){this.pending[this.at++]=b; if(this.at>=1024) this.flush();}
   if(bytes.length) this.port.postMessage({kind:'partial',id:this.id,size:this.at});
   if(this.resampler.complete) this.finish();
  }
  return !this.disposed;
 }
}
registerProcessor('Ywon-pcm-stream', PcmStreamCapture);
""", encoding="utf-8")
print(p.stat().st_size, p.read_text(encoding="utf-8")[:300])

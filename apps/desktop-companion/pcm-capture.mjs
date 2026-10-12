import {Pcm16Resampler} from './pcm16-resampler.mjs';
class PcmCapture extends AudioWorkletProcessor {
 constructor(){super();this.id=null;this.resampler=null;this.pending=new Uint8Array(1024);this.at=0;this.disposed=false;this.port.onmessage=event=>{const e=event.data;if(e?.kind==='start'&&typeof e.id==='string'&&e.id.length<=64){this.at=0;this.id=e.id;this.resampler=new Pcm16Resampler(sampleRate);}else if(e?.kind==='finish'&&e.id===this.id)this.finish();else if(e?.kind==='cancel'&&e.id===this.id){this.disposed=true;this.id=null;this.resampler=null;this.pending.fill(0);this.at=0;}};}
 flush(){if(this.id&&this.at){const bytes=this.pending.slice(0,this.at);this.at=0;this.port.postMessage({kind:'chunk',id:this.id,buffer:bytes.buffer},[bytes.buffer]);}}
 finish(){this.flush();if(this.id)this.port.postMessage({kind:'end',id:this.id});this.id=null;this.resampler=null;this.disposed=true;this.pending.fill(0);}
 process(inputs,outputs){for(const channels of outputs)for(const output of channels)output.fill(0); // Silent graph output; never monitor raw microphone.
  if(this.disposed)return false;
  if(this.id&&this.resampler&&inputs[0]?.[0]){const bytes=this.resampler.feed(inputs[0][0]);for(const byte of bytes){this.pending[this.at++]=byte;if(this.at===1024)this.flush();}if(this.resampler.complete)this.finish();}return !this.disposed;
 }
}
registerProcessor('Ywon-pcm-capture',PcmCapture);

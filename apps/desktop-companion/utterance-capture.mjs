/** Explicit max15s clip in memory. No ASR/upload by itself. */
export class UtteranceCapture {
 constructor(){this.epoch=0;this.node=null;this.source=null;this.chunks=[];this.bytes=0;this.id=null;this.resolve=null;this.timer=null;this.done=null;}
 cancel(){this.epoch++;clearTimeout(this.timer);this.timer=null;if(this.source&&this.node)try{this.source.disconnect(this.node);}catch{}if(this.node){if(this.id)this.node.port.postMessage({kind:'cancel',id:this.id});this.node.disconnect();this.node.port.close();}this.node=null;this.source=null;this.id=null;this.chunks.forEach(x=>x.fill(0));this.chunks=[];this.bytes=0;if(this.resolve)this.resolve(null);this.resolve=null;this.done=null;}
 async start(context,source){
  this.cancel();const epoch=this.epoch;if(!context?.audioWorklet||!source||typeof AudioWorkletNode!=='function')throw Error('pcm_worklet_unsupported');
  try{await context.audioWorklet.addModule('/pcm-capture.mjs');}catch(error){if(epoch!==this.epoch)return false;throw error;}
  if(epoch!==this.epoch||context.state==='closed')return false;
  const id=crypto.randomUUID(),node=new AudioWorkletNode(context,'Ywon-pcm-capture',{numberOfInputs:1,numberOfOutputs:1,outputChannelCount:[1]});this.id=id;this.node=node;this.source=source;this.done=new Promise(resolve=>{this.resolve=resolve;});
  node.port.onmessage=event=>{
   const e=event.data;if(epoch!==this.epoch||e?.id!==this.id)return;
   if(e.kind==='chunk'&&e.buffer instanceof ArrayBuffer){const bytes=new Uint8Array(e.buffer);if(bytes.byteLength>4096||this.bytes+bytes.byteLength>480000){bytes.fill(0);this.cancel();return;}this.bytes+=bytes.byteLength;this.chunks.push(bytes);}
   if(e.kind==='end'){
    const pcm=new Uint8Array(this.bytes);let at=0;for(const bytes of this.chunks){pcm.set(bytes,at);at+=bytes.byteLength;bytes.fill(0);}const resolve=this.resolve;this.resolve=null;this.cancel();resolve?.({clipId:id,pcm});
   }
  };
  source.connect(node);node.connect(context.destination);node.port.postMessage({kind:'start',id});this.timer=setTimeout(()=>node.port.postMessage({kind:'finish',id}),15000);return true;
 }
 finish(){const done=this.done;if(this.node)this.node.port.postMessage({kind:'finish',id:this.id});return done??Promise.resolve(null);}
 get recording(){return this.node!==null;}
}

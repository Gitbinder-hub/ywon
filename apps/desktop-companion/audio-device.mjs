/** Local browser audio only. No recorder, ASR, upload, classifier or wake detector. */
export class LocalAudioDevice {
 constructor({mediaDevices=globalThis.navigator?.mediaDevices,Context=globalThis.AudioContext}={}){
  this.mediaDevices=mediaDevices;this.Context=Context;this.epoch=0;this.stream=null;this.context=null;this.source=null;this.analyser=null;this.tone=null;this.sessionId=null;this.pending=false;this.samples=new Float32Array(256);
 }
 async start(sessionId){
  if(typeof sessionId!=='string'||!sessionId)throw Error('invalid_audio_session');
  this.stop();const epoch=this.epoch;this.pending=true;
  let stream=null,context=null;
  try{
   if(!this.mediaDevices?.getUserMedia||!this.Context)throw Error('audio_unsupported');
   stream=await this.mediaDevices.getUserMedia({audio:{channelCount:1,echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
   if(epoch!==this.epoch){stream.getTracks().forEach(t=>t.stop());return false;}
   if(!stream.getAudioTracks().length)throw Error('audio_track_missing');
   context=new this.Context();await context.resume();
   if(epoch!==this.epoch){stream.getTracks().forEach(t=>t.stop());await context.close();return false;}
   const source=context.createMediaStreamSource(stream),analyser=context.createAnalyser();analyser.fftSize=256;source.connect(analyser); // NEVER connect microphone to speaker.
   this.stream=stream;this.context=context;this.source=source;this.analyser=analyser;this.sessionId=sessionId;this.pending=false;return true;
  }catch(error){stream?.getTracks().forEach(t=>t.stop());if(context&&context.state!=='closed')await context.close().catch(()=>{});if(epoch===this.epoch)this.stop();throw error;}
 }
 flush(){const tone=this.tone;this.tone=null;if(tone){try{tone.stop();}catch{}try{tone.disconnect();}catch{}}}
 stop(){
  this.epoch++;this.pending=false;this.sessionId=null;this.flush();
  const stream=this.stream,context=this.context,source=this.source,analyser=this.analyser;
  this.stream=null;this.context=null;this.source=null;this.analyser=null;
  stream?.getTracks().forEach(t=>t.stop());try{source?.disconnect();analyser?.disconnect();}catch{}
  if(context&&context.state!=='closed')void context.close().catch(()=>{});
 }
 level(){if(!this.analyser)return 0;this.analyser.getFloatTimeDomainData(this.samples);let sum=0;for(const n of this.samples)sum+=n*n;return Math.min(1,Math.sqrt(sum/this.samples.length));}
 playTone(){
  if(!this.context||!this.stream)throw Error('audio_not_open');this.flush();const context=this.context,oscillator=context.createOscillator(),gain=context.createGain();
  oscillator.frequency.value=330;gain.gain.value=0.06;oscillator.connect(gain);gain.connect(context.destination);this.tone=oscillator;
  oscillator.onended=()=>{if(this.tone===oscillator)this.tone=null;oscillator.disconnect();gain.disconnect();};oscillator.start();oscillator.stop(context.currentTime+1.2);
 }
 facts(){return {capturing:!!this.stream&&this.stream.getAudioTracks().some(t=>t.readyState==='live'),pending:this.pending,trackCount:this.stream?.getTracks().length??0,outputPlaying:this.tone!==null,sessionId:this.sessionId,audioUploaded:false,modelConnected:false};}
}

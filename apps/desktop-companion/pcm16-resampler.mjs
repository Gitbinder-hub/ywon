/** Bounded mono PCM16 conversion. Box averaging, not a certified band-limited speech front-end. */
export class Pcm16Resampler {
 constructor(rate,maxSamples=240000){if(!Number.isFinite(rate)||rate<16000||rate>192000||!Number.isSafeInteger(maxSamples)||maxSamples<1||maxSamples>240000)throw Error('invalid_pcm_config');this.rate=rate;this.max=maxSamples;this.phase=0;this.sum=0;this.count=0;this.emitted=0;}
 feed(input){const values=[];for(const raw of input){if(this.emitted>=this.max)break;const x=Number.isFinite(raw)?Math.max(-1,Math.min(1,raw)):0;this.sum+=x;this.count++;this.phase+=16000;if(this.phase>=this.rate){this.phase-=this.rate;const v=this.sum/this.count;values.push(v<0?Math.round(v*32768):Math.round(v*32767));this.sum=0;this.count=0;this.emitted++;}}const bytes=new Uint8Array(values.length*2),view=new DataView(bytes.buffer);values.forEach((v,i)=>view.setInt16(i*2,v,true));return bytes;}
 get complete(){return this.emitted>=this.max;}
}

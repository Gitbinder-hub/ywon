import test from 'node:test';import assert from 'node:assert/strict';
import {LocalAudioDevice} from '../apps/desktop-companion/audio-device.mjs';
function fixture({defer=false,deny=false}={}){
 const track={readyState:'live',stop(){this.readyState='ended';}},stream={getTracks:()=>[track],getAudioTracks:()=>[track]};let resolve;
 const promise=defer?new Promise(r=>{resolve=r;}):Promise.resolve(stream);let constraints;
 const mediaDevices={getUserMedia:c=>{constraints=c;return deny?Promise.reject(Error('permission_denied')):promise;}};
 const node=()=>({connect(){},disconnect(){}});let stopped=0,closes=0;
 class Context{state='running';currentTime=0;destination={};async resume(){}async close(){closes++;this.state='closed';}createMediaStreamSource(){return node();}createAnalyser(){return {...node(),getFloatTimeDomainData(a){a.fill(0.1);}};}createOscillator(){return {...node(),frequency:{value:0},start(){},stop(){stopped++;}};}createGain(){return {...node(),gain:{value:0}};}}
 const audio=new LocalAudioDevice({mediaDevices,Context});return {audio,track,stream,resolve:()=>resolve(stream),constraints:()=>constraints,stopped:()=>stopped,closes:()=>closes};
}
test('device opens mono microphone only, no speaker feedback or audio upload',async()=>{const f=fixture();assert.equal(f.audio.facts().capturing,false);await f.audio.start('session');assert.equal(f.constraints().video,false);assert.equal(f.constraints().audio.channelCount,1);assert.equal(f.audio.facts().capturing,true);assert.equal(f.audio.facts().audioUploaded,false);assert.ok(f.audio.level()>0);f.audio.stop();assert.equal(f.track.readyState,'ended');assert.equal(f.audio.level(),0);});
test('mute immediately stops all media tracks and context',async()=>{const f=fixture();await f.audio.start('session');f.audio.stop();assert.equal(f.track.readyState,'ended');assert.equal(f.audio.facts().trackCount,0);assert.equal(f.closes(),1);});
test('permission resolution after stop cannot resurrect microphone',async()=>{const f=fixture({defer:true});const start=f.audio.start('session');assert.equal(f.audio.facts().pending,true);f.audio.stop();f.resolve();assert.equal(await start,false);assert.equal(f.track.readyState,'ended');assert.equal(f.audio.facts().capturing,false);});
test('permission denied leaves no active or pending capture',async()=>{const f=fixture({deny:true});await assert.rejects(f.audio.start('session'),/permission_denied/);assert.equal(f.audio.facts().capturing,false);assert.equal(f.audio.facts().pending,false);});
test('unsupported browser and invalid session cannot open audio',async()=>{const a=new LocalAudioDevice({mediaDevices:{},Context:null});await assert.rejects(a.start('session'),/unsupported/);await assert.rejects(a.start(''),/invalid_audio/);assert.equal(a.facts().capturing,false);});
test('diagnostic playback and interruption stop oscillator; mic stays active',async()=>{const f=fixture();await f.audio.start('session');f.audio.playTone();assert.equal(f.audio.facts().outputPlaying,true);f.audio.flush();assert.equal(f.audio.facts().outputPlaying,false);assert.equal(f.audio.facts().capturing,true);assert.ok(f.stopped()>=2);f.audio.stop();});
test('playback cannot start with microphone channel closed',()=>{const f=fixture();assert.throws(()=>f.audio.playTone(),/audio_not_open/);});
test('repeated stop/flush safe, no growing resource collection',async()=>{const f=fixture();await f.audio.start('session');for(let i=0;i<10;i++){f.audio.stop();f.audio.flush();}assert.equal(f.closes(),1);assert.equal(f.audio.facts().trackCount,0);});

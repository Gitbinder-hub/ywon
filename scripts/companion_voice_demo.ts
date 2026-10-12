/** Synthetic control-plane demonstration. Does not capture, transmit or play audio. */
import {VoiceSession} from '../packages/companion/src/voice-session.ts';
let now=1_000;const session=new VoiceSession({clock:()=>now});
const activation=session.open('button');const sid=session.snapshot().sessionId!;
const turn=session.speech({sessionId:sid,turnId:'demo-turn',text:'Проверь мои файлы',addressee:'owner-directed',echo:false});
const response=turn.find(e=>e.kind==='request_model');if(!response||response.kind!=='request_model')throw Error('demo_failed');
session.output(sid,response.responseId,'demo-chunk');
const backgroundIgnored=session.speech({sessionId:sid,turnId:'family-turn',text:'Разговор семьи',addressee:'background',echo:false}).length===0;
const interrupt=session.beginSpeech(sid,'owner-directed');
const staleAudioIgnored=session.output(sid,response.responseId,'late-chunk').length===0;
now+=45_000;const sleep=session.tick();
console.log(JSON.stringify({mode:'synthetic_voice_control_demo',productionReady:false,microphoneOpened:false,audioPlayed:false,providerCalls:0,executionAllowed:false,activationEffects:activation.map(e=>e.kind),backgroundIgnored,interruptionEffects:interrupt.map(e=>e.kind),staleAudioIgnored,sleepEffects:sleep.map(e=>e.kind),finalState:session.snapshot().state}));

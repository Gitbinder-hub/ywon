
import {runGoogleLiveSpike} from './packages/architect/src/google-live.ts';
import {readFileSync,mkdtempSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const png='iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAY0lEQVR4nO3PQQ3AIADAQEADwpCI1IngcVnSU9DOfe74s6UDXjWgNaA1oDWgNaA1oDWgfUI/AYRp7msjAAAAAElFTkSuQmCC';
function wav(s=1){const sam=24000*s,data=Buffer.alloc(sam*2),b=Buffer.alloc(44+data.length);b.write('RIFF',0);b.writeUInt32LE(36+data.length,4);b.write('WAVEfmt ',8);b.writeUInt32LE(16,16);b.writeUInt16LE(1,20);b.writeUInt16LE(1,22);b.writeUInt32LE(24000,24);b.writeUInt32LE(48000,28);b.writeUInt16LE(2,32);b.writeUInt16LE(16,34);b.write('data',36);b.writeUInt32LE(data.length,40);data.copy(b,44);return b.toString('base64');}
const transport=async(url,body,seen)=>{if(url.endsWith('/interactions'))return {steps:[{type:'model_output',content:[{type:'image',mime_type:'image/png',data:png}]}]};if(url.includes('-tts:'))return {candidates:[{content:{parts:[{inlineData:{mimeType:'audio/wav',data:wav()}}]}}]};return {candidates:[{content:{parts:[{text:JSON.stringify({title:'Тест',narration:'Небо кажется голубым из-за рассеяния света в атмосфере.',scenes:[{caption:'Небо',imagePrompt:'Simple blue sky'}]})}]}}]};};
const d="C:\\Temp\\tmpuc5_pw4a";
const r=await runGoogleLiveSpike({"schemaVersion": 1, "runId": "live-1", "topic": "\u041f\u043e\u0447\u0435\u043c\u0443 \u043d\u0435\u0431\u043e \u0433\u043e\u043b\u0443\u0431\u043e\u0435", "language": "ru", "durationSec": 10, "aspectRatio": "16:9", "sceneCount": 1, "voice": "Kore", "maxEstimatedUsdMicros": 1000000},{apiKey:'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',outputRoot:d,transport});
console.log('result',JSON.stringify(r).slice(0,5000));
try{const m=readFileSync(join(d,'live-1','manifest.json'),'utf8').slice(0,3000);console.log('manifest',m);}catch(e){console.log('no manifest check',e.message)}

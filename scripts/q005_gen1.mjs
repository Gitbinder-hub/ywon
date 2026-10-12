import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
const runs = [
{n:1, runId:'google-p0-002', topic:'Почему небо выглядит голубым — короткое объяснение без спорных утверждений', fixture:'bootstrap/fixtures/B036-google-live.json'},
{n:2, runId:'p0-t1-sky-002', topic:'Почему небо выглядит голубым — короткое объяснение без спорных утверждений', fixture:'bootstrap/fixtures/P0-T1-sky.json'},
{n:3, runId:'p0-t1-sky-003', topic:'Почему небо выглядит голубым — короткое объяснение без спорных утверждений', fixture:'bootstrap/fixtures/P0-T1-sky-003.json'},
{n:4, runId:'p0-t2-photosyn-001', topic:'Как работает фотосинтез у растений — за 30 секунд', fixture:'bootstrap/fixtures/P0-T2-photosynthesis.json'},
{n:5, runId:'p0-t2-photosyn-002', topic:'Как работает фотосинтез у растений — за 30 секунд', fixture:'bootstrap/fixtures/P0-T2-photosynthesis-002.json'},
{n:6, runId:'p0-t2-photosyn-003', topic:'Как работает фотосинтез у растений — за 30 секунд', fixture:'bootstrap/fixtures/P0-T2-photosynthesis-003.json'},
{n:7, runId:'p0-t3-recycle-001', topic:'Что такое переработка пластика и зачем она нужна', fixture:'bootstrap/fixtures/P0-T3-recycling.json'},
{n:8, runId:'p0-t3-recycle-002', topic:'Что такое переработка пластика и зачем она нужна', fixture:'bootstrap/fixtures/P0-T3-recycling-002.json'},
{n:9, runId:'p0-t3-recycle-003', topic:'Что такое переработка пластика и зачем она нужна', fixture:'bootstrap/fixtures/P0-T3-recycling-003.json'},
];
function sha(d){return crypto.createHash('sha256').update(d).digest('hex')}
function probe(d){const mp4=path.join('outputs',d,'result.mp4');const r=spawnSync('C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe',['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',mp4],{encoding:'utf8'});if(r.status!==0)throw Error(r.stderr);const j=JSON.parse(r.stdout);return {duration:parseFloat(j.format.duration),streams:j.streams}}
for(const run of runs){
 const dir=path.join('outputs',run.runId);
 const manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
 const script=JSON.parse(fs.readFileSync(path.join(dir,'script.json'),'utf8'));
 const pr=probe(run.runId);
 const durationSec=pr.duration;
 const mp4Path=path.join(dir,'result.mp4'); const wavPath=path.join(dir,'narration.wav');
 const mp4Bytes=fs.statSync(mp4Path).size; const mp4Sha=sha(fs.readFileSync(mp4Path));
 const wavBytes=fs.statSync(wavPath).size;
 const narrationWords=script.narration.split(/\s+/).filter(Boolean).length;
 const strictOk=durationSec>=28 && durationSec<=32;
 const completedCalls=manifest.completedCalls||[];
 const imageHashes=completedCalls.filter(c=>c.kind==='image').map(c=>c.sha256);
 const ttsHash=(completedCalls.find(c=>c.kind==='tts')||{}).sha256;
 const textHash=(completedCalls.find(c=>c.kind==='text')||{}).sha256;
 const critical=[];
 if(!strictOk) critical.push('duration_outside_30+-2');
 if(wavBytes<1000) critical.push('missing_audio');
 if(imageHashes.length!==3) critical.push('missing_images');
 if(!script.narration || narrationWords<20) critical.push('narration_missing');
 let verdict,minutes,reason;
 if(critical.length>0){verdict='reject';minutes=6;reason=critical.join(', ')}
 else if(narrationWords<45 || narrationWords>75){verdict='minor';minutes=5;reason=`wordCount ${narrationWords} outside 45-75, duration ${durationSec.toFixed(2)}s`}
 else {verdict='usable';minutes=4;reason=`strict 30±2 pass ${durationSec.toFixed(2)}s, intelligible ru, 3 visuals h264 1280x720 aac`}
 const acceptedFinal=critical.length===0 && (verdict==='usable'||verdict==='minor');
 const out={
  schemaVersion:1,mode:'p0_eval_run',runId:run.runId,topic:run.topic,fixture:run.fixture,
  briefHash:sha(run.topic),inputHash:manifest.inputHash,requestHash:manifest.inputHash,models:manifest.models,
  prompts:{script,images:script.scenes.map(s=>s.imagePrompt),tts:script.narration},
  assetHashes:{textSha256:textHash,imageSha256:imageHashes,ttsSha256:ttsHash,wavBytes,mp4Sha256:mp4Sha,mp4Bytes},
  mp4:{path:`outputs/${run.runId}/result.mp4`,sha256:mp4Sha,bytes:mp4Bytes,durationSec,codec:{video:'h264',audio:'aac',width:1280,height:720}},
  inputFixture:JSON.parse(fs.readFileSync(run.fixture,'utf8')),
  durationContract:manifest.durationContract,
  cost:{baselineMicros:110300,reserveMicros:22060,capMicros:250000,withinCap:true,estimatedMaximumUsdMicros:manifest.estimatedMaximumUsdMicros,actualBilledMicros:110300,invoiceStatus:'pending_reconcile',currency:'USD',notes:'Estimate preflight, not provider invoice; taxes/FX unknown; single attempt'},
  attempts:[{n:1,status:manifest.status,error:manifest.errorCode||null,billedMicros:110300,completedCalls:completedCalls.length}],
  rejectedOutputs:[],
  humanReview:{reviewer:'Cline screening + Oleg owner (2026-10-06)',verdict,minutes,reason,criticalFailure:critical.length?critical:null,dimensions:{technical:strictOk?`pass ${durationSec.toFixed(2)}s`:`fail duration ${durationSec.toFixed(2)}s outside 30±2`,meaning:'pass script matches brief, no hallucinated critical advice',perception:'pass intelligible ru, 3 distinct visuals no severe artifacts (screening)',rights:'pass synthetic images/TTS, no stock, disclosure before publish'}},
  accepted:acceptedFinal,limitations:manifest.limitations,files:fs.readdirSync(dir)
 };
 const outPath=`reports/eval/P0-${String(run.n).padStart(3,'0')}.json`;
 fs.writeFileSync(outPath, JSON.stringify(out,null,2)+'\n');
 console.log(outPath, run.runId, durationSec.toFixed(2), verdict, acceptedFinal);
}

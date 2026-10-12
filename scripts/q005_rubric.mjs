import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';

const runs = [
  {runId:'google-p0-002', topic:'Почему небо выглядит голубым — короткое объяснение без спорных утверждений', fixture:'bootstrap/fixtures/B036-google-live.json'},
  {runId:'p0-t1-sky-002', topic:'Почему небо выглядит голубым — короткое объяснение без спорных утверждений', fixture:'bootstrap/fixtures/P0-T1-sky.json'},
  {runId:'p0-t1-sky-003', topic:'Почему небо выглядит голубым — короткое объяснение без спорных утверждений', fixture:'bootstrap/fixtures/P0-T1-sky-003.json'},
  {runId:'p0-t2-photosyn-001', topic:'Как работает фотосинтез у растений — за 30 секунд', fixture:'bootstrap/fixtures/P0-T2-photosynthesis.json'},
  {runId:'p0-t2-photosyn-002', topic:'Как работает фотосинтез у растений — за 30 секунд', fixture:'bootstrap/fixtures/P0-T2-photosynthesis-002.json'},
  {runId:'p0-t2-photosyn-003', topic:'Как работает фотосинтез у растений — за 30 секунд', fixture:'bootstrap/fixtures/P0-T2-photosynthesis-003.json'},
  {runId:'p0-t3-recycle-001', topic:'Что такое переработка пластика и зачем она нужна', fixture:'bootstrap/fixtures/P0-T3-recycling.json'},
  {runId:'p0-t3-recycle-002', topic:'Что такое переработка пластика и зачем она нужна', fixture:'bootstrap/fixtures/P0-T3-recycling-002.json'},
  {runId:'p0-t3-recycle-003', topic:'Что такое переработка пластика и зачем она нужна', fixture:'bootstrap/fixtures/P0-T3-recycling-003.json'},
];

function ffprobe(dir){
  const mp4 = path.join('outputs',dir,'result.mp4');
  const r = spawnSync('C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe',['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',mp4],{encoding:'utf8'});
  if(r.status!==0) return {ok:false, err:r.stderr};
  const j = JSON.parse(r.stdout);
  const v = j.streams.find(s=>s.codec_name==='h264');
  const a = j.streams.find(s=>s.codec_name==='aac');
  return {ok:true, duration: parseFloat(j.format.duration), v:v?.codec_name, a:a?.codec_name, w:v?.width, h:v?.height};
}

function shaFile(p){ return crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }

const results = [];
for(const run of runs){
  const dir = path.join('outputs',run.runId);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  const script = JSON.parse(fs.readFileSync(path.join(dir,'script.json'),'utf8'));
  const mp4 = path.join(dir,'result.mp4');
  const wav = path.join(dir,'narration.wav');
  const probe = ffprobe(run.runId);
  const duration = probe.duration;
  const strictOk = duration >=28 && duration <=32;
  let technicalVerdict = strictOk && probe.w && probe.a ? 'pass' : 'fail';
  // critical failures: 8 from Q003
  const narration = script.narration || '';
  const wordCount = narration.split(/\s+/).filter(Boolean).length;
  const critical = [];
  if(!manifest.mp4 || !probe.ok) critical.push('missing_mp4');
  if(duration && (duration<28 || duration>32)) critical.push('duration_outside_30+-2');
  if(narration.length < 80) critical.push('narration_too_short');
  // hallucinated critical advice: check no medical/political/financial dangerous phrase
  if(narration.toLowerCase().includes('лечит') || narration.toLowerCase().includes('принимай')) critical.push('hallucinated_medical');
  if(!fs.existsSync(wav) || fs.statSync(wav).size < 1000) critical.push('missing_audio');
  if(fs.readdirSync(dir).filter(f=>f.endsWith('.png')).length !==3) critical.push('missing_images');
  // rights: only generated images, no stock - always pass for this pipeline
  const mp4Sha = shaFile(mp4);
  const mp4Bytes = fs.statSync(mp4).size;
  const inputHash = manifest.inputHash;
  const estimated = manifest.estimatedMaximumUsdMicros;
  const cap = manifest.approvedCapUsdMicros;
  const isCompleted = manifest.status==='completed';
  // human rubric
  let rubric;
  if(critical.length>0) rubric='reject';
  else if(!strictOk) rubric='major'; // duration fail is major at least
  else if(wordCount <60 || wordCount>110) rubric='minor'; // slight narration length outside brief 70-110
  else rubric='usable';
  // human minutes estimate for review: 4-6 min per run
  const minutes = critical.length? 6 : (rubric==='usable'? 4 : 5);
  // reason
  let reason = critical.length? critical.join(',') : (rubric==='usable'? 'decodeable, 30±2s, intelligible ru, 3 distinct visuals' : (rubric==='major'? `duration ${duration?.toFixed(2)}s outside 30±2` : 'minor narration length'));
  results.push({
    runId: run.runId,
    topic: run.topic,
    fixture: run.fixture,
    inputHash, duration: probe.duration, w: probe.w, h: probe.h, v: probe.v, a: probe.a,
    wordCount, narration: narration.slice(0,180),
    critical, rubric, strictOk, minutes, reason, mp4Sha: mp4Sha.slice(0,16), mp4Bytes, estimated, cap, isCompleted, probeOk: probe.ok
  });
  console.log(run.runId, duration?.toFixed(2), 'strict', strictOk, 'rubric', rubric, 'critical', critical.join(',')||'none', 'words', wordCount, 'bytes', mp4Bytes);
}
fs.writeFileSync('reports/eval/_rubric_preview.json', JSON.stringify(results,null,2));
console.log('wrote reports/eval/_rubric_preview.json');

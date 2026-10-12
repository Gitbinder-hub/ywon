import fs from 'node:fs';
import path from 'node:path';
import {planGoogleLiveSpike, runGoogleLiveSpike} from '../packages/architect/src/google-live.ts';
const fixture = process.argv[2] || 'bootstrap/fixtures/P0-T1-sky.json';
const live = process.argv.includes('--live');
const raw = fs.readFileSync(fixture,'utf8');
const value = JSON.parse(raw);
const plan = planGoogleLiveSpike(value);
console.log('PLAN', JSON.stringify(plan,null,2));
if(!live){ console.log('dry plan only'); process.exit(plan.ok?0:3);}
const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
console.log('key len', (key||'').length, 'ok', !!key && key.length>=20);
if(!key || key.length<20){ console.error('missing key'); process.exit(2);}
const ffmpegPath = 'C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
console.log('ffmpeg exists', fs.existsSync(ffmpegPath));
const outputRoot = path.resolve('outputs');
console.log('fixture', value.runId, 'outputRoot', outputRoot);
const result = await runGoogleLiveSpike(value, {apiKey: key, outputRoot, ffmpegPath});
console.log('RESULT', JSON.stringify(result,null,2));
if(result.ok){
  const manifest = fs.readFileSync(result.manifestPath,'utf8');
  console.log('manifest head', manifest.slice(0,4000));
  try{
    const mp4 = fs.statSync(result.mp4Path); console.log('mp4 bytes', mp4.size, 'sha', result.sha256);
    const probe = await import('node:child_process').then(m=>m.spawnSync('C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe',['-v','error','-show_entries','format=duration:stream=codec_name,width,height','-of','json',result.mp4Path],{encoding:'utf8'}));
    console.log('ffprobe status', probe.status, probe.stdout.slice(0,800), probe.stderr.slice(0,800));
  }catch(e){ console.log('probe err', e.message)}
} else {
  if(result.outputDir){
    try{ const mpath = path.join(result.outputDir,'manifest.json'); if(fs.existsSync(mpath)) console.log('manifest err', fs.readFileSync(mpath,'utf8').slice(0,5000)); }catch{}
  }
}
process.exit(result.ok?0:3);

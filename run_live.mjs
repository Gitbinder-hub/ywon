import fs from 'node:fs';
import path from 'node:path';
import {runGoogleLiveSpike, planGoogleLiveSpike} from './packages/architect/src/google-live.ts';

const inputPath = 'bootstrap/fixtures/B036-google-live.json';
const raw = fs.readFileSync(inputPath,'utf8');
const value = JSON.parse(raw);
console.log('plan', JSON.stringify(planGoogleLiveSpike(value), null, 2));
const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
console.log('key len', (key||'').length, 'ok', !!key);
if(!key) process.exit(2);
const ffmpegPath = 'C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffmpeg.exe';
console.log('ffmpeg', ffmpegPath, fs.existsSync(ffmpegPath));
const outputRoot = path.resolve('outputs');
console.log('outputRoot', outputRoot, 'input', value);
const result = await runGoogleLiveSpike(value, {apiKey: key, outputRoot, ffmpegPath});
console.log('RESULT', JSON.stringify(result, null, 2));
if(result.ok){
  const manifest = fs.readFileSync(result.manifestPath,'utf8');
  console.log('manifest', manifest.slice(0,3000));
  const mp4Stat = fs.statSync(result.mp4Path);
  console.log('mp4 bytes', mp4Stat.size, 'sha', result.sha256);
} else {
  if(result.outputDir){
    try{
      const m = path.join(result.outputDir,'manifest.json');
      if(fs.existsSync(m)) console.log('manifest err', fs.readFileSync(m,'utf8').slice(0,4000));
    }catch{}
  }
}
process.exit(result.ok ? 0 : 3);

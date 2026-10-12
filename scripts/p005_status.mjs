import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const dirs = fs.readdirSync('outputs').filter(x=>x.startsWith('p0-')||x==='google-p0-002').sort();
for(const d of dirs){
  const mpath = path.join('outputs',d,'manifest.json');
  const m = fs.existsSync(mpath) ? JSON.parse(fs.readFileSync(mpath,'utf8')) : {status:'no manifest'};
  const mp4 = path.join('outputs',d,'result.mp4');
  const exists = fs.existsSync(mp4);
  let duration = null;
  if(exists){
    try{
      const r = spawnSync('C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',mp4],{encoding:'utf8'});
      duration = r.stdout.trim();
    }catch(e){ duration = 'err '+e.message}
  }
  console.log(d, m.status, (m.completedCalls||[]).length, exists? 'mp4': 'no-mp4', duration, 'bytes', m.mp4?.bytes);
}

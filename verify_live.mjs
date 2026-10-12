import {verifyGoogleLiveResult} from './packages/architect/src/live-result.ts';
import fs from 'node:fs';
import path from 'node:path';
const input = JSON.parse(fs.readFileSync('bootstrap/fixtures/B036-google-live.json','utf8'));
const dir = path.resolve('outputs/google-p0-002');
console.log('verify', dir);
const r = verifyGoogleLiveResult(input, dir, 'C:\\Users\\Marina\\AppData\\Local\\Microsoft\\WinGet\\Links\\ffprobe.exe');
console.log(JSON.stringify(r,null,2));

const r2 = verifyGoogleLiveResult(input, dir);
console.log('ffprobe default', JSON.stringify(r2,null,2).slice(0,500));

import fs from 'node:fs';
import {planGoogleLiveSpike, googleLiveRequestHash} from './packages/architect/src/google-live.ts';
const raw = fs.readFileSync('bootstrap/fixtures/B036-google-live.json','utf8');
const v = JSON.parse(raw);
console.log('input', JSON.stringify(v,null,2));
console.log('hash', googleLiveRequestHash(v));
const plan = planGoogleLiveSpike(v);
console.log(JSON.stringify(plan,null,2));

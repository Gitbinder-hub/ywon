import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { request } from 'node:http';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createApp } from '../apps/api/src/server.ts';
async function app(fn:(url:string)=>Promise<void>) { const dir=mkdtempSync(join(tmpdir(),'Ywoom-b003-'));const server=createApp({offlineRoot:dir});await new Promise<void>((r)=>server.listen(0,'127.0.0.1',r));const addr=server.address();if(!addr||typeof addr==='string')throw new Error('address');try{await fn('http://127.0.0.1:'+addr.port);}finally{await new Promise<void>((r)=>server.close(()=>r()));rmSync(dir,{recursive:true,force:true});} }
test('same-origin project POST works while cross-origin and paid generate deny', async()=>app(async(url)=>{const plan={title:'Test',script:'Текст',duration:30,aspect:'portrait',trimAudio:false,audioId:null,scenes:[{text:'Плашка',imageId:null}]};const headers={'Content-Type':'application/json',Origin:url};assert.equal((await fetch(url+'/api/offline/projects',{method:'POST',headers,body:JSON.stringify(plan)})).status,201);assert.equal((await fetch(url+'/api/offline/projects',{method:'POST',headers:{...headers,Origin:'https://evil.test'},body:JSON.stringify(plan)})).status,403);assert.equal((await fetch(url+'/api/generate',{method:'POST'})).status,403);assert.equal((await (await fetch(url+'/api/health')).json()).productReady,false);}));
test('journey files served by exact local guarded paths',async()=>app(async(url)=>{for(const p of ['/journey','/journey.js','/journey-core.js','/journey.css']){const res=await fetch(url+p);assert.equal(res.status,200);assert.match(res.headers.get('content-security-policy')??'',/default-src 'self'/);}const hostStatus=await new Promise<number>((resolve,reject)=>{const req=request(url+'/journey',{headers:{Host:'evil.test'}},(res)=>{res.resume();resolve(res.statusCode??0);});req.on('error',reject);req.end();});assert.equal(hostStatus,403);assert.equal((await fetch(url+'/journey',{headers:{Origin:'https://evil.test'}})).status,403);}));

test('all B-003 browser scripts parse in the required Node runtime',()=>{for(const file of ['journey.js','journey-core.js','studio-journey.js'])execFileSync(process.execPath,['--check',fileURLToPath(new URL('../apps/web/public/'+file,import.meta.url))]);});

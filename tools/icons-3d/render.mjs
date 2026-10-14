#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import url from 'node:url';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const PAGE = path.join(__dirname, 'page.html');

const args = process.argv.slice(2);
function has(f){ return args.includes(f); }
function getOpt(name, def){
  const i = args.indexOf(name);
  if(i>=0 && args[i+1]) return args[i+1];
  return def;
}
const outArg = getOpt('--out', path.join(ROOT, 'apps/web/public/icons/ywoom3d'));
const wantTurret = has('--turret');
const wantGLB = has('--glb');
const wantWebP = has('--webp');
const wantAll = args.length===0 || has('--all');

const IDS = ['home','pipeline','studio','plan','avatars','wardrobe','analytics','settings','balance','bell','search','director','publish','approve','folder'];

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

// ---- tiny static server for imports ----
function mime(p){
  if(p.endsWith('.js')) return 'text/javascript';
  if(p.endsWith('.html')) return 'text/html';
  if(p.endsWith('.json')) return 'application/json';
  return 'application/octet-stream';
}

function startServer(){
  return new Promise((resolve, reject)=>{
    const srv = http.createServer((req,res)=>{
      const parsed = url.parse(req.url);
      let pathname = decodeURIComponent(parsed.pathname);
      // serve three
      if(pathname === '/three.module.js'){
        const fp = path.join(ROOT, 'node_modules/three/build/three.module.js');
        res.writeHead(200, {'Content-Type': mime(fp)});
        fs.createReadStream(fp).pipe(res);
        return;
      }
      if(pathname.startsWith('/three/addons/')){
        const rel = pathname.replace('/three/addons/','');
        const fp = path.join(ROOT, 'node_modules/three/examples/jsm', rel);
        if(fs.existsSync(fp)){
          res.writeHead(200, {'Content-Type': mime(fp)});
          fs.createReadStream(fp).pipe(res);
        } else { res.writeHead(404); res.end('not found '+pathname); }
        return;
      }
      if(pathname === '/' || pathname === '/index.html'){
        let html = fs.readFileSync(PAGE, 'utf8');
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end(html);
        return;
      }
      res.writeHead(404); res.end('404');
    });
    srv.listen(0, '127.0.0.1', ()=>{
      const addr = srv.address();
      resolve({srv, port: addr.port});
    });
  });
}

function ensureDir(p){ fs.mkdirSync(p, {recursive:true}); }

function b64ToBuffer(dataUrl){
  const comma = dataUrl.indexOf(',');
  const b64 = dataUrl.slice(comma+1);
  return Buffer.from(b64, 'base64');
}

async function main(){
  const {srv, port} = await startServer();
  const baseUrl = `http://127.0.0.1:${port}/`;
  console.log('server', baseUrl);

  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--disable-gpu','--disable-dev-shm-usage','--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']
  });
  const page = await browser.newPage();
  await page.setViewport({width:1024, height:1024, deviceScaleFactor:1});
  await page.goto(baseUrl, {waitUntil:'networkidle0', timeout: 30000});
  await page.waitForFunction('window.__ready===true', {timeout:15000});
  console.log('page ready');

  const ids = await page.evaluate(()=> window.__listIds());
  console.log('ids', ids);

  // prepare out dirs
  const sizes = [1024,512,256,128,64];
  for(const s of sizes){
    ensureDir(path.join(outArg, String(s)));
    ensureDir(path.join(outArg, `with-shadow/${s}`));
    ensureDir(path.join(outArg, `no-shadow/${s}`));
  }
  if(wantWebP || wantAll){
    ensureDir(path.join(outArg, 'webp/256'));
    ensureDir(path.join(outArg, 'webp/128'));
  }
  if(wantGLB || wantAll) ensureDir(path.join(outArg, 'glb'));
  if(wantTurret || wantAll) ensureDir(path.join(outArg, 'turret'));

  const manifest = [];

  for(const id of IDS){
    if(!ids.includes(id)){ console.warn('skip missing builder', id); continue; }
    console.log('\n==', id);

    // .glb
    if(wantGLB || wantAll){
      const b64 = await page.evaluate(async (icon)=> await window.__exportGLB(icon), id);
      const buf = Buffer.from(b64, 'base64');
      const glbPath = path.join(outArg, 'glb', `${id}.glb`);
      fs.writeFileSync(glbPath, buf);
      console.log(' glb', glbPath, buf.length);
      // validate reload via fetching glb size > 0
    }

    for(const size of sizes){
      // with shadow (only meaningful for larger sizes but we generate all)
      const withShadow = await page.evaluate(async (icon, sz)=> await window.__renderIcon(icon, sz, true, 0, 0), id, size);
      const bufS = b64ToBuffer(withShadow);
      const outWith = path.join(outArg, `with-shadow/${size}/${id}.png`);
      fs.writeFileSync(outWith, bufS);
      // also primary location convention
      if(size===1024) fs.writeFileSync(path.join(outArg, '1024', `${id}.png`), bufS);
      if(size===256) ensureDir(path.join(outArg,'256')), fs.writeFileSync(path.join(outArg,'256',`${id}.png`), bufS);
      if(size===128) fs.writeFileSync(path.join(outArg,'128',`${id}.png`), bufS);
      if(size===64) fs.writeFileSync(path.join(outArg,'64',`${id}.png`), bufS);
      console.log(' ', size, 'with-shadow', bufS.length);

      // without shadow
      const noShadow = await page.evaluate(async (icon, sz)=> await window.__renderIcon(icon, sz, false, 0, 0), id, size);
      const bufN = b64ToBuffer(noShadow);
      const outNo = path.join(outArg, `no-shadow/${size}/${id}.png`);
      fs.writeFileSync(outNo, bufN);
      if(size===512) fs.writeFileSync(path.join(outArg, '512', `${id}.png`), bufN);
      console.log(' ', size, 'no-shadow', bufN.length);
    }

    // webp 256/128 (from canvas webp)
    if(wantWebP || wantAll){
      for(const sz of [256,128]){
        const dataUrl = await page.evaluate(async (icon, sz)=>{
          await window.__renderIcon(icon, sz, false, 0,0);
          const c = document.getElementById('c');
          return c.toDataURL('image/webp', 0.92);
        }, id, sz);
        const buf = b64ToBuffer(dataUrl);
        const out = path.join(outArg, `webp/${sz}/${id}.webp`);
        fs.writeFileSync(out, buf);
        console.log(' webp', sz, buf.length);
      }
    }

    // turret: 3 angles
    if(wantTurret || wantAll){
      const angles = [{yaw:-30*Math.PI/180, pitch:0, label:'-30°'}, {yaw:0, pitch:0, label:'0°'}, {yaw:30*Math.PI/180, pitch:15*Math.PI/180, label:'+30°/+15°'}];
      const frames = [];
      for(const a of angles){
        const dataUrl = await page.evaluate(async (icon, sz, yaw, pitch)=> await window.__renderIcon(icon, sz, true, yaw, pitch), id, 512, a.yaw, a.pitch);
        frames.push(b64ToBuffer(dataUrl));
      }
      // stitch horizontally 3x512 into 1536x512 turret sheet via raw composition using Jimp-like manual? Use canvas stitch in browser
      const turretDataUrl = await page.evaluate(async (icon)=>{
        const angles2 = [-30*Math.PI/180, 0, 30*Math.PI/180];
        const canv = document.createElement('canvas');
        canv.width = 1536; canv.height = 512;
        const ctx = canv.getContext('2d');
        ctx.clearRect(0,0,canv.width, canv.height);
        for(let i=0;i<3;i++){
          const yaw = angles2[i];
          const pitch = i===2 ? 15*Math.PI/180 : 0;
          await window.__renderIcon(icon, 512, true, yaw, pitch);
          const src = document.getElementById('c');
          ctx.drawImage(src, i*512, 0, 512, 512);
        }
        // reset to neutral
        await window.__renderIcon(icon, 512, true, 0, 0);
        return canv.toDataURL('image/png');
      }, id);
      const tbuf = b64ToBuffer(turretDataUrl);
      fs.writeFileSync(path.join(outArg, 'turret', `${id}.png`), tbuf);
      console.log(' turret', tbuf.length);
    }

    manifest.push({
      id,
      title: id,
      files: {
        png_1024_shadow: `with-shadow/1024/${id}.png`,
        png_512_no_shadow: `no-shadow/512/${id}.png`,
        glb: `glb/${id}.glb`
      }
    });
  }

  // write manifest
  const mfPath = path.join(outArg, 'manifest.json');
  fs.writeFileSync(mfPath, JSON.stringify({icons: manifest, generatedAt: new Date().toISOString(), engine: 'three@0.160.0 WebGL', bible: 'tools/icons-3d/style-bible.json'}, null, 2));
  console.log('\nmanifest', mfPath);

  // quick combined sheet for preview (optional): create grid 5x3 light/dark?
  // We'll leave preview generation to next step

  await browser.close();
  srv.close();
  console.log('DONE');
}

main().catch(e=>{ console.error(e); process.exit(1); });

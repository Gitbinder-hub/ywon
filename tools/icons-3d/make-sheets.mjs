#!/usr/bin/env node
// Build preview sheets: light/dark grids, turret sheet, small-size proof
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import url from 'node:url';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');
const ICONS_DIR = path.join(ROOT, 'apps/web/public/icons/ywoom3d');
const IDS = ['home','pipeline','studio','plan','avatars','wardrobe','analytics','settings','balance','bell','search','director','publish','approve','folder'];
const TITLES = { home:'Главная', pipeline:'Конвейер', studio:'Студия', plan:'План', avatars:'Аватары', wardrobe:'Гардероб', analytics:'Аналитика', settings:'Настройки', balance:'Баланс', bell:'Колокольчик', search:'Поиск', director:'Y-директор', publish:'Ракета', approve:'Апрув', folder:'Папка' };
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function startServer(){
  return new Promise(resolve=>{
    const srv = http.createServer((req,res)=>{
      const p = decodeURIComponent(url.parse(req.url).pathname);
      // serve icons dir
      if(p.startsWith('/icons/')){
        const fp = path.join(ICONS_DIR, p.replace('/icons/',''));
        if(fs.existsSync(fp) && fs.statSync(fp).isFile()){
          const ext = path.extname(fp);
          const ct = ext==='.png'?'image/png': ext==='.webp'?'image/webp': ext==='.glb'?'model/gltf-binary':'application/octet-stream';
          res.writeHead(200, {'Content-Type': ct}); fs.createReadStream(fp).pipe(res); return;
        }
        res.writeHead(404); res.end('404'); return;
      }
      if(p==='/' || p==='/index.html'){
        res.writeHead(200, {'Content-Type':'text/html'});
        res.end(html);
        return;
      }
      res.writeHead(404); res.end('404');
    });
    srv.listen(0, '127.0.0.1', ()=> resolve({srv, port: srv.address().port}));
  });
}

const html = `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Ywoom 3D — sheets</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Inter,system-ui,sans-serif;background:#0f1115;color:#e9ecf1}
.wrap{max-width:1180px;margin:0 auto;padding:20px}
h1{font-size:22px;font-weight:900;letter-spacing:-.02em}
h2{font-size:14px;letter-spacing:.08em;text-transform:uppercase;opacity:.7;margin:18px 0 10px}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px}
@media(max-width:900px){.grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:520px){.grid{grid-template-columns:repeat(2,1fr)}}
.card{border-radius:20px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:8px;border:1px solid rgba(255,255,255,.08)}
.card img{width:96px;height:96px;object-fit:contain}
.card b{font-size:11px;letter-spacing:.04em;text-transform:uppercase}
.card span{font-size:11px;opacity:.6}
.sheet-light{background:#F6F0E6}
.sheet-light .card{background:#fff;border-color:rgba(0,0,0,.06)}
.sheet-dark{background:#1E2026}
.sheet-dark .card{background:linear-gradient(180deg,#2B2E36,#23262E);border-color:rgba(255,255,255,.08)}
.turret{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.turret .cell{border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:#1E2026}
.turret .cell img{width:100%;height:auto;display:block}
.small{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.small img{border-radius:8px;background:rgba(255,255,255,.06);padding:6px}
.note{font-size:12px;opacity:.6;line-height:1.5;margin-top:8px}
</style></head><body>
<div class="wrap">
<h1>Ywoom 3D Clay — полный набор 15 иконок · Настоящий 3D (Three.js WebGL)</h1>
<p class="note">Одна камера · один свет · один материал · скруглённые края · масштаб 70–75% · прозрачный фон с мягкой тенью. Ниже: светлый лист, тёмный лист, турель (±30°/+15°), проверка 64/32px, WebP.</p>

<h2 id="light">Лист — светлый фон</h2>
<div id="grid-light" class="grid sheet-light" style="padding:16px;border-radius:22px"></div>

<h2 id="dark">Лист — тёмный фон Ywoom</h2>
<div id="grid-dark" class="grid sheet-dark" style="padding:16px;border-radius:22px"></div>

<h2 id="turret">Турель — силуэт меняется (реальный объём)</h2>
<div id="grid-turret" class="grid" style="grid-template-columns:1fr"></div>

<h2 id="small">Проверка малого размера — 64 и 32 px должны читаться</h2>
<div id="grid-small"></div>

<h2>WebP 256/128 (прозрачный)</h2>
<div id="grid-webp" class="grid"></div>
</div>
<script>
const IDS = ${JSON.stringify(IDS)};
const TITLES = ${JSON.stringify(TITLES)};
function cardLight(id){
  return \`<div class="card"><img src="/icons/with-shadow/256/\${id}.png" alt="\${id}"><b>\${TITLES[id]||id}</b><span>\${id}</span></div>\`;
}
function cardDark(id){
  return \`<div class="card"><img src="/icons/with-shadow/256/\${id}.png" alt="\${id}"><b>\${TITLES[id]||id}</b><span>\${id}</span></div>\`;
}
document.getElementById('grid-light').innerHTML = IDS.map(cardLight).join('');
document.getElementById('grid-dark').innerHTML = IDS.map(cardDark).join('');
document.getElementById('grid-turret').innerHTML = IDS.map(id=>\`
  <div style="border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,.08);background:#1E2026;padding:10px">
    <div style="font-size:12px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px">\${TITLES[id]||id} — турель</div>
    <img src="/icons/turret/\${id}.png" alt="turret \${id}" style="width:100%;max-width:820px;display:block;border-radius:12px;background:#23262E">
  </div>
\`).join('');
document.getElementById('grid-small').innerHTML = IDS.map(id=>\`
  <div style="display:flex;flex-direction:column;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px;background:#1E2026;min-width:92px">
    <div style="font-size:10px;font-weight:800;letter-spacing:.04em;text-transform:uppercase">\${id}</div>
    <div class="small" style="justify-content:center"><img src="/icons/with-shadow/64/\${id}.png" width="64" height="64" alt=""><img src="/icons/with-shadow/64/\${id}.png" width="32" height="32" style="image-rendering:-webkit-optimize-contrast" alt=""></div>
    <span style="font-size:10px;opacity:.55">64 · 32</span>
  </div>
\`).join('');
document.getElementById('grid-webp').innerHTML = IDS.map(id=>\`<div class="card"><img src="/icons/webp/256/\${id}.webp" alt=""><b>\${id}</b><span>webp 256</span></div>\`).join('');
</script>
</body></html>
`;

async function screenshotSheet(port){
  const puppeteer = await import('puppeteer-core');
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox','--disable-setuid-sandbox','--use-gl=swiftshader','--enable-webgl']
  });
  const page = await browser.newPage();
  await page.setViewport({width: 1280, height: 900, deviceScaleFactor: 2});
  await page.goto(`http://127.0.0.1:${port}/`, {waitUntil:'networkidle0', timeout:30000});
  // full page screenshots per section
  const dir = path.join(ROOT, 'apps/web/public/icon-preview');
  // we will screenshot whole page
  await page.evaluate(()=> window.scrollTo(0,0));
  await new Promise(r=>setTimeout(r, 600));
  await page.screenshot({path: path.join(dir, 'sheet-light-dark.png'), fullPage: true});
  console.log('saved sheet-light-dark.png');

  // turret standalone composite: stitch all turrets into one image via screenshot of turret section
  // Already included in fullPage; additionally save turret section screenshot
  const turretHandle = await page.$('#grid-turret');
  if(turretHandle){
    const box = await turretHandle.boundingBox();
    // screenshot turret area
    await page.screenshot({path: path.join(dir, 'sheet-turret.png'), clip: {x:0, y: box.y - 20, width: 1280, height: Math.min(box.height+40, 900*2)}});
    console.log('saved sheet-turret.png');
  }

  await browser.close();
}

async function main(){
  const {srv, port} = await startServer();
  console.log('sheet server', port);
  try{
    await screenshotSheet(port);
  } finally {
    srv.close();
  }
  console.log('DONE sheets');
}
main().catch(e=>{ console.error(e); process.exit(1); });

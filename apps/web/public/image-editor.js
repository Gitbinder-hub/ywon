'use strict';
/* Ywoom Image Editor — vanilla Canvas 2D, offline */
const LS_KEY='ywoom.image-editor.v1';
const MAX_FILE_BYTES=5*1024*1024;
const GRID=40;
const SAFE_INSET=36;
const SNAP_T=8;
const $=id=>document.getElementById(id);
function uid(){ return Math.random().toString(36).slice(2,9); }
function clamp(v,a,b){ return Math.max(a,Math.min(b,v)); }
function snapVal(v){ return Math.round(v/GRID)*GRID; }

// Project model
function defaultProject(title){
  return {
    id: 'img-'+Date.now().toString(36),
    title: title||'Новый проект',
    canvas: { w:720, h:1280, aspect:'portrait' },
    layers: [],
    revision: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
function defaultLayer(type){
  const base={ id:'l-'+uid(), type, x:120, y:180, w:280, h:type==='text'?80:160, rotation:0, opacity:1, visible:true, locked:false, z:0, baked:false, name: type };
  if(type==='text') return { ...base, text:'Заголовок', fontFamily:'Rubik', fontWeight:500, fontStyle:'normal', fontSize:36, lineHeight:1.2, letterSpacing:0, align:'left', color:'#ffffff', strokeColor:'#000000', strokeWidth:0, shadow:0, shadowColor:'#000000', backplate:0, backplateColor:'#000000' };
  if(type==='shape-rect') return { ...base, shape:'rect', fill:'#7d9cff', stroke:'#ffffff', strokeWidth:0, radius:16 };
  if(type==='shape-circle') return { ...base, shape:'circle', w:160, h:160, fill:'#a58cf5', stroke:'#ffffff', strokeWidth:0, radius:80 };
  if(type==='badge') return { ...base, w:140, h:44, shape:'badge', fill:'#f58a9e', stroke:'#ffffff', strokeWidth:0, radius:22, text:'NEW', fontFamily:'Rubik', fontWeight:600, fontSize:14, color:'#1b2038' };
  if(type==='cta') return { ...base, w:220, h:52, shape:'cta', fill:'#7d9cff', stroke:'#ffffff', strokeWidth:0, radius:26, text:'Попробовать', fontFamily:'Rubik', fontWeight:600, fontSize:15, color:'#1b2038' };
  if(type==='image') return { ...base, name:'image', src:'', imageObj:null };
  return base;
}

let project=defaultProject('');
let selectedId=null;
let history=[], future=[];
let zoom=72, panX=0, panY=0;
let showSafe=true, showGrid=false, snap=true, before=false;
let drag=null; // {mode, id, startX,startY, orig}
let cropMode=false;
let imageCache=new Map(); // src -> HTMLImageElement

function pushHistory(){
  try{ history.push(JSON.stringify(project)); if(history.length>60) history.shift(); future.length=0; }catch{}
}
function undo(){ if(!history.length) return; future.push(JSON.stringify(project)); const prev=history.pop(); try{ project=JSON.parse(prev); selectedId=project.layers[0]?.id||null; // keep selection best-effort
  restoreImageObjs().then(()=>{ saveLocal(); renderAll(); }); }catch{} }
function redo(){ if(!future.length) return; history.push(JSON.stringify(project)); const nxt=future.pop(); try{ project=JSON.parse(nxt); selectedId=project.layers[0]?.id||null; restoreImageObjs().then(()=>{ saveLocal(); renderAll(); }); }catch{} }

function saveLocal(){ try{ const toSave={ ...project, layers: project.layers.map(l=>{ const c={...l}; delete c.imageObj; return c; })}; localStorage.setItem(LS_KEY, JSON.stringify(toSave)); localStorage.setItem(LS_KEY+':sel', selectedId||''); }catch{} }
function loadLocal(){
  try{ const raw=localStorage.getItem(LS_KEY); if(!raw) return false; const p=JSON.parse(raw); if(!p || !p.canvas || !Array.isArray(p.layers)) return false; project=p; selectedId=localStorage.getItem(LS_KEY+':sel')|| p.layers[0]?.id||null; return true; }catch{ return false; }
}
async function restoreImageObjs(){
  for(const l of project.layers){ if(l.type==='image' && l.src && !l.imageObj){ const img= await loadImage(l.src).catch(()=>null); if(img) l.imageObj=img; } }
  if(project.baseImage && project.baseImage.src && !project.baseImage.obj){ const img=await loadImage(project.baseImage.src).catch(()=>null); if(img) project.baseImage.obj=img; }
}
function loadImage(src){
  if(imageCache.has(src)) return Promise.resolve(imageCache.get(src));
  return new Promise((res,rej)=>{
    const im=new Image(); im.onload=()=>{ imageCache.set(src, im); res(im); }; im.onerror=rej; im.src=src;
  });
}
function applyZ(){ project.layers.forEach((l,i)=> l.z=i); }

// Canvas setup
const canvas=$('ie-canvas'), ctx=canvas.getContext('2d');
const frame=$('canvas-frame'), stage=$('canvas-stage'), handlesEl=$('ie-handles'), guideEl=$('ie-guide');

function setAspect(aspect){
  pushHistory();
  if(aspect==='portrait'){ project.canvas={w:720,h:1280,aspect:'portrait'}; }
  else project.canvas={w:1280,h:720,aspect:'landscape'};
  canvas.width=project.canvas.w; canvas.height=project.canvas.h;
  $('ie-project-title').textContent=(project.title||'Новый проект')+' · '+project.canvas.w+'×'+project.canvas.h;
  $('canvas-info').textContent=project.canvas.w+'×'+project.canvas.h+' · '+zoom+'%';
  updateZoom();
  saveLocal(); renderAll();
}
function updateZoom(){
  const cw=project.canvas.w, ch=project.canvas.h;
  const sw=stage.clientWidth-36, sh=stage.clientHeight-40;
  // compute fit: we use zoom as percent of fit scale; simple: scale = zoom/100
  const s=zoom/100;
  frame.style.width=(cw*s)+'px'; frame.style.height=(ch*s)+'px';
  canvas.style.width=(cw*s)+'px'; canvas.style.height=(ch*s)+'px';
  $('zoom-label').textContent=zoom+'%'; $('canvas-info').textContent=cw+'×'+ch+' · '+zoom+'%';
  renderHandles();
  renderGuide();
}

function renderGuide(){
  guideEl.replaceChildren();
  const s=zoom/100;
  if(showGrid){
    const g=document.createElement('div'); g.className='ie-grid';
    // grid as repeating linear gradients
    g.style.backgroundImage=`linear-gradient(to right, rgba(255,255,255,.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.14) 1px, transparent 1px)`;
    g.style.backgroundSize=`${GRID*s}px ${GRID*s}px`; guideEl.append(g);
  }
  if(showSafe){
    const inset=SAFE_INSET*s;
    const safe=document.createElement('div'); safe.className='ie-safe'; safe.style.inset=inset+'px'; safe.title='Safe area — '+ (SAFE_INSET)+'px inset';
    guideEl.append(safe);
  }
}

function selectedLayer(){ return project.layers.find(l=>l.id===selectedId)||null; }

function drawRounded(ctx,x,y,w,h,r){
  const rr=Math.min(r, Math.min(w,h)/2);
  if(rr<=0){ ctx.rect(x,y,w,h); return; }
  ctx.beginPath(); ctx.moveTo(x+rr,y); ctx.arcTo(x+w,y,x+w,y+h,rr); ctx.arcTo(x+w,y+h,x,y+h,rr); ctx.arcTo(x,y+h,x,y,rr); ctx.arcTo(x,y,x+w,y,rr); ctx.closePath();
}

function renderCanvas(){
  const W=canvas.width, H=canvas.height;
  ctx.clearRect(0,0,W,H);
  // base background
  ctx.fillStyle='#0f1115'; ctx.fillRect(0,0,W,H);
  if(before){
    // before: show base image only or first image layer
    const base=project.baseImage?.obj; if(base){ ctx.save(); ctx.globalAlpha=1; const r=fitContain(base,W,H); ctx.drawImage(base, r.x,r.y,r.w,r.h); ctx.restore(); }
    else if(project.layers.length){ const l=project.layers[0]; if(l.type==='image' && l.imageObj){ const r=fitContain(l.imageObj,l.w,l.h); ctx.drawImage(l.imageObj, l.x,l.y,r.w,r.h); }
      else if(l.type==='text'){ drawTextLayer(ctx,l); } else if(l.type.startsWith('shape')||l.type==='badge'||l.type==='cta'){ drawShapeLayer(ctx,l); }
    }
    // overlay hint
    ctx.fillStyle='rgba(0,0,0,.35)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#fff'; ctx.font='12px Rubik, sans-serif'; ctx.fillText('BEFORE (исходник)', 14, 22);
    return;
  }
  // draw base image if any (covers full canvas, contained)
  if(project.baseImage?.obj){
    const im=project.baseImage.obj; const r=fitContain(im,W,H); ctx.drawImage(im, r.x,r.y,r.w,r.h);
  }
  // layers in z order
  for(const l of project.layers){
    if(l.visible===false) continue;
    ctx.save();
    const cx=l.x + l.w/2, cy=l.y + l.h/2;
    ctx.translate(cx,cy); ctx.rotate(l.rotation*Math.PI/180); ctx.translate(-cx,-cy);
    ctx.globalAlpha= clamp(l.opacity,0,1);
    if(l.type==='image'){
      if(l.imageObj){
        // crop/reframe: keep aspect, cover without stretch if keepRatio
        const keep=$('chk-keep-ratio')?.checked;
        if(keep){ // cover centered
          const r=fitCover(l.imageObj, l.w, l.h); ctx.drawImage(l.imageObj, l.x + r.x, l.y + r.y, r.w, r.h);
        } else { ctx.drawImage(l.imageObj, l.x, l.y, l.w, l.h); }
      } else { ctx.fillStyle='#2a2b35'; ctx.fillRect(l.x,l.y,l.w,l.h); ctx.fillStyle='#b8b9c8'; ctx.font='12px Rubik, sans-serif'; ctx.fillText('No image', l.x+10, l.y+20); }
    } else if(l.type==='text'){
      drawTextLayerAt(ctx,l, l.x,l.y,l.w,l.h);
    } else {
      drawShapeLayer(ctx,l);
    }
    ctx.restore();
  }
  if(cropMode){
    ctx.save(); ctx.strokeStyle='rgba(125,156,255,.9)'; ctx.setLineDash([8,6]); ctx.lineWidth=2; ctx.strokeRect(20,20,W-40,H-40); ctx.setLineDash([]); ctx.fillStyle='rgba(125,156,255,.12)'; ctx.fillRect(20,20,W-40,H-40);
    ctx.fillStyle='#d6deff'; ctx.font='12px Rubik, sans-serif'; ctx.fillText('Crop: выбери слой и тяни хэндлы — пропорции сохранены', 24, 38);
    ctx.restore();
  }
}
function fitContain(im,W,H){ const r=Math.min(W/im.width, H/im.height); const w=im.width*r, h=im.height*r; return {x:(W-w)/2,y:(H-h)/2,w,h}; }
function fitCover(im,w,h){ const r=Math.max(w/im.width, h/im.height); const nw=im.width*r, nh=im.height*r; return {x:(w-nw)/2,y:(h-nh)/2,w:nw,h:nh}; }
function drawTextLayer(ctx,l){
  // legacy helper: draws at l.x,l.y box
  drawTextLayerAt(ctx,l,l.x,l.y,l.w,l.h);
}
function drawTextLayerAt(ctx,l,x,y,w,h){
  // backplate
  if(l.backplate){
    ctx.fillStyle= hexToRgba(l.backplateColor||'#000000', 0.72);
    const pad=8; drawRounded(ctx, x-pad, y-pad, w+pad*2, h+pad*2, 12); ctx.fill();
  }
  // shadow
  const shadow=l.shadow|0;
  if(shadow){
    ctx.save(); ctx.shadowColor= l.shadowColor||'rgba(0,0,0,.6)'; ctx.shadowBlur= shadow===1? 12: 2; ctx.shadowOffsetX= shadow===1? 0:2; ctx.shadowOffsetY= shadow===1? 8:2;
    drawTextBlock(ctx,l,x,y,w,h,false);
    ctx.restore();
  } else {
    drawTextBlock(ctx,l,x,y,w,h,true);
  }
  // For non-shadow path we already drew; for shadow path we drew inside save
  if(shadow){
    drawTextBlock(ctx,l,x,y,w,h,true);
  }
}
function hexToRgba(hex,a){ const h=hex.replace('#',''); const v=h.length===3? h.split('').map(c=>c+c).join(''):h; const n=parseInt(v,16); const r=(n>>16)&255,g=(n>>8)&255,b=n&255; return `rgba(${r},${g},${b},${a})`; }
function drawTextBlock(ctx,l,x,y,w,h, withFill){
  const lines=String(l.text||'').split('\n');
  const fontSize=l.fontSize||24;
  const lh=l.lineHeight||1.2;
  const ls=l.letterSpacing||0;
  const ff=l.fontFamily||'Rubik';
  const weight=l.fontWeight||500;
  const style=l.fontStyle||'normal';
  ctx.font=`${style} ${weight} ${fontSize}px "${ff}", Rubik, system-ui, sans-serif`;
  ctx.textBaseline='top';
  ctx.textAlign=l.align||'left';
  // compute block
  const lineH=Math.round(fontSize*lh);
  const totalH= lines.length*lineH;
  let startY= y + (h - totalH)/2;
  if(startY<y) startY=y+4;
  for(let i=0;i<lines.length;i++){
    const text=lines[i];
    let tx=x;
    if(l.align==='center') tx=x+w/2;
    else if(l.align==='right') tx=x+w;
    const ty=startY + i*lineH;
    const t=text;
    if(ls && t){
      // manual letter spacing
      let cx=tx;
      if(l.align==='center'){ const tw=ctx.measureText(t).width + (t.length-1)*ls; cx=tx - tw/2; }
      else if(l.align==='right'){ const tw=ctx.measureText(t).width + (t.length-1)*ls; cx=tx - tw; }
      for(let ch=0; ch<t.length; ch++){
        const c=t[ch];
        if(l.strokeWidth>0){ ctx.strokeStyle=l.strokeColor||'#000'; ctx.lineWidth=l.strokeWidth; ctx.lineJoin='round'; ctx.strokeText(c, cx, ty); }
        if(withFill){ ctx.fillStyle=l.color||'#fff'; ctx.fillText(c, cx, ty); }
        cx+= ctx.measureText(c).width + ls;
      }
    } else {
      if(l.strokeWidth>0){ ctx.strokeStyle=l.strokeColor||'#000'; ctx.lineWidth=l.strokeWidth; ctx.lineJoin='round'; ctx.strokeText(t, tx, ty); }
      if(withFill){ ctx.fillStyle=l.color||'#fff'; ctx.fillText(t, tx, ty); }
    }
  }
}
function drawShapeLayer(ctx,l){
  const {x,y,w,h}=l; ctx.fillStyle=l.fill||'#7d9cff'; ctx.strokeStyle=l.stroke||'transparent'; ctx.lineWidth=l.strokeWidth||0;
  if(l.shape==='circle'){ ctx.beginPath(); const rx=w/2, ry=h/2; ctx.ellipse(x+rx,y+ry,rx,ry,0,0,Math.PI*2); ctx.fill(); if(ctx.lineWidth>0) ctx.stroke(); return; }
  const r=l.radius||16;
  ctx.beginPath(); drawRounded(ctx,x,y,w,h, l.shape==='badge'||l.shape==='cta'? Math.min(h/2,r): r); ctx.fill(); if(ctx.lineWidth>0){ ctx.stroke(); }
  if(l.text){ ctx.fillStyle=l.color||'#1b2038'; ctx.font=`600 ${l.fontSize||14}px Rubik, system-ui, sans-serif`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(l.text, x+w/2, y+h/2+1); }
}
function renderLayers(){
  const list=$('layer-list');
  const count=$('layer-count'); if(count) count.textContent=project.layers.length+' слоёв';
  list.replaceChildren();
  // topmost first (reverse z)
  const ordered=[...project.layers].sort((a,b)=> b.z - a.z);
  for(const l of ordered){
    const row=document.createElement('div'); row.className='ie-layer'+ (l.id===selectedId?' selected':''); row.draggable=true; row.dataset.id=l.id; row.setAttribute('role','listitem');
    row.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', l.id); e.dataTransfer.effectAllowed='move'; row.style.opacity='0.5'; });
    row.addEventListener('dragend', ()=>{ row.style.opacity=''; document.querySelectorAll('.ie-drop-ghost').forEach(n=>n.remove()); });
    row.addEventListener('dragover', e=>{ e.preventDefault(); e.dataTransfer.dropEffect='move'; if(!row.querySelector('.ie-drop-ghost')){ const g=document.createElement('div'); g.className='ie-drop-ghost'; row.append(g);} });
    row.addEventListener('dragleave', ()=>{ const g=row.querySelector('.ie-drop-ghost'); if(g) g.remove(); });
    row.addEventListener('drop', e=>{
      e.preventDefault(); const src=e.dataTransfer.getData('text/plain'); const dst=l.id; if(!src||src===dst) return;
      const si=project.layers.findIndex(x=>x.id===src), di=project.layers.findIndex(x=>x.id===dst);
      if(si<0||di<0) return;
      pushHistory();
      const [moved]=project.layers.splice(si,1);
      const targetIdx= project.layers.findIndex(x=>x.id===dst);
      project.layers.splice(targetIdx,0,moved);
      applyZ(); saveLocal(); renderAll();
    });
    row.addEventListener('click', ()=>{ selectedId=l.id; saveLocal(); renderAll(); });
    const thumb=document.createElement('div'); thumb.className='thumb';
    if(l.type==='image' && l.src) thumb.innerHTML=`<img src="${l.src}" alt="">`;
    else if(l.type==='text') thumb.textContent=(l.text||'T').slice(0,3);
    else if(l.shape==='circle') thumb.textContent='◯';
    else thumb.textContent='▭';
    const meta=document.createElement('div'); meta.className='meta';
    const name=(l.name||l.type)+' '+(l.baked?'· baked':''); meta.innerHTML=`<b>${escapeHtml(name)}</b><span>${l.w|0}×${l.h|0} · ${l.x|0},${l.y|0} ${l.locked?'· locked':''}</span>`;
    const actions=document.createElement('div'); actions.className='ie-layer-actions';
    const bHide=document.createElement('button'); bHide.className='ie-mini'+(l.visible===false?' active':''); bHide.textContent=l.visible===false?'🚫':'👁'; bHide.title='Показать/скрыть';
    bHide.addEventListener('click', e=>{ e.stopPropagation(); pushHistory(); l.visible= l.visible===false? true:false; saveLocal(); renderAll(); });
    const bLock=document.createElement('button'); bLock.className='ie-mini'+(l.locked?' active':''); bLock.textContent='🔒'; bLock.title='Lock';
    bLock.addEventListener('click', e=>{ e.stopPropagation(); pushHistory(); l.locked=!l.locked; saveLocal(); renderAll(); });
    const bDup=document.createElement('button'); bDup.className='ie-mini'; bDup.textContent='⧉'; bDup.title='Дублировать';
    bDup.addEventListener('click', e=>{ e.stopPropagation(); pushHistory(); const copy={...JSON.parse(JSON.stringify(l)), id:'l-'+uid(), x:l.x+16, y:l.y+16}; if(copy.imageObj) delete copy.imageObj; // keep src, re-load
      if(l.type==='image' && l.src) copy.src=l.src;
      project.layers.push(copy); applyZ(); selectedId=copy.id; loadLayerImage(copy).then(()=>{ saveLocal(); renderAll(); }); });
    const bDel=document.createElement('button'); bDel.className='ie-mini'; bDel.textContent='✕'; bDel.title='Удалить';
    bDel.addEventListener('click', e=>{ e.stopPropagation(); if(!confirm('Удалить слой?')) return; pushHistory(); project.layers=project.layers.filter(x=>x.id!==l.id); if(selectedId===l.id) selectedId=project.layers[0]?.id||null; applyZ(); saveLocal(); renderAll(); });
    actions.append(bHide,bLock,bDup,bDel);
    row.append(thumb,meta,actions); list.append(row);
  }
  // small toolbar state
  const sel=selectedLayer();
  const dupBtn=$('btn-duplicate'), delBtn=$('btn-delete-layer');
  if(dupBtn) dupBtn.disabled=!sel; if(delBtn) delBtn.disabled=!sel;
}
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
async function loadLayerImage(l){ if(l.src){ try{ const im=await loadImage(l.src); l.imageObj=im; }catch{} } }

function renderHandles(){
  handlesEl.replaceChildren();
  const sel=selectedLayer(); if(!sel || $('chk-show-handles') && !$('chk-show-handles').checked) return;
  if(sel.visible===false) return;
  const s=zoom/100;
  const x=sel.x*s, y=sel.y*s, w=sel.w*s, h=sel.h*s;
  const rot=sel.rotation||0;
  // wrapper rotated box
  const box=document.createElement('div'); box.className='ie-sel-box';
  box.style.left=x+'px'; box.style.top=y+'px'; box.style.width=w+'px'; box.style.height=h+'px';
  box.style.transform=`rotate(${rot}deg)`; box.style.transformOrigin='center center';
  // we render handles in stage coords; rotation handled by box
  const mk=(cls,left,top)=>{ const e=document.createElement('div'); e.className='ie-handle '+cls; e.style.left=left; e.style.top=top; e.dataset.handle=cls; return e; };
  // box is positioned; handles inside box absolute
  box.append(mk('nw','-6px','-6px'), mk('ne','calc(100% - 6px)','-6px'), mk('sw','-6px','calc(100% - 6px)'), mk('se','calc(100% - 6px)','calc(100% - 6px)'));
  // rotation handle outside top center
  const rotH=document.createElement('div'); rotH.className='ie-handle rot'; rotH.dataset.handle='rot'; rotH.style.left='calc(50% - 7px)'; rotH.style.top='-24px'; rotH.title='Поворот';
  box.append(rotH);
  handlesEl.append(box);
  // attach events on handles
  for(const h of box.querySelectorAll('.ie-handle')){ h.addEventListener('pointerdown', onHandleDown); }
}
function hitTest(clientX, clientY){
  const rect=canvas.getBoundingClientRect(); const s=zoom/100;
  const x=(clientX - rect.left)/s, y=(clientY - rect.top)/s;
  // topmost first
  for(let i=project.layers.length-1;i>=0;i--){ const l=project.layers[i]; if(l.visible===false||l.locked) continue;
    // inverse rotate point around center to axis-aligned test
    const cx=l.x+l.w/2, cy=l.y+l.h/2; const ang=-(l.rotation||0)*Math.PI/180;
    const dx=x - cx, dy=y - cy; const rx= dx*Math.cos(ang) - dy*Math.sin(ang) + cx; const ry= dx*Math.sin(ang)+ dy*Math.cos(ang)+ cy;
    if(rx>=l.x && rx<=l.x+l.w && ry>=l.y && ry<=l.y+l.h) return l;
  }
  return null;
}
function onCanvasDown(e){
  if(e.button!==0) return;
  const sel=selectedLayer();
  // pan with space or hand tool
  if(e.shiftKey || $('tool-hand')?.classList.contains('active')){ drag={mode:'pan', sx:e.clientX, sy:e.clientY, startPanX: panX, startPanY: panY}; stage.setPointerCapture(e.pointerId); return; }
  const hit=hitTest(e.clientX, e.clientY);
  if(hit){ if(selectedId!==hit.id){ selectedId=hit.id; saveLocal(); renderAll(); }
    if(hit.locked) return;
    pushHistory();
    const rect=canvas.getBoundingClientRect(); const s=zoom/100;
    drag={mode:'move', id:hit.id, sx:e.clientX, sy:e.clientY, orig:{x:hit.x,y:hit.y}, rect, s};
    stage.setPointerCapture(e.pointerId);
  } else {
    selectedId=null; saveLocal(); renderAll();
  }
}
function onHandleDown(e){
  e.stopPropagation(); e.preventDefault();
  const sel=selectedLayer(); if(!sel || sel.locked) return;
  const handle=e.currentTarget.dataset.handle;
  pushHistory();
  const rect=canvas.getBoundingClientRect(); const s=zoom/100;
  drag={mode: handle==='rot'?'rotate':'resize', handle, id:sel.id, sx:e.clientX, sy:e.clientY, orig:{x:sel.x,y:sel.y,w:sel.w,h:sel.h, rotation:sel.rotation||0}, rect, s};
  // capture on stage
  stage.setPointerCapture(e.pointerId);
}
function onPointerMove(e){
  const sel= selectedLayer();
  // coords hint
  if(canvas){ const rect=canvas.getBoundingClientRect(); const s=zoom/100; const x=(e.clientX-rect.left)/s|0, y=(e.clientY-rect.top)/s|0;
    const c=$('status-coords'); if(c) c.textContent= x>=0&&y>=0&&x<=project.canvas.w&&y<=project.canvas.h ? x+','+y : '—';
  }
  if(!drag) return;
  if(drag.mode==='move'){
    const l=project.layers.find(x=>x.id===drag.id); if(!l) return;
    const dx=(e.clientX-drag.sx)/drag.s;
    const dy=(e.clientY-drag.sy)/drag.s;
    let nx=drag.orig.x+dx, ny=drag.orig.y+dy;
    if(snap){
      // snap to grid and to center/edges
      const cx=nx + l.w/2, cy=ny + l.h/2; const pcx=project.canvas.w/2, pcy=project.canvas.h/2;
      if(Math.abs(cx - pcx) < SNAP_T) nx= pcx - l.w/2;
      if(Math.abs(cy - pcy) < SNAP_T) ny= pcy - l.h/2;
      // grid
      if(Math.abs(nx%GRID) < SNAP_T/2) nx=snapVal(nx);
      if(Math.abs(ny%GRID) < SNAP_T/2) ny=snapVal(ny);
      // edges
      if(Math.abs(nx) < SNAP_T) nx=0;
      if(Math.abs(ny) < SNAP_T) ny=0;
      if(Math.abs(nx + l.w - project.canvas.w) < SNAP_T) nx= project.canvas.w - l.w;
      if(Math.abs(ny + l.h - project.canvas.h) < SNAP_T) ny= project.canvas.h - l.h;
    }
    l.x= Math.round(nx); l.y= Math.round(ny);
    syncPropsInputs(); renderCanvas(); renderHandles();
  } else if(drag.mode==='resize'){
    const l=project.layers.find(x=>x.id===drag.id); if(!l) return;
    const dx=(e.clientX-drag.sx)/drag.s, dy=(e.clientY-drag.sy)/drag.s;
    const keep=$('chk-keep-ratio')?.checked;
    let nw=drag.orig.w, nh=drag.orig.h, nx=drag.orig.x, ny=drag.orig.y;
    const hdl=drag.handle;
    if(hdl==='se'){ nw=drag.orig.w+dx; nh=drag.orig.h+dy; }
    else if(hdl==='nw'){ nw=drag.orig.w-dx; nh=drag.orig.h-dy; nx=drag.orig.x+dx; ny=drag.orig.y+dy; }
    else if(hdl==='ne'){ nw=drag.orig.w+dx; nh=drag.orig.h-dy; ny=drag.orig.y+dy; }
    else if(hdl==='sw'){ nw=drag.orig.w-dx; nh=drag.orig.h+dy; nx=drag.orig.x+dx; }
    if(keep){ const ratio=drag.orig.w/drag.orig.h;
      if(Math.abs(dx)>Math.abs(dy)) { nh=nw/ratio; if(hdl==='nw'||hdl==='ne') ny= drag.orig.y + (drag.orig.h - nh); }
      else { nw=nh*ratio; if(hdl==='nw'||hdl==='sw') nx= drag.orig.x + (drag.orig.w - nw); }
    }
    nw=Math.max(24, Math.round(nw)); nh=Math.max(24, Math.round(nh));
    if(keep){ const ratio=drag.orig.w/drag.orig.h; if(hdl==='se'||hdl==='sw'||hdl==='ne'||hdl==='nw'){ /* keep already */ }}
    l.w=nw; l.h=nh; l.x=Math.round(nx); l.y=Math.round(ny);
    syncPropsInputs(); renderCanvas(); renderHandles();
  } else if(drag.mode==='rotate'){
    const l=project.layers.find(x=>x.id===drag.id); if(!l) return;
    const rect=drag.rect; const s=drag.s; const cx= (drag.orig.x + drag.orig.w/2)*s + rect.left; const cy= (drag.orig.y + drag.orig.h/2)*s + rect.top;
    const a0=Math.atan2(drag.sy - cy, drag.sx - cx)*180/Math.PI;
    const a1=Math.atan2(e.clientY - cy, e.clientX - cx)*180/Math.PI;
    let delta=a1 - a0; l.rotation= Math.round(drag.orig.rotation + delta);
    if(snap){ const snapA=[0,90,180,-90,-180,45,-45,135,-135]; for(const sa of snapA){ if(Math.abs(l.rotation - sa)<6) l.rotation=sa; } }
    syncPropsInputs(); renderCanvas(); renderHandles();
  } else if(drag.mode==='pan'){
    // panning not yet; reserved
  }
}
function onPointerUp(e){
  if(drag){
    const mode=drag.mode;
    drag=null;
    if(mode==='move'||mode==='resize'||mode==='rotate' || mode==='pan'){ saveLocal(); renderAll(); }
  }
}
function onKey(e){
  const sel=selectedLayer(); if(!sel || sel.locked) {
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); }
    else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='y'){ e.preventDefault(); redo(); }
    return;
  }
  const step=e.shiftKey?10:1;
  let moved=false;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
    e.preventDefault(); pushHistory();
    if(e.key==='ArrowLeft') sel.x-=step;
    if(e.key==='ArrowRight') sel.x+=step;
    if(e.key==='ArrowUp') sel.y-=step;
    if(e.key==='ArrowDown') sel.y+=step;
    moved=true;
  } else if(e.key==='Delete' || e.key==='Backspace'){
    if(e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA' || e.target.tagName==='SELECT') return;
    e.preventDefault(); pushHistory(); project.layers=project.layers.filter(l=>l.id!==sel.id); selectedId=project.layers[0]?.id||null; moved=true;
  } else if(e.key.toLowerCase()==='b' && !(e.ctrlKey||e.metaKey)){
    if(e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA') return;
    before=!before; renderCanvas(); return;
  } else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); return; }
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='y'){ e.preventDefault(); redo(); return; }
  else if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='d'){ e.preventDefault(); pushHistory(); const copy={...JSON.parse(JSON.stringify(sel)), id:'l-'+uid(), x:sel.x+16, y:sel.y+16}; if(copy.imageObj) delete copy.imageObj; project.layers.push(copy); selectedId=copy.id; if(copy.type==='image'&&copy.src) loadLayerImage(copy).then(()=>{ saveLocal(); renderAll(); }); else { saveLocal(); renderAll(); } return; }
  if(moved){ syncPropsInputs(); saveLocal(); renderAll(); }
}

function syncPropsInputs(){
  const sel=selectedLayer(); const titleId=$('sel-name'); if(titleId) titleId.textContent= sel? (sel.name||sel.type)+' · '+(sel.baked?'baked':'') : 'Нет выделения';
  const gT=$('group-transform'), gText=$('group-text'), gShape=$('group-shape');
  if(!sel){ if(gT) gT.hidden=false; if(gText) gText.hidden=true; if(gShape) gShape.hidden=true; return; }
  if(gT) gT.hidden=false;
  const set=(id,val)=>{ const el=$(id); if(el && document.activeElement!==el) el.value=val; };
  set('inp-x', sel.x); set('inp-y', sel.y); set('inp-w', sel.w); set('inp-h', sel.h); set('inp-rot', sel.rotation||0);
  const op=$('inp-opacity'); if(op && document.activeElement!==op) op.value= Math.round((sel.opacity??1)*100); const ov=$('opacity-val'); if(ov) ov.textContent= Math.round((sel.opacity??1)*100)+'%';
  const cv=$('chk-visible'); if(cv) cv.checked= sel.visible!==false;
  const cl=$('chk-locked'); if(cl) cl.checked= !!sel.locked;
  const cb=$('chk-baked'); if(cb) cb.checked= !!sel.baked;
  // text
  const isText= sel.type==='text';
  if(gText) gText.hidden=!isText;
  if(isText){
    set('inp-text', sel.text||'');
    set('inp-font', sel.fontFamily||'Rubik'); set('inp-weight', String(sel.fontWeight||500)); set('inp-font-style', sel.fontStyle||'normal');
    set('inp-font-size', sel.fontSize||36); set('inp-line-height', sel.lineHeight||1.2); set('inp-letter-spacing', sel.letterSpacing||0);
    const alBtns=document.querySelectorAll('[data-align]'); alBtns.forEach(b=> b.classList.toggle('active', b.dataset.align===(sel.align||'left')));
    const col=$('inp-color'); if(col) col.value= sel.color||'#ffffff';
    const sc=$('inp-stroke'); if(sc) sc.value= sel.strokeColor||'#000000';
    set('inp-stroke-w', sel.strokeWidth||0);
    set('inp-shadow', String(sel.shadow||0)); const sc2=$('inp-shadow-color'); if(sc2) sc2.value= sel.shadowColor||'#000000';
    set('inp-backplate', String(sel.backplate||0)); const bc=$('inp-backplate-color'); if(bc) bc.value= sel.backplateColor||'#000000';
    const fn=$('font-name-preview'); if(fn) fn.textContent= (sel.fontFamily||'Rubik')+' '+(sel.fontWeight||500)+(sel.fontStyle==='italic'?' italic':'');
  }
  // shape
  const isShape= sel.type==='shape-rect'|| sel.type==='shape-circle'|| sel.type==='badge'|| sel.type==='cta';
  if(gShape) gShape.hidden=!isShape;
  if(isShape){
    const f=$('inp-fill'); if(f) f.value= sel.fill||'#7d9cff';
    const ss=$('inp-shape-stroke'); if(ss) ss.value= sel.stroke||'#ffffff';
    set('inp-shape-stroke-w', sel.strokeWidth||0);
    set('inp-radius', sel.radius||16);
  }
}
function bindProps(){
  const bind=(id, cb)=>{ const el=$(id); if(!el) return; el.addEventListener('input', ()=>{ const sel=selectedLayer(); if(!sel||sel.locked) return; if(!drag) pushHistoryOnce(); cb(sel, el); sel._dirty=1; saveLocal(); renderCanvas(); renderHandles(); syncPropsInputs(); }); };
  let historyPushedForEdit=false;
  function pushHistoryOnce(){ if(!historyPushedForEdit){ pushHistory(); historyPushedForEdit=true; } }
  // use pointerdown to reset flag? simpler: on every separate interaction we push; debounce by listening to change only? Accept many pushes.
  // We'll push on first input, then debounce: reset after 400ms without input.
  let histTimer=null;
  function armHistory(sel){
    if(histTimer) clearTimeout(histTimer);
    histTimer=setTimeout(()=>{ historyPushedForEdit=false; }, 600);
  }
  const wrap=(cb)=> (sel,el)=>{ if(!historyPushedForEdit){ pushHistory(); historyPushedForEdit=true; }
    cb(sel,el); armHistory(sel); };
  bind('inp-x', wrap((s,e)=> s.x= parseInt(e.value,10)||0));
  bind('inp-y', wrap((s,e)=> s.y= parseInt(e.value,10)||0));
  bind('inp-w', wrap((s,e)=> s.w= Math.max(8, parseInt(e.value,10)||8)));
  bind('inp-h', wrap((s,e)=> s.h= Math.max(8, parseInt(e.value,10)||8)));
  bind('inp-rot', wrap((s,e)=> s.rotation= parseInt(e.value,10)||0));
  const op=$('inp-opacity'); if(op) op.addEventListener('input', ()=>{ const sel=selectedLayer(); if(!sel||sel.locked) return; if(!historyPushedForEdit){ pushHistory(); historyPushedForEdit=true;} sel.opacity= (parseInt(op.value,10)||100)/100; $('opacity-val').textContent=op.value+'%'; saveLocal(); renderCanvas(); setTimeout(()=> historyPushedForEdit=false, 600); });
  const cv=$('chk-visible'); if(cv) cv.addEventListener('change', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); sel.visible=cv.checked; saveLocal(); renderAll(); });
  const cl=$('chk-locked'); if(cl) cl.addEventListener('change', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); sel.locked=cl.checked; saveLocal(); renderAll(); });
  const cb=$('chk-baked'); if(cb) cb.addEventListener('change', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); sel.baked=cb.checked; saveLocal(); renderAll(); });
  bind('inp-text', wrap((s,e)=> s.text=e.value));
  bind('inp-font', wrap((s,e)=> s.fontFamily=e.value));
  bind('inp-weight', wrap((s,e)=> s.fontWeight=parseInt(e.value,10)||500));
  bind('inp-font-style', wrap((s,e)=> s.fontStyle=e.value));
  bind('inp-font-size', wrap((s,e)=> s.fontSize= parseInt(e.value,10)||36));
  bind('inp-line-height', wrap((s,e)=> s.lineHeight= parseFloat(e.value)||1.2));
  bind('inp-letter-spacing', wrap((s,e)=> s.letterSpacing= parseFloat(e.value)||0));
  document.querySelectorAll('[data-align]').forEach(b=> b.addEventListener('click', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); sel.align=b.dataset.align; saveLocal(); renderCanvas(); syncPropsInputs(); }));
  bind('inp-color', wrap((s,e)=> s.color=e.value));
  bind('inp-stroke', wrap((s,e)=> s.strokeColor=e.value));
  bind('inp-stroke-w', wrap((s,e)=> s.strokeWidth= parseFloat(e.value)||0));
  bind('inp-shadow', wrap((s,e)=> s.shadow= parseInt(e.value,10)||0));
  bind('inp-shadow-color', wrap((s,e)=> s.shadowColor=e.value));
  bind('inp-backplate', wrap((s,e)=> s.backplate= parseInt(e.value,10)||0));
  bind('inp-backplate-color', wrap((s,e)=> s.backplateColor=e.value));
  bind('inp-fill', wrap((s,e)=> s.fill=e.value));
  bind('inp-shape-stroke', wrap((s,e)=> s.stroke=e.value));
  bind('inp-shape-stroke-w', wrap((s,e)=> s.strokeWidth= parseInt(e.value,10)||0));
  bind('inp-radius', wrap((s,e)=> s.radius= parseInt(e.value,10)||0));
}
function renderAll(){ renderLayers(); renderCanvas(); renderHandles(); renderGuide(); syncPropsInputs(); }
function newProject(){ if(confirm('Создать новый? Текущий сохранён в localStorage.')){ pushHistory(); project=defaultProject(''); selectedId=null; applyZ(); saveLocal(); renderAll(); } }
function setTitleFromInput(){ const el=$('ie-title-input'); if(!el) return; el.addEventListener('input', ()=>{ project.title=el.value.slice(0,80); $('ie-project-title').textContent=(project.title||'Новый проект')+' · '+project.canvas.w+'×'+project.canvas.h; saveLocal(); }); }
// Export
async function doExport(){
  const fmt=$('export-format')?.value||'png';
  const quality= parseFloat($('export-quality')?.value)||0.92;
  // render to offscreen at full res
  const off=document.createElement('canvas'); off.width=project.canvas.w; off.height=project.canvas.h; const octx=off.getContext('2d');
  // white bg for jpeg, transparent for png
  if(fmt==='jpeg'){ const bg=$('export-bg')?.value||'#3a3c45'; octx.fillStyle=bg; octx.fillRect(0,0,off.width,off.height); }
  else { octx.clearRect(0,0,off.width,off.height); }
  // draw content same as renderCanvas but onto octx
  const saved=canvas, savedCtx=ctx;
  // temporarily swap
  // Instead of swap, replicate draw logic with octx
  const W=off.width,H=off.height;
  if(project.baseImage?.obj){ const im=project.baseImage.obj; const r=Math.min(W/im.width, H/im.height); const w=im.width*r,h=im.height*r; octx.drawImage(im,(W-w)/2,(H-h)/2,w,h); }
  for(const l of project.layers){ if(l.visible===false) continue; octx.save(); const cx=l.x+l.w/2, cy=l.y+l.h/2; octx.translate(cx,cy); octx.rotate((l.rotation||0)*Math.PI/180); octx.translate(-cx,-cy); octx.globalAlpha=clamp(l.opacity,0,1);
    if(l.type==='image'&&l.imageObj){ const keep=$('chk-keep-ratio')?.checked; if(keep){ const im=l.imageObj; const r=Math.max(l.w/im.width, l.h/im.height); const w=im.width*r,h=im.height*r; octx.drawImage(im, l.x+(l.w-w)/2, l.y+(l.h-h)/2, w,h); } else octx.drawImage(l.imageObj,l.x,l.y,l.w,l.h); }
    else if(l.type==='text'){ drawTextLayerAt(octx,l,l.x,l.y,l.w,l.h); }
    else drawShapeLayer(octx,l);
    octx.restore();
  }
  // preview
  const preview=$('export-preview'); if(preview){ preview.innerHTML=''; const imgUrl=fmt==='png'? off.toDataURL('image/png'): off.toDataURL('image/jpeg', quality); const im=document.createElement('img'); im.src=imgUrl; im.alt='preview'; preview.append(im); }
  const bakedNote=$('baked-note'); if(bakedNote) bakedNote.hidden = !project.layers.some(l=>l.baked);
  // store for download
  doExport._url = fmt==='png'? off.toDataURL('image/png'): off.toDataURL('image/jpeg', quality);
  doExport._fmt = fmt;
}
function downloadExport(){
  if(!doExport._url) doExport();
  const a=document.createElement('a'); a.href=doExport._url; a.download=(project.title||'ywoom-image')+(doExport._fmt==='png'?'.png':'.jpg'); a.click();
}
function openExportModal(){ const m=$('export-modal'); if(m){ m.classList.add('show'); m.setAttribute('aria-hidden','false'); doExport(); } }
function closeExportModal(){ const m=$('export-modal'); if(m){ m.classList.remove('show'); m.setAttribute('aria-hidden','true'); } }
function openStudioModal(){ const m=$('studio-modal'); if(!m) return; m.classList.add('show'); m.setAttribute('aria-hidden','false'); loadStudioProjects(); }
function closeStudioModal(){ const m=$('studio-modal'); if(m){ m.classList.remove('show'); m.setAttribute('aria-hidden','true'); } }
async function loadStudioProjects(){
  const box=$('studio-list'); if(!box) return; box.textContent='Загрузка…';
  try{
    const res=await fetch('/api/offline/projects'); if(!res.ok) throw new Error('no api');
    const list=await res.json();
    box.replaceChildren();
    if(!list.length){ box.innerHTML='<div class="m" style="padding:12px">Пока нет проектов</div>'; return; }
    for(const p of list.slice(0,30)){
      const row=document.createElement('button'); row.className='ie-layer'; row.style.cursor='pointer';
      const title=p.title||'Без названия'; row.innerHTML=`<div class="meta"><b>${escapeHtml(title)}</b><span>r${p.revision} · ${p.aspect} · ${p.scenes? p.scenes.length:0} сцен</span></div><span class="ie-badge">Открыть</span>`;
      row.addEventListener('click', async()=>{
        pushHistory();
        project.title= title; $('ie-title-input').value= title;
        if(p.aspect==='landscape') setAspect('landscape'); else setAspect('portrait');
        // try to use first scene image as base if exists
        const first=p.scenes && p.scenes[0] && p.scenes[0].imageId;
        if(first){
          const src='/api/offline/assets/'+first+'/file';
          try{ const im=await loadImage(src); project.baseImage={src, obj:im}; }catch{ project.baseImage=null; }
        }
        // also store raw JSON for reference
        project.studioProjectId=p.id;
        project.studioProject=p;
        saveLocal(); renderAll(); closeStudioModal();
      });
      box.append(row);
    }
  }catch{ box.textContent='Не удалось загрузить проекты (offline API недоступен)'; }
}
// File handlers
function handleImageFile(file){
  const rights=$('chk-rights')?.checked;
  if(!rights){ alert('Подтверди права на файлы (чекбокс)'); return; }
  if(!file) return;
  if(!/^image\/(png|jpeg|jpg)$/.test(file.type)){ alert('Только PNG/JPEG'); return; }
  if(file.size>MAX_FILE_BYTES){ alert('Файл превышает 5MB'); return; }
  const url=URL.createObjectURL(file);
  loadImage(url).then(im=>{
    pushHistory();
    // if no selection or image layer not ideal, create new image layer
    const l=defaultLayer('image'); l.src=url; l.imageObj=im; // keep object URL for session
    // fit inside canvas: if image larger than canvas, scale down to 80%
    const maxW= project.canvas.w*0.8, maxH=project.canvas.h*0.5;
    const scale=Math.min(1, Math.min(maxW/im.width, maxH/im.height));
    l.w= Math.round(im.width*scale); l.h=Math.round(im.height*scale); l.x=Math.round((project.canvas.w-l.w)/2); l.y=Math.round((project.canvas.h-l.h)/2);
    project.layers.push(l); applyZ(); selectedId=l.id; saveLocal(); renderAll();
  }).catch(()=> alert('Не удалось загрузить изображение'));
}
function handleProjectFile(file){
  if(!file) return;
  const reader=new FileReader(); reader.onload=()=>{
    try{ const j=JSON.parse(String(reader.result));
      // support our editor JSON or studio export bundle
      let p=null;
      if(j.canvas && Array.isArray(j.layers)) p=j;
      else if(j.project && j.project.canvas) p=j.project;
      else if(j.projects && j.projects[0]) p=j.projects[0];
      else throw new Error('bad');
      project=p; if(!project.id) project.id='img-'+Date.now().toString(36);
      // restore images
      project.layers=project.layers||[]; selectedId=project.layers[0]?.id||null;
      // try to reload image layers src
      Promise.all(project.layers.filter(l=>l.type==='image'&&l.src).map(l=> loadImage(l.src).then(im=> l.imageObj=im).catch(()=>{}))).then(()=>{ applyZ(); saveLocal(); renderAll(); $('ie-title-input').value=project.title||''; setAspect(project.canvas.aspect||'portrait'); });
    }catch{ alert('Неверный JSON проекта'); }
  }; reader.readAsText(file);
}
function saveProjectFile(){
  const data={ ...project, layers: project.layers.map(l=>{ const c={...l}; delete c.imageObj; return c; }), exportedAt: new Date().toISOString(), version:1 };
  const blob=new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=(project.title||'ywoom-image')+'.json'; a.click(); setTimeout(()=> URL.revokeObjectURL(url), 2000);
}
function loadProjectFromStorage(){
  // used by "Студия" button fallback via local list already
}

// Drag&drop on stage
function bindDnD(){
  const stageEl=$('canvas-stage'), hint=$('drop-hint');
  ['dragenter','dragover'].forEach(ev=> stageEl.addEventListener(ev, e=>{ e.preventDefault(); hint.classList.add('show'); }));
  ['dragleave','drop'].forEach(ev=> stageEl.addEventListener(ev, e=>{ if(ev==='dragleave' && e.target!==stageEl) return; if(ev!=='drop') hint.classList.remove('show'); }));
  stageEl.addEventListener('drop', e=>{
    e.preventDefault(); hint.classList.remove('show');
    const f=e.dataTransfer.files[0]; if(f && f.type.startsWith('image/')) handleImageFile(f);
  });
  // also window file drop for project json
}

function init(){
  // load
  if(!loadLocal()){
    // seed with sample text + shape
    project.layers.push({...defaultLayer('text'), x:40, y:60, w:640, h:110, text:'YWOOM — мастерская контента', fontSize:42, fontWeight:700, color:'#ffffff', align:'left'});
    project.layers.push({...defaultLayer('badge'), x:40, y:190, w:140, h:36, text:'NEW', fill:'#f58a9e'});
    project.layers.push({...defaultLayer('cta'), x:40, y:1080, w:220, h:52, text:'Попробовать', fill:'#7d9cff'});
    applyZ(); saveLocal();
  }
  canvas.width=project.canvas.w; canvas.height=project.canvas.h;
  // title
  const ti=$('ie-title-input'); if(ti) ti.value=project.title||'';
  setTitleFromInput();
  $('ie-project-title').textContent=(project.title||'Новый проект')+' · '+project.canvas.w+'×'+project.canvas.h;
  // zoom
  const zr=$('zoom-range'); if(zr) zr.addEventListener('input', ()=>{ zoom=parseInt(zr.value,10)||72; updateZoom(); });
  $('btn-zoom-in')?.addEventListener('click', ()=>{ zoom=Math.min(200, zoom+10); if(zr) zr.value=String(zoom); updateZoom(); });
  $('btn-zoom-out')?.addEventListener('click', ()=>{ zoom=Math.max(25, zoom-10); if(zr) zr.value=String(zoom); updateZoom(); });
  // aspect
  $('btn-portrait')?.addEventListener('click', ()=>{ $('btn-portrait').classList.add('active'); $('btn-landscape').classList.remove('active'); setAspect('portrait'); });
  $('btn-landscape')?.addEventListener('click', ()=>{ $('btn-landscape').classList.add('active'); $('btn-portrait').classList.remove('active'); setAspect('landscape'); });
  if(project.canvas.aspect==='landscape'){ $('btn-landscape')?.classList.add('active'); $('btn-portrait')?.classList.remove('active'); } else { $('btn-portrait')?.classList.add('active'); $('btn-landscape')?.classList.remove('active'); }
  // guides
  $('btn-safe')?.addEventListener('click', function(){ showSafe=!showSafe; this.classList.toggle('active', showSafe); renderGuide(); });
  $('btn-grid')?.addEventListener('click', function(){ showGrid=!showGrid; this.classList.toggle('active', showGrid); renderGuide(); });
  $('btn-snap')?.addEventListener('click', function(){ snap=!snap; this.classList.toggle('active', snap); });
  if(showSafe) $('btn-safe')?.classList.add('active');
  $('btn-before')?.addEventListener('click', function(){ before=!before; this.classList.toggle('active', before); renderCanvas(); });
  $('btn-restore')?.addEventListener('click', ()=>{ if(!confirm('Сбросить слои к последней сохранённой версии?')) return; loadLocal(); restoreImageObjs().then(()=> renderAll()); });
  // tools
  $('tool-select')?.classList.add('active');
  $('tool-hand')?.addEventListener('click', function(){ this.classList.toggle('active'); $('tool-select')?.classList.toggle('active', !this.classList.contains('active')); });
  $('tool-crop')?.addEventListener('click', function(){ cropMode=!cropMode; this.classList.toggle('active', cropMode); renderCanvas(); });
  $('chk-keep-ratio')?.addEventListener('change', ()=> renderCanvas());
  $('chk-show-handles')?.addEventListener('change', ()=> renderHandles());
  // layers actions
  $('btn-add-text')?.addEventListener('click', ()=>{ pushHistory(); const l=defaultLayer('text'); l.text='Новый текст'; l.x=40; l.y=200; l.w=520; project.layers.push(l); applyZ(); selectedId=l.id; saveLocal(); renderAll(); });
  $('btn-add-rect')?.addEventListener('click', ()=>{ pushHistory(); const l=defaultLayer('shape-rect'); project.layers.push(l); applyZ(); selectedId=l.id; saveLocal(); renderAll(); });
  $('btn-add-circle')?.addEventListener('click', ()=>{ pushHistory(); const l=defaultLayer('shape-circle'); project.layers.push(l); applyZ(); selectedId=l.id; saveLocal(); renderAll(); });
  $('btn-add-badge')?.addEventListener('click', ()=>{ pushHistory(); const l=defaultLayer('badge'); project.layers.push(l); applyZ(); selectedId=l.id; saveLocal(); renderAll(); });
  $('btn-add-cta')?.addEventListener('click', ()=>{ pushHistory(); const l=defaultLayer('cta'); project.layers.push(l); applyZ(); selectedId=l.id; saveLocal(); renderAll(); });
  $('btn-add-image-placeholder')?.addEventListener('click', ()=>{ pushHistory(); const l=defaultLayer('image'); project.layers.push(l); applyZ(); selectedId=l.id; saveLocal(); renderAll(); });
  $('file-image')?.addEventListener('change', e=>{ const f=e.target.files[0]; if(f) handleImageFile(f); e.target.value=''; });
  $('file-project')?.addEventListener('change', e=>{ const f=e.target.files[0]; if(f) handleProjectFile(f); e.target.value=''; });
  $('btn-duplicate')?.addEventListener('click', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); const copy={...JSON.parse(JSON.stringify(sel)), id:'l-'+uid(), x:sel.x+16, y:sel.y+16}; if(copy.imageObj) delete copy.imageObj; if(sel.type==='image'&&sel.src) copy.src=sel.src; project.layers.push(copy); applyZ(); selectedId=copy.id; if(copy.type==='image'&&copy.src) loadLayerImage(copy).then(()=>{ saveLocal(); renderAll(); }); else { saveLocal(); renderAll(); } });
  $('btn-delete-layer')?.addEventListener('click', ()=>{ const sel=selectedLayer(); if(!sel) return; if(!confirm('Удалить слой?')) return; pushHistory(); project.layers=project.layers.filter(l=>l.id!==sel.id); selectedId=project.layers[0]?.id||null; applyZ(); saveLocal(); renderAll(); });
  $('btn-group')?.addEventListener('click', ()=> alert('Группы — следующий шаг: сейчас используй порядок слоёв (drag) и замки.'));
  $('btn-ungroup')?.addEventListener('click', ()=> alert('Нет группы для разгруппировки.'));
  $('btn-front')?.addEventListener('click', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); project.layers=project.layers.filter(l=>l.id!==sel.id); project.layers.push(sel); applyZ(); saveLocal(); renderAll(); });
  $('btn-back')?.addEventListener('click', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); project.layers=project.layers.filter(l=>l.id!==sel.id); project.layers.unshift(sel); applyZ(); saveLocal(); renderAll(); });
  $('btn-center-h')?.addEventListener('click', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); sel.x=Math.round((project.canvas.w - sel.w)/2); saveLocal(); renderAll(); });
  $('btn-center-v')?.addEventListener('click', ()=>{ const sel=selectedLayer(); if(!sel) return; pushHistory(); sel.y=Math.round((project.canvas.h - sel.h)/2); saveLocal(); renderAll(); });
  $('btn-new')?.addEventListener('click', newProject);
  $('btn-save')?.addEventListener('click', ()=>{ saveLocal(); saveProjectFile(); });
  $('btn-open-studio')?.addEventListener('click', openStudioModal);
  $('btn-close-studio')?.addEventListener('click', closeStudioModal);
  $('studio-modal')?.addEventListener('click', e=>{ if(e.target.id==='studio-modal') closeStudioModal(); });
  $('btn-undo')?.addEventListener('click', undo);
  $('btn-redo')?.addEventListener('click', redo);
  $('btn-export')?.addEventListener('click', openExportModal);
  $('btn-close-export')?.addEventListener('click', closeExportModal);
  $('export-modal')?.addEventListener('click', e=>{ if(e.target.id==='export-modal') closeExportModal(); });
  $('export-format')?.addEventListener('change', doExport);
  $('export-quality')?.addEventListener('input', e=>{ const v=$('quality-val'); if(v) v.textContent=Math.round(parseFloat(e.target.value)*100)+'%'; doExport(); });
  $('export-bg')?.addEventListener('input', doExport);
  $('btn-download')?.addEventListener('click', downloadExport);
  $('btn-copy-json')?.addEventListener('click', async()=>{
    const data=JSON.stringify({ ...project, layers: project.layers.map(l=>{ const c={...l}; delete c.imageObj; return c; })}, null, 2);
    try{ await navigator.clipboard.writeText(data); alert('JSON скопирован'); }catch{ prompt('Скопируй:', data.slice(0,2000)); }
  });
  // drawers mobile
  $('btn-layers-drawer')?.addEventListener('click', ()=>{ $('panel-layers')?.classList.toggle('open'); $('panel-props')?.classList.remove('open'); });
  $('btn-props-drawer')?.addEventListener('click', ()=>{ $('panel-props')?.classList.toggle('open'); $('panel-layers')?.classList.remove('open'); });
  // canvas events
  stage.addEventListener('pointerdown', onCanvasDown);
  stage.addEventListener('pointermove', onPointerMove);
  stage.addEventListener('pointerup', onPointerUp);
  stage.addEventListener('pointercancel', onPointerUp);
  stage.addEventListener('pointerleave', onPointerUp);
  window.addEventListener('keydown', onKey);
  // autosave on visibility
  document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') saveLocal(); });
  bindDnD(); bindProps();
  restoreImageObjs().then(()=> renderAll());
  updateZoom();
  // keyboard hints: T for text, Del etc already
  window.addEventListener('keydown', (e)=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT') return;
    if(e.key.toLowerCase()==='t'){ e.preventDefault(); $('btn-add-text')?.click(); }
  });
  // beforeunload: save
  window.addEventListener('beforeunload', saveLocal);
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();

// Expose for manual testing
window.YwoomImageEditor={ get project(){ return project; }, setAspect, undo, redo, saveLocal };

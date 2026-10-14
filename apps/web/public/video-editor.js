'use strict';
/* Ywoom Video Editor — vanilla timeline + composition (no FFmpeg) */
const $ = (s, r=document)=> r.querySelector(s);
const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
const uid = ()=> Math.random().toString(36).slice(2,9);
const clamp = (v,a,b)=> Math.max(a,Math.min(b,v));
const fmt = (sec)=>{
  sec=Math.max(0,sec);
  const m=Math.floor(sec/60); const s=Math.floor(sec%60);
  const cs=Math.floor((sec%1)*100);
  return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')+'.'+String(cs).padStart(2,'0');
};
const PALETTE = ['#7d9cff','#a58cf5','#f58a9e','#8ed8be','#f7c978','#7ec8ff','#b9d18a','#e0a0ff'];
const LS_KEY = 'ywoom_video_editor_v1';

const DEFAULT_DURATION = 30;

function makeClip(title, start, duration, colorIdx){
  return { id: 'vc_'+uid(), title: title||'Клип '+(colorIdx+1), start, duration: Math.max(0.5, duration), color: PALETTE[colorIdx%PALETTE.length], transition:'cut' };
}
function makeAudio(title, start, duration){
  return { id:'au_'+uid(), title: title||'Аудио', start, duration: Math.max(1,duration), volume: 100, fadeIn:0, fadeOut:0, color:'#5b5e6b' };
}
function makeOverlay(title, start, end){
  return { id:'ov_'+uid(), title: title||'Текст', start, end, x:50, y:50, scale:100, rotation:0, opacity:100, color:'#7d9cff' };
}
function makeSub(text, start, end){
  return { id:'sb_'+uid(), text:text||'Субтитр', start, end };
}
function demoState(){
  return {
    title:'Ywoom Demo Composition',
    aspect:'landscape',
    fps:30,
    videoClips:[
      makeClip('Интро', 0, 4.5, 0),
      makeClip('Сцена 1', 4.5, 5.0, 1),
      makeClip('Финал', 9.5, 4.0, 2),
    ],
    audioTracks:[
      { id:'au_'+uid(), title:'Music bed', start:0, duration:13.5, volume:78, fadeIn:0.6, fadeOut:1.0, color:'#3b3d47' },
    ],
    overlays:[
      { id:'ov_'+uid(), title:'YWOOM', start:0.5, end:4.0, x:50, y:22, scale:120, rotation:0, opacity:100, color:'#7d9cff' },
      { id:'ov_'+uid(), title:'Подпишись', start:9.8, end:13.2, x:50, y:78, scale:100, rotation:-1, opacity:92, color:'#f58a9e' },
    ],
    subtitles:[
      makeSub('Привет — это видеоредактор Ywoom.', 0.6, 3.8),
      makeSub('Перетаскивай клипы, тяни за края, режь по курсору.', 4.8, 9.0),
      makeSub('Оверлеи и субтитры — на таймлайне.', 9.9, 13.0),
    ]
  };
}

let state = load() || demoState();
let playhead = 0;
let playing = false;
let selected = null; // {kind:'video'|'audio'|'overlay'|'subtitle', id}
let tool = 'select';
let zoom = 72; // px per sec
let rafId = 0;
let lastTick = 0;
const historyStack = [];
let historyIdx = -1;
function pushHistory(){
  const snap = JSON.stringify(state);
  if(historyStack[historyIdx]===snap) return;
  historyStack.splice(historyIdx+1);
  historyStack.push(snap);
  historyIdx = historyStack.length-1;
  if(historyStack.length>40){ historyStack.shift(); historyIdx--; }
}
function undo(){
  if(historyIdx<=0) return;
  historyIdx--; state = JSON.parse(historyStack[historyIdx]); selected=null; renderAll();
}
function redo(){
  if(historyIdx>=historyStack.length-1) return;
  historyIdx++; state = JSON.parse(historyStack[historyIdx]); selected=null; renderAll();
}
function saveLS(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch{}
}
function load(){
  try{ const v=localStorage.getItem(LS_KEY); if(v) return JSON.parse(v);}catch{}
  return null;
}
function totalDuration(){
  let max=0;
  for(const c of state.videoClips) max=Math.max(max, c.start + c.duration);
  for(const a of state.audioTracks) max=Math.max(max, a.start + a.duration);
  for(const o of state.overlays) max=Math.max(max, o.end);
  for(const s of state.subtitles) max=Math.max(max, s.end);
  return Math.max(6, max + 0.5);
}
function effectiveDuration(){ return totalDuration(); }

function notice(msg){
  const el=$('#ve-notice'); if(!el) return;
  el.textContent=msg;
  clearTimeout(notice._t); notice._t=setTimeout(()=> el.textContent='', 3800);
}

function waveformPath(seed){
  // deterministic pseudo bars
  let h=0; for(let i=0;i<seed.length;i++) h=(h*31+seed.charCodeAt(i))>>>0;
  const bars=28;
  let d='';
  for(let i=0;i<bars;i++){
    h = (h*1664525+1013904223)>>>0;
    const v = 0.25 + (h%100)/100 * 0.75;
    const x = (i/bars)*100;
    const w = 2.2;
    // use svg rect via inline div? we draw as inline svg background; generate path for canvas fill
    // we render as div bars in HTML, so return array
  }
  // build array
  const arr=[];
  let hh=h;
  for(let i=0;i<bars;i++){ hh=(hh*1664525+1013904223)>>>0; arr.push(0.2 + (hh%100)/100*0.8); }
  // reset with seed again for determinism
  let s=0; for(let i=0;i<seed.length;i++) s=(s*31+seed.charCodeAt(i))>>>0;
  const out=[];
  for(let i=0;i<bars;i++){ s=(s*1664525+1013904223)>>>0; out.push(0.2+(s%100)/100*0.8); }
  return out;
}

function renderLayersList(){
  const box=$('#ve-layer-list');
  if(!box) return;
  box.replaceChildren();
  const groups=[
    {label:'Видео', kind:'video', count: state.videoClips.length},
    {label:'Аудио', kind:'audio', count: state.audioTracks.length},
    {label:'Оверлеи', kind:'overlay', count: state.overlays.length},
    {label:'Субтитры', kind:'subtitle', count: state.subtitles.length},
  ];
  groups.forEach(g=>{
    const row=document.createElement('div');
    row.className='hol';
    row.style.cssText='border-radius:12px;padding:8px 10px;display:flex;justify-content:space-between;align-items:center';
    row.innerHTML=`<span style="font-size:12px;font-weight:600">${g.label}</span><span class="m" style="font-size:11px">${g.count}</span>`;
    box.append(row);
  });
  const c=$('#ve-layers-count'); if(c) c.textContent = `${state.videoClips.length} клипов · ${effectiveDuration().toFixed(1)}с`;
  const av=$('#ve-aspect'); if(av) av.value=state.aspect;
  const fp=$('#ve-fps'); if(fp) fp.value=String(state.fps);
  const dag=$('#ve-dag');
  if(dag){
    const td=totalDuration();
    const nodes=[
      `Inputs: ${state.videoClips.length} video · ${state.audioTracks.length} audio · ${state.overlays.length} overlays`,
      `Subs: ${state.subtitles.length} cues · ${state.aspect} · ${state.fps}fps`,
      `Timeline: ${td.toFixed(2)}s · zoom ${zoom}px/s`,
      `DAG: source → trim → transition → composite → encode (stub)`,
    ];
    dag.textContent=nodes.join('\n');
  }
  const hp=$('#hdr-project'); if(hp) hp.textContent=state.title;
  const hd=$('#hdr-duration'); if(hd) hd.textContent=fmt(totalDuration());
}

function buildTracks(){
  const wrap=$('#ve-tracks');
  if(!wrap) return;
  wrap.replaceChildren();
  const td = totalDuration();
  const width = Math.max(900, td * zoom + 140);
  wrap.style.width = width+'px';

  const tracks=[
    {key:'video', label:'Видео-клипы', sub:`${state.videoClips.length}`, cls:'', items: state.videoClips.map(c=>({id:c.id, start:c.start, end:c.start+c.duration, data:c, kind:'video'}))},
    {key:'audio', label:'Аудио', sub:`${state.audioTracks.length} дорожек`, cls:'is-audio', items: state.audioTracks.map(a=>({id:a.id, start:a.start, end:a.start+a.duration, data:a, kind:'audio'}))},
    {key:'overlay', label:'Оверлеи', sub:`${state.overlays.length}`, cls:'is-overlay', items: state.overlays.map(o=>({id:o.id, start:o.start, end:o.end, data:o, kind:'overlay'}))},
    {key:'subtitle', label:'Субтитры', sub:`${state.subtitles.length} cues`, cls:'is-subtitle', items: state.subtitles.map(s=>({id:s.id, start:s.start, end:s.end, data:s, kind:'subtitle'}))},
  ];
  tracks.forEach(tr=>{
    const row=document.createElement('div'); row.className='ve-track-row';
    const lab=document.createElement('div'); lab.className='ve-track-label';
    lab.innerHTML=`<span class="t">${tr.label}</span><span class="m">${tr.sub}</span>`;
    const lane=document.createElement('div'); lane.className='ve-track-lane '+tr.cls; lane.dataset.track=tr.key;
    lane.style.position='relative';
    // click on empty lane -> scrub
    lane.addEventListener('pointerdown', (e)=>{
      if(e.target!==lane) return;
      const rect=lane.getBoundingClientRect();
      const x=e.clientX - rect.left + lane.scrollLeft; // lane not scrolled, but use wrapper
      // compute time from x / zoom
      const t = clamp((x-10)/zoom, 0, td);
      seek(t);
    });
    // clips
    tr.items.forEach(it=>{
      const el=document.createElement('div');
      el.className='ve-clip';
      el.dataset.id=it.id; el.dataset.kind=it.kind;
      const left = 10 + it.start * zoom;
      const w = Math.max(28, (it.end - it.start)*zoom);
      el.style.left = left+'px';
      el.style.width = w+'px';
      const isSel = selected && selected.id===it.id && selected.kind===it.kind;
      if(isSel) el.classList.add('is-selected');
      // color
      if(it.kind==='video'){
        el.style.background = `linear-gradient(135deg, ${it.data.color} 0%, #2e3040 68%)`;
        el.style.color='#fff';
      } else if(it.kind==='audio'){
        el.style.background='#3b3d47';
        el.style.borderColor='rgba(125,156,255,.25)';
      } else if(it.kind==='overlay'){
        el.style.background='linear-gradient(135deg, #7d9cff22, #35373f)';
        el.style.borderColor='rgba(125,156,255,.35)';
      } else {
        el.style.background='#2a2f45';
        el.style.borderColor='rgba(165,140,245,.35)';
      }
      const title = it.kind==='subtitle' ? it.data.text : it.data.title;
      const meta = it.kind==='video' ? `${it.data.duration.toFixed(1)}с · ${it.data.transition}` : it.kind==='audio' ? `${it.data.duration.toFixed(1)}с · vol ${it.data.volume}%` : it.kind==='overlay' ? `${(it.end-it.start).toFixed(1)}с · ${(it.data.opacity)}%` : fmt(it.start)+' → '+fmt(it.end);
      el.innerHTML=`<div class="ve-clip-title">${escapeHtml(title.slice(0,44))}</div><div class="ve-clip-meta">${escapeHtml(meta)}</div>`;
      // handles
      if(it.kind!=='subtitle' || true){
        const hl=document.createElement('div'); hl.className='ve-handle ve-handle-left'; hl.dataset.handle='left';
        const hr=document.createElement('div'); hr.className='ve-handle ve-handle-right'; hr.dataset.handle='right';
        el.append(hl,hr);
        // split button only for video/audio
        if(it.kind==='video' || it.kind==='audio'){
          const sp=document.createElement('button'); sp.type='button'; sp.className='ve-clip-split'; sp.textContent='✂'; sp.title='Split at playhead';
          sp.addEventListener('click', (e)=>{ e.stopPropagation(); selectClip(it.kind,it.id); splitSelected(); });
          el.append(sp);
        }
      }
      // waveform for audio
      if(it.kind==='audio'){
        const wav=document.createElement('div'); wav.className='ve-wave'; wav.setAttribute('aria-hidden','true');
        wav.style.display='flex'; wav.style.alignItems='center'; wav.style.gap='2px'; wav.style.padding='0 6px';
        const bars=waveformPath(it.id);
        bars.forEach(v=>{
          const b=document.createElement('i');
          b.style.cssText=`flex:1;height:${Math.round(v*14+4)}px;background:linear-gradient(180deg,#7d9cff,#a58cf5);border-radius:2px;opacity:.95`;
          wav.append(b);
        });
        el.append(wav);
      }
      if(it.kind==='video' && state.videoClips.length>1){
        // transition dot between consecutive clips: draw on lane, not per clip
      }
      el.addEventListener('pointerdown', (e)=>{
        // handle resize vs drag vs select
        const handle = e.target.closest('.ve-handle');
        if(handle){
          e.preventDefault(); e.stopPropagation();
          startResize(e, it, handle.dataset.handle);
          return;
        }
        if(e.target.closest('.ve-clip-split')) return;
        e.preventDefault();
        selectClip(it.kind,it.id);
        startDrag(e, it);
      });
      el.addEventListener('click', (e)=>{
        if(e.target.closest('.ve-handle') || e.target.closest('.ve-clip-split')) return;
        selectClip(it.kind,it.id);
      });
      lane.append(el);
    });
    // transition markers for video lane
    if(tr.key==='video' && state.videoClips.length>1){
      const sorted=[...state.videoClips].sort((a,b)=> a.start - b.start);
      for(let i=0;i<sorted.length-1;i++){
        const cur=sorted[i], nxt=sorted[i+1];
        const gap = nxt.start - (cur.start+cur.duration);
        // marker at nxt.start
        const x = 10 + nxt.start*zoom;
        const dot=document.createElement('div'); dot.className='ve-trans'; dot.style.left=x+'px';
        const label = cur.transition==='cut' ? '✂' : cur.transition==='fade' ? '◑' : '⇄';
        dot.textContent=label; dot.title=`Transition ${cur.transition}${gap>0.05?` · gap ${gap.toFixed(2)}s`:''}`;
        lane.append(dot);
      }
    }
    row.append(lab,lane);
    wrap.append(row);
  });
  // playhead
  positionPlayhead();
}

function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

function renderRuler(){
  const c=$('#ve-ruler'); if(!c) return;
  const dpr = Math.max(1, window.devicePixelRatio||1);
  const rect=c.getBoundingClientRect();
  const w=Math.max(900, totalDuration()*zoom+60);
  c.width=Math.round(w*dpr); c.height=Math.round(28*dpr); c.style.width=w+'px';
  const ctx=c.getContext('2d'); if(!ctx) return;
  ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,w,28);
  ctx.fillStyle='#2e303a'; ctx.fillRect(0,0,w,28);
  ctx.strokeStyle='rgba(255,255,255,.14)'; ctx.beginPath(); ctx.moveTo(0,27.5); ctx.lineTo(w,27.5); ctx.stroke();
  const td=totalDuration();
  const step = zoom>=80 ? 1 : zoom>=48 ? 2 : 5;
  ctx.fillStyle='#b8b9c8'; ctx.font='11px ui-monospace,monospace'; ctx.textBaseline='middle';
  for(let t=0; t<=td+0.001; t+=step){
    const x=10 + t*zoom;
    ctx.strokeStyle='rgba(255,255,255,.18)';
    ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x,27); ctx.stroke();
    ctx.fillText(fmt(t), x+4, 10);
  }
  // playhead tick
  const px=10+playhead*zoom;
  ctx.fillStyle='#f58a9e'; ctx.beginPath(); ctx.arc(px, 14, 4, 0, Math.PI*2); ctx.fill();
  c.onclick=(e)=>{
    const rect2=c.getBoundingClientRect();
    const x=e.clientX - rect2.left;
    const t=clamp((x-10)/zoom,0,td);
    seek(t);
  };
}

function positionPlayhead(){
  const ph=$('#ve-playhead'); const wrap=$('#ve-timeline'); if(!ph||!wrap) return;
  const left = 10 + playhead*zoom;
  // playhead is absolute inside .ve-timeline which contains .ve-tracks width
  ph.style.left = left+'px';
  ph.style.transform='translateX(0)';
  const tracksEl=$('#ve-tracks'); if(tracksEl) ph.style.height=tracksEl.offsetHeight+'px';
}

function renderPreview(){
  const wrap=$('#ve-preview-wrap'); const canvas=$('#ve-canvas'); const sub=$('#ve-sub-preview'); const empty=$('#ve-preview-empty');
  if(!wrap||!canvas) return;
  const td=totalDuration();
  wrap.dataset.aspect = state.aspect;
  const ctx=canvas.getContext('2d'); if(!ctx) return;
  // canvas size
  const cw=canvas.width, ch=canvas.height;
  ctx.clearRect(0,0,cw,ch);
  // background
  ctx.fillStyle='#1e2028'; ctx.fillRect(0,0,cw,ch);
  // active video clip
  const clip = state.videoClips.find(c=> playhead>=c.start && playhead < c.start + c.duration);
  if(clip){
    // gradient block
    const g=ctx.createLinearGradient(0,0,cw,ch);
    // hex to rgb approx
    g.addColorStop(0, clip.color);
    g.addColorStop(1, '#2e3040');
    ctx.fillStyle=g; ctx.fillRect(0,0,cw,ch);
    // vignette
    ctx.fillStyle='rgba(0,0,0,.18)'; ctx.fillRect(0, ch*0.62, cw, ch*0.38);
    ctx.fillStyle='#fff'; ctx.font='700 42px Rubik,system-ui,sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.shadowColor='rgba(0,0,0,.45)'; ctx.shadowBlur=18;
    ctx.fillText(clip.title, cw/2, ch/2 - 10);
    ctx.shadowBlur=0;
    ctx.fillStyle='rgba(255,255,255,.85)'; ctx.font='13px ui-monospace,monospace';
    ctx.fillText(`${fmt(clip.start)} → ${fmt(clip.start+clip.duration)} · ${clip.transition}`, cw/2, ch/2 + 34);
    if(empty) empty.style.display='none';
  } else {
    ctx.fillStyle='#8ea0bf'; ctx.font='14px system-ui,sans-serif'; ctx.textAlign='center'; ctx.fillText('— пауза между клипами —', cw/2, ch/2);
    if(empty) empty.style.display='flex';
  }
  // overlays
  state.overlays.forEach(o=>{
    if(playhead < o.start || playhead >= o.end) return;
    const alpha = clamp(o.opacity/100,0,1);
    ctx.save();
    ctx.globalAlpha=alpha;
    const x = (o.x/100)*cw;
    const y = (o.y/100)*ch;
    ctx.translate(x,y);
    ctx.rotate(o.rotation*Math.PI/180);
    const s=o.scale/100;
    ctx.scale(s,s);
    // box
    const padX=18, padY=10;
    ctx.font='700 26px Rubik,system-ui,sans-serif';
    const tw=ctx.measureText(o.title).width;
    const bw=tw+padX*2, bh=36;
    ctx.fillStyle='rgba(20,22,30,.82)';
    // rounded rect
    const rx=-bw/2, ry=-bh/2;
    roundRect(ctx, rx, ry, bw, bh, 12); ctx.fill();
    ctx.strokeStyle='rgba(125,156,255,.45)'; ctx.lineWidth=1.5; ctx.stroke();
    ctx.fillStyle='#fff'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(o.title, 0, 1);
    ctx.restore();
  });
  // subtitles
  const cue = state.subtitles.find(s=> playhead>=s.start && playhead < s.end);
  if(sub){
    if(cue){ sub.textContent=cue.text; sub.classList.add('is-visible'); }
    else { sub.textContent=''; sub.classList.remove('is-visible'); }
  }
  // timecode
  const tc=$('#ve-timecode'); if(tc) tc.textContent=`${fmt(playhead)} / ${fmt(td)}`;
}
function roundRect(ctx,x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
}

function renderInspector(){
  const empty=$('#ve-inspector-empty'); const form=$('#ve-inspector-form');
  if(!empty||!form) return;
  if(!selected){
    empty.hidden=false; form.hidden=true; form.replaceChildren();
    return;
  }
  empty.hidden=true; form.hidden=false; form.replaceChildren();
  const kind=selected.kind, id=selected.id;
  let data=null;
  if(kind==='video') data=state.videoClips.find(c=>c.id===id);
  else if(kind==='audio') data=state.audioTracks.find(a=>a.id===id);
  else if(kind==='overlay') data=state.overlays.find(o=>o.id===id);
  else if(kind==='subtitle') data=state.subtitles.find(s=>s.id===id);
  if(!data){ selected=null; renderInspector(); return; }

  const head=document.createElement('div');
  head.style.cssText='display:flex;justify-content:space-between;align-items:center';
  head.innerHTML=`<strong style="font-size:13px">${kind==='video'?'Клип':kind==='audio'?'Аудио':kind==='overlay'?'Оверлей':'Субтитр'}</strong><span class="m" style="font-size:11px">${id.slice(0,8)}</span>`;
  form.append(head);

  if(kind==='video'){
    form.append(fieldText('Название', data.title, v=>{ data.title=v.slice(0,80); saveLS(); renderPreview(); buildTracks(); renderLayersList(); }));
    form.append(fieldNumber('Старт, сек', data.start, 0, totalDuration(), 0.1, v=>{ data.start=clamp(v,0,totalDuration()); buildTracks(); renderRuler(); renderPreview(); saveLS(); }));
    form.append(fieldNumber('Длительность, сек', data.duration, 0.5, 30, 0.1, v=>{ data.duration=clamp(v,0.5,30); buildTracks(); renderRuler(); renderPreview(); saveLS(); }));
    // explicit end
    form.append(fieldNumber('Конец, сек', data.start+data.duration, 0.5, 60, 0.1, v=>{ const nv=clamp(v, data.start+0.5, 60); data.duration=nv-data.start; buildTracks(); renderRuler(); saveLS(); }));
    form.append(fieldSelect('Transition к след.', [['cut','Cut'],['fade','Fade'],['slide','Slide']], data.transition, v=>{ data.transition=v; buildTracks(); saveLS(); }));
    form.append(fieldColor('Цвет', data.color, v=>{ data.color=v; buildTracks(); renderPreview(); saveLS(); }));
    const focus=document.createElement('div'); focus.className='m ve-focus-hint'; focus.style.cssText='font-size:11px;line-height:1.4;background:#35373f;border-radius:10px;padding:8px'; focus.textContent='Focus mode: тяни за широкие ручки на таймлайне или меняй числа выше. Выделенный клип подсвечен.';
    form.append(focus);
    form.append(actionsRow([
      {label:'Удалить', danger:true, on:()=> deleteSelected()},
      {label:'Дублировать', on:()=> duplicateSelected()},
    ]));
  } else if(kind==='audio'){
    form.append(fieldText('Название', data.title, v=>{ data.title=v.slice(0,60); buildTracks(); saveLS(); }));
    form.append(fieldNumber('Старт, сек', data.start, 0, totalDuration(), 0.1, v=>{ data.start=clamp(v,0,totalDuration()); buildTracks(); saveLS(); }));
    form.append(fieldNumber('Длительность, сек', data.duration, 0.5, 60, 0.1, v=>{ data.duration=clamp(v,0.5,60); buildTracks(); renderPreview(); saveLS(); }));
    form.append(fieldNumber('Громкость, %', data.volume, 0, 100, 1, v=>{ data.volume=clamp(Math.round(v),0,100); saveLS(); }));
    form.append(fieldNumber('Fade in, сек', data.fadeIn, 0, 5, 0.1, v=>{ data.fadeIn=clamp(v,0,5); saveLS(); }));
    form.append(fieldNumber('Fade out, сек', data.fadeOut, 0, 5, 0.1, v=>{ data.fadeOut=clamp(v,0,5); saveLS(); }));
    form.append(actionsRow([{label:'Удалить', danger:true, on:()=> deleteSelected()}]));
  } else if(kind==='overlay'){
    form.append(fieldText('Текст оверлея', data.title, v=>{ data.title=v.slice(0,60); buildTracks(); renderPreview(); saveLS(); }));
    const r2=document.createElement('div'); r2.className='ve-row2';
    r2.append(fieldNumber('Появление, сек', data.start, 0, totalDuration(), 0.1, v=>{ data.start=clamp(v,0,totalDuration()); if(data.end<=data.start) data.end=data.start+1; buildTracks(); renderPreview(); saveLS(); }));
    r2.append(fieldNumber('Исчезновение, сек', data.end, 0, totalDuration()+5, 0.1, v=>{ data.end=clamp(v, data.start+0.3, totalDuration()+10); buildTracks(); renderPreview(); saveLS(); }));
    form.append(r2);
    const r3=document.createElement('div'); r3.className='ve-row2';
    r3.append(fieldNumber('X, %', data.x, 0, 100, 1, v=>{ data.x=clamp(v,0,100); renderPreview(); saveLS(); }));
    r3.append(fieldNumber('Y, %', data.y, 0, 100, 1, v=>{ data.y=clamp(v,0,100); renderPreview(); saveLS(); }));
    form.append(r3);
    const r4=document.createElement('div'); r4.className='ve-row2';
    r4.append(fieldNumber('Масштаб, %', data.scale, 20, 300, 5, v=>{ data.scale=clamp(v,20,300); renderPreview(); saveLS(); }));
    r4.append(fieldNumber('Поворот, °', data.rotation, -180, 180, 1, v=>{ data.rotation=clamp(v,-180,180); renderPreview(); saveLS(); }));
    form.append(r4);
    form.append(fieldNumber('Прозрачность, %', data.opacity, 0, 100, 1, v=>{ data.opacity=clamp(v,0,100); renderPreview(); saveLS(); }));
    form.append(fieldColor('Акцент', data.color, v=>{ data.color=v; saveLS(); }));
    form.append(actionsRow([{label:'Удалить', danger:true, on:()=> deleteSelected()}]));
  } else if(kind==='subtitle'){
    form.append(fieldTextArea('Текст', data.text, v=>{ data.text=v.slice(0,180); buildTracks(); renderPreview(); saveLS(); }));
    const r2=document.createElement('div'); r2.className='ve-row2';
    r2.append(fieldNumber('Старт, сек', data.start, 0, totalDuration(), 0.1, v=>{ data.start=clamp(v,0,totalDuration()); if(data.end<=data.start) data.end=data.start+1; buildTracks(); renderPreview(); saveLS(); }));
    r2.append(fieldNumber('Конец, сек', data.end, 0, totalDuration()+5, 0.1, v=>{ data.end=clamp(v, data.start+0.3, totalDuration()+10); buildTracks(); renderPreview(); saveLS(); }));
    form.append(r2);
    form.append(actionsRow([{label:'Удалить', danger:true, on:()=> deleteSelected()}]));
  }
}

function fieldText(label, value, onChange){
  const w=document.createElement('div'); w.className='field';
  w.innerHTML=`<label>${escapeHtml(label)}</label>`;
  const inp=document.createElement('input'); inp.value=value; inp.addEventListener('input', ()=> onChange(inp.value));
  w.append(inp); return w;
}
function fieldTextArea(label, value, onChange){
  const w=document.createElement('div'); w.className='field';
  w.innerHTML=`<label>${escapeHtml(label)}</label>`;
  const ta=document.createElement('textarea'); ta.value=value; ta.rows=3; ta.addEventListener('input', ()=> onChange(ta.value));
  w.append(ta); return w;
}
function fieldNumber(label, value, min, max, step, onChange){
  const w=document.createElement('div'); w.className='field';
  w.innerHTML=`<label>${escapeHtml(label)}</label>`;
  const inp=document.createElement('input'); inp.type='number'; inp.min=String(min); inp.max=String(max); inp.step=String(step); inp.value=String(value);
  inp.addEventListener('input', ()=> { const v=parseFloat(inp.value); if(Number.isFinite(v)) onChange(v); });
  inp.addEventListener('change', ()=> { const v=parseFloat(inp.value); if(Number.isFinite(v)) onChange(v); });
  w.append(inp); return w;
}
function fieldSelect(label, opts, value, onChange){
  const w=document.createElement('div'); w.className='field';
  w.innerHTML=`<label>${escapeHtml(label)}</label>`;
  const sel=document.createElement('select');
  opts.forEach(([val,txt])=>{ const o=document.createElement('option'); o.value=val; o.textContent=txt; if(val===value) o.selected=true; sel.append(o); });
  sel.addEventListener('change', ()=> onChange(sel.value));
  w.append(sel); return w;
}
function fieldColor(label, value, onChange){
  const w=document.createElement('div'); w.className='field';
  w.innerHTML=`<label>${escapeHtml(label)}</label>`;
  const row=document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.alignItems='center';
  const inp=document.createElement('input'); inp.type='color'; inp.value=value.startsWith('#')?value:'#7d9cff'; inp.style.width='44px'; inp.style.height='36px'; inp.style.padding='2px';
  const txt=document.createElement('input'); txt.value=value; txt.placeholder='#7d9cff';
  inp.addEventListener('input', ()=>{ txt.value=inp.value; onChange(inp.value); });
  txt.addEventListener('input', ()=> onChange(txt.value));
  row.append(inp,txt); w.append(row); return w;
}
function actionsRow(btns){
  const row=document.createElement('div'); row.style.display='flex'; row.style.gap='8px'; row.style.flexWrap='wrap';
  btns.forEach(b=>{
    const el=document.createElement('button'); el.type='button'; el.textContent=b.label; el.className='btn hol'; el.style.padding='8px 12px'; el.style.borderRadius='10px'; el.style.fontSize='12px';
    if(b.danger) el.style.color='#ff8a9e';
    el.addEventListener('click', b.on);
    row.append(el);
  });
  return row;
}

function selectClip(kind,id){
  selected={kind,id};
  renderInspector();
  buildTracks();
  saveLS();
}

function deleteSelected(){
  if(!selected) return;
  pushHistory();
  const {kind,id}=selected;
  if(kind==='video') state.videoClips=state.videoClips.filter(c=>c.id!==id);
  else if(kind==='audio') state.audioTracks=state.audioTracks.filter(a=>a.id!==id);
  else if(kind==='overlay') state.overlays=state.overlays.filter(o=>o.id!==id);
  else if(kind==='subtitle') state.subtitles=state.subtitles.filter(s=>s.id!==id);
  selected=null; saveLS(); renderAll();
}
function duplicateSelected(){
  if(!selected) return;
  pushHistory();
  const {kind,id}=selected;
  if(kind==='video'){
    const c=state.videoClips.find(x=>x.id===id); if(!c) return;
    const copy={...c, id:'vc_'+uid(), title:c.title+' copy', start: c.start + c.duration + 0.1};
    state.videoClips.push(copy); selected={kind:'video',id:copy.id};
  } else if(kind==='audio'){
    const a=state.audioTracks.find(x=>x.id===id); if(!a) return;
    const copy={...a, id:'au_'+uid(), title:a.title+' copy', start: a.start + a.duration + 0.2};
    state.audioTracks.push(copy); selected={kind:'audio',id:copy.id};
  } else if(kind==='overlay'){
    const o=state.overlays.find(x=>x.id===id); if(!o) return;
    const copy={...o, id:'ov_'+uid(), title:o.title+' copy'};
    state.overlays.push(copy); selected={kind:'overlay',id:copy.id};
  } else if(kind==='subtitle'){
    const s=state.subtitles.find(x=>x.id===id); if(!s) return;
    const copy={...s, id:'sb_'+uid(), start: s.end+0.2, end: s.end+2.2};
    state.subtitles.push(copy); selected={kind:'subtitle',id:copy.id};
  }
  saveLS(); renderAll();
}
function splitSelected(){
  if(!selected) { notice('Выбери клип'); return; }
  const k=selected.kind;
  if(k!=='video' && k!=='audio'){ notice('Split только для видео/аудио'); return; }
  const list = k==='video' ? state.videoClips : state.audioTracks;
  const item = list.find(x=>x.id===selected.id); if(!item) return;
  const t=playhead;
  const s=item.start, e=item.start+item.duration;
  if(t<=s+0.15 || t>=e-0.15){ notice('Поставь playhead внутри клипа'); return; }
  pushHistory();
  const leftDur = t - s;
  const rightDur = e - t;
  item.duration = leftDur;
  const copy={...item, id:(k==='video'?'vc_':'au_')+uid(), start: t, duration: rightDur, title: item.title+' 2'};
  list.push(copy);
  // keep sorted for video
  if(k==='video') state.videoClips.sort((a,b)=> a.start - b.start);
  selected={kind:k, id:copy.id};
  saveLS(); renderAll(); notice('Разрезано ✂');
}

function seek(t){
  playhead=clamp(t,0,totalDuration());
  positionPlayhead(); renderPreview(); renderRuler();
}

function togglePlay(){
  playing=!playing;
  const btn=$('#btn-play'); if(btn) btn.textContent=playing?'❚❚':'▶';
  if(playing){
    lastTick=performance.now();
    const loop=(now)=>{
      if(!playing) return;
      const dt=(now-lastTick)/1000; lastTick=now;
      playhead+=dt;
      if(playhead>=totalDuration()){ playhead=totalDuration(); playing=false; const b=$('#btn-play'); if(b) b.textContent='▶'; positionPlayhead(); renderPreview(); return; }
      positionPlayhead(); renderPreview(); renderRuler();
      rafId=requestAnimationFrame(loop);
    };
    rafId=requestAnimationFrame(loop);
  } else {
    cancelAnimationFrame(rafId);
  }
}
function stepFrame(dir){
  const fps = Number(state.fps)||30;
  seek(playhead + dir * (1/fps));
}

// drag / resize
let dragState=null;
function startDrag(e, it){
  const startX=e.clientX;
  const origStart=it.start;
  const lane=$('#ve-timeline');
  const onMove=(ev)=>{
    const dx=(ev.clientX - startX)/zoom;
    it.start = clamp(origStart + dx, 0, 120);
    buildTracks(); renderRuler(); renderPreview();
  };
  const onUp=()=>{
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    pushHistory(); saveLS(); renderAll();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp, {once:true});
  // for cancel outside
  window.addEventListener('pointerup', onUp, {once:true});
}
function startResize(e, it, side){
  const startX=e.clientX;
  const origStart=it.start;
  const origEnd=it.end;
  const origDur = it.end - it.start;
  const isVideoOrAudio = it.kind==='video' || it.kind==='audio';
  const onMove=(ev)=>{
    const dx=(ev.clientX - startX)/zoom;
    if(side==='left'){
      const ns = clamp(origStart + dx, 0, origEnd - 0.3);
      it.start = ns;
      if(isVideoOrAudio) it.data.duration = origEnd - ns;
      else { it.data.start=ns; it.data.end=origEnd; }
      // for overlay/subtitle, data is overlay/subtitle shape with start/end
      if(it.kind==='overlay' || it.kind==='subtitle'){ it.data.start=ns; }
    } else {
      const ne = clamp(origEnd + dx, origStart+0.3, 200);
      if(isVideoOrAudio) it.data.duration = ne - origStart;
      else { it.data.end=ne; }
      if(it.kind==='overlay' || it.kind==='subtitle'){ it.data.end=ne; }
    }
    buildTracks(); renderRuler(); renderPreview();
  };
  const onUp=()=>{
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    pushHistory(); saveLS(); renderAll();
  };
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp, {once:true});
}

// export EDL
function buildEDL(){
  const td=totalDuration();
  const edl={
    schemaVersion:1,
    mode:'ywoom_edl_v1',
    title: state.title,
    aspect: state.aspect,
    fps: state.fps,
    duration: td,
    generatedAt: new Date().toISOString(),
    tracks:{
      video: state.videoClips.map(c=> ({id:c.id, title:c.title, start:c.start, duration:c.duration, end:c.start+c.duration, color:c.color, transition:c.transition})),
      audio: state.audioTracks.map(a=> ({id:a.id, title:a.title, start:a.start, duration:a.duration, volume:a.volume, fadeIn:a.fadeIn, fadeOut:a.fadeOut})),
      overlays: state.overlays.map(o=> ({id:o.id, title:o.title, start:o.start, end:o.end, x:o.x, y:o.y, scale:o.scale, rotation:o.rotation, opacity:o.opacity})),
      subtitles: state.subtitles.map(s=> ({id:s.id, text:s.text, start:s.start, end:s.end})),
    },
    dag:[
      {stage:'inputs', inputs:['videoClips','audioTracks','overlays','subtitles'], note:'source media retained, no generation'},
      {stage:'trim', params:'per-clip start/duration (deterministic document edit)'},
      {stage:'transitions', params: state.videoClips.map(c=>c.transition).join(', ')||'cut'},
      {stage:'composite', params:`canvas overlay · ${state.aspect} · ${state.fps}fps`},
      {stage:'encode', params:'offline stub — server FFmpeg required for real MP4', status:'simulated'},
    ],
    limitations:['Frontend interactive editor only — no FFmpeg in browser','Render on server; this JSON is EDL for handoff','No real media bytes included'],
    source:'ywoom video-editor (vanilla)',
  };
  return edl;
}
function showExport(){
  const edl=buildEDL();
  const box=$('#ve-export-box'); const pre=$('#ve-export-preview');
  if(box) box.hidden=false;
  if(pre) pre.textContent=JSON.stringify(edl,null,2);
  const dl=$('#btn-download-edl'); if(dl){
    const blob=new Blob([JSON.stringify(edl,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    dl.href=url; dl.download=`ywoom-edl-${Date.now()}.json`;
    setTimeout(()=> URL.revokeObjectURL(url), 60000);
  }
  notice('EDL собран — проверь DAG и ограничения');
}
function simulateMP4(){
  const dlg=$('#dlg-sim'); const body=$('#dlg-sim-body'); const prog=$('#dlg-sim-progress'); const stat=$('#dlg-sim-status');
  if(!dlg||!body) return;
  const edl=buildEDL();
  body.textContent = edl.dag.map((n,i)=> `${i+1}. ${n.stage} — ${n.params||n.inputs?.join(',')||''} ${n.status?`[${n.status}]`:''}`).join('\n') + '\n\n— симуляция без FFmpeg: это offline заглушка. Реальный рендер — на сервере.\nОграничение: synthetic Chromium media не является Windows-сертификацией.';
  if(typeof dlg.showModal==='function') dlg.showModal(); else dlg.setAttribute('open','');
  let p=0; if(prog) prog.value=0; if(stat) stat.textContent='Подготовка…';
  const iv=setInterval(()=>{
    p+=0.14; if(prog) prog.value=Math.min(1,p);
    if(stat) stat.textContent = p<0.4?'Компоновка…' : p<0.8?'Композинг оверлеев…' : 'Финализация (stub)…';
    if(p>=1){ clearInterval(iv); if(stat) stat.textContent='Готово — stub. Скачай EDL и передай на серверный рендер.'; }
  }, 220);
}

// Studio loader
async function openStudioPicker(){
  const dlg=$('#dlg-studio'); const list=$('#dlg-studio-list');
  if(!dlg||!list) return;
  list.replaceChildren();
  list.textContent='Загружаю…';
  try{
    const r=await fetch('/api/offline/projects');
    if(!r.ok) throw new Error('no api');
    const projects=await r.json();
    list.replaceChildren();
    if(!projects.length){ list.textContent='Нет проектов в Студии — создай сцены в /studio'; }
    else {
      projects.filter(p=>!p.deletedAt).slice(0,20).forEach(p=>{
        const row=document.createElement('div'); row.className='hol'; row.style.cssText='border-radius:12px;padding:10px;display:flex;justify-content:space-between;align-items:center;gap:10px';
        const left=document.createElement('div');
        left.innerHTML=`<div style="font-weight:600;font-size:13px">${escapeHtml(p.title)}</div><div class="m" style="font-size:11px">${(p.scenes||[]).length} сцен · ${p.aspect} · ${p.duration}с</div>`;
        const btn=document.createElement('button'); btn.className='btn conv'; btn.style.cssText='padding:8px 12px;border-radius:12px;color:#fff;flex:none'; btn.textContent='Загрузить сцены';
        btn.addEventListener('click', ()=>{
          loadFromStudioProject(p);
          dlg.close();
        });
        row.append(left,btn); list.append(row);
      });
    }
  }catch{
    // fallback: try localStorage studio drafts? look for offline projects in localStorage
    list.replaceChildren();
    list.textContent='Оффлайн API недоступен (нужен локальный same-origin). Импортируй JSON вручную или открой /studio на этом же хосте.';
  }
  if(typeof dlg.showModal==='function') dlg.showModal(); else dlg.setAttribute('open','');
}
function loadFromStudioProject(p){
  pushHistory();
  const scenes=p.scenes||[];
  const per = scenes.length? (DEFAULT_DURATION / scenes.length) : 4;
  state.title = p.title ? p.title+' · edit' : 'Из Студии';
  state.aspect = p.aspect || 'landscape';
  state.videoClips = scenes.map((s,i)=> makeClip((s.text||'Сцена '+(i+1)).slice(0,42), i*per, per, i));
  // keep existing audio/overlays but collapse if needed, or add demo audio if has audioId
  state.subtitles = scenes.map((s,i)=> makeSub(s.text||'', i*per+0.2, i*per+per-0.2));
  state.overlays = [];
  if(p.audioId){
    // placeholder audio entry with duration from project
    state.audioTracks = [{id:'au_'+uid(), title:'Озвучка из Студии', start:0, duration: p.duration||DEFAULT_DURATION, volume:88, fadeIn:0.4, fadeOut:0.6, color:'#3b3d47'}];
  }
  selected=null; playhead=0; saveLS(); renderAll(); notice('Сцены из Студии загружены — таймлайн готов');
}

function renderAll(){
  renderLayersList(); buildTracks(); renderRuler(); renderPreview(); renderInspector(); positionPlayhead();
}

function bind(){
  $('#btn-play')?.addEventListener('click', togglePlay);
  $('#btn-prev-frame')?.addEventListener('click', ()=> stepFrame(-1));
  $('#btn-next-frame')?.addEventListener('click', ()=> stepFrame(1));
  $('#btn-fit')?.addEventListener('click', ()=>{ zoom=72; const el=$('#ve-zoom'); if(el) el.value='72'; renderAll(); });
  $('#ve-zoom')?.addEventListener('input', (e)=>{ zoom=Number(e.target.value)||72; renderAll(); });
  $('#ve-aspect')?.addEventListener('change', (e)=>{ state.aspect=e.target.value; saveLS(); renderAll(); });
  $('#ve-fps')?.addEventListener('change', (e)=>{ state.fps=Number(e.target.value)||30; saveLS(); renderLayersList(); });
  $$('.ve-tool[data-tool]').forEach(btn=> btn.addEventListener('click', ()=>{
    $$('.ve-tool[data-tool]').forEach(b=> b.classList.remove('is-active'));
    btn.classList.add('is-active'); tool=btn.dataset.tool;
    if(tool==='cut'){ // cut at playhead for selected or split
      if(selected) splitSelected(); else notice('Выбери клип и нажми Cut');
    }
  }));
  $('#btn-split')?.addEventListener('click', splitSelected);
  $('#btn-delete')?.addEventListener('click', deleteSelected);
  $('#btn-duplicate')?.addEventListener('click', duplicateSelected);
  $('#btn-undo')?.addEventListener('click', undo);
  $('#btn-redo')?.addEventListener('click', redo);
  $('#btn-add-clip')?.addEventListener('click', ()=>{
    pushHistory();
    const td=totalDuration();
    const lastEnd = state.videoClips.length? Math.max(...state.videoClips.map(c=> c.start+c.duration)) : 0;
    const c=makeClip('Клип '+(state.videoClips.length+1), lastEnd+0.15, 3.2, state.videoClips.length);
    state.videoClips.push(c); selected={kind:'video', id:c.id}; saveLS(); renderAll();
  });
  $('#btn-add-audio')?.addEventListener('click', ()=>{
    pushHistory();
    const a=makeAudio('Аудио '+(state.audioTracks.length+1), 0, Math.min(12, totalDuration()));
    state.audioTracks.push(a); selected={kind:'audio', id:a.id}; saveLS(); renderAll();
  });
  $('#btn-add-overlay')?.addEventListener('click', ()=>{
    pushHistory();
    const td=totalDuration();
    const o=makeOverlay('Текст '+(state.overlays.length+1), playhead, Math.min(playhead+2.8, td));
    if(o.end<=o.start) o.end=o.start+2;
    state.overlays.push(o); selected={kind:'overlay', id:o.id}; saveLS(); renderAll();
  });
  $('#btn-add-sub')?.addEventListener('click', ()=>{
    pushHistory();
    const td=totalDuration();
    const s=makeSub('Новый субтитр', playhead, Math.min(playhead+2.2, td));
    if(s.end<=s.start) s.end=s.start+1.5;
    state.subtitles.push(s); selected={kind:'subtitle', id:s.id}; saveLS(); renderAll();
  });
  $('#btn-demo')?.addEventListener('click', ()=>{
    pushHistory();
    state=demoState(); selected=null; playhead=0; saveLS(); renderAll(); notice('Демо загружено');
  });
  $('#btn-load-studio')?.addEventListener('click', openStudioPicker);
  $('#btn-save')?.addEventListener('click', ()=>{ saveLS(); pushHistory(); notice('Сохранено локально ✓'); });
  $('#btn-export-json')?.addEventListener('click', showExport);
  $('#btn-copy-edl')?.addEventListener('click', async()=>{
    const edl=buildEDL();
    try{ await navigator.clipboard.writeText(JSON.stringify(edl,null,2)); notice('EDL скопирован ✓'); }catch{ notice('Копирование недоступно — скачай файл'); }
  });
  $('#btn-sim-mp4')?.addEventListener('click', simulateMP4);
  $('#file-import')?.addEventListener('change', async (e)=>{
    const f=e.target.files && e.target.files[0]; if(!f) return;
    try{
      const txt=await f.text(); const data=JSON.parse(txt);
      // accept either edl or raw tracks
      if(data.tracks){
        pushHistory();
        const t=data.tracks;
        state.title=data.title||state.title;
        state.aspect=data.aspect||state.aspect;
        state.fps=data.fps||state.fps;
        if(t.video) state.videoClips=t.video.map(c=> ({id:c.id||'vc_'+uid(), title:c.title||'Клип', start:Number(c.start)||0, duration:Number(c.duration)||2, color:c.color||PALETTE[0], transition:c.transition||'cut'}));
        if(t.audio) state.audioTracks=t.audio.map(a=> ({id:a.id||'au_'+uid(), title:a.title||'Аудио', start:Number(a.start)||0, duration:Number(a.duration)||4, volume:Number(a.volume)||80, fadeIn:Number(a.fadeIn)||0, fadeOut:Number(a.fadeOut)||0, color:'#3b3d47'}));
        if(t.overlays) state.overlays=t.overlays.map(o=> ({id:o.id||'ov_'+uid(), title:o.title||'Оверлей', start:Number(o.start)||0, end:Number(o.end)||2, x:Number(o.x)||50, y:Number(o.y)||50, scale:Number(o.scale)||100, rotation:Number(o.rotation)||0, opacity:Number(o.opacity)||100, color:'#7d9cff'}));
        if(t.subtitles) state.subtitles=t.subtitles.map(s=> ({id:s.id||'sb_'+uid(), text:String(s.text||''), start:Number(s.start)||0, end:Number(s.end)||2}));
        saveLS(); renderAll(); notice('Импорт EDL готов');
      } else if(data.project && data.schemaVersion){
        // ywoom_export_v1 fallback -> load as studio project
        loadFromStudioProject(data.project);
      } else {
        notice('Неизвестный формат JSON');
      }
    }catch(err){ notice('Ошибка импорта: '+(err && err.message || err)); }
    e.target.value='';
  });
  // timeline scrub via pointer on timeline background
  const tl=$('#ve-timeline');
  if(tl){
    let scrubbing=false;
    tl.addEventListener('pointerdown', (e)=>{
      if(e.target.closest('.ve-clip') || e.target.closest('.ve-handle') || e.target.closest('.ve-clip-split')) return;
      scrubbing=true; tl.setPointerCapture(e.pointerId);
      const rect=tl.getBoundingClientRect();
      const tracksW=$('#ve-tracks')?.offsetWidth||900;
      // compute scrolled offset
      const scrollLeft=tl.scrollLeft;
      const x = e.clientX - rect.left + scrollLeft;
      const t=clamp((x-10)/zoom,0,totalDuration());
      seek(t);
    });
    tl.addEventListener('pointermove', (e)=>{
      if(!scrubbing) return;
      const rect=tl.getBoundingClientRect(); const scrollLeft=tl.scrollLeft;
      const x=e.clientX - rect.left + scrollLeft;
      seek(clamp((x-10)/zoom,0,totalDuration()));
    });
    tl.addEventListener('pointerup', ()=> scrubbing=false);
    tl.addEventListener('pointercancel', ()=> scrubbing=false);
  }
  // keyboard
  window.addEventListener('keydown', (e)=>{
    if(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); }
      return;
    }
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='z'){ e.preventDefault(); if(e.shiftKey) redo(); else undo(); return; }
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='y'){ e.preventDefault(); redo(); return; }
    if(e.code==='Space'){ e.preventDefault(); togglePlay(); return; }
    if(e.key==='Delete' || e.key==='Backspace'){ if(selected){ e.preventDefault(); deleteSelected(); } return; }
    if(e.key.toLowerCase()==='c' && !e.ctrlKey){ tool='cut'; $$('.ve-tool').forEach(b=> b.classList.toggle('is-active', b.dataset.tool==='cut')); }
    if(e.key.toLowerCase()==='v' && !e.ctrlKey){ tool='select'; $$('.ve-tool').forEach(b=> b.classList.toggle('is-active', b.dataset.tool==='select')); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); stepFrame(e.shiftKey?-5:-1); }
    if(e.key==='ArrowRight'){ e.preventDefault(); stepFrame(e.shiftKey?5:1); }
  });
  // preview click -> play/pause
  $('#ve-preview-wrap')?.addEventListener('click', (e)=>{
    if(e.target.closest('button')|| e.target.closest('a')) return;
    togglePlay();
  });
  window.addEventListener('resize', ()=>{ renderRuler(); positionPlayhead(); });
  // initial history
  pushHistory();
}

document.addEventListener('DOMContentLoaded', ()=>{
  bind();
  renderAll();
  // try auto-load from Studio if ?projectId= present
  try{
    const qs=new URLSearchParams(location.search);
    const pid=qs.get('projectId');
    if(pid && /^[0-9a-f]{8}-/.test(pid)){
      fetch('/api/offline/projects/'+encodeURIComponent(pid)).then(r=> r.ok? r.json(): null).then(p=>{
        if(p && p.scenes){ loadFromStudioProject(p); }
      }).catch(()=>{});
    }
  }catch{}
});

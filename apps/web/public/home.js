'use strict';
// Home / Architect hub wiring — real local data + factory discovery
(function(){
  const gid = (id)=> document.getElementById(id);
  function setBalance(){
    fetch('/api/billing/limits').then(r=>r.json()).then(j=>{
      const el=gid('yw-balance');
      if(!el) return;
      if(j.unlimited) el.textContent='∞';
      else el.textContent = j.plan==='free' ? 'Free · '+j.maxProjects : j.plan;
    }).catch(()=>{});
    fetch('/api/billing/subscription').then(r=>r.json()).then(j=>{
      const sub=j.subscription;
      const el=gid('yw-balance');
      if(el && sub && sub.plan) el.textContent = sub.plan + (sub.status==='active'?' · активен':'');
    }).catch(()=>{});
  }
  function setConveyor(){
    fetch('/api/offline/projects').then(r=>r.json()).then(arr=>{
      const n=arr.length;
      const hint=gid('yw-conveyor-hint');
      if(!hint) return;
      if(!n) hint.textContent='Пока пусто — выбери фабрику ниже и запусти первую миссию.';
      else hint.textContent='Проектов: '+n+' · последний '+ new Date(arr[0].updatedAt).toLocaleDateString();
    }).catch(()=>{ const h=gid('yw-conveyor-hint'); if(h) h.textContent='Конвейер: локально · без облака по умолчанию'; });
  }
  function setAutonomy(){
    fetch('/api/offline/projects').then(r=>r.json()).then(arr=>{
      const n=arr.length;
      const pct=Math.min(100, Math.round((n/6)*100));
      const ring=gid('yw-auto-ring');
      if(ring) ring.setAttribute('stroke-dasharray', '0.9 4.655 '.repeat(Math.round(pct/10)) + ' 0 200');
      const lblA=gid('yw-autonomy-label');
      if(lblA) lblA.textContent = n>=6 ? 'Полная' : n>=3 ? 'Средняя' : n ? 'Начало' : 'Пусто';
    }).catch(()=>{});
    const tg=gid('yw-autopilot');
    if(tg){
      const v=localStorage.getItem('ywoom_autopilot');
      if(v!==null) tg.checked = v==='1';
      else tg.checked = true;
      const lbl=gid('yw-autopilot-label');
      const upd=()=>{
        const on=tg.checked;
        if(lbl) lbl.textContent = on ? 'Работает сам' : 'На паузе';
        localStorage.setItem('ywoom_autopilot', on?'1':'0');
      };
      tg.addEventListener('change', upd); upd();
    }
  }
  function setBest(){
    fetch('/api/offline/projects').then(r=>r.json()).then(arr=>{
      const box=gid('yw-best');
      if(!box) return;
      if(!arr.length){ box.innerHTML='<div class="m" style="padding:12px 8px">Пока нет контента — сделай первый ролик в Студии.</div>'; return; }
      const top=arr.slice(0,3);
      box.replaceChildren();
      top.forEach(p=>{
        const row=document.createElement('button');
        row.className='row conv';
        row.style.cursor='pointer';
        const pct=Math.min(99, 60+ (p.title.length%30) + (p.scenes? p.scenes.length*3:0));
        row.innerHTML='<span class="bead" style="--c:'+(pct>85?'#f58a9e':'#7d9cff')+'"></span><span style="flex:1;text-align:left"><span style="display:block;font-size:14px;font-weight:500">'+(p.title||'Без названия')+'</span><span class="m" style="display:block;font-size:11.5px">'+(p.tags? p.tags.slice(0,2).join(' · '):'Студия')+'</span></span><b style="font-weight:600;color:#b7c8ff">'+pct+'%</b>';
        row.addEventListener('click', ()=> location.href='/studio?projectId='+encodeURIComponent(p.id));
        box.append(row);
      });
      const hint=gid('yw-best-hint');
      if(hint) hint.textContent = 'Топ по локальной оценке · кликни чтобы открыть в Студии.';
    }).catch(()=>{});
  }
  function setNow(){
    fetch('/api/offline/projects').then(r=>r.json()).then(arr=>{
      const now=gid('yw-now'), next=gid('yw-next');
      if(now && !arr.length){ now.textContent='Пока тихо — выбери фабрику ниже и Ywon соберёт план.'; if(next) next.textContent=''; return; }
      const last=arr[0];
      if(now) now.innerHTML='Последний проект «'+(last.title||'—')+'» · r'+last.revision;
      if(next) next.textContent='Открой Студию чтобы продолжить или выбери другую фабрику.';
    }).catch(()=>{});
    fetch('/api/offline/projects').then(r=>r.json()).then(arr=>{
      const pct=Math.min(100, Math.round((arr.length/6)*60+20));
      const wrap=gid('yw-progress');
      const label=gid('yw-progress-pct');
      if(wrap) wrap.style.setProperty('--a', (pct*3.6)+'deg');
      if(label) label.textContent = pct+'%';
    }).catch(()=>{});
  }
  function setQueue(){
    fetch('/api/offline/projects').then(r=>r.json()).then(arr=>{
      const box=gid('yw-queue');
      if(!box) return;
      if(!arr.length){ box.innerHTML='<div class="m" style="padding:10px">Очередь пуста — публикации появятся после сборки MP4.</div>'; return; }
      box.replaceChildren();
      arr.slice(0,3).forEach(p=>{
        const row=document.createElement('button');
        row.className='row conv';
        const when=new Date(p.updatedAt);
        const hh=String(when.getHours()).padStart(2,'0'), mm=String(when.getMinutes()).padStart(2,'0');
        row.innerHTML='<span class="bead" style="--c:#f58a9e"></span><span style="flex:1;text-align:left"><span style="display:block;font-size:14px;font-weight:500">'+(p.title||'—')+'</span><span class="m" style="display:block;font-size:11.5px">Студия · r'+p.revision+'</span></span><span style="text-align:right"><b style="display:block;font-weight:600">'+hh+':'+mm+'</b><span class="m" style="display:block;font-size:11.5px">сегодня</span></span>';
        row.addEventListener('click', ()=> location.href='/studio?projectId='+encodeURIComponent(p.id));
        box.append(row);
      });
    }).catch(()=>{});
  }
  function setEff(){
    fetch('/api/storage').then(r=>r.json()).then(j=>{
      const pct = j.projects ? Math.min(60, j.projects*6 + j.assets*1.2) : 18;
      const el=gid('yw-eff-pct');
      if(el) el.textContent='+'+pct+'%';
      const area=gid('yw-eff-area'), line=gid('yw-eff-line');
      if(area && line){
        const pts=[[30,100],[75,78],[120,86],[164,52],[208,64],[252,30],[300,44]];
        const d='M'+pts.map(p=>p.join(' ')).join(' L');
        line.setAttribute('d', d);
        area.setAttribute('d', d+' L300 110 L30 110 Z');
      }
    }).catch(()=>{});
  }
  const inp=gid('yw-search');
  if(inp){
    inp.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){
        e.preventDefault();
        const q=inp.value.trim();
        if(q) location.href='/studio?q='+encodeURIComponent(q);
      }
    });
    window.addEventListener('keydown', (e)=>{
      if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); inp.focus(); inp.select(); }
    });
  }
  // CTA: Новая задача -> выбор фабрики (пока якорь на блок фабрик, позже — модалка)
  const go=document.querySelector('.go');
  if(go){
    go.addEventListener('click', (e)=>{
      e.preventDefault();
      const target=document.getElementById('yw-factories');
      if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
    });
  }
  // Direct director label -> Ywon active mission (keep existing id for compat)
  const directorText=gid('yw-director-text');
  if(directorText){
    // keep as is; home.js earlier set -— ; now we leave to setNow
  }
  fetch('/api/offline/projects').then(r=>r.json()).then(arr=>{
    const bead=gid('yw-notify-bead');
    if(!bead) return;
    const recent=arr.some(p=> Date.now() - new Date(p.updatedAt).getTime() < 24*3600*1000);
    bead.hidden = !recent;
  }).catch(()=>{});
  fetch('/api/auth/me').then(r=>r.json()).then(j=>{
    const el=gid('yw-profile');
    if(el && j.ok && j.userId) el.textContent=j.userId.split('@')[0];
  }).catch(()=>{});
  setBalance(); setConveyor(); setAutonomy(); setBest(); setNow(); setQueue(); setEff();
})();

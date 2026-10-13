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
  var __portfolioSelectedId=null;
  function conveyorStageFromProject(p){
    if(!p) return 1;
    var scenes=p.scenes||[];
    var total=scenes.length;
    if(!total) return 1;
    var withImg=scenes.filter(function(s){return !!s.imageId;}).length;
    var hasAudio=!!p.audioId;
    if(withImg===0) return 1;
    if(withImg < total) return 2;
    if(!hasAudio) return 2;
    // all assets present -> consider revision as progression: r1=idea/generate, higher => review/publish
    if(p.revision && p.revision>=4) return 4;
    if(p.revision && p.revision>=2) return 3;
    return 3;
  }
  function renderConveyor(arr){
    var n=arr ? arr.length : 0;
    var hint=gid('yw-conveyor-hint');
    var bar=gid('yw-conveyor-bar');
    var pctEl=gid('yw-conveyor-pct');
    var stage=1;
    var scenePct=null;
    if(n){
      var sorted=[].concat(arr).sort(function(a,b){ return new Date(b.updatedAt)-new Date(a.updatedAt); });
      var curId=__portfolioSelectedId;
      var cur= sorted.find(function(x){return x.id===curId;}) || sorted[0];
      stage=conveyorStageFromProject(cur);
      if(cur.scenes && cur.scenes.length){
        var done=cur.scenes.filter(function(s){return !!s.imageId;}).length;
        scenePct=Math.round(done/cur.scenes.length*100);
      }
      if(hint){
        var names=['Идея','Генерация','Проверка','Выход'];
        hint.textContent='Проектов: '+n+' · этап: '+ names[stage-1] +' ('+stage+'/4)'+ (scenePct!=null ? ' · сцен '+scenePct+'%' : '');
        hint.title='Конвейер: '+stage+'/4 · '+ names[stage-1];
      }
    } else {
      if(hint) hint.textContent='Пока пусто — выбери фабрику ниже и запусти первую миссию.';
    }
    var steps=document.querySelectorAll('#yw-conveyor-steps .yw-conv-step');
    var cols=['#7d9cff','#a58cf5','#d777d0','#f58a9e'];
    steps.forEach(function(el, i){
      var idx=i+1;
      var active= idx<=stage && n>0;
      var current= idx===stage && n>0;
      el.style.opacity= active ? '1' : '0.42';
      el.style.fontWeight= current ? '600' : '400';
      var bicon=el.querySelector('.bicon');
      if(bicon){
        bicon.style.opacity= active ? '1' : '0.55';
        if(current) bicon.classList.add('bicon--zone'); else bicon.classList.remove('bicon--zone');
      }
      var ln=el.nextElementSibling;
      if(ln && ln.classList.contains('ln')){
        ln.style.background= idx < stage ? cols[i%4] : idx===stage ? cols[i%4] : 'rgba(255,255,255,.18)';
        ln.style.opacity= idx < stage ? '1' : idx===stage ? '0.85' : '0.45';
      }
    });
    if(bar){
      var segCols=['#7d9cff','#a58cf5','#d777d0','#f58a9e'];
      bar.replaceChildren();
      for(var i=0;i<4;i++){
        var seg=document.createElement('i');
        var filled=(i+1)<=stage && n>0;
        seg.style.cssText='flex:1;border-radius:6px;background:'+(filled? segCols[i] :'#4a4c57')+';opacity:'+(filled?'1':'0.45')+';transition:background .2s,opacity .2s';
        bar.append(seg);
      }
    }
    if(pctEl){
      if(!n) pctEl.textContent='0/4 · 0%';
      else pctEl.textContent=stage+'/4 · '+Math.round(stage/4*100)+'%'+ (scenePct!=null ? ' · сцен '+scenePct+'%':'');
    }
  }
  function setConveyor(){
    fetch('/api/offline/projects').then(function(r){return r.json();}).then(function(arr){
      renderConveyor(arr);
    }).catch(function(){ var h=gid('yw-conveyor-hint'); if(h) h.textContent='Конвейер: локально · без облака по умолчанию'; renderConveyor([]); });
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
  function retentionPctFromProjects(arr){
    if(!arr || !arr.length) return 0;
    var now=Date.now();
    var sixWeeks=6*7*24*3600*1000;
    var active=arr.filter(function(p){ return now - new Date(p.updatedAt).getTime() <= sixWeeks; }).length;
    return Math.round(active/arr.length*100);
  }
  function weeklyBuckets(arr){
    var buckets=[0,0,0,0,0,0];
    if(!arr) return buckets;
    var now=Date.now();
    var week=7*24*3600*1000;
    arr.forEach(function(p){
      var age=now - new Date(p.updatedAt).getTime();
      if(age<0) age=0;
      var idx=Math.floor(age/week);
      if(idx>=0 && idx<6) buckets[5-idx]++;
    });
    return buckets;
  }
  function buildSparkFromBuckets(buckets){
    var max=Math.max(1, Math.max.apply(null, buckets));
    var xs=[30,75,120,164,208,252,300];
    var pts=[];
    for(var i=0;i<6;i++){
      var norm=buckets[i]/max;
      var y=Math.round(62 - norm*44 + (i===5? -2:0));
      y=Math.max(14, Math.min(62, y));
      pts.push([xs[i], y]);
    }
    pts.push([300, pts[5][1]]);
    return pts;
  }
  function setQueue(){
    fetch('/api/offline/projects').then(function(r){return r.json();}).then(function(arr){
      var box=gid('yw-queue');
      if(!box) return;
      if(!arr.length){ box.innerHTML='<div class="m" style="padding:10px">Очередь пуста — публикации появятся после сборки MP4.</div>'; return; }
      box.replaceChildren();
      var sorted=[].concat(arr).sort(function(a,b){ return new Date(b.updatedAt)-new Date(a.updatedAt); });
      sorted.slice(0,3).forEach(function(p){
        var row=document.createElement('button');
        row.className='row conv';
        if(__portfolioSelectedId===p.id) row.style.outline='1.5px solid rgba(125,156,255,.55)';
        var when=new Date(p.updatedAt);
        var hh=String(when.getHours()).padStart(2,'0'), mm=String(when.getMinutes()).padStart(2,'0');
        var beadC=__portfolioSelectedId===p.id ? '#7d9cff' : '#f58a9e';
        row.innerHTML='<span class="bead" style="--c:'+beadC+'"></span><span style="flex:1;text-align:left"><span style="display:block;font-size:14px;font-weight:500">'+(p.title||'—')+'</span><span class="m" style="display:block;font-size:11.5px">Студия · r'+p.revision+'</span></span><span style="text-align:right"><b style="display:block;font-weight:600">'+hh+':'+mm+'</b><span class="m" style="display:block;font-size:11.5px">сегодня</span></span>';
        row.addEventListener('click', function(){
          __portfolioSelectedId=p.id;
          var sel=gid('yw-portfolio-switch'), qsel=gid('yw-queue-switch');
          if(sel) sel.value=p.id;
          if(qsel) qsel.value=p.id;
          fetch('/api/offline/projects').then(function(rr){return rr.json();}).then(function(a2){ renderPortfolioSelection(a2); renderConveyor(a2); });
          location.href='/studio?projectId='+encodeURIComponent(p.id);
        });
        row.title='Клик — открыть в Студии; выбор также меняет Портфель';
        box.append(row);
      });
    }).catch(function(){});
  }
  function projectPct(p){
    if(!p) return 20;
    var tLen=(p.title||'').length;
    var sLen=(p.scenes&&Array.isArray(p.scenes))? p.scenes.length : 0;
    var rev=p.revision||0;
    return Math.min(99, 60 + (tLen%30) + sLen*3 + (rev%7));
  }
  function setEff(){
    Promise.all([fetch('/api/offline/projects').then(function(r){return r.json();}).catch(function(){return [];}), fetch('/api/storage').then(function(r){return r.json();}).catch(function(){return {};})]).then(function(res){
      var arr=res[0]||[];
      var pct=retentionPctFromProjects(arr);
      var el=gid('yw-eff-pct');
      if(el){ el.textContent=(arr.length? '+'+pct+'%':'—'); el.title='Удержание: '+pct+'% проектов обновлены за 6 недель ('+arr.filter(function(p){return Date.now()-new Date(p.updatedAt).getTime()<=6*7*24*3600*1000;}).length+'/'+arr.length+')'; }
      var buckets=weeklyBuckets(arr);
      var pts=buildSparkFromBuckets(buckets);
      var d='M'+pts.slice(0,6).map(function(p){return p.join(' ');}).join(' L');
      var line=gid('yw-eff-line'), area=gid('yw-eff-area');
      if(line) line.setAttribute('d', d);
      if(area) area.setAttribute('d', d+' L300 110 L30 110 Z');
      if(line){ var col= pct>=60 ? '#7d9cff' : pct>=30 ? '#a58cf5' : '#f58a9e'; line.style.filter='drop-shadow(0 0 6px '+col+'66)'; line.setAttribute('stroke', '#f4e6da'); }
      var effHead=document.querySelector('#yw-card-eff .yw-widget-head .t');
      if(effHead && !document.getElementById('yw-eff-badge')){
        var b=document.createElement('span'); b.id='yw-eff-badge'; b.className='m';
        b.style.cssText='font-size:10px;border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:2px 7px;margin-left:6px';
        effHead.after(b);
      }
      var eb=gid('yw-eff-badge'); if(eb) eb.textContent=(arr.length? pct+'%':'—');
    }).catch(function(){});
  }
  function setAgents(){
    var list=gid('yw-agents-list'), countEl=gid('yw-agents-count');
    if(!list) return;
    function render(agents){
      if(countEl) countEl.textContent = agents.length ? agents.length+' активно' : '0';
      list.replaceChildren();
      if(!agents.length){
        var e=document.createElement('div'); e.className='m'; e.style.cssText='font-size:12px;padding:6px'; e.textContent='Нет активных — фабрика ждёт задачи.';
        list.append(e); return;
      }
      agents.forEach(function(a){
        var row=document.createElement('div');
        row.className='hol';
        row.style.cssText='border-radius:14px;padding:8px 10px;display:flex;align-items:center;gap:8px';
        var dotColor = a.status==='active' ? '#7d9cff' : (a.status==='busy'?'#f58a9e':'#b8b9c8');
        var nameEsc=String(a.role||a.id||'—').replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});
        var taskEsc=String(a.task||'—').replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});
        var uptimeEsc=String(a.uptime||'').replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});
        row.innerHTML='<span class="bead" style="--c:'+dotColor+';flex:none"></span><span style="flex:1;min-width:0"><span style="display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+nameEsc+'</span><span class="m" style="display:block;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+taskEsc+' · '+uptimeEsc+'</span></span><button class="btn conv" data-connect="'+nameEsc+'" style="padding:6px 10px;border-radius:10px;font-size:11px;flex:none">Connect</button>';
        var btn=row.querySelector('[data-connect]');
        if(btn) btn.addEventListener('click', function(){ location.href='/architect?agent='+encodeURIComponent(a.role||a.id); });
        list.append(row);
      });
    }
    fetch('/api/agents').then(function(r){ return r.ok? r.json(): Promise.reject(); }).then(function(j){
      var agents = (j && (j.agents||j)) ;
      if(!Array.isArray(agents)) agents=[];
      // normalize
      agents=agents.slice(0,6).map(function(x){ return {id:x.id||x.role, role:x.role||x.id, status:x.status||'active', task:x.task||'—', uptime:x.uptime||'—'}; });
      render(agents);
    }).catch(function(){
      // mock fallback 2-3 agents
      render([
        {id:'strategist', role:'Strategist', status:'active', task:'Планирует контент-неделю', uptime:'2ч 14м'},
        {id:'producer', role:'Producer', status:'active', task:'Собирает сцены', uptime:'47м'},
        {id:'guardian', role:'Guardian', status:'idle', task:'Ждёт проверку', uptime:'—'}
      ]);
    });
  }
  function initRingPopup(){
    var ring=gid('yw-arch-ring'), progress=gid('yw-progress');
    var popup=gid('yw-ring-popup'), backdrop=gid('yw-ring-popup-backdrop'), closeBtn=gid('yw-ring-popup-close');
    var list=gid('yw-ring-popup-list'), empty=gid('yw-ring-popup-empty');
    if(!ring||!popup||!backdrop||!list) return;
    // allow clicks on progress bead
    if(progress) progress.style.pointerEvents='auto';
    function open(){
      // fill list from projects
      fetch('/api/offline/projects').then(function(r){ return r.json(); }).then(function(arr){
        list.replaceChildren();
        if(!arr || !arr.length){
          if(empty) empty.hidden=false;
          return;
        }
        if(empty) empty.hidden=true;
        arr.slice(0,6).forEach(function(p){
          var pct=projectPct(p);
          var title=(p.title||'Без названия');
          var stage=(p.tags&&p.tags[0])||'Студия';
          var row=document.createElement('button');
          row.className='hol';
          row.style.cssText='border-radius:14px;padding:10px 12px;display:flex;flex-direction:column;gap:6px;text-align:left;width:100%;cursor:pointer';
          var esc=function(s){ return String(s).replace(/[&<>"]/g,function(m){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m];});};
          row.innerHTML='<span style="display:flex;align-items:center;gap:8px"><span class="bead" style="--c:'+(pct>85?'#f58a9e':'#7d9cff')+';flex:none"></span><span style="flex:1;font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(title)+'</span><b style="font-size:12px;color:#b7c8ff">'+pct+'%</b></span><span class="m" style="font-size:11px">'+esc(stage)+' · r'+(p.revision||0)+'</span><span class="hol" style="height:8px;border-radius:6px;padding:2px;display:flex"><i style="width:'+pct+'%;border-radius:4px;background:'+(pct>85?'#f58a9e':'#7d9cff')+';display:block"></i></span>';
          row.addEventListener('click', function(){ location.href='/studio?projectId='+encodeURIComponent(p.id); });
          list.append(row);
        });
      }).catch(function(){
        if(empty){ empty.hidden=false; empty.textContent='Не удалось загрузить — проверь /api/offline/projects.'; }
      });
      popup.hidden=false; backdrop.hidden=false;
      // trap focus to close button
      if(closeBtn) closeBtn.focus();
      document.addEventListener('keydown', onKey);
    }
    function close(){
      popup.hidden=true; backdrop.hidden=true;
      document.removeEventListener('keydown', onKey);
      ring.focus();
    }
    function onKey(e){ if(e.key==='Escape') close(); }
    ring.addEventListener('click', open);
    if(progress) progress.addEventListener('click', function(e){ e.stopPropagation(); open(); });
    ring.addEventListener('keydown', function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); }});
    if(closeBtn) closeBtn.addEventListener('click', close);
    backdrop.addEventListener('click', close);
  }
  function setConveyorPipelinePct(){
    fetch('/api/offline/projects').then(function(r){ return r.json(); }).then(function(arr){
      var el=gid('yw-conveyor-pct');
      if(!el) return;
      if(!arr.length){ el.textContent='Конвейер · 0% · —'; return; }
      var avg=Math.round(arr.slice(0,6).reduce(function(s,p){return s+projectPct(p);},0)/Math.min(arr.length,6));
      el.textContent='Конвейер · '+avg+'% — '+arr.length+' проектов';
    }).catch(function(){});
  }
  // W5: header search — icon toggle → panel below header
  const inp=gid('yw-search');
  const panel=gid('yw-search-panel');
  const tog=gid('yw-search-toggle');
  const closeBtn=gid('yw-search-close');
  function openSearch(){
    if(!panel||!tog) return;
    panel.hidden=false;
    tog.classList.add('is-open');
    tog.setAttribute('aria-expanded','true');
    requestAnimationFrame(()=>{ if(inp){ inp.focus(); inp.select(); } });
  }
  function closeSearch(){
    if(!panel||!tog) return;
    panel.hidden=true;
    tog.classList.remove('is-open');
    tog.setAttribute('aria-expanded','false');
  }
  function toggleSearch(){
    if(!panel) return;
    if(panel.hidden) openSearch(); else closeSearch();
  }
  if(inp){
    inp.addEventListener('keydown', (e)=>{
      if(e.key==='Enter'){
        e.preventDefault();
        const q=inp.value.trim();
        if(q) location.href='/studio?q='+encodeURIComponent(q);
      }
      if(e.key==='Escape'){ e.preventDefault(); closeSearch(); if(tog) tog.focus(); }
    });
  }
  if(tog && panel){
    tog.addEventListener('click', (e)=>{ e.preventDefault(); toggleSearch(); });
  }
  if(closeBtn){ closeBtn.addEventListener('click', (e)=>{ e.preventDefault(); closeSearch(); if(tog) tog.focus(); }); }
  document.addEventListener('keydown', (e)=>{
    if(e.key==='Escape' && panel && !panel.hidden){ closeSearch(); }
  });
  document.addEventListener('click', (e)=>{
    if(!panel||panel.hidden) return;
    if(panel.contains(e.target) || (tog && tog.contains(e.target))) return;
    // click outside panel closes (but not on first toggle click)
    closeSearch();
  });
  window.addEventListener('keydown', (e)=>{
    if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){
      e.preventDefault();
      if(panel && panel.hidden) openSearch(); else if(inp){ inp.focus(); inp.select(); }
    }
  });
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
  // ——— DASHBOARD tetris (W5) ———
  // localStorage ywoom_dashboard_v1 = {version:1, layout:[{id,type,x,y,w,h,config,locked,kind}], updatedAt}
  // mobile widget: PWA widget pack — widget.kind grid|widget
  var DASH_LS='ywoom_dashboard_v1';
  var TRASH_LS='ywoom_trash_v1';
  function dashDefaultLayout(){
    return [
      {id:'portfolio', type:'fixed', locked:false, kind:'grid', w:1,h:1, config:{fields:['count','last','tags','pipe','auto']}},
      {id:'economy',   type:'fixed', locked:false, kind:'grid', w:1,h:1, config:{fields:['spark','balance','limit','storage']}},
      {id:'conveyor',  type:'widget', kind:'grid', w:1,h:1, config:{}},
      {id:'best',       type:'widget', kind:'grid', w:1,h:1, config:{}},
      {id:'queue',      type:'widget', kind:'grid', w:1,h:1, config:{}},
      {id:'eff',        type:'widget', kind:'grid', w:1,h:1, config:{}},
      {id:'agents',     type:'widget', kind:'grid', w:1,h:1, config:{}},
      {id:'autonomy',   type:'widget', kind:'grid', w:1,h:1, config:{}},
      {id:'autopilot',  type:'widget', kind:'grid', w:1,h:1, config:{}}
    ];
  }
  function dashLoad(){
    try{
      var raw=localStorage.getItem(DASH_LS);
      if(!raw) return {version:1, layout:dashDefaultLayout(), updatedAt: new Date().toISOString()};
      var j=JSON.parse(raw);
      if(!j || !Array.isArray(j.layout) || !j.layout.length) throw 0;
      // migrate: keep kind/w defaults, do NOT force lock on portfolio/economy — user may freely move them (was locked in W5)
      j.layout.forEach(function(it){ if(!it.kind) it.kind='grid'; if(it.w==null) it.w=1; if(it.h==null) it.h=1; if(it.locked==null) it.locked=false; });
      return j;
    }catch(e){ return {version:1, layout:dashDefaultLayout(), updatedAt: new Date().toISOString()}; }
  }
  function dashSave(layout){
    try{ localStorage.setItem(DASH_LS, JSON.stringify({version:1, layout:layout, updatedAt:new Date().toISOString()})); }catch(e){}
  }
  function dashLayoutIds(){ return dashLoad().layout.map(function(x){return x.id;}); }
  // ——— Trash bin (W8) ———
  function trashLoad(){ try{ var raw=localStorage.getItem(TRASH_LS); if(!raw) return []; var a=JSON.parse(raw); return Array.isArray(a)?a:[]; }catch(e){ return []; } }
  function trashSave(list){ try{ localStorage.setItem(TRASH_LS, JSON.stringify(list)); }catch(e){} }
  function trashPush(item){
    var list=trashLoad();
    // dedup by id: replace
    list=list.filter(function(x){ return x.id!==item.id; });
    list.unshift({id:item.id, removedAt:new Date().toISOString(), layoutItem: JSON.parse(JSON.stringify(item))});
    // keep max 30, no expiry yet
    if(list.length>30) list=list.slice(0,30);
    trashSave(list);
  }
  function trashRestore(id){
    var list=trashLoad();
    var found=list.find(function(x){ return x.id===id; });
    if(!found) return false;
    var cur=dashLoad();
    if(cur.layout.some(function(x){ return x.id===id; })) return false;
    cur.layout.push(found.layoutItem);
    dashSave(cur.layout);
    trashSave(list.filter(function(x){ return x.id!==id; }));
    return true;
  }
  function trashRenderPanel(){
    var panel=gid('yw-trash-panel'), cnt=gid('yw-trash-count');
    if(!panel) return;
    var list=trashLoad();
    if(cnt) cnt.textContent=String(list.length);
    if(panel.hidden) return; // only full render when open; count always
    panel.replaceChildren();
    var head=document.createElement('div'); head.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px';
    head.innerHTML='<b style="font-size:12px">Корзина</b><span class="m" style="font-size:11px">'+(list.length? list.length+' шт':'пусто')+'</span>';
    var clearBtn=document.createElement('button'); clearBtn.className='btn hol'; clearBtn.textContent='Очистить'; clearBtn.style.cssText='height:26px;padding:0 10px;border-radius:13px;font-size:11px;flex:none';
    clearBtn.addEventListener('click', function(){ trashSave([]); trashRenderPanel(); });
    head.append(clearBtn);
    panel.append(head);
    if(!list.length){
      var empty=document.createElement('div'); empty.className='m'; empty.style.cssText='padding:10px;font-size:12px;text-align:center'; empty.textContent='Корзина пуста';
      panel.append(empty); return;
    }
    list.forEach(function(entry){
      var row=document.createElement('div'); row.style.cssText='display:flex;align-items:center;gap:8px;padding:8px;border-radius:12px;background:rgba(255,255,255,.06);margin-bottom:6px';
      var title=(entry.layoutItem && entry.layoutItem.config && entry.layoutItem.config.title) || entry.id;
      var when=new Date(entry.removedAt); var hh=String(when.getHours()).padStart(2,'0'), mm=String(when.getMinutes()).padStart(2,'0');
      row.innerHTML='<span style="flex:1;min-width:0"><span style="display:block;font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+escapeHtml(title)+' · '+escapeHtml(entry.id)+'</span><span class="m" style="display:block;font-size:11px">'+hh+':'+mm+' · '+when.toLocaleDateString()+'</span></span>';
      var btn=document.createElement('button'); btn.className='btn conv'; btn.textContent='Вернуть'; btn.style.cssText='height:28px;padding:0 12px;border-radius:14px;font-size:11px;font-weight:600;flex:none';
      var stillInLayout=dashLoad().layout.some(function(x){return x.id===entry.id;});
      if(stillInLayout){ btn.disabled=true; btn.textContent='Уже на месте'; btn.style.opacity='.55'; }
      btn.addEventListener('click', function(){
        if(trashRestore(entry.id)){
          renderCustomWidgets(); dashApplyHidden(); try{ if(window.initArchitectConnections) window.initArchitectConnections(); }catch(_){}
          trashRenderPanel();
        }
      });
      row.append(btn);
      panel.append(row);
    });
  }
  function applyFieldVisibility(){
    var cur=dashLoad();
    var p=cur.layout.find(function(x){return x.id==='portfolio';});
    var e=cur.layout.find(function(x){return x.id==='economy';});
    var pf=p && p.config && Array.isArray(p.config.fields) ? new Set(p.config.fields) : null;
    var ef=e && e.config && Array.isArray(e.config.fields) ? new Set(e.config.fields) : null;
    // portfolio parts
    var mapP={count:'yw-portfolio-count', last:'yw-portfolio-last', tags:'yw-portfolio-tags', pipe:'yw-portfolio-pipe', auto:'yw-portfolio-auto'};
    Object.keys(mapP).forEach(function(k){ var el=gid(mapP[k]); if(!el) return; if(!pf) el.style.display=''; else el.style.display = pf.has(k) ? '' : 'none'; });
    // economy parts
    var mapE={spark:'yw-economy-spark', balance:'yw-economy-balance', limit:'yw-economy-limit', storage:'yw-economy-storage', eff:'yw-economy-eff'};
    Object.keys(mapE).forEach(function(k){ var el=gid(mapE[k]); if(!el) return; if(!ef) el.style.display=''; else el.style.display = ef.has(k) ? '' : 'none'; });
    // custom CSS
    try{
      var old=document.getElementById('yw-custom-css'); if(old) old.remove();
      var css=''; if(p && p.config && p.config.customCSS) css+='\n'+p.config.customCSS; if(e && e.config && e.config.customCSS) css+='\n'+e.config.customCSS;
      cur.layout.forEach(function(it){ if(it.type==='custom' && it.config && it.config.customCSS) css+='\n'+it.config.customCSS; });
      if(css.trim()){ var st=document.createElement('style'); st.id='yw-custom-css'; st.textContent=css; document.head.appendChild(st); }
    }catch(_){}
  }
  function renderPortfolioSelection(arr){
    if(!arr) return;
    var n=arr.length;
    var sorted=[].concat(arr).sort(function(a,b){ return new Date(b.updatedAt)-new Date(a.updatedAt); });
    var cur = __portfolioSelectedId ? sorted.find(function(x){return x.id===__portfolioSelectedId;}) : null;
    if(!cur) cur = sorted[0] || null;
    if(cur) __portfolioSelectedId = cur.id;
    var last=gid('yw-portfolio-last'); if(last){
      if(!n) last.textContent='— пока пусто';
      else { last.textContent=(cur.title||'Без названия')+' · r'+cur.revision; last.title=cur.title||''; }
    }
    var tagsBox=gid('yw-portfolio-tags'); if(tagsBox){
      tagsBox.replaceChildren();
      if(cur){
        var tags=(cur.tags||[]).slice(0,4);
        if(!tags.length) tags=['студия'];
        tags.forEach(function(t){
          var chip=document.createElement('span'); chip.textContent=t; chip.style.cssText='font-size:11px;border:1px solid rgba(255,255,255,.10);border-radius:999px;padding:2px 8px;color:#b8b9c8;background:rgba(255,255,255,.04)'; tagsBox.append(chip);
        });
        var more=document.createElement('span'); more.className='m'; more.style.fontSize='11px'; more.textContent=' · '+n+' проектов'; tagsBox.append(more);
      }
    }
    var pct=Math.min(100, Math.round((n/6)*100));
    var pa=gid('yw-portfolio-auto');
    if(pa){
      pa.textContent='Автономия '+n+'/6 · '+pct+'%';
      pa.title='Автономность = заполненность конвейера ('+n+' из 6)';
      var autoLabel=gid('yw-portfolio-auto'); // same element has tooltip
      if(autoLabel) autoLabel.title='Автономность = заполненность конвейера';
    }
    var pipe=gid('yw-portfolio-pipe'); if(pipe){
      var cols=['#7d9cff','#a58cf5','#d777d0','#f58a9e']; pipe.replaceChildren();
      for(var i=0;i<4;i++){
        var el=document.createElement('i');
        var baseOp = n ? (0.42 + Math.min(0.5, n/6*0.55)) : 0.18;
        // opacity fades slightly across steps to show progression, base depends on fill
        var op = baseOp - i*0.06 + (i<Math.ceil(n/2)?0.10:0);
        op=Math.max(0.14, Math.min(1, op));
        el.style.cssText='flex:1;border-radius:6px;background:'+cols[i]+';opacity:'+op;
        pipe.append(el);
      }
      pipe.title='Автономность = заполненность конвейера';
    }
  }
  function ensurePortfolioSwitch(arr){
    var sel=gid('yw-portfolio-switch');
    var qsel=gid('yw-queue-switch');
    var sorted=[].concat(arr).sort(function(a,b){ return new Date(b.updatedAt)-new Date(a.updatedAt); });
    [sel,qsel].forEach(function(s){
      if(!s) return;
      // rebuild options but keep selection
      var curVal=s.value;
      s.replaceChildren();
      var opt0=document.createElement('option'); opt0.value=''; opt0.textContent='Ближайший — '+(sorted[0]? (sorted[0].title||'Без названия')+' · r'+sorted[0].revision : '—');
      s.append(opt0);
      sorted.forEach(function(p){
        var o=document.createElement('option'); o.value=p.id; o.textContent=(p.title||'Без названия')+' · r'+p.revision;
        s.append(o);
      });
      if(curVal && sorted.some(function(x){return x.id===curVal;})) s.value=curVal;
      else if(__portfolioSelectedId && sorted.some(function(x){return x.id===__portfolioSelectedId;})) s.value=__portfolioSelectedId;
      else s.value='';
    });
    function onSelChange(e){
      var v=e.target.value||'';
      __portfolioSelectedId = v ? v : (sorted[0]? sorted[0].id : null);
      // sync other select
      [sel,qsel].forEach(function(s){ if(s && s!==e.target) s.value=v; });
      renderPortfolioSelection(arr);
      renderConveyor(arr);
      // highlight queue
      setQueue();
    }
    [sel,qsel].forEach(function(s){
      if(!s || s._w4bound) return;
      s.addEventListener('change', onSelChange);
      s._w4bound=true;
    });
  }
  function renderPortfolioEconomy(){
    fetch('/api/offline/projects').then(function(r){ return r.json(); }).then(function(arr){
      var n=arr.length;
      var c=gid('yw-portfolio-count'); if(c) c.textContent = n ? String(n) : '0';
      if(!n) __portfolioSelectedId=null;
      else if(!__portfolioSelectedId && arr[0]) {
        var sorted=[].concat(arr).sort(function(a,b){ return new Date(b.updatedAt)-new Date(a.updatedAt); });
        __portfolioSelectedId=sorted[0].id;
      }
      ensurePortfolioSwitch(arr);
      renderPortfolioSelection(arr);
      renderConveyor(arr);
    }).catch(function(){});
    // Economy: retention % + spark from real buckets + correct limits + storage with Локально/Облако
    Promise.all([
      fetch('/api/offline/projects').then(function(r){return r.json();}).catch(function(){return [];}),
      fetch('/api/storage').then(function(r){return r.json();}).catch(function(){return {};}),
      fetch('/api/health').then(function(r){return r.json();}).catch(function(){return {};}),
      fetch('/api/billing/limits').then(function(r){return r.json();}).catch(function(){return {};})
    ]).then(function(res){
      var arr=res[0]||[], stor=res[1]||{}, health=res[2]||{}, lim=res[3]||{};
      var pct= retentionPctFromProjects ? retentionPctFromProjects(arr) : 0;
      if(!arr.length) pct=0;
      var el=gid('yw-economy-eff'); if(el){ el.textContent=(arr.length? pct+'%':'—'); el.title='Доля проектов, обновлённых за последние 6 недель'; }
      var ae=gid('yw-eff-pct'); if(ae){ ae.textContent=(arr.length? '+'+pct+'%':'—'); ae.title='Доля проектов, обновлённых за последние 6 недель · линия связана с данными ниже'; }
      // sparklines from weekly buckets
      if(typeof weeklyBuckets==='function' && typeof buildSparkFromBuckets==='function'){
        var buckets=weeklyBuckets(arr);
        var pts=buildSparkFromBuckets(buckets);
        var d='M'+pts.slice(0,6).map(function(p){return p.join(' ');}).join(' L');
        var le=gid('yw-economy-line'), ar=gid('yw-economy-area');
        if(le) le.setAttribute('d', d);
        if(ar) ar.setAttribute('d', d+' L300 62 L30 62 Z');
        // tint economy line by retention
        if(le){ var col= pct>=60 ? '#7d9cff' : pct>=30 ? '#a58cf5' : '#f58a9e'; le.setAttribute('stroke', '#f4e6da'); le.style.filter='drop-shadow(0 0 5px '+col+'55)'; }
      }
      // storage label Локально/Облако
      var st=gid('yw-economy-storage');
      if(st){
        var mib=stor.totalAssetMiB||'0.00';
        var isCloud= !!(health.s3Configured || stor.s3Configured);
        var prefix= isCloud ? 'Облако ' : 'Локально ';
        st.textContent= prefix + mib + ' MiB';
        st.title=(isCloud?'Облако (S3 настроен)':'Локальное хранилище (.Ywoom-offline/assets)')+' · '+mib+' MiB';
      }
      // limits: Тариф
      var b=gid('yw-economy-balance'), limEl=gid('yw-economy-limit');
      var plan=lim.plan||'free';
      var unl=!!lim.unlimited;
      var balText= unl ? 'Pro · ∞' : (plan==='free' ? 'Free' : plan);
      var limText= unl ? 'Pro · ∞' : (plan==='free' ? 'Free · лимит 3 проекта' : plan+' · ∞');
      var tip= unl ? 'Тариф: Pro — без лимита проектов' : 'Тариф: Free — до 3 проектов';
      if(b){ b.textContent=balText; b.title=tip; }
      if(limEl){ limEl.textContent=limText; limEl.title=tip; }
    }).catch(function(){});
    setTimeout(applyFieldVisibility, 0);
  }
  function renderCustomWidgets(){
    var slot=gid('yw-custom-slot'); if(!slot) return;
    // clear previous customs
    slot.querySelectorAll('[data-custom]').forEach(function(n){ n.remove(); });
    var lay=dashLoad().layout.filter(function(x){ return x.type==='custom'; });
    lay.forEach(function(it){
      var sec=document.createElement('section');
      sec.className='card yw-widget'; sec.dataset.widget=it.id; sec.dataset.widgetId=it.id; sec.dataset.widgetKind=it.kind||'grid'; sec.setAttribute('draggable','true');
      sec.style.cssText='--w:'+(it.w||1)+';--h:'+(it.h||1)+';border-radius:22px;padding:14px 16px;display:flex;flex-direction:column;gap:8px';
      sec.setAttribute('data-custom','1');
      var title=(it.config&&it.config.title)||it.id;
      var metric=(it.source&&it.source.metric)||it.config&&it.config.metric||'—';
      var head=document.createElement('div'); head.className='yw-widget-head'; head.style.cssText='display:flex;align-items:center;gap:8px;margin:-4px 0 4px';
      head.innerHTML='<span class="widget-handle" aria-hidden="true" title="Перетащить">⠿</span><span class="t" style="font-size:11px;flex:1">'+escapeHtml(title)+'</span><button class="yw-widget-remove btn hol" data-remove="'+escapeHtml(it.id)+'" aria-label="Удалить" style="padding:4px 8px;border-radius:10px;font-size:11px;flex:none">✕</button>';
      sec.append(head);
      var body=document.createElement('div'); body.style.cssText='display:flex;flex-direction:column;gap:6px';
      body.innerHTML='<div class="m" style="font-size:11px">'+escapeHtml(metric)+'</div><div class="hol" style="border-radius:14px;padding:10px 12px;font-size:12px;line-height:1.4">Источник: '+(it.source? escapeHtml(it.source.factoryId||'')+' · '+escapeHtml(it.source.projectId||'') : '—')+' · кастомный виджет из Архитектора. Данные: /api/offline/projects | /storage | /billing (мок, localStorage).</div><div class="m" style="font-size:11px">id '+escapeHtml(it.id)+' · drag по ручке — перетащи в другую колонку.</div>';
      sec.append(body);
      slot.append(sec);
    });
    // also handle hidden widgets: those in layout but not in DOM (removed) — add ghost placeholder with restore hint? Not needed.
  }
  function escapeHtml(s){ return String(s).replace(/[&<>"]/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]); }); }
  function dashApplyHidden(){
    var ids=new Set(dashLoad().layout.map(function(x){return x.id;}));
    // hide widgets not in layout (user removed). Fixed always present.
    document.querySelectorAll('.yw-widget[data-widget-id]').forEach(function(el){
      var id=el.getAttribute('data-widget-id');
      if(!ids.has(id) && el.dataset.locked!=='true'){
        el.style.display='none';
        el.setAttribute('aria-hidden','true');
      } else {
        el.style.display='';
        el.removeAttribute('aria-hidden');
      }
    });
  }
  function dashReorderFromDOM(){
    // rebuild layout order from DOM sequence left->right interleaved by visual columns, preserving fixed positions
    var left=gid('yw-col-left'), right=gid('yw-col-right'), slot=gid('yw-custom-slot');
    var cur=dashLoad();
    var map=new Map(cur.layout.map(function(x){ return [x.id, x]; }));
    var seq=[];
    function collect(col){
      if(!col) return;
      col.querySelectorAll(':scope > .yw-widget[data-widget-id]').forEach(function(el){
        var id=el.getAttribute('data-widget-id'); if(map.has(id)) seq.push(map.get(id));
      });
    }
    collect(left); collect(right);
    // customs in slot
    if(slot) slot.querySelectorAll('[data-custom][data-widget-id]').forEach(function(el){
      var id=el.getAttribute('data-widget-id'); if(map.has(id)) seq.push(map.get(id));
    });
    // preserve any layout ids not in DOM (hidden)
    cur.layout.forEach(function(it){ if(!seq.find(function(s){return s.id===it.id;})) seq.push(it); });
    dashSave(seq);
  }
  // helpers for pair + bottom row
  function dissolvePairIfNeeded(dragging){
    var pair=dragging.closest('[data-pair="auto"]');
    if(!pair) return;
    if(pair.childElementCount===2){
      var other= pair.querySelector('.yw-widget:not([data-widget-id="'+dragging.getAttribute('data-widget-id')+'"])');
      var parent=pair.parentElement;
      if(other){
        parent.insertBefore(dragging, pair);
        parent.insertBefore(other, pair);
        other.style.flex=''; other.style.transition='';
      } else {
        parent.insertBefore(dragging, pair.nextSibling);
      }
      pair.remove();
    } else if(pair.childElementCount<=1){
      var p=pair.parentElement, nx=pair.nextSibling;
      while(pair.firstChild) p.insertBefore(pair.firstChild, nx);
      pair.remove();
    }
  }
  function tryRewrapPair(dropCol){
    var au=gid('yw-card-autonomy'), ap=document.querySelector('[data-widget-id="autopilot"]');
    if(!au||!ap) return;
    if(au.closest('[data-pair="auto"]') || ap.closest('[data-pair="auto"]')) return;
    if(au.parentElement!==dropCol || ap.parentElement!==dropCol) return;
    var ra=au.getBoundingClientRect(), rb=ap.getBoundingClientRect();
    // must be roughly same vertical band to be a pair row
    if(Math.abs(ra.top - rb.top) > Math.max(ra.height, rb.height)*1.15) return;
    // allow rewrap even if one other widget between them? prefer adjacent, but also allow if within 2
    var widgets=[].slice.call(dropCol.querySelectorAll(':scope > .yw-widget[data-widget-id], :scope > [data-pair="auto"]'));
    var ia=widgets.indexOf(au), ib=widgets.indexOf(ap);
    if(ia===-1||ib===-1) return;
    var dist=Math.abs(ia-ib);
    if(dist>2) return;
    // choose adjacency: bring them together
    if(dist===2){
      // move ap next to au
      if(ia<ib) dropCol.insertBefore(ap, widgets[ia].nextSibling || null);
      else dropCol.insertBefore(ap, au);
      // re-evaluate indices
      widgets=[].slice.call(dropCol.querySelectorAll(':scope > .yw-widget[data-widget-id], :scope > [data-pair="auto"]'));
      ia=widgets.indexOf(au); ib=widgets.indexOf(ap);
    }
    if(Math.abs(ia-ib)!==1) return;
    var first= ia<ib ? au : ap, second= ia<ib ? ap : au;
    var w=document.createElement('div'); w.setAttribute('data-pair','auto'); w.style.cssText='display:grid;grid-template-columns:1fr 1fr;gap:12px';
    dropCol.insertBefore(w, first); w.append(first); w.append(second);
  }
  function countColWidgets(col){
    if(!col) return 0;
    var n=0;
    col.querySelectorAll(':scope > .yw-widget[data-widget-id]').forEach(function(){n++;});
    col.querySelectorAll(':scope > [data-pair="auto"] .yw-widget').forEach(function(){n++;});
    return n;
  }
  function updateBottomRowAvailability(){
    var left=gid('yw-col-left'), right=gid('yw-col-right'), bottom=gid('yw-row-bottom');
    if(!bottom) return;
    var lc=countColWidgets(left), rc=countColWidgets(right);
    var enabled = lc>=5 && rc>=5;
    if(enabled){
      bottom.hidden=false;
      bottom.style.display='grid';
      bottom.style.pointerEvents='auto';
      bottom.removeAttribute('data-disabled'); bottom.classList.remove('is-disabled');
      bottom.querySelectorAll('.yw-widget').forEach(function(w){ w.style.pointerEvents='auto'; });
    } else {
      var hasChildren = bottom.querySelector('.yw-widget')!=null;
      if(hasChildren){
        bottom.hidden=false;
        bottom.style.display='grid';
        bottom.style.pointerEvents='auto';
        bottom.removeAttribute('data-disabled'); bottom.classList.remove('is-disabled');
        bottom.querySelectorAll('.yw-widget').forEach(function(w){ w.style.pointerEvents='auto'; });
        // keep interactive even when condition not met but has children — not inactive
      } else { bottom.hidden=true; bottom.removeAttribute('data-disabled'); bottom.classList.remove('is-disabled'); }
    }
  }
  function dashReorderFromDOMWithPair(){
    var left=gid('yw-col-left'), right=gid('yw-col-right'), bottom=gid('yw-row-bottom'), slot=gid('yw-custom-slot');
    var cur=dashLoad();
    var map=new Map(cur.layout.map(function(x){ return [x.id, x]; }));
    var seq=[];
    function collectWithPair(col){
      if(!col) return;
      [].slice.call(col.children).forEach(function(child){
        if(child.matches && child.matches('.yw-widget[data-widget-id]')){
          var id=child.getAttribute('data-widget-id'); if(map.has(id)) seq.push(map.get(id));
        } else if(child.matches && child.matches('[data-pair="auto"]')){
          child.querySelectorAll('.yw-widget[data-widget-id]').forEach(function(el){
            var id2=el.getAttribute('data-widget-id'); if(map.has(id2)) seq.push(map.get(id2));
          });
        }
      });
    }
    collectWithPair(left); collectWithPair(right);
    if(bottom){
      bottom.querySelectorAll('.yw-widget[data-widget-id]').forEach(function(el){
        var id=el.getAttribute('data-widget-id'); if(map.has(id)) seq.push(map.get(id));
      });
    }
    if(slot) slot.querySelectorAll('[data-custom][data-widget-id]').forEach(function(el){
      var id=el.getAttribute('data-widget-id'); if(map.has(id)) seq.push(map.get(id));
    });
    var toSave=seq.filter(function(s){ return s.id!=='__pair_auto'; });
    cur.layout.forEach(function(it){ if(!toSave.find(function(s){return s.id===it.id;})) toSave.push(it); });
    dashSave(toSave);
    try{
      if(document.querySelector('[data-pair="auto"]')) localStorage.setItem('ywoom_pair_auto','1');
      else localStorage.removeItem('ywoom_pair_auto');
    }catch(e){}
  }
  function initDashboardDrag(){
    var grid=gid('yw-arch-grid'); if(!grid) return;
    var dragging=null, ghost=null, offsetX=0, offsetY=0, origCol=null, origNext=null, origPair=null;
    function onHandleDown(e){
      var head=e.target.closest('.widget-handle'); if(!head) return;
      var card=head.closest('.yw-widget'); if(!card || card.dataset.locked==='true') return;
      e.preventDefault();
      dragging=card;
      origCol=card.parentElement;
      origPair = card.closest('[data-pair="auto"]');
      origNext= origPair ? origPair.nextSibling : card.nextSibling;
      if(origPair) dissolvePairIfNeeded(card);
      var r=card.getBoundingClientRect();
      offsetX=e.clientX - r.left;
      offsetY=e.clientY - r.top;
      ghost=card.cloneNode(true); ghost.classList.add('yw-widget-ghost');
      ghost.style.width=r.width+'px'; ghost.style.height=r.height+'px';
      ghost.style.left='0'; ghost.style.top='0';
      ghost.style.transform='translate3d('+(e.clientX - offsetX)+'px,'+(e.clientY - offsetY)+'px,0) rotate(.4deg)';
      ghost.style.pointerEvents='none'; document.body.append(ghost);
      card.style.opacity='.28'; card.style.transition='transform .16s ease, opacity .16s ease';
      grid.classList.add('is-dragging');
      grid.querySelectorAll('.yw-widget').forEach(function(w){ if(w!==card) w.style.transition='transform .18s ease, opacity .18s ease'; });
      updateBottomRowAvailability();
      document.addEventListener('pointermove', onMove); document.addEventListener('pointerup', onUp);
      if(e.target.setPointerCapture) try{ e.target.setPointerCapture(e.pointerId); }catch(_){}
    }
    function findInsertionIndex(col, y){
      var items=[];
      [].slice.call(col.children).forEach(function(child){
        if(child===dragging) return;
        if(child.matches('.yw-widget[data-widget-id]')) items.push(child);
        else if(child.matches('[data-pair="auto"]')) items.push(child);
      });
      if(!items.length) return null;
      for(var i=0;i<items.length;i++){
        var rr=items[i].getBoundingClientRect();
        var mid=rr.top + rr.height/2;
        if(y < mid) return items[i];
      }
      return null;
    }
    var _dropMarker=null;
    function _ensureDropMarker(){
      if(_dropMarker) return _dropMarker;
      var m=document.createElement('div'); m.className='yw-drop-marker';
      m.style.cssText='height:3px;border-radius:999px;background:linear-gradient(90deg,#7d9cff,#a58cf5);box-shadow:0 0 8px rgba(125,156,255,.55);margin:4px 0 6px;opacity:.95;pointer-events:none;transition:opacity .12s,transform .12s';
      _dropMarker=m; return m;
    }
    function _placeDropMarker(targetCol, beforeEl){
      var m=_ensureDropMarker();
      if(!m.parentElement || m.parentElement!==targetCol) {
        // remove from old parent
        if(m.parentElement) m.parentElement.removeChild(m);
      }
      if(beforeEl) targetCol.insertBefore(m, beforeEl);
      else targetCol.appendChild(m);
      // keep marker right before dragging element is not needed — marker is visual only; remove before saving layout
    }
    function _removeDropMarker(){ if(_dropMarker && _dropMarker.parentElement) _dropMarker.parentElement.removeChild(_dropMarker); }
    function onMove(e){
      if(!dragging||!ghost) return;
      ghost.style.transform='translate3d('+(e.clientX - offsetX)+'px,'+(e.clientY - offsetY)+'px,0) rotate(.4deg)';
      // subtle feedback on grid alignment, not left-based
      var _snap = (Math.abs(e.clientX%8)<1.2 || Math.abs(e.clientY%8)<1.2);
      ghost.style.outline = _snap ? '1px dashed rgba(125,156,255,.35)' : '';
      var left=gid('yw-col-left'), right=gid('yw-col-right'), center=gid('yw-arch-center'), bottom=gid('yw-row-bottom');
      var targetCol=null, isBottom=false;
      var el=document.elementFromPoint(e.clientX, e.clientY);
      if(el){
        if(el.closest && el.closest('#yw-row-bottom')){ targetCol=bottom; isBottom=true; }
        else if(el.closest && el.closest('#yw-col-left')) targetCol=left;
        else if(el.closest && el.closest('#yw-col-right')) targetCol=right;
        if(!targetCol && center && bottom && !bottom.hidden){
          var gr=grid.getBoundingClientRect(), cr=center.getBoundingClientRect(), br=bottom.getBoundingClientRect();
          if(e.clientY > br.top - 16) { targetCol=bottom; isBottom=true; }
          else { targetCol = e.clientX < cr.left ? left : (e.clientX > cr.right ? right : (e.clientX < gr.left + gr.width/2 ? left : right)); }
        } else if(!targetCol && center){
          var gr2=grid.getBoundingClientRect(), cr2=center.getBoundingClientRect();
          targetCol = e.clientX < cr2.left ? left : (e.clientX > cr2.right ? right : (e.clientX < gr2.left + gr2.width/2 ? left : right));
        }
      } else {
        var gr3=grid.getBoundingClientRect(), cr3=center?center.getBoundingClientRect():null;
        if(bottom && !bottom.hidden && e.clientY > bottom.getBoundingClientRect().top - 20) { targetCol=bottom; isBottom=true; }
        else if(cr3) targetCol = e.clientX < cr3.left ? left : (e.clientX > cr3.right ? right : (e.clientX < gr3.left + gr3.width/2 ? left : right));
        else targetCol = e.clientX < gr3.left + gr3.width/2 ? left : right;
      }
      if(!targetCol) return;
      // bottom-row: only allow if enabled OR already has children (existing bottom row stays). Otherwise reroute to side column.
      var _wasBottomDisabled = isBottom && targetCol.getAttribute('data-disabled')==='1' && !targetCol.querySelector('.yw-widget');
      if(_wasBottomDisabled){
        _removeDropMarker();
        isBottom=false; targetCol = e.clientX < grid.getBoundingClientRect().left + grid.getBoundingClientRect().width/2 ? left : right;
      }
      // keep marker visible and neighbours nudged live
      // clear previous neighbour nudge
      grid.querySelectorAll('.yw-widget').forEach(function(w){ if(w!==dragging) w.style.transform=''; });
      if(isBottom){
        var before=findInsertionIndex(targetCol, e.clientY);
        // marker before insertion point
        _placeDropMarker(targetCol, before);
        if(before){ before.style.transform='translateY(4px)'; }
        // also nudge next sibling if any
        dragging.style.flex='1 1 280px';
        // actually insert dragging at marker position (marker is visual, dragging follows)
        if(before) targetCol.insertBefore(dragging, before);
        else {
          // marker is last; dragging goes before marker to keep visual order
          if(_dropMarker && _dropMarker.parentElement===targetCol) targetCol.insertBefore(dragging, _dropMarker);
          else targetCol.appendChild(dragging);
        }
        targetCol.classList.add('yw-widget-drop');
        setTimeout(function(c){ c.classList.remove('yw-widget-drop'); }, 180, targetCol);
      } else {
        // if marker was in bottom, remove it when moving to side
        if(_dropMarker && _dropMarker.parentElement && _dropMarker.parentElement!==targetCol) _removeDropMarker();
        dragging.style.flex='';
        var before2=findInsertionIndex(targetCol, e.clientY);
        _placeDropMarker(targetCol, before2||null);
        if(before2) before2.style.transform='translateY(4px)';
        if(before2) targetCol.insertBefore(dragging, before2);
        else {
          if(_dropMarker && _dropMarker.parentElement===targetCol) targetCol.insertBefore(dragging, _dropMarker);
          else targetCol.appendChild(dragging);
        }
        targetCol.classList.add('yw-widget-drop'); setTimeout(function(c){ c.classList.remove('yw-widget-drop'); }, 180, targetCol);
        var did=dragging.getAttribute('data-widget-id');
        if(did==='autonomy' || did==='autopilot') tryRewrapPair(targetCol);
      }
      // live bottom availability
      updateBottomRowAvailability();
    }
    function onUp(e){
      document.removeEventListener('pointermove', onMove); document.removeEventListener('pointerup', onUp);
      _removeDropMarker();
      if(ghost) ghost.remove(); ghost=null;
      if(dragging){ dragging.style.opacity=''; dragging.style.transform=''; dragging.style.flex=''; }
      grid.classList.remove('is-dragging');
      grid.querySelectorAll('.yw-widget').forEach(function(w){ w.style.transform=''; w.style.transition=''; });
      if(dragging){
        var left=gid('yw-col-left'), right=gid('yw-col-right'), bottom=gid('yw-row-bottom');
        var inLeft=dragging.parentElement===left, inRight=dragging.parentElement===right, inBottom=bottom && dragging.parentElement===bottom;
        if(!inLeft && !inRight && !inBottom){
          if(origPair){
            if(origCol) origCol.insertBefore(dragging, origNext);
            if(origCol) tryRewrapPair(origCol);
          } else if(origCol) origCol.insertBefore(dragging, origNext);
        }
        if(inBottom) dragging.style.flex='1 1 280px';
        dashReorderFromDOMWithPair();
        updateBottomRowAvailability();
        try{ if(window.initArchitectConnections) window.initArchitectConnections(); }catch(_){}
      }
      dragging=null; origCol=null; origNext=null; origPair=null;
    }
    grid.addEventListener('pointerdown', onHandleDown);
    // remove buttons
    grid.addEventListener('click', function(e){
      var btn=e.target.closest('[data-remove]'); if(!btn) return;
      var id=btn.getAttribute('data-remove');
      if(!id) return;
      var card=document.querySelector('.yw-widget[data-widget-id="'+id+'"]');
      if(card && card.dataset.locked==='true') return;
      var cur=dashLoad();
      var removed=cur.layout.find(function(x){ return x.id===id; });
      if(removed) trashPush(removed);
      cur.layout=cur.layout.filter(function(x){ return x.id!==id; });
      dashSave(cur.layout);
      if(card){ card.style.display='none'; card.setAttribute('aria-hidden','true'); }
      // also remove custom element if any
      var custom=document.querySelector('[data-custom][data-widget-id="'+id+'"]'); if(custom) custom.remove();
      dashReorderFromDOM();
      trashRenderPanel();
      try{ if(window.initArchitectConnections) window.initArchitectConnections(); }catch(_){}
    });
    // edit pencils for fixed — freeform modal (W8)
    grid.addEventListener('click', function(e){
      var btn=e.target.closest('[data-edit]'); if(!btn) return;
      var id=btn.getAttribute('data-edit');
      openEditModal(id);
    });
  }
  // ——— W8 freeform modals ———
  var _editId=null;
  function openEditModal(id){
    _editId=id;
    var cur=dashLoad(); var it=cur.layout.find(function(x){ return x.id===id; }); if(!it) return;
    var modal=gid('yw-edit-modal'); if(!modal) return;
    var promptEl=gid('yw-edit-prompt'), cssEl=gid('yw-edit-css'), chips=gid('yw-edit-chips');
    if(promptEl) promptEl.value=(it.config && it.config.prompt)||'';
    if(cssEl) cssEl.value=(it.config && it.config.customCSS)||'';
    if(chips){
      chips.replaceChildren();
      var isPortfolio=id==='portfolio';
      var isEconomy=id==='economy';
      var avail=isPortfolio ? ['count','last','tags','pipe','auto'] : isEconomy ? ['spark','balance','limit','storage','eff'] : ['count','last','tags','pipe','auto','spark','balance','limit','storage'];
      var curFields=new Set((it.config&&it.config.fields)||avail);
      avail.forEach(function(f){
        var b=document.createElement('button'); b.type='button'; b.textContent=f;
        b.className='btn'; b.style.cssText='height:28px;padding:0 10px;border-radius:999px;font-size:11px;flex:none;border:1px solid rgba(255,255,255,.14);background:'+(curFields.has(f)?'#7d9cff':'#35373f')+';color:'+(curFields.has(f)?'#1b2038':'#ecebf4');
        b.setAttribute('aria-pressed', curFields.has(f)?'true':'false');
        (function(field, btn){ btn.addEventListener('click', function(){ if(curFields.has(field)) curFields.delete(field); else curFields.add(field); btn.style.background=curFields.has(field)?'#7d9cff':'#35373f'; btn.style.color=curFields.has(field)?'#1b2038':'#ecebf4'; btn.setAttribute('aria-pressed', curFields.has(field)?'true':'false'); btn.dataset.on=curFields.has(field)?'1':'0'; }); })(f,b);
        b.dataset.field=f; b.dataset.on=curFields.has(f)?'1':'0';
        chips.append(b);
      });
    }
    modal.hidden=false; modal.style.display='flex';
    if(promptEl) promptEl.focus();
    document.addEventListener('keydown', onEditKey);
  }
  function closeEditModal(){ var m=gid('yw-edit-modal'); if(m){ m.hidden=true; m.style.display=''; } document.removeEventListener('keydown', onEditKey); _editId=null; }
  function onEditKey(e){ if(e.key==='Escape') closeEditModal(); }
  function applyEditModal(){
    if(!_editId) return;
    var cur=dashLoad(); var it=cur.layout.find(function(x){ return x.id===_editId; }); if(!it) return;
    var promptEl=gid('yw-edit-prompt'), cssEl=gid('yw-edit-css'), chips=gid('yw-edit-chips');
    var prompt=(promptEl&&promptEl.value.trim())||'';
    var css=(cssEl&&cssEl.value.trim())||'';
    var fields=[];
    if(chips){ chips.querySelectorAll('[data-field]').forEach(function(b){ if(b.dataset.on==='1') fields.push(b.getAttribute('data-field')); }); }
    if(!it.config) it.config={};
    it.config.prompt=prompt;
    it.config.customCSS=css;
    if(fields.length) it.config.fields=fields; else if(chips) it.config.fields=fields;
    dashSave(cur.layout);
    renderPortfolioEconomy(); applyFieldVisibility();
    try{ if(window.initArchitectConnections) window.initArchitectConnections(); }catch(_){}
    fetch('/api/architect', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({kind:'widget_edit', id:_editId, prompt:prompt, fields:fields, customCSS:css})}).catch(function(){});
    closeEditModal();
  }
  function openNewWidgetModal(){ var m=gid('yw-new-widget-modal'); if(!m) return; m.hidden=false; m.style.display='flex'; var inp=gid('yw-new-name'); if(inp) inp.focus(); document.addEventListener('keydown', onNewKey); }
  function closeNewWidgetModal(){ var m=gid('yw-new-widget-modal'); if(m){ m.hidden=true; m.style.display=''; } document.removeEventListener('keydown', onNewKey); }
  function onNewKey(e){ if(e.key==='Escape') closeNewWidgetModal(); }
  function createCustomWidget(){
    var titleEl=gid('yw-new-name'), kindEl=gid('yw-new-kind'), descEl=gid('yw-new-desc');
    var title=(titleEl&&titleEl.value.trim())||'';
    var kind=(kindEl&&kindEl.value)||'grid';
    var desc=(descEl&&descEl.value.trim())||'';
    if(!title){ if(titleEl) titleEl.focus(); return; }
    var cur=dashLoad();
    var id='custom_'+Date.now();
    cur.layout.push({id:id, type:'custom', kind:kind, w:1,h:1, config:{title:title, metric:desc, prompt:desc, fields:[]}, source:{factoryId:'manual', projectId:''}, customCSS:''});
    dashSave(cur.layout);
    renderCustomWidgets(); dashApplyHidden();
    try{ if(window.initArchitectConnections) window.initArchitectConnections(); }catch(_){}
    fetch('/api/architect', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({kind:'widget_create', id:id, title:title, widgetKind:kind, prompt:desc})}).catch(function(){});
    closeNewWidgetModal();
    if(titleEl) titleEl.value=''; if(descEl) descEl.value='';
  }
  function initW8UI(){
    var trashTog=gid('yw-trash-toggle'), trashPanel=gid('yw-trash-panel');
    if(trashTog && trashPanel){
      trashRenderPanel();
      trashTog.addEventListener('click', function(e){
        e.stopPropagation();
        var open=trashPanel.hidden;
        trashPanel.hidden=!open; trashPanel.style.display=open?'block':'';
        trashTog.setAttribute('aria-expanded', open?'true':'false');
        if(open) trashRenderPanel();
      });
      document.addEventListener('click', function(e){
        if(trashPanel.hidden) return;
        if(e.target.closest('#yw-trash-panel')||e.target.closest('#yw-trash-toggle')) return;
        trashPanel.hidden=true; trashPanel.style.display=''; trashTog.setAttribute('aria-expanded','false');
      });
      document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !trashPanel.hidden){ trashPanel.hidden=true; trashPanel.style.display=''; trashTog.setAttribute('aria-expanded','false'); }});
    }
    var editModal=gid('yw-edit-modal');
    if(editModal){
      var bd=gid('yw-edit-backdrop'), cl=gid('yw-edit-close'), ca=gid('yw-edit-cancel'), ap=gid('yw-edit-apply');
      if(bd) bd.addEventListener('click', closeEditModal);
      if(cl) cl.addEventListener('click', closeEditModal);
      if(ca) ca.addEventListener('click', closeEditModal);
      if(ap) ap.addEventListener('click', applyEditModal);
    }
    var newModal=gid('yw-new-widget-modal');
    var newBtn=gid('yw-new-widget');
    if(newModal){
      var nbd=gid('yw-new-backdrop'), ncl=gid('yw-new-close'), nca=gid('yw-new-cancel'), ncr=gid('yw-new-create');
      if(nbd) nbd.addEventListener('click', closeNewWidgetModal);
      if(ncl) ncl.addEventListener('click', closeNewWidgetModal);
      if(nca) nca.addEventListener('click', closeNewWidgetModal);
      if(ncr) ncr.addEventListener('click', createCustomWidget);
    }
    if(newBtn) newBtn.addEventListener('click', openNewWidgetModal);
    // mobile compact toolbar inside portfolio header: mirror actions
    var newBtnM=gid('yw-new-widget-m'), trashTogM=gid('yw-trash-toggle-m'), tipTog=gid('yw-tip-toggle'), tipPanel=gid('yw-tip-panel');
    if(newBtnM) newBtnM.addEventListener('click', openNewWidgetModal);
    if(trashTogM && trashPanel){
      // share same panel, but open anchored to mobile button
      trashTogM.addEventListener('click', function(e){
        e.stopPropagation();
        var open=trashPanel.hidden;
        trashPanel.hidden=!open; trashPanel.style.display=open?'block':'';
        var ae=open?'true':'false';
        trashTogM.setAttribute('aria-expanded', ae);
        if(trashTog) trashTog.setAttribute('aria-expanded', ae);
        if(open) trashRenderPanel();
        // also sync desktop toggle aria
      });
      // keep counts in sync: patch trashRenderPanel already updates yw-trash-count, add m
      (function(){
        var _origTrashRender=trashRenderPanel;
        // already defined; wrap to sync m count
        var wrap=function(){
          _origTrashRender();
          var mainCnt=gid('yw-trash-count'), mCnt=gid('yw-trash-count-m');
          if(mainCnt && mCnt) mCnt.textContent=mainCnt.textContent;
        };
        // replace reference for future calls: monkey-patch by reassigning inner var via closure trick
        // simpler: just add observer on panel hidden sync and count polling on open
        document.addEventListener('click', function(e){
          if(e.target.closest('#yw-trash-panel')||e.target.closest('#yw-trash-toggle')||e.target.closest('#yw-trash-toggle-m')) return;
          if(!trashPanel.hidden){ trashPanel.hidden=true; trashPanel.style.display=''; trashTogM.setAttribute('aria-expanded','false'); if(trashTog) trashTog.setAttribute('aria-expanded','false'); }
        });
      })();
    }
    if(tipTog && tipPanel){
      // clamp panel inside viewport so it never goes off-screen right
      function clampTipPanel(panel){
        if(!panel || panel.hidden) return;
        panel.style.right=''; panel.style.left='';
        // default is right:0 via CSS; check overflow
        var r=panel.getBoundingClientRect();
        if(r.right > window.innerWidth - 8){
          panel.style.right='0';
          panel.style.left='auto';
        }
        if(r.left < 8){
          panel.style.left='8px';
          panel.style.right='auto';
        }
      }
      tipTog.addEventListener('click', function(e){
        e.stopPropagation();
        var open=tipPanel.hidden;
        tipPanel.hidden=!open; tipTog.setAttribute('aria-expanded', open?'true':'false');
        if(open) clampTipPanel(tipPanel);
      });
      // desktop tip as well
      var tipTogD=gid('yw-tip-toggle-desktop'), tipPanelD=gid('yw-tip-panel-desktop');
      if(tipTogD && tipPanelD){
        tipTogD.addEventListener('click', function(e){
          e.stopPropagation();
          var open=tipPanelD.hidden;
          tipPanelD.hidden=!open; tipTogD.setAttribute('aria-expanded', open?'true':'false');
          if(open) clampTipPanel(tipPanelD);
          // close mobile tip if open
          if(!tipPanel.hidden){ tipPanel.hidden=true; tipTog.setAttribute('aria-expanded','false'); }
        });
        document.addEventListener('click', function(e){
          if(tipPanelD.hidden) return;
          if(e.target.closest('#yw-tip-panel-desktop')||e.target.closest('#yw-tip-toggle-desktop')) return;
          tipPanelD.hidden=true; tipTogD.setAttribute('aria-expanded','false');
        });
      }
      document.addEventListener('click', function(e){
        if(tipPanel.hidden) return;
        if(e.target.closest('#yw-tip-panel')||e.target.closest('#yw-tip-toggle')) return;
        if(tipPanelD && !tipPanelD.hidden && (e.target.closest('#yw-tip-panel-desktop')||e.target.closest('#yw-tip-toggle-desktop'))) return;
        tipPanel.hidden=true; tipTog.setAttribute('aria-expanded','false');
      });
      window.addEventListener('resize', function(){ if(!tipPanel.hidden) clampTipPanel(tipPanel); if(tipPanelD && !tipPanelD.hidden) clampTipPanel(tipPanelD); });
      document.addEventListener('keydown', function(e){ if(e.key==='Escape' && !tipPanel.hidden){ tipPanel.hidden=true; tipTog.setAttribute('aria-expanded','false'); } if(tipPanelD && e.key==='Escape' && !tipPanelD.hidden){ tipPanelD.hidden=true; tipTogD.setAttribute('aria-expanded','false'); }});
    }
  }
  function initDashboard(){
    renderPortfolioEconomy();
    renderCustomWidgets();
    dashApplyHidden();
    applyFieldVisibility();
    trashRenderPanel();
    initDashboardDrag();
    initW8UI();
    try{ updateBottomRowAvailability(); }catch(e){}
    window.__dash={ load:dashLoad, save:dashSave, renderPortfolioEconomy:renderPortfolioEconomy, renderCustomWidgets:renderCustomWidgets, trash:{load:trashLoad, save:trashSave, push:trashPush, restore:trashRestore, render:trashRenderPanel}, applyFieldVisibility:applyFieldVisibility, updateBottomRow:updateBottomRowAvailability };
  }
  function initArchitectConnections(){
    var grid=document.getElementById('yw-arch-grid');
    var svg=document.getElementById('yw-arch-svg');
    var ring=document.getElementById('yw-arch-ring');
    if(!grid||!svg||!ring) return;
    var cards=[
      {id:'yw-card-conveyor', key:'conveyor', color:'#7d9cff', accent:'#b7c8ff'},
      {id:'yw-card-best',      key:'best',      color:'#a58cf5', accent:'#b9a6ff'},
      {id:'yw-card-queue',     key:'queue',     color:'#f58a9e', accent:'#f4a3b8'},
      {id:'yw-card-eff',       key:'eff',       color:'#7d9cff', accent:'#b7c8ff'}
    ];
    // mark cards
    cards.forEach(function(c){
      var el=document.getElementById(c.id);
      if(el) el.classList.add('yw-arch-card');
    });
    var NS='http://www.w3.org/2000/svg';
    var defs=null, groups={};
    var isMobile=function(){ return window.matchMedia('(max-width:900px)').matches; };
    var isNarrow=function(){ return window.matchMedia('(max-width:640px)').matches; };
    var beadGlowBlur=null;
    function applyBeadMetrics(){
      var narrow=isNarrow();
      var r = narrow ? '3.6' : '4.2';
      var blur = narrow ? '1.6' : '2.2';
      if(beadGlowBlur) beadGlowBlur.setAttribute('stdDeviation', blur);
      Object.keys(groups).forEach(function(k){
        var b=groups[k].bead;
        if(b) b.setAttribute('r', r);
      });
    }
    function ensureDefs(){
      if(defs && defs.parentNode===svg) return;
      svg.innerHTML='';
      defs=document.createElementNS(NS,'defs');
      svg.appendChild(defs);
      cards.forEach(function(c){
        var lg=document.createElementNS(NS,'linearGradient');
        lg.setAttribute('id','arch-g-'+c.key);
        lg.setAttribute('gradientUnits','userSpaceOnUse');
        var s1=document.createElementNS(NS,'stop');
        s1.setAttribute('offset','0%'); s1.setAttribute('stop-color', c.color); s1.setAttribute('stop-opacity','0.95');
        var s2=document.createElementNS(NS,'stop');
        s2.setAttribute('offset','100%'); s2.setAttribute('stop-color','#f4e6da'); s2.setAttribute('stop-opacity','0.34');
        lg.appendChild(s1); lg.appendChild(s2);
        defs.appendChild(lg);
      });
      // bead glow filter — blur tuned for mobile (1.6 vs 2.2)
      var f=document.createElementNS(NS,'filter');
      f.setAttribute('id','arch-bead-glow');
      f.setAttribute('x','-60%'); f.setAttribute('y','-60%'); f.setAttribute('width','220%'); f.setAttribute('height','220%');
      var fe1=document.createElementNS(NS,'feGaussianBlur');
      fe1.setAttribute('stdDeviation', isNarrow() ? '1.6' : '2.2'); fe1.setAttribute('result','blur');
      beadGlowBlur=fe1;
      var fe2=document.createElementNS(NS,'feMerge');
      var mn1=document.createElementNS(NS,'feMergeNode'); mn1.setAttribute('in','blur');
      var mn2=document.createElementNS(NS,'feMergeNode'); mn2.setAttribute('in','SourceGraphic');
      fe2.appendChild(mn1); fe2.appendChild(mn2);
      f.appendChild(fe1); f.appendChild(fe2);
      defs.appendChild(f);
      // style for dash animation
      if(!document.getElementById('arch-dash-style')){
        var st=document.createElement('style');
        st.id='arch-dash-style';
        st.textContent='@keyframes archFlow{to{stroke-dashoffset:-11}} .arch-line--dash{stroke-dasharray:3 8;animation:archFlow 1.7s linear infinite} .arch-line--dash.is-fast{animation-duration:.85s} @keyframes archBeadPulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.25);opacity:.9}}';
        document.head.appendChild(st);
      }
      cards.forEach(function(c){
        var g=document.createElementNS(NS,'g');
        g.setAttribute('class','arch-conn'); g.setAttribute('data-key',c.key);
        // glow
        var glow=document.createElementNS(NS,'path');
        glow.setAttribute('class','arch-line arch-line--glow');
        glow.setAttribute('fill','none'); glow.setAttribute('stroke',c.color); glow.setAttribute('stroke-width','7'); glow.setAttribute('opacity','0.18');
        g.appendChild(glow);
        // core
        var core=document.createElementNS(NS,'path');
        core.setAttribute('class','arch-line arch-line--core');
        core.setAttribute('fill','none'); core.setAttribute('stroke','url(#arch-g-'+c.key+')'); core.setAttribute('stroke-width','1.6'); core.setAttribute('opacity','1');
        g.appendChild(core);
        // dash
        var dash=document.createElementNS(NS,'path');
        dash.setAttribute('class','arch-line arch-line--dash');
        dash.setAttribute('fill','none'); dash.setAttribute('stroke','#f4e6da'); dash.setAttribute('stroke-width','1.25'); dash.setAttribute('stroke-linecap','round'); dash.setAttribute('opacity','0.92');
        g.appendChild(dash);
        // bead
        var bead=document.createElementNS(NS,'circle');
        bead.setAttribute('class','arch-bead');
        bead.setAttribute('r','4.2'); bead.setAttribute('fill',c.color); bead.setAttribute('stroke','rgba(255,255,255,.9)'); bead.setAttribute('stroke-width','1.1');
        bead.setAttribute('filter','url(#arch-bead-glow)');
        bead.style.transformBox='fill-box'; bead.style.transformOrigin='center';
        bead.style.animation='archBeadPulse 1.6s ease-in-out infinite';
        g.appendChild(bead);
        svg.appendChild(g);
        groups[c.key]= {g:g, glow:glow, core:core, dash:dash, bead:bead};
      });
    }
    function clamp(v,a,b){ return Math.max(a, Math.min(b,v)); }
    function anchorAtTorusCenter(rect, rx, ry){
      var narrow = window.matchMedia('(max-width:640px)').matches;
      if(narrow){
        // mobile single column: spread lines to outer edges alternately so they don't bunch in center (red sketch)
        // assign side by card index parity via distance but bias to alternate
        var leftDist = Math.hypot((rect.left+1)-rx, (rect.top+rect.height/2)-ry);
        var rightDist = Math.hypot((rect.right-1)-rx, (rect.top+rect.height/2)-ry);
        // small bias: if distances are close (< 40px), alternate by rect top to spread
        if(Math.abs(leftDist-rightDist) < 40){
          var useLeft = (Math.floor(rect.top/100) % 2 === 0);
          if(useLeft) return {x: rect.left+1, y: rect.top+rect.height/2, side:'left'};
          return {x: rect.right-1, y: rect.top+rect.height/2, side:'right'};
        }
        if(leftDist < rightDist) return {x: rect.left+1, y: rect.top+rect.height/2, side:'left'};
        return {x: rect.right-1, y: rect.top+rect.height/2, side:'right'};
      }
      var candidates=[
        {x: rect.right - 1, y: rect.top + rect.height/2, side:'right'},
        {x: rect.left + 1, y: rect.top + rect.height/2, side:'left'},
        {x: rect.left + rect.width/2, y: rect.top + 1, side:'top'},
        {x: rect.left + rect.width/2, y: rect.bottom - 1, side:'bottom'}
      ];
      var best=candidates[0], bestD=Math.hypot(best.x - rx, best.y - ry);
      for(var i=1;i<candidates.length;i++){
        var d=Math.hypot(candidates[i].x - rx, candidates[i].y - ry);
        if(d < bestD){ bestD=d; best=candidates[i]; }
      }
      return {x: best.x, y: best.y, side: best.side};
    }
    // keep old name as alias for compat (not used internally any more)
    var closestPointOnRect = anchorAtTorusCenter;
    var raf=0, beadT=0;
    var paths={};
    function buildPath(sx,sy,ax,ay, narrow, idx){
      var dx=ax-sx, dy=ay-sy;
      var len=Math.hypot(dx,dy);
      idx = idx|0;
      var isLeft = dx < 0;
      var isRight = dx > 0;
      if(narrow){
        // mobile single column: route via outer gutters (grid has 16px padding), never through center
        var gutterOffset = isLeft ? -14 : 14;
        var fan = (idx - 1.5) * 14;
        var gx = ax + gutterOffset;
        var c1x = sx + dx * 0.30 + fan * 0.40;
        var c1y = sy + dy * 0.22 + fan * 0.16;
        var c2x = gx + fan * 0.22;
        var c2y = ay + fan * 0.10;
        return 'M'+sx.toFixed(1)+' '+sy.toFixed(1)+' C'+c1x.toFixed(1)+' '+c1y.toFixed(1)+' '+c2x.toFixed(1)+' '+c2y.toFixed(1)+' '+ax.toFixed(1)+' '+ay.toFixed(1);
      }
      // desktop: orthogonal corridor to avoid crossing blocks — exit ring, go H to column gap, then V, then H to anchor center
      // gap between center and side columns is ~20px; estimate as 18% of dx from ring to card
      var gapMid = sx + dx * 0.52;
      var splay = (idx - 1.5) * 10; // distinct Y slots for right-bottom 3 lines
      // For left cards, gapMid slightly right; for right cards, gapMid slightly left — improves corridor
      if(isLeft) gapMid += 14;
      else if(isRight) gapMid -= 14;
      // Add extra spread for cards below ring to separate 3 bottom tracks
      var belowBoost = ay > sy ? (idx * 5) : 0;
      var c1x = gapMid + splay * 0.42 + belowBoost * 0.35;
      var c1y = sy + (ay - sy) * 0.14 + splay * 0.18;
      var c2x = gapMid + splay * 0.52 + belowBoost * 0.5;
      var c2y = ay - (ay > sy ? 14 : 9) + splay * 0.22;
      var bow = (ay < sy ? -1 : 1) * Math.min(12, len*0.055);
      c1y += bow*0.32;
      c2y -= bow*0.22;
      return 'M'+sx.toFixed(1)+' '+sy.toFixed(1)+' C'+c1x.toFixed(1)+' '+c1y.toFixed(1)+' '+c2x.toFixed(1)+' '+c2y.toFixed(1)+' '+ax.toFixed(1)+' '+ay.toFixed(1);
    }
    function update(){
      var narrow=isNarrow();
      applyBeadMetrics();
      // always show lines; on mobile ring is top row so vertical mode
      Object.keys(groups).forEach(function(k){ groups[k].g.style.display=''; });
      var gridRect=grid.getBoundingClientRect();
      var ringRect=ring.getBoundingClientRect();
      if(!ringRect.width || !gridRect.width) return;
      var rx = ringRect.left + ringRect.width/2;
      var ry = ringRect.top + ringRect.height/2;
      var radius = ringRect.width/2 * 0.88;
      // ensure svg covers grid exactly (inset:0 already, but ensure viewBox not needed)
      // compute per card
      cards.forEach(function(c, idx){
        var card=document.getElementById(c.id);
        var gr=groups[c.key];
        if(!card||!gr) return;
        var cr=card.getBoundingClientRect();
        if(!cr.width) { gr.g.style.display='none'; return; }
        var anchor=anchorAtTorusCenter(cr, rx, ry);
        var ang=Math.atan2(anchor.y - ry, anchor.x - rx);
        var sx = rx + Math.cos(ang)*radius;
        var sy = ry + Math.sin(ang)*radius;
        var ax = anchor.x;
        var ay = anchor.y;
        // to svg local
        var lsx=sx - gridRect.left, lsy=sy - gridRect.top;
        var lax=ax - gridRect.left, lay=ay - gridRect.top;
        var d=buildPath(lsx, lsy, lax, lay, narrow, idx);
        gr.glow.setAttribute('d', d);
        gr.core.setAttribute('d', d);
        gr.dash.setAttribute('d', d);
        paths[c.key]=d;
        // update gradient coords
        var lg=document.getElementById('arch-g-'+c.key);
        if(lg){
          lg.setAttribute('x1', String(lsx)); lg.setAttribute('y1', String(lsy));
          lg.setAttribute('x2', String(lax)); lg.setAttribute('y2', String(lay));
        }
        // bead will be positioned in tick loop
      });
    }
    function tick(now){
      beadT = now*0.001;
      cards.forEach(function(c,idx){
        var gr=groups[c.key];
        if(!gr || gr.g.style.display==='none') return;
        var d=paths[c.key];
        if(!d) return;
        // staggered phase per line
        var phase = (beadT*0.62 + idx*0.37) % 1;
        var t = phase;
        var tmp=gr.core;
        try{
          var len=tmp.getTotalLength();
          var pt=tmp.getPointAtLength(len*t);
          gr.bead.setAttribute('cx', String(pt.x));
          gr.bead.setAttribute('cy', String(pt.y));
          var op = 0.82 + 0.18*Math.sin(beadT*2.4 + idx);
          gr.bead.setAttribute('opacity', String(op));
        }catch(e){}
      });
      raf=requestAnimationFrame(tick);
    }
    function scheduleUpdate(){
      clearTimeout(scheduleUpdate._t);
      scheduleUpdate._t=setTimeout(update, 16);
    }
    ensureDefs();
    update();
    raf=requestAnimationFrame(tick);
    // hover highlight
    cards.forEach(function(c){
      var card=document.getElementById(c.id);
      var gr=groups[c.key];
      if(!card||!gr) return;
      card.addEventListener('mouseenter', function(){
        card.classList.add('is-hot');
        gr.g.classList.add('is-hot');
        gr.dash.classList.add('is-fast');
        gr.dash.setAttribute('stroke-width','1.9');
        gr.core.setAttribute('stroke-width','2.1');
        gr.glow.setAttribute('opacity','0.32');
      });
      card.addEventListener('mouseleave', function(){
        card.classList.remove('is-hot');
        gr.g.classList.remove('is-hot');
        gr.dash.classList.remove('is-fast');
        gr.dash.setAttribute('stroke-width','1.25');
        gr.core.setAttribute('stroke-width','1.6');
        gr.glow.setAttribute('opacity','0.18');
      });
    });
    window.addEventListener('resize', scheduleUpdate, {passive:true});
    window.addEventListener('scroll', scheduleUpdate, {passive:true, capture:true});
    // breakpoint crossing must recalc even if no resize event fires via CSS only
    try{
      var mql900=window.matchMedia('(max-width:900px)');
      var mql640=window.matchMedia('(max-width:640px)');
      var onBp=function(){ scheduleUpdate(); applyBeadMetrics(); };
      if(mql900.addEventListener) { mql900.addEventListener('change', onBp); mql640.addEventListener('change', onBp); }
      else if(mql900.addListener) { mql900.addListener(onBp); mql640.addListener(onBp); }
    }catch(e){}
    if(window.ResizeObserver){
      var ro=new ResizeObserver(scheduleUpdate);
      ro.observe(grid); ro.observe(ring);
      cards.forEach(function(c){
        var el=document.getElementById(c.id);
        if(el) ro.observe(el);
      });
    }
    // fonts / images may shift layout shortly after load
    setTimeout(update, 120);
    setTimeout(update, 600);
    // expose for debugging
    window.initArchitectConnections = update;
  }
  initDashboard();
  initArchitectConnections();
  setBalance(); setConveyor(); setAutonomy(); setBest(); setNow(); setQueue(); setEff(); setAgents(); initRingPopup(); setConveyorPipelinePct();
})();

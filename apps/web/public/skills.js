'use strict';
(function(){
  // Skills — factory-filtered view. Robust: defer init until DOM ready, guard all getElementById.
  function init(){
    const get = (id)=> document.getElementById(id);
    const grid = get('skills-grid');
    if(!grid) return;

    let skills = [];
    let detailCache = new Map();
    let activeId = null;

    const DESCS = {
      'tovary-hero': 'Герой-кадр товара — approved cutout + фон. Protected продукт не трогаем.',
      'reklama-banner': 'Баннер/оффер/CTA, до 6 вариаций с lineage.',
      'video-shorts': 'Shorts/Reels 30–60с: hook + голос + музыка.',
      'ffmpeg-technical': 'Честные 2D: pan/zoom/push_in/shake. Not orbit.',
      'video-prompting': '200 терминов + VEO 14 / Seedance 8 / Sora / LTX 6.',
      'b-roll-planning': 'Stock vs generation per beat, rights gate.',
      'code-scaffold': 'Скрипт/апка/бот по брифу — scaffold + qa_syntax.',
      'bot-factory': 'Telegram/Discord/виджет — токен не в артефакте.',
      'freelance-autopilot': 'Kwork/FL — черновики ставок, человек подтверждает.',
    };
    const FACTORY_MAP = { 'tovary-hero':'commerce', 'reklama-banner':'commerce', 'b-roll-planning':'commerce', 'video-shorts':'content-factory', 'ffmpeg-technical':'content-factory', 'video-prompting':'content-factory', 'code-scaffold':'code-scaffold', 'bot-factory':'bot-factory', 'freelance-autopilot':'freelance-autopilot', 'telegram-network':'telegram-network' };
    const GROUPS = [
      { id:'all', label:'Все', filter:() => true },
      { id:'content-factory', label:'Контент-Завод', filter:(s)=> FACTORY_MAP[s.id]==='content-factory' },
      { id:'freelance', label:'Фриланс', filter:(s)=> s.id === 'freelance-autopilot' },
      { id:'bot', label:'Боты', filter:(s)=> s.id==='bot-factory' },
      { id:'code', label:'Код', filter:(s)=> s.id==='code-scaffold' },
      { id:'commerce', label:'Товары·Реклама', filter:(s)=> ['tovary-hero','reklama-banner','b-roll-planning'].includes(s.id) },
      { id:'telegram-network', label:'Telegram-сеть', filter:(s)=> s.id==='telegram-network' },
    ];
    let activeGroup = 'all';

    function esc(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
    function bumpVersion(v){
      const m = String(v).match(/^(\d+)\.(\d+)\.(\d+)$/);
      if(!m) return v+'-next';
      return `${m[1]}.${m[2]}.${Number(m[3])+1}`;
    }

    function renderChips(){
      const chips = get('skills-chips'); if(!chips) return;
      chips.innerHTML = '';
      for(const g of GROUPS){
        const b = document.createElement('button');
        b.className = 'chip' + (activeGroup===g.id ? ' active' : '');
        const n = g.id==='all' ? skills.length : skills.filter(g.filter).length;
        b.textContent = `${g.label} · ${n}`;
        b.addEventListener('click', ()=>{ activeGroup=g.id; render(); renderChips(); });
        chips.appendChild(b);
      }
    }
    function card(s){
      const el = document.createElement('article');
      el.className = 'skill-card';
      el.setAttribute('data-fidelity', s.fidelity);
      const desc = DESCS[s.id] || s.id;
      const pres = s.presets && s.presets.length ? s.presets.map(p=>`${p.id} (${p.kind})`).join(' · ') : (s.hasPrompts ? 'промпты VEO/Seedance' : '—');
      const forbid = s.forbidden && s.forbidden.length ? s.forbidden.join(', ') : '—';
      const steps = s.steps && s.steps.length ? s.steps.join(' → ') : '—';
      const recipes = s.recipeIds && s.recipeIds.length ? s.recipeIds.join(', ') : '—';
      const approval = s.approval && s.approval.length ? s.approval.join(', ') : '—';
      el.innerHTML = `
        <div class="skill-head"><div class="skill-id">${s.id}</div><span class="skill-ver">${esc(s.version)}</span></div>
        <div class="skill-badges">
          <span class="badge-sm status-${esc(s.status)}">${esc(s.status)}</span>
          <span class="badge-sm fidelity">${esc(s.fidelity)}</span>
          <span class="badge-sm">${s.budgetMinor}¢</span>
          ${s.curiosityReserve!=null ? `<span class="badge-sm">curiosity ${s.curiosityReserve}%</span>` : ''}
        </div>
        <div class="skill-desc">${esc(desc)}</div>
        <div class="skill-flow"><i class="on"></i><b>draft</b><i></i><b>canary</b><i></i><b>active</b></div>
        <div class="skill-meta"><span>шаги: ${esc(steps)}</span><span>approval: ${esc(approval)}</span></div>
        <div class="skill-meta"><span>пресеты: ${esc(pres)}</span><span>forbidden: ${esc(forbid)}</span></div>
        <div class="skill-meta"><span>рецепты: ${esc(recipes)}</span></div>
        <div class="skill-actions"><button class="btn btn-primary" data-open="${esc(s.id)}">Читать / Править</button><button class="btn" data-copy="${esc(s.id)}">Копировать id</button></div>
      `;
      const o = el.querySelector(`[data-open="${s.id}"]`); if(o) o.addEventListener('click', ()=> openDrawer(s.id));
      const c = el.querySelector(`[data-copy="${s.id}"]`); if(c) c.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(s.id); }catch{} });
      return el;
    }
    function visible(){
      let arr = skills.slice();
      if(activeGroup!=='all'){ const g=GROUPS.find(x=>x.id===activeGroup); if(g) arr = arr.filter(g.filter); }
      const filt = get('skills-filter');
      const f = filt ? (filt.value||'').trim() : '';
      if(f) arr = arr.filter(s=> s.fidelity===f);
      const qqEl = get('skills-query');
      const qq = qqEl ? (qqEl.value||'').toLowerCase().trim() : '';
      if(qq) arr = arr.filter(s=> s.id.toLowerCase().includes(qq) || (s.fidelity||'').toLowerCase().includes(qq) || (DESCS[s.id]||'').toLowerCase().includes(qq));
      return arr;
    }
    function render(){
      const gg = get('skills-grid'); if(!gg) return;
      const arr = visible();
      gg.innerHTML = '';
      for(const s of arr) gg.appendChild(card(s));
      const subEl = get('skills-sub'); if(subEl) subEl.textContent = `${arr.length} / ${skills.length}`;
    }
    async function openDrawer(id){
      activeId = id;
      const drawerTitle = get('drawer-title');
      const drawerSub = get('drawer-sub');
      const drawer = get('skill-drawer');
      const drawerRead = get('drawer-read');
      const drawerLab = get('drawer-lab');
      const nextVer = get('next-version');
      const drawerYaml = get('drawer-yaml');
      const editHint = get('drawer-edit-hint');
      if(drawerTitle) drawerTitle.textContent = id;
      if(drawerSub) drawerSub.textContent = 'загрузка...';
      if(drawer) drawer.hidden = false;
      if(drawerRead) drawerRead.innerHTML = '<p class="m">Загрузка...</p>';
      if(drawerLab) drawerLab.innerHTML = '';
      try{
        let d = detailCache.get(id);
        if(!d){ const r=await fetch(`/api/skills/${encodeURIComponent(id)}`); if(!r.ok) throw new Error('not found'); d=await r.json(); detailCache.set(id,d); }
        const meta = skills.find(s=> s.id===id);
        if(drawerSub) drawerSub.textContent = `${meta? meta.version+' · '+meta.fidelity : ''} · ${d.prompts.length ? d.prompts.length+' промптов' : 'без промптов'}`;
        const ver = bumpVersion(meta? meta.version : '1.0.0');
        if(nextVer) nextVer.textContent = ver;
        if(drawerYaml) drawerYaml.value = d.yaml;
        if(editHint) editHint.textContent = '';
        if(drawerRead) drawerRead.innerHTML = `
          <h3>SKILL.md</h3><pre>${esc(d.md || '— нет SKILL.md —')}</pre>
          <h3>skill.yaml</h3><pre>${esc(d.yaml)}</pre>
          <h3>Промпты</h3><p class="m">${d.prompts.length ? esc(d.prompts.join(' · ')) : '— нет —'}</p>
          <h3>Рецепты</h3><p class="m">${meta? esc(meta.recipeIds.join(', ')||'— ни один рецепт не ссылается —') : '—'}</p>
        `;
        if(drawerLab) drawerLab.innerHTML = `
          <p class="m">Двигай скил через Лабу, не напрямую. Сейчас <strong>${esc(meta? meta.status : 'draft')}</strong>.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
            <span class="badge-sm">1. механический eval в CI — golden/holdout</span>
            <span class="badge-sm">2. real eval — approved spend</span>
            <span class="badge-sm">3. canary small</span>
            <span class="badge-sm">4. active</span>
          </div>
          <p class="m">Откат не возвращает billed calls. Protected <code>budget/policy/auth</code> не правится из карточки.</p>
        `;
      }catch(e){
        const dr=get('drawer-read'); if(dr) dr.innerHTML = `<p class="m">Ошибка: ${esc(String(e))}</p>`;
      }
    }

    // wiring
    const drawerEl = get('skill-drawer');
    if(drawerEl) drawerEl.addEventListener('click', (e)=>{ const t=e.target; if(t instanceof Element && (t.hasAttribute('data-close-drawer') || t.classList.contains('drawer-backdrop'))) { drawerEl.hidden=true; activeId=null; } });
    document.addEventListener('keydown', (e)=>{ const d=get('skill-drawer'); if(e.key==='Escape' && d && !d.hidden){ d.hidden=true; } });
    document.querySelectorAll('.drawer-tabs .tab').forEach(tab=>{
      tab.addEventListener('click', ()=>{
        document.querySelectorAll('.drawer-tabs .tab').forEach(x=>x.classList.remove('active'));
        tab.classList.add('active');
        const t=tab.getAttribute('data-tab');
        document.querySelectorAll('[data-panel]').forEach(p=>{ const h=p.getAttribute('data-panel')!==t; (p).hidden = h; });
      });
    });
    const saveBtn = get('drawer-save');
    if(saveBtn) saveBtn.addEventListener('click', ()=>{
      const editHint = get('drawer-edit-hint');
      const nextVer = get('next-version');
      const drawerYaml = get('drawer-yaml');
      if(editHint) editHint.textContent = 'Черновик новой версии — сохрани файл skills/'+activeId+'/skill.yaml как '+(nextVer? nextVer.textContent : '?')+' и прогоняй node scripts/check_skills.mjs → SkillLab draft→canary→active. Прямая перезапись из браузера отключена (protected). Скопируй yaml ниже.';
      if(drawerYaml && typeof drawerYaml.select==='function') drawerYaml.select();
    });
    const qEl = get('skills-query');
    const filtEl = get('skills-filter');
    if(qEl) qEl.addEventListener('input', render);
    if(filtEl) filtEl.addEventListener('change', render);

    // load
    fetch('/api/skills').then(r=>{ if(!r.ok) throw new Error('skills api '+r.status); return r.json(); }).then(j=>{
      skills = j.skills || [];
      const countEl = get('skills-count');
      const badgeTotal = get('badge-total');
      const badgeDraft = get('badge-draft');
      const empty = get('skills-empty');
      if(countEl) countEl.textContent = `${skills.length} скилов`;
      if(badgeTotal) badgeTotal.textContent = `${skills.length} скилов`;
      if(badgeDraft) badgeDraft.textContent = `draft ${skills.filter(s=> s.status==='draft').length}`;
      if(empty) empty.hidden = true;
      renderChips();
      render();
    }).catch(e=>{
      const msg = String(e && e.message || e);
      fetch('/api/version').then(r=>r.json()).then(v=> {
        const el=get('skills-error'); if(el) el.textContent = msg + ' · версия ' + (v.version||'?') + ' — перезапусти мастерскую или переустанови Setup-1.4.exe';
      }).catch(()=> {
        const el=get('skills-error'); if(el) el.textContent = msg + ' — проверь что мастерская запущена на 127.0.0.1:3000';
      });
      const empty2 = get('skills-empty');
      const countEl2 = get('skills-count');
      if(empty2) empty2.hidden = false;
      if(countEl2) countEl2.textContent = 'ошибка';
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();

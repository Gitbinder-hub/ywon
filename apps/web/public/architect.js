/* architect.js — Ywon Architect mock: tabs, chat streaming, graph, code split-view, integrations, project context — localStorage only */
(() => {
  const LS_CHAT = 'ywon_arch_chat';
  const LS_INTS = 'ywon_arch_integrations';
  const LS_FILES = 'ywon_arch_files';
  const LS_DIALOGS = 'ywon_arch_dialogs';
  const LS_TASKS = 'ywon_arch_tasks';
  const LS_ACTIVE = 'ywon_arch_active_dialog';

  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"]/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[m]));
  function uid(){ return Math.random().toString(36).slice(2,9); }

  // ---- tabs ----
  const tabBtns = $$('.arch-tab');
  const panels = { dialog: $('#panel-dialog'), arch: $('#panel-arch'), code: $('#panel-code'), integrations: $('#panel-integrations') };
  function setTab(id){
    tabBtns.forEach(b=>{ const on=b.dataset.tab===id; b.classList.toggle('active',on); b.setAttribute('aria-selected', String(on)); });
    Object.entries(panels).forEach(([k,el])=> el && el.classList.toggle('active', k===id));
    try{ history.replaceState(null,'','#'+id); }catch{}
  }
  tabBtns.forEach(b=> b.addEventListener('click', ()=> setTab(b.dataset.tab)));
  const initial = (location.hash||'').replace('#','');
  if(initial && panels[initial]) setTab(initial);

  // ---- dialogs / chat ----
  function loadDialogs(){
    try{ const v=JSON.parse(localStorage.getItem(LS_DIALOGS)||'null'); if(Array.isArray(v)&&v.length) return v; }catch{}
    return [{ id:'d1', title:'Диалог 1 — знакомство', at: new Date().toISOString(), messages:[
      { role:'assistant', text:'Привет — я Архитектор Ywon. Могу в интернет, на биржи, любую работу. Скажи задачу — соберу архитектуру, открою код или покажу интеграции в контексте проекта. Всё пока мок без LLM/оплат.', ts: Date.now()-60000 },
    ]}];
  }
  let dialogs = loadDialogs();
  let activeId = localStorage.getItem(LS_ACTIVE) || dialogs[0].id;
  if(!dialogs.find(d=>d.id===activeId)) activeId = dialogs[0].id;

  function saveDialogs(){ try{ localStorage.setItem(LS_DIALOGS, JSON.stringify(dialogs)); localStorage.setItem(LS_ACTIVE, activeId); }catch{} }
  function activeDialog(){ return dialogs.find(d=>d.id===activeId) || dialogs[0]; }
  const chatLog = $('#chat-log'), chatInput = $('#chat-input'), chatSend = $('#chat-send'), chatStop = $('#chat-stop'), chatStatus = $('#chat-status');
  let streaming = null;

  function renderHistory(){
    const box = $('#dialog-history'); if(!box) return;
    box.innerHTML = dialogs.map(d=> `<div class="hist-item ${d.id===activeId?'active':''}" data-id="${esc(d.id)}" tabindex="0" role="button"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(d.title)}</span><span class="m" style="font-size:10px;white-space:nowrap">${new Date(d.at).toLocaleDateString('ru-RU')}</span></div>`).join('') || '<div class="m" style="font-size:12px">Нет диалогов</div>';
    box.querySelectorAll('.hist-item').forEach(el=>{
      const go = ()=>{ activeId=el.dataset.id; saveDialogs(); renderHistory(); renderChat(); };
      el.addEventListener('click', go);
      el.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' ') { e.preventDefault(); go(); } });
    });
  }
  function renderChat(){
    const d = activeDialog();
    chatLog.innerHTML = d.messages.map(m=>{
      const cls = m.role==='user' ? 'user' : m.role==='system' ? 'system' : 'assistant';
      const meta = m.ts ? `<div class="chat-meta">${esc(new Date(m.ts).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}))}</div>` : '';
      return `<div class="chat-msg ${cls}">${esc(m.text)}${meta}</div>`;
    }).join('');
    chatLog.scrollTop = chatLog.scrollHeight;
    const empty = d.messages.length===0;
    if(empty){
      chatLog.innerHTML = `<div class="chat-msg system">Начни с чипа ниже или напиши задачу своими словами.</div>`;
    }
  }
  function pushMsg(role, text){
    const d = activeDialog();
    d.messages.push({ role, text, ts: Date.now() });
    if(d.messages.length===1) d.title = text.slice(0,42);
    if(role==='user' && d.messages.length<=2) d.title = text.slice(0,42);
    saveDialogs(); renderChat(); renderHistory();
  }

  // mock streaming assistant reply
  const REPLIES = {
    exchange: "Нашёл на бирже (мок):\n• Видео-монтаж Reels — $180, удержание 42% (заказчик: бренд одежды)\n• UGC 30с — $240, отклик 2ч\n• Автопилот ставок: черновик готов в /journey?factory=freelance-autopilot\n\nДальше: могу отфильтровать по бюджету/нише или собрать отклик. Хочешь — переключу на «Архитектура», как это встроить в конвейер.",
    arch: "Собрал архитектуру (см. вкладку Архитектура):\nПриём заявок → очередь → воркеры (STT/LLM/рендер) → публикация. Узлы кликабельны — детали внизу. Связи: очередь держит бэк-прешер, guardian режет токсичность. Готов открыть код — вкладка «Код».",
    code: "Открыл код (вкладка Код): слева дерево, справа редактор с line numbers. Правки — в localStorage, кнопка Сохранить. Могу предложить патч таймлайна — скажи «запатчь» и покажу diff.",
    integ: "Показал интеграции (вкладка Интеграции): какие карты/кошельки/сервисы залогинены в контексте текущего проекта. Переключись туда — увидишь «Проект X → сервис Y» и кнопку Подключить (мок).",
    week: "План на неделю (фабрика контента):\nПн — 1 сценарий + 2 черновика\nСр — озвучка + картинки (6 сцен)\nПт — сборка 3× MP4 30–60с + публикация\nСб — ретеншн-аналитика\nГотов завести задачи в правой колонке.",
    fallback: "Принял. Могу: найти на бирже, собрать архитектуру, открыть код, показать интеграции, спланировать неделю. Уточни — «на бирже X», «архитектура для Y», «открой файл Z». (Мок — без сети/оплат.)"
  };
  function pickReply(text){
    const t = text.toLowerCase();
    if(/бирж|freelance|kwork|fl\./.test(t)) return REPLIES.exchange;
    if(/архитектур|схем|граф|узл/.test(t)) return REPLIES.arch;
    if(/\.(js|ts|html|css)|\bкод\b|редактор|файл/.test(t)) return REPLIES.code;
    if(/интеграц|карт|кошел|telegram|youtube|billing|crypto|залог|подключ/.test(t)) return REPLIES.integ;
    if(/план|недел/.test(t)) return REPLIES.week;
    return REPLIES.fallback;
  }
  function streamReply(fullText){
    let i=0, stopped=false;
    const d = activeDialog();
    const idx = d.messages.push({ role:'assistant', text:'', ts: Date.now() }) -1;
    saveDialogs(); renderChat();
    chatStatus.textContent = 'печатает…';
    chatSend.hidden = true; chatStop.hidden = false;
    const tick = () => {
      if(stopped) return;
      i = Math.min(fullText.length, i + Math.max(1, Math.ceil(fullText.length/60)));
      d.messages[idx].text = fullText.slice(0,i);
      saveDialogs(); renderChat();
      if(i < fullText.length) streaming = setTimeout(tick, 22);
      else { chatStatus.textContent='готов · мок'; chatSend.hidden=false; chatStop.hidden=true; streaming=null; autoSwitchTab(fullText); }
    };
    streaming = setTimeout(tick, 120);
    chatStop.onclick = ()=>{ stopped=true; clearTimeout(streaming); streaming=null; chatStatus.textContent='остановлено'; chatSend.hidden=false; chatStop.hidden=true; };
  }
  function autoSwitchTab(reply){
    const t = reply.toLowerCase();
    if(t.includes('архитектура') || t.includes('узлы кликабельны')) setTab('arch');
    else if(t.includes('код') || t.includes('редактор')) setTab('code');
    else if(t.includes('интеграц') || t.includes('карт')) setTab('integrations');
  }
  function send(){
    const text = (chatInput.value||'').trim();
    if(!text) return;
    if(streaming) { clearTimeout(streaming); streaming=null; }
    pushMsg('user', text);
    chatInput.value='';
    const reply = pickReply(text);
    streamReply(reply);
  }
  chatSend.addEventListener('click', send);
  chatInput.addEventListener('keydown', e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); send(); } });
  $$('#chat-chips [data-prompt]').forEach(b=> b.addEventListener('click', ()=>{ chatInput.value=b.dataset.prompt; send(); }));
  $('#chat-clear').addEventListener('click', ()=>{
    const d=activeDialog(); d.messages=[]; saveDialogs(); renderChat(); renderHistory();
  });
  $('#new-dialog').addEventListener('click', ()=>{
    const id='d'+Date.now().toString(36);
    dialogs.unshift({ id, title:'Новый диалог', at:new Date().toISOString(), messages:[] });
    activeId=id; saveDialogs(); renderHistory(); renderChat(); chatInput.focus();
  });
  // try restore old single-chat key
  try{
    const old = JSON.parse(localStorage.getItem(LS_CHAT)||'null');
    if(Array.isArray(old) && old.length && dialogs[0] && dialogs[0].messages.length<=1){
      dialogs[0].messages = old.slice(-20);
      saveDialogs();
    }
  }catch{}
  renderHistory(); renderChat();
  // persist on every push
  const _push = pushMsg;

  // ---- architecture graph ----
  const svg = $('#arch-svg');
  const detail = $('#arch-detail');
  const nodes = [
    { id:'entry', label:'Входы', sub:'Studio / Journey / API', x:80, y:90, w:120, h:44, fill:'#7d9cff', stroke:'rgba(255,255,255,.18)' },
    { id:'orch', label:'Orchestrator', sub:'очередь · ретраи', x:240, y:70, w:140, h:48, fill:'#7d9cff', stroke:'#7d9cff' },
    { id:'guard', label:'Guardian', sub:'модерация · права', x:240, y:160, w:140, h:48, fill:'#f58a9e', stroke:'rgba(255,255,255,.18)' },
    { id:'content', label:'Content Factory', sub:'сцены → MP4 30–60с', x:430, y:60, w:150, h:48, fill:'#7d9cff', stroke:'#7d9cff' },
    { id:'freel', label:'Freelance AP', sub:'поиск → ставки', x:430, y:130, w:150, h:48, fill:'#7d9cff', stroke:'rgba(255,255,255,.18)' },
    { id:'bot', label:'Bot Factory', sub:'TG / Discord', x:430, y:200, w:150, h:48, fill:'#7d9cff', stroke:'rgba(255,255,255,.18)' },
    { id:'code', label:'Code Scaffold', sub:'заготовка → репо', x:430, y:270, w:150, h:48, fill:'#7d9cff', stroke:'rgba(255,255,255,.18)' },
    { id:'store', label:'Store', sub:'.Ywoom-offline / S3', x:640, y:80, w:130, h:44, fill:'#8ed8be', stroke:'rgba(255,255,255,.18)' },
    { id:'ledger', label:'Ledger', sub:'резерв · cap', x:640, y:160, w:130, h:44, fill:'#8ed8be', stroke:'rgba(255,255,255,.18)' },
    { id:'publish', label:'Publish', sub:'очередь публикаций', x:640, y:240, w:130, h:44, fill:'#8ed8be', stroke:'rgba(255,255,255,.18)' },
  ];
  const edges = [
    ['entry','orch'], ['orch','content'], ['orch','freel'], ['orch','bot'], ['orch','code'],
    ['guard','orch'], ['content','store'], ['content','publish'], ['freel','ledger'], ['bot','store'], ['code','store'], ['store','publish']
  ];
  function draw(){
    if(!svg) return;
    svg.innerHTML='';
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    defs.innerHTML = `<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="rgba(255,255,255,.45)"/></marker>`;
    svg.appendChild(defs);
    // edges
    edges.forEach(([a,b])=>{
      const A=nodes.find(n=>n.id===a), B=nodes.find(n=>n.id===b);
      if(!A||!B) return;
      const x1=A.x + A.w, y1=A.y + A.h/2, x2=B.x, y2=B.y + B.h/2;
      const mx = (x1+x2)/2;
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d', `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`);
      p.setAttribute('class','edge');
      p.setAttribute('stroke','rgba(232,236,255,.55)');
      p.setAttribute('marker-end','url(#arr)');
      svg.appendChild(p);
    });
    // nodes
    nodes.forEach(n=>{
      const g = document.createElementNS('http://www.w3.org/2000/svg','g');
      g.setAttribute('class','node');
      g.setAttribute('transform', `translate(${n.x},${n.y})`);
      g.dataset.id = n.id;
      const r = document.createElementNS('http://www.w3.org/2000/svg','rect');
      r.setAttribute('width', n.w); r.setAttribute('height', n.h); r.setAttribute('rx','14'); r.setAttribute('fill', n.fill);
      r.setAttribute('stroke', n.stroke); r.setAttribute('opacity','0.96');
      if(n.fill==='#7d9cff') r.setAttribute('fill-opacity','0.95');
      if(n.fill==='#f58a9e') r.setAttribute('fill-opacity','0.92');
      if(n.fill==='#8ed8be') { r.setAttribute('fill','#3a3c45'); r.setAttribute('stroke','#8ed8be'); r.setAttribute('stroke-opacity','0.9'); }
      const t = document.createElementNS('http://www.w3.org/2000/svg','text');
      t.setAttribute('x', String(n.w/2)); t.setAttribute('y','18'); t.setAttribute('text-anchor','middle');
      t.textContent = n.label;
      if(n.fill==='#8ed8be') t.setAttribute('fill','#8ed8be');
      const s = document.createElementNS('http://www.w3.org/2000/svg','text');
      s.setAttribute('x', String(n.w/2)); s.setAttribute('y','30'); s.setAttribute('text-anchor','middle');
      s.setAttribute('class','sub'); s.textContent = n.sub;
      g.appendChild(r); g.appendChild(t); g.appendChild(s);
      g.addEventListener('click', ()=> showDetail(n.id));
      svg.appendChild(g);
    });
  }
  const DETAILS = {
    entry:{ title:'Входы', text:'Studio (монтаж), Journey (черновик), /api/offline/*, /api/billing. Все входы → один проект-контекст (выбор справа).' },
    orch:{ title:'Orchestrator', text:'Очередь задач, ретраи, бэк-прешер. Ограничивает параллельность сборок (409 если занято). Хранит history в .Ywoom-offline.' },
    guard:{ title:'Guardian', text:'Модерация/права: rightsConfirmed, лимиты Free/Pro, 100 MiB материалов, 20 сборок. Режет токсичность до публикации.' },
    content:{ title:'Content Factory', text:'Сцены → озвучка → MP4 30–60с, FFmpeg локально. Диагностические материалы помечены.' },
    freel:{ title:'Freelance Autopilot', text:'Поиск на биржах → черновики ставок. Крон дергает /freelancer/active, шлёт уведомления.' },
    bot:{ title:'Bot Factory', text:'Telegram/Discord/виджет — приём заявок → очередь → ответы. Adapter отдельно, хранение — Store.' },
    code:{ title:'Code Scaffold', text:'Заготовка проекта → репо. Шаблоны + проверки, без paid генерации в CI.' },
    store:{ title:'Store', text:'.Ywoom-offline/{projects,assets,jobs,revisions} + S3 (когда live). Range-запросы для MP4.' },
    ledger:{ title:'Ledger', text:'Резерв · cap: episode/project/month, 20% repair preset (из GENERATION_RESERVE). Деньги — env/vault, не git.' },
    publish:{ title:'Publish', text:'Очередь публикаций, share-ссылки, verified evidence. Публикация — только после owner gate.' },
  };
  function showDetail(id){
    const d = DETAILS[id]; if(!d) return;
    detail.hidden=false;
    detail.innerHTML = `<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div><div style="font-weight:700">${esc(d.title)}</div><div class="m" style="font-size:12px;margin-top:4px;line-height:1.5">${esc(d.text)}</div></div><button class="btn hol" style="padding:6px 10px;border-radius:10px;font-size:11px" onclick="this.closest('#arch-detail').hidden=true">Закрыть</button></div><div class="m" style="font-size:11px;margin-top:8px">Узел: <code style="background:rgba(255,255,255,.07);padding:2px 6px;border-radius:6px">${esc(id)}</code> · кликни другой узел чтобы переключить.</div>`;
  }
  draw();
  // pan/zoom mock
  let scale=1, tx=0, ty=0, dragging=false, sx=0, sy=0;
  const canvas = $('#arch-canvas');
  function apply(){ if(svg) svg.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`; svg.style.transformOrigin='0 0'; }
  canvas.addEventListener('wheel', e=>{ e.preventDefault(); const d = e.deltaY>0 ? 0.92 : 1.08; scale=Math.min(1.8,Math.max(0.6, scale*d)); apply(); }, {passive:false});
  canvas.addEventListener('mousedown', e=>{ dragging=true; sx=e.clientX-tx; sy=e.clientY-ty; canvas.style.cursor='grabbing'; });
  window.addEventListener('mouseup', ()=>{ dragging=false; if(canvas) canvas.style.cursor=''; });
  window.addEventListener('mousemove', e=>{ if(!dragging) return; tx=e.clientX-sx; ty=e.clientY-sy; apply(); });
  $('#arch-zoom-in').addEventListener('click', ()=>{ scale=Math.min(1.8,scale*1.15); apply(); });
  $('#arch-zoom-out').addEventListener('click', ()=>{ scale=Math.max(0.6,scale*0.87); apply(); });
  $('#arch-reset').addEventListener('click', ()=>{ scale=1; tx=0; ty=0; apply(); });

  // ---- code ----
  const DEFAULT_FILES = {
    'studio.js': `// studio.js — локальная сборка (мок)\n// Правь и жми Сохранить — уйдёт в localStorage\nexport async function splitIntoScenes(script){\n  return script.split(/\\n\\s*\\n/).filter(Boolean).slice(0,6);\n}\n`,
    'apps/api/src/server.ts': `// server.ts — роут /architect добавлен (мок)\n// staticFiles: ['/architect', ['architect.html','text/html']] \nexport const ARCH_ROUTES = ['/architect','/architect.js','/architect.css'];\n`,
    'apps/web/public/design.css': `/* Ywoom dark — #3a3c45, #43454f, #7d9cff */\n.card{ background:#43454f; border-radius:22px }\n`,
    'README.md': `# Ywon / Ywoom\nАрхитектор — универсальный помощник. Диалог, граф, код, интеграции — всё в контексте проекта.\n`,
  };
  function loadFiles(){
    try{ const v=JSON.parse(localStorage.getItem(LS_FILES)||'null'); if(v && typeof v==='object') return { ...DEFAULT_FILES, ...v }; }catch{}
    return { ...DEFAULT_FILES };
  }
  let files = loadFiles();
  let activeFile = Object.keys(files)[0];
  const fileTreeEl = $('#file-tree'), editor = $('#code-editor'), lineNums = $('#line-nums'), fnameEl = $('#code-filename'), dirtyEl = $('#code-dirty'), hintEl = $('#code-hint');

  function renderTree(){
    const keys = Object.keys(files).sort();
    fileTreeEl.innerHTML = keys.map(k=> `<div class="file-row ${k===activeFile?'active':''}" data-f="${esc(k)}"><span style="opacity:.7">▸</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(k)}</span></div>`).join('');
    fileTreeEl.querySelectorAll('.file-row').forEach(el=> el.addEventListener('click', ()=>{ openFile(el.dataset.f); }));
  }
  function updateLines(){
    const n = editor.value.split('\n').length;
    lineNums.textContent = Array.from({length:n},(_,i)=> i+1).join('\n');
  }
  function openFile(name){
    activeFile=name;
    editor.value = files[name] ?? '';
    fnameEl.textContent = name;
    dirtyEl.hidden=true;
    hintEl.textContent = `Файл: ${name} · ${editor.value.length} симв. · Сохранение — localStorage.`;
    renderTree(); updateLines();
  }
  editor.addEventListener('input', ()=>{ dirtyEl.hidden=false; updateLines(); hintEl.textContent=`Не сохранено · ${editor.value.length} симв. — нажми Сохранить.`; });
  editor.addEventListener('scroll', ()=>{ lineNums.scrollTop = editor.scrollTop; });
  $('#code-save').addEventListener('click', ()=>{
    if(!activeFile) return;
    files[activeFile]=editor.value;
    try{ localStorage.setItem(LS_FILES, JSON.stringify(files)); }catch{}
    dirtyEl.hidden=true;
    hintEl.textContent=`Сохранено в localStorage (ywon_arch_files) · ${new Date().toLocaleTimeString('ru-RU')}`;
    // collab fake cursor
    const c = $('#collab-status'); if(c){ c.textContent='сохранено · соавтор увидел правку'; setTimeout(()=> c.textContent='соавтор в сети · заглушка', 2200); }
  });
  $('#code-copy').addEventListener('click', async ()=>{
    try{ await navigator.clipboard.writeText(editor.value); hintEl.textContent='Скопировано в буфер.'; }catch{ hintEl.textContent='Копирование не удалось — выдели вручную.'; }
  });
  $('#file-new').addEventListener('click', ()=>{
    const name = prompt('Имя файла (напр. notes.md)', 'notes-'+uid()+'.md');
    if(!name) return;
    if(files[name]){ alert('Такой файл уже есть'); return; }
    files[name]=''; try{ localStorage.setItem(LS_FILES, JSON.stringify(files)); }catch{}
    openFile(name);
  });
  $('#file-reveal').addEventListener('click', ()=>{
    hintEl.textContent = `В репо: ${activeFile} — мок. Реальный путь: ${location.origin}/${activeFile}`;
  });
  renderTree(); openFile(activeFile);

  // ---- integrations ----
  const DEFAULT_INTS = [
    { id:'telegram', title:'Telegram', sub:'Бот / каналы', icon:'TG', color:'#2aabee', status:'connected', login:'@ywoom_bot · залогинен как @oleg', ctx:'Проект → публикует в TG' },
    { id:'youtube', title:'YouTube', sub:'Загрузка / аналитика', icon:'▶', color:'#ff2a2a', status:'off', login:'не подключено', ctx:'—' },
    { id:'billing', title:'Billing', sub:'Карты · лимиты', icon:'₿', color:'#7d9cff', status:'connected', login:'Карта •• 4242 · Pro · $42', ctx:'Проект → списывает генерацию' },
    { id:'crypto', title:'Crypto', sub:'Кошелёк · биржа', icon:'◈', color:'#8ed8be', status:'off', login:'не подключено', ctx:'—' },
    { id:'model', title:'Модель-провайдер', sub:'LLM / TTS / ASR', icon:'✦', color:'#a58cf5', status:'connected', login:'Gemini · ключ в env · local mock', ctx:'Проект → использует Gemini (dry-run)' },
  ];
  function loadInts(){
    try{ const v=JSON.parse(localStorage.getItem(LS_INTS)||'null'); if(Array.isArray(v)&&v.length) return v; }catch{}
    return DEFAULT_INTS;
  }
  let ints = loadInts();
  function saveInts(){ try{ localStorage.setItem(LS_INTS, JSON.stringify(ints)); }catch{} }
  function renderInts(){
    const grid = $('#int-grid'); if(!grid) return;
    grid.innerHTML = ints.map(it=> `
      <div class="int-card">
        <div class="int-head">
          <span class="int-icon" style="background:${esc(it.color)};color:#fff">${esc(it.icon)}</span>
          <div style="min-width:0;flex:1"><div class="int-title">${esc(it.title)}</div><div class="int-sub">${esc(it.sub)}</div></div>
          <span class="${it.status==='connected'?'badge-on':'badge-off'}">${it.status==='connected'?'Подключено':'Не подключено'}</span>
        </div>
        <div class="m" style="font-size:12px;line-height:1.4">${esc(it.login)}</div>
        <div class="m" style="font-size:11px">${esc(it.ctx)}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn ${it.status==='connected'?'hol':'conv'}" data-act="toggle" data-id="${esc(it.id)}" style="padding:7px 12px;border-radius:12px;font-size:12px;color:${it.status==='connected'?'inherit':'#fff'}">${it.status==='connected'?'Отключить':'Подключить'}</button>
          <button class="btn hol" data-act="edit" data-id="${esc(it.id)}" style="padding:7px 10px;border-radius:12px;font-size:11px">Изменить</button>
        </div>
      </div>`).join('');
    grid.querySelectorAll('[data-act="toggle"]').forEach(b=> b.addEventListener('click', ()=>{
      const it=ints.find(x=>x.id===b.dataset.id); if(!it) return;
      if(it.status==='connected'){ it.status='off'; it.login='не подключено'; it.ctx='—'; }
      else { it.status='connected'; it.login='залогинен как @oleg · мок'; it.ctx='Проект → использует '+it.title; }
      saveInts(); renderInts(); renderCtxBindings();
    }));
    grid.querySelectorAll('[data-act="edit"]').forEach(b=> b.addEventListener('click', ()=>{
      const it=ints.find(x=>x.id===b.dataset.id); if(!it) return;
      const v = prompt(`Логин/карта для ${it.title}`, it.login);
      if(v===null) return;
      it.login = v.trim() || it.login;
      if(it.login && it.login!=='не подключено') it.status='connected';
      saveInts(); renderInts(); renderCtxBindings();
    }));
    $('#int-summary').textContent = `${ints.filter(i=>i.status==='connected').length} подключено · ${ints.length} всего · мок`;
    const ctxBox = $('#ctx-box');
    const projName = ($('#ctx-project option:checked')||{}).textContent || '—';
    const connected = ints.filter(i=>i.status==='connected').map(i=>i.title).join(', ') || 'ничего не подключено';
    ctxBox.innerHTML = `В контексте проекта: <b>${esc(projName)}</b> → использует: ${esc(connected)}<br><span class="m" style="font-size:11px">Карты/кошельки/сервисы — где залогинен — отображается здесь и на карточках выше. Хранение — localStorage.</span>`;
  }
  renderInts();

  // ---- project context ----
  const ctxSel = $('#ctx-project'), ctxMeta = $('#ctx-project-meta'), ctxBindings = $('#ctx-bindings');
  let projectsCache = [];
  async function fetchProjects(){
    try{
      const r = await fetch('/api/offline/projects', { headers:{ 'Accept':'application/json' } });
      if(!r.ok) throw 0;
      const j = await r.json();
      if(Array.isArray(j)) return j;
    }catch{}
    return [];
  }
  function renderProjectSelect(list){
    projectsCache = list;
    if(!list.length){
      ctxSel.innerHTML = `<option value="">(проектов нет — мок)</option>`;
      ctxMeta.textContent = 'Создай проект в Студии — он появится здесь. Пока мок: 3 демо-проекта.';
      // mock fallback for UI demo
      const mock = [
        { id:'mock-1', title:'Демо-ролик 30с', updatedAt: new Date().toISOString(), tags:['демо'] },
        { id:'mock-2', title:'Telegram-бот · заявки', updatedAt: new Date().toISOString(), tags:['бот'] },
        { id:'mock-3', title:'Фриланс · монтаж', updatedAt: new Date().toISOString(), tags:['фриланс'] },
      ];
      ctxSel.innerHTML = mock.map(p=> `<option value="${esc(p.id)}">${esc(p.title)}</option>`).join('');
      projectsCache = mock;
    } else {
      ctxSel.innerHTML = list.map(p=> `<option value="${esc(p.id)}">${esc(p.title||p.id)}</option>`).join('');
    }
    renderProjectMeta();
    renderCtxBindings();
  }
  function renderProjectMeta(){
    const p = projectsCache.find(x=> x.id===ctxSel.value) || projectsCache[0];
    if(!p){ ctxMeta.textContent='—'; return; }
    ctxMeta.innerHTML = `ID <code style="background:rgba(255,255,255,.07);padding:1px 6px;border-radius:6px">${esc(p.id.slice(0,8))}</code> · обновлён ${esc((p.updatedAt||'').slice(0,10))} · теги: ${esc((p.tags||[]).join(', ')||'—')}`;
  }
  function renderCtxBindings(){
    const p = projectsCache.find(x=> x.id===ctxSel.value) || projectsCache[0];
    const name = p ? p.title : 'Проект';
    const rows = ints.filter(i=>i.status==='connected').map(i=> `<div class="hist-item" style="cursor:default"><span>${esc(name)} → ${esc(i.title)}</span><span class="badge-on" style="font-size:10px">в контексте</span></div>`).join('');
    ctxBindings.innerHTML = rows || '<div class="m" style="font-size:12px">Ничего не подключено — нажми Подключить на карточке.</div>';
    // also update integrations ctx box
    const box = $('#ctx-box');
    if(box){
      const connected = ints.filter(i=>i.status==='connected').map(i=>i.title).join(', ') || 'ничего';
      box.innerHTML = `В контексте проекта: <b>${esc(name||'—')}</b> → использует: ${esc(connected)}<br><span class="m" style="font-size:11px">Карты/кошельки/сервисы — где залогинен — отображается здесь и на карточках выше.</span>`;
    }
  }
  ctxSel.addEventListener('change', ()=>{ renderProjectMeta(); renderCtxBindings(); });
  $('#ctx-refresh').addEventListener('click', async ()=>{
    $('#ctx-refresh').textContent='…';
    const list = await fetchProjects();
    renderProjectSelect(list);
    $('#ctx-refresh').textContent='Обновить проекты';
  });
  fetchProjects().then(renderProjectSelect);

  // ---- tasks ----
  function loadTasks(){
    try{ const v=JSON.parse(localStorage.getItem(LS_TASKS)||'null'); if(Array.isArray(v)) return v; }catch{}
    return [
      { id:uid(), text:'Собрать архитектуру для бота', done:false },
      { id:uid(), text:'Найти на бирже 3 заказа по видео', done:true },
      { id:uid(), text:'Подключить YouTube к проекту', done:false },
    ];
  }
  let tasks = loadTasks();
  function saveTasks(){ try{ localStorage.setItem(LS_TASKS, JSON.stringify(tasks)); }catch{} }
  function renderTasks(){
    const box=$('#arch-tasks'); if(!box) return;
    box.innerHTML = tasks.map(t=> `<label class="task-row"><input type="checkbox" ${t.done?'checked':''} data-id="${esc(t.id)}"><span style="${t.done?'text-decoration:line-through;opacity:.6':''}">${esc(t.text)}</span><button data-del="${esc(t.id)}" class="btn hol" style="margin-left:auto;padding:4px 8px;border-radius:8px;font-size:11px">✕</button></label>`).join('') || '<div class="m" style="font-size:12px">Задач нет</div>';
    box.querySelectorAll('input[type="checkbox"]').forEach(cb=> cb.addEventListener('change', ()=>{
      const t=tasks.find(x=>x.id===cb.dataset.id); if(t){ t.done=cb.checked; saveTasks(); renderTasks(); }
    }));
    box.querySelectorAll('[data-del]').forEach(b=> b.addEventListener('click', ()=>{
      tasks=tasks.filter(x=>x.id!==b.dataset.del); saveTasks(); renderTasks();
    }));
  }
  renderTasks();
  function addTask(){
    const inp=$('#task-input'); const text=(inp.value||'').trim(); if(!text) return;
    tasks.unshift({ id:uid(), text, done:false }); inp.value=''; saveTasks(); renderTasks();
  }
  $('#task-add').addEventListener('click', addTask);
  $('#task-input').addEventListener('keydown', e=>{ if(e.key==='Enter') addTask(); });

  // ---- dashboard (W5) — ywoom_dashboard_v1 ----
  (function(){
    var LS_DASH='ywoom_dashboard_v1';
    function loadDash(){
      try{ var v=JSON.parse(localStorage.getItem(LS_DASH)||'null'); if(v&&Array.isArray(v.layout)) return v; }catch(e){}
      return {version:1, layout:[
        {id:'portfolio', type:'fixed', locked:true, kind:'grid', w:1,h:1, config:{fields:['count','last','tags','pipe','auto']}},
        {id:'economy',   type:'fixed', locked:true, kind:'grid', w:1,h:1, config:{fields:['spark','balance','limit','storage']}},
        {id:'conveyor',  type:'widget', kind:'grid', w:1,h:1, config:{}},
        {id:'best',       type:'widget', kind:'grid', w:1,h:1, config:{}},
        {id:'queue',      type:'widget', kind:'grid', w:1,h:1, config:{}},
        {id:'eff',        type:'widget', kind:'grid', w:1,h:1, config:{}},
        {id:'autonomy',   type:'widget', kind:'grid', w:1,h:1, config:{}},
        {id:'autopilot',  type:'widget', kind:'grid', w:1,h:1, config:{}}
      ], updatedAt:new Date().toISOString()};
    }
    function saveDash(d){ try{ localStorage.setItem(LS_DASH, JSON.stringify(d)); }catch(e){} }
    var dashCreate=$('#dash-create'), dashType=$('#dash-type'), dashTitle=$('#dash-title'), dashMetric=$('#dash-metric'), dashFactory=$('#dash-factory'), dashProject=$('#dash-project'), dashHint=$('#dash-create-hint');
    var dashEditBlock=$('#dash-edit-block'), dashEditFields=$('#dash-edit-fields'), dashEditSave=$('#dash-edit-save'), dashEditReset=$('#dash-edit-reset'), dashEditHint=$('#dash-edit-hint');
    var dashOpenHome=$('#dash-open-home'), dashClear=$('#dash-clear');
    function refreshEditFields(){
      if(!dashEditBlock||!dashEditFields) return;
      var d=loadDash(); var it=d.layout.find(function(x){ return x.id===dashEditBlock.value; });
      dashEditFields.value = it && it.config && it.config.fields ? it.config.fields.join(', ') : '';
      if(dashEditHint) dashEditHint.textContent='';
    }
    if(dashEditBlock) dashEditBlock.addEventListener('change', refreshEditFields);
    refreshEditFields();
    if(dashCreate) dashCreate.addEventListener('click', function(){
      var title=(dashTitle.value||'').trim() || 'Трекер '+(dashMetric.value||'metric').slice(0,18);
      var metric=(dashMetric.value||'').trim() || '/api/offline/projects';
      var factory=(dashFactory.value||'content-factory').trim();
      var projectId=(dashProject.value||'').trim() || '—';
      var type=(dashType.value||'custom');
      var id='w-'+uid();
      var d=loadDash();
      d.layout.push({id:id, type:type==='custom'?'custom':'widget', kind:'grid', w:1,h:1, locked:false, source:{factoryId:factory, projectId:projectId, metric:metric}, config:{title:title, fields:[metric], metric:metric}});
      d.updatedAt=new Date().toISOString(); saveDash(d);
      if(dashHint) dashHint.textContent='Создан '+id+' → открой Главную (релоад).';
      // also push a mock chat line for evidence
      try{ var dialogs=JSON.parse(localStorage.getItem(LS_DIALOGS)||'null'); }catch(e){}
      setTimeout(function(){ if(dashHint) dashHint.textContent='Готово: '+title+' ('+metric+'). Релоад Главной покажет карточку.'; }, 900);
    });
    if(dashEditSave) dashEditSave.addEventListener('click', function(){
      var block=(dashEditBlock.value||'portfolio');
      var raw=(dashEditFields.value||'').trim();
      if(!raw){ if(dashEditHint) dashEditHint.textContent='Укажи поля через запятую.'; return; }
      var fields=raw.split(',').map(function(s){return s.trim();}).filter(Boolean);
      var d=loadDash(); var it=d.layout.find(function(x){ return x.id===block; });
      if(!it){ if(dashEditHint) dashEditHint.textContent='Блок не найден.'; return; }
      it.config = it.config||{}; it.config.fields=fields; d.updatedAt=new Date().toISOString(); saveDash(d);
      if(dashEditHint) dashEditHint.textContent='Сохранено: '+block+' → '+fields.join(', ');
      refreshEditFields();
    });
    if(dashEditReset) dashEditReset.addEventListener('click', function(){
      var block=(dashEditBlock.value||'portfolio');
      var d=loadDash(); var it=d.layout.find(function(x){ return x.id===block; });
      if(!it) return;
      if(block==='portfolio') it.config.fields=['count','last','tags','pipe','auto'];
      else if(block==='economy') it.config.fields=['spark','balance','limit','storage'];
      d.updatedAt=new Date().toISOString(); saveDash(d);
      refreshEditFields();
      if(dashEditHint) dashEditHint.textContent='Сброшено к дефолту: '+block;
    });
    if(dashOpenHome) dashOpenHome.addEventListener('click', function(){ location.href='/'; });
    if(dashClear) dashClear.addEventListener('click', function(){
      if(!confirm('Сбросить дашборд к дефолту? Кастомные виджеты удалятся.')) return;
      try{ localStorage.removeItem(LS_DASH); }catch(e){}
      if(dashHint) dashHint.textContent='Сброшено. Релоад Главной — дефолт.';
      if(dashEditHint) dashEditHint.textContent='';
      refreshEditFields();
    });
  })();

  // expose for QA
  window.__arch = { setTab, nodes, DEFAULT_FILES };
})();

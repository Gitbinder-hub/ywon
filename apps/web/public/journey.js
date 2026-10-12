import { STORAGE_KEY, FIELDS, FACTORIES, FACTORY_FIELDS, freshDraft, readRecord, missingFields, outline, splitScript, invalidate, blockers, approve, approved, toPlan, planKey, matchingProjects, commitRecord, replaceRecord } from './journey-core.js';
const $ = (id) => document.getElementById(id);
let draft = freshDraft(), revision = 0, dirty = false, conflict = false, busy = false, timer = null, saving = Promise.resolve();
const titles = ['Фабрика и недостающие данные', 'План / сценарий', 'Допущения и подтверждение', 'Следующий шаг'];
const FACTORY_LABEL = ()=> (FACTORIES[draft.factory]||FACTORIES['content-factory']).label;
const status = (s) => { $('status').textContent = s; };
const error = (s) => { $('error').textContent = s; $('error').hidden = !s; };
function node(tag, text, cls) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (cls) el.className = cls; return el; }
function button(text, id, fn) { const el = node('button', text); el.type = 'button'; if (id) el.id = id; el.addEventListener('click', () => action(fn)); return el; }
function changed(content = true) { if (content) { const hadApproval = draft.approval !== null; invalidate(draft); if (hadApproval) status('План изменён. Предыдущее подтверждение недействительно; проверь новую версию.'); } dirty = true; $('saved').textContent = 'Есть несохранённые изменения'; clearTimeout(timer); timer = setTimeout(() => save().catch((e) => error(e.message)), 400); }
async function save() {
  clearTimeout(timer);
  const run = async () => {
    if (conflict) throw new Error('Сначала разреши конфликт: текущие ответы сохранены в форме. Кнопка «Продолжить сохранённый» загрузит новую версию после подтверждения.');
    const before = JSON.stringify(draft), snapshot = JSON.parse(before);
    const r = await commitRecord(localStorage, navigator.locks, revision, snapshot);
    revision = r.revision; dirty = JSON.stringify(draft) !== before;
    $('saved').textContent = dirty ? 'Есть новые несохранённые изменения' : 'Сохранено в браузере · r' + revision;
    return r;
  };
  const promise = saving.then(run, run); saving = promise.catch(() => {}); return promise;
}
async function action(fn) {
  if (busy) return; busy = true; error(''); setDisabled(true);
  let failed = false; const previousMode = draft.mode, previousStep = draft.step;
  try { await fn(); } catch (e) { failed = true; draft.mode = previousMode; draft.step = previousStep; error(e.message || 'Не удалось выполнить действие. Ответы остаются в форме.'); }
  finally { busy = false; if (!failed || draft.step === 3) render(); setDisabled(false); if (failed) { $('error').tabIndex = -1; $('error').focus(); } else focusStep(); }
}
function setDisabled(value) { for (const el of document.querySelectorAll('button,input,select,textarea')) el.disabled = value; if (!value) { $('back').disabled = draft.step === 0; if ($('generate')) $('generate').disabled = true; } }
function field(key, label, target, parent, choices, max) {
  const wrap = node('label', label); const input = node(choices ? 'select' : 'textarea'); input.id = 'field-' + key;
  if (choices) for (const [v, text] of [['', 'Выберите явно'], ...choices]) { const o = node('option', text); o.value = v; input.append(o); }
  else { input.rows = key === 'sourceNotes' ? 4 : 2; input.maxLength = max; }
  input.value = String(target[key]);
  input.addEventListener(choices ? 'change' : 'input', () => {
    target[key] = key === 'duration' ? (input.value === '' ? '' : Number(input.value)) : input.value;
    changed();
    if (draft.mode === 'talk' && choices) status('Ответ записан. Нажми «Сохранить ответ», чтобы перейти к следующему вопросу.');
  }); wrap.append(input); parent.append(wrap); return input;
}
function briefField(k, parent) {
  const fields = FACTORY_FIELDS[draft.factory] || FIELDS;
  const row = fields.find(([key]) => key === k) || FIELDS.find(([key])=>key===k) || [k,k,200];
  const choices = k === 'language' ? [['ru', 'Русский · единственный пилотный язык']] : k === 'duration' ? Array.from({ length: 31 }, (_, i) => [String(i + 30), String(i + 30) + ' сек.']) : k === 'aspect' ? [['portrait', 'Вертикальный · 9:16'], ['landscape', 'Горизонтальный · 16:9']] : k==='platforms' ? [['kwork','Kwork'],['fl','FL.ru'],['freelancer','Freelancer.com'],['kwork,fl','Kwork + FL'],['kwork,fl,freelancer','Все три']] : k==='platform' ? [['telegram','Telegram'],['discord','Discord'],['web_widget','Web-виджет']] : k==='language_code' ? [['typescript','TypeScript'],['python','Python']] : k==='schedule' ? [['daily','Ежедневно'],['3xweek','3× в неделю'],['weekly','Еженедельно'],['2daily','2× в день']] : null;
  if (k==='platforms' || k==='platform' || k==='language_code' || k==='schedule') {
    const sel = field(k, row[1], draft.brief, parent, choices, 0);
    sel.addEventListener('change', ()=>{ draft.brief[k]=sel.value; changed(false); });
    return sel;
  }
  return field(k, row[1], draft.brief, parent, choices, row[2]);
}
function factorySwitcher(parent){
  const wrap = document.createElement('div'); wrap.style.cssText='display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px';
  const sel = document.createElement('select'); sel.style.cssText='padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:#35373f;color:#ecebf4';
  for(const [id, meta] of Object.entries(FACTORIES)){ const o=document.createElement('option'); o.value=id; o.textContent=meta.label; if(id===draft.factory) o.selected=true; sel.append(o); }
  sel.addEventListener('change', ()=> action(async()=>{ draft.factory=sel.value; if(FACTORY_FIELDS[draft.factory]){ /* keep goal/audience */ } draft.step=0; changed(false); await save(); }));
  const hint=document.createElement('span'); hint.className='m'; hint.style.fontSize='12px'; hint.textContent=(FACTORIES[draft.factory]||{}).hint||'';
  sel.addEventListener('change', ()=> hint.textContent=(FACTORIES[sel.value]||{}).hint||'');
  wrap.append(sel, hint); parent.append(wrap);
}
function checkbox(key, text, parent) {
  const label = node('label', undefined, 'check'), input = node('input'); input.type = 'checkbox'; input.id = key; input.checked = draft[key];
  input.addEventListener('change', () => { draft[key] = input.checked; draft.approval = null; changed(false); }); label.append(input, node('span', text)); parent.append(label);
}
function renderBrief(surface) {
  surface.append(node('p', `Фабрика: ${FACTORY_LABEL()} — ${FACTORIES[draft.factory].hint}`));
  const url = new URLSearchParams(location.search).get('factory');
  if(url && FACTORIES[url] && url!==draft.factory){ draft.factory=url; changed(false); save().catch(()=>{}); }
  factorySwitcher(surface);
  if (draft.mode === 'talk') {
    surface.append(node('p', 'Офлайн-вопросы по правилам, не AI-чат. Спрашиваем только недостающие обязательные данные.'));
    const missing = missingFields(draft);
    if (missing.length) { const key = missing[0]; briefField(key, surface); surface.append(button('Сохранить ответ', 'answer', async () => { if (missingFields(draft).includes(key)) throw new Error('Заполни ответ на текущий вопрос'); await save(); status('Ответ сохранён. Следующий вопрос — только о недостающем.'); })); }
    else surface.append(node('p', 'Обязательные ответы собраны. Можно перейти к следующему шагу или изменить их в «Проведи меня».'));
  } else {
    surface.append(node('p', draft.mode === 'import' ? 'Если сценарий уже готов, вставь его ниже. Бриф остаётся общим.' : 'Короткие шаги подготовки. Выбирай только известные параметры, без скрытых настроек.'));
    for (const [key] of (FACTORY_FIELDS[draft.factory]||FIELDS)) briefField(key, surface);
  }
  if (draft.factory==='content-factory') field('sourceNotes', 'Проверенные факты / заметки источников (необязательно сейчас)', draft.brief, surface, null, 2000);
  else field('sourceNotes', 'Заметки / проверенные факты (если есть)', draft.brief, surface, null, 2000);
  if (draft.mode === 'import') field('script', 'Твой готовый сценарий: 1–6 абзацев', draft, surface, null, 4000);
}
function demoFreelanceBox(surface){
  const box=node('div'); box.style.cssText='background:rgba(125,156,255,.08);border:1px solid rgba(125,156,255,.18);border-radius:14px;padding:14px';
  box.append(node('p','Демо без платных вызовов: 3 примера лотов + gate >10% preview.'));
  const sample=[
    { platform:'Kwork', title:'Сделать лендинг на Next.js', budget:15000 },
    { platform:'FL', title:'Бот Telegram + платежи', budget:25000 },
    { platform:'Freelancer', title:'Auto outreach script', budget: 45 },
  ];
  const list=node('div'); list.style.cssText='display:grid;gap:8px;margin-top:10px';
  for(const it of sample){
    const row=node('div'); row.style.cssText='display:flex;justify-content:space-between;gap:12px;padding:10px 12px;background:rgba(255,255,255,.05);border-radius:12px;border:1px solid rgba(255,255,255,.07)';
    const left=node('div'); left.append(node('div', `${it.platform} · ${it.title}`), node('div', `Бюджет: ${it.budget}`, 'm'));
    const gate=node('span'); const over = it.budget>20000; gate.textContent= over? 'gate >10% → пауза' : 'в лимите'; gate.style.cssText=`padding:6px 10px;border-radius:999px;font-size:11px;background:${over?'#3a2330':'#203a2e'};color:${over?'#ffb3c8':'#8ed8be'};align-self:center`;
    row.append(left, gate); list.append(row);
  }
  const btn=button('Скопировать пример черновика ставки', 'demo-bid', async()=>{
    const text=`[${draft.factory}] query=${draft.brief.query||'(пусто)'} platforms=${draft.brief.platforms} goal=${draft.brief.goal.slice(0,80)} — черновик, human approval required, gate >10%`;
    try{ await navigator.clipboard.writeText(text); status('Скопировано — вставь в Скилы/freelance-autopilot как draft.'); }catch{ status(text); }
  });
  box.append(list, node('p','Отправка ставки — только после твоего human approval. Смета/резерв — в Наблюдении.'), btn);
  surface.append(box);
}
function demoBotBox(surface){
  const box=node('div'); box.style.cssText='background:rgba(125,156,255,.08);border:1px solid rgba(125,156,255,.18);border-radius:14px;padding:14px';
  const cmds=(draft.brief.commands||'/start, /help').split(',').map(s=>s.trim()).filter(Boolean);
  box.append(node('p', `Scaffold preview: ${draft.brief.platform||'telegram'} · ${draft.brief.language_code||'typescript'} · ${cmds.length} команд`), node('pre', `token: <не хранится, stub_without_token>\n${cmds.map(c=>`command ${c} → handler stub`).join('\n')}\nqa_commands → preview_url (локально)`));
  const copy=button('Скопировать scaffold-манифест', 'demo-bot', async()=>{
    const m={ factory: draft.factory, platform: draft.brief.platform, language: draft.brief.language_code, commands: cmds, note: 'token не в артефакте; публикация только после approval' };
    try{ await navigator.clipboard.writeText(JSON.stringify(m,null,2)); status('Скопировано.'); }catch{ status(JSON.stringify(m)); }
  });
  box.append(node('p','Токен не попадёт в артефакт — degraded stub_without_token до approval.'), copy);
  surface.append(box);
}
function demoCodeBox(surface){
  const box=node('div'); box.style.cssText='background:rgba(125,156,255,.08);border:1px solid rgba(125,156,255,.18);border-radius:14px;padding:14px';
  box.append(node('p', `Заготовка: ${draft.brief.stack||'stack не указан'} — goal: ${draft.brief.goal.slice(0,80)||'—'}`), node('pre', `scaffold → files: src/, tests/, README\nqa_syntax → lint/typecheck`));
  const copy=button('Скопировать план заготовки', 'demo-code', async()=>{
    const m={ factory: draft.factory, goal: draft.brief.goal.slice(0,200), stack: draft.brief.stack, audience: draft.brief.audience };
    try{ await navigator.clipboard.writeText(JSON.stringify(m,null,2)); status('Скопировано.'); }catch{ status(JSON.stringify(m)); }
  });
  box.append(copy); surface.append(box);
}
function demoTelegramBox(surface){
  const box=node('div'); box.style.cssText='background:rgba(125,156,255,.08);border:1px solid rgba(125,156,255,.18);border-radius:14px;padding:14px';
  const ch=draft.brief.channel||'@example'; const sch=draft.brief.schedule||'daily'; const lang=draft.brief.language||'ru';
  const posts=[
    { time:'09:00', kind:'Польза', title:`${draft.brief.goal.slice(0,28)||'Тема'} — разбор` },
    { time:'15:00', kind:'Кейс', title:'Кейс / пример' },
    { time:'19:00', kind:'Вовлечение', title:'Вопрос / опрос' },
  ];
  box.append(node('p', `Канал: ${ch} · Частота: ${sch} · Язык: ${lang} · Аудитория: ${(draft.brief.audience||'—').slice(0,60)}`));
  const list=node('div'); list.style.cssText='display:grid;gap:8px;margin-top:10px';
  for(const p of posts){
    const row=node('div'); row.style.cssText='display:flex;justify-content:space-between;gap:12px;padding:10px 12px;background:rgba(255,255,255,.05);border-radius:12px;border:1px solid rgba(255,255,255,.07)';
    row.append(node('div', `${p.time} · ${p.kind} — ${p.title}`), node('span','черновик · права/факты проверяет человек','m')); list.append(row);
  }
  const planBtn=button('Скопировать контент-план (3 поста)', 'demo-tg-plan', async()=>{
    const plan={ factory: draft.factory, channel: ch, schedule: sch, language: lang, goal: draft.brief.goal.slice(0,300), posts };
    try{ await navigator.clipboard.writeText(JSON.stringify(plan,null,2)); status('Скопировано — контент-план. Публикация — по расписанию после approval.'); }catch{ status(JSON.stringify(plan)); }
  });
  box.append(list, node('p','Публикация — по расписанию после твоего approval. Факты/права проверяет человек, не LLM. Черновики хранятся как локальный проект-след.'), planBtn);
  surface.append(box);
}
function renderPlan(surface) {
  if(draft.factory!=='content-factory'){
    surface.append(node('p', `План для «${FACTORY_LABEL()}» — детерминирован, без AI-генерации. Проверь бриф на предыдущем шаге и переходи к подтверждению.`));
    const box=node('div'); box.style.cssText='background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px';
    box.append(node('p', `Ключевые поля: ${(FACTORY_FIELDS[draft.factory]||[]).map(([k,l])=>l).join(' · ')}`));
    box.append(node('p', draft.brief.goal? `Цель: ${draft.brief.goal.slice(0,120)}` : 'Цель пока пуста — вернись на шаг 0.'));
    if(draft.brief.query) box.append(node('p', `Query: ${draft.brief.query} · Биржи: ${draft.brief.platforms} · Floor: ${draft.brief.budget_floor||0}`));
    if(draft.brief.platform) box.append(node('p', `Платформа: ${draft.brief.platform} · Команды: ${draft.brief.commands||'—'} · Язык: ${draft.brief.language_code||'—'}`));
    surface.append(box);
    if(draft.factory==='freelance-autopilot') demoFreelanceBox(surface);
    else if(draft.factory==='bot-factory') demoBotBox(surface);
    else if(draft.factory==='code-scaffold') demoCodeBox(surface);
    else if(draft.factory==='telegram-network') demoTelegramBox(surface);
    return;
  }
  surface.append(node('p', 'Здесь нет генерации текста. Можно получить структуру с подсказками, затем написать или вставить свой проверенный сценарий.'));
  surface.append(button('Предложить структуру без AI', 'outline', async () => { if (draft.script && !confirm('Заменить текущий сценарий шаблонной структурой? Ручные правки будут заменены.')) return; draft.script = outline(draft); changed(); await save(); }));
  field('script', 'Сценарий озвучки · до 4000 символов', draft, surface, null, 4000);
  surface.append(button('Обновить сцены из абзацев', 'split', async () => { if (draft.scenes.length && !confirm('Обновить плашки сцен из абзацев? Текущие плашки будут заменены.')) return; draft.scenes = splitScript(draft.script); draft.sceneScript = draft.script; changed(); await save(); }));
  if (draft.sceneScript !== draft.script && draft.scenes.length) surface.append(node('p', 'Сценарий изменён. Обнови сцены и проверь их перед подтверждением.', 'notice'));
  for (let i = 0; i < draft.scenes.length; i++) field('text', 'Сцена ' + (i + 1) + ' · плашка (до 180 символов)', draft.scenes[i], surface, null, 180).id = 'scene-' + i;
  surface.append(node('p', 'Разбивка детерминированная: абзацы → равные интервалы, плашка — первые 160 символов. Это не содержательное AI-планирование.'));
}
function renderConfirm(surface) {
  const meta = FACTORIES[draft.factory];
  const summary = node('section'); summary.append(node('h3', `Что переносим — ${meta.label}`), node('p', draft.brief.goal), node('p', 'Аудитория: ' + draft.brief.audience));
  if(draft.factory==='content-factory') { summary.append(node('p', 'Русский · ' + draft.brief.duration + ' сек. · ' + (draft.brief.aspect === 'portrait' ? 'вертикальный 9:16' : 'горизонтальный 16:9'))); summary.append(node('pre', draft.script)); const list = node('ol'); for (const s of draft.scenes) list.append(node('li', s.text)); summary.append(list); }
  else if(draft.factory==='freelance-autopilot') summary.append(node('p', `Поиск: ${draft.brief.query} · Биржи: ${draft.brief.platforms} · Floor: ${draft.brief.budget_floor||0}`), node('pre', draft.brief.goal + (draft.brief.sourceNotes? '\n\n'+draft.brief.sourceNotes:'')));
  else if(draft.factory==='bot-factory') summary.append(node('p', `Платформа: ${draft.brief.platform} · Язык: ${draft.brief.language_code||'typescript'}`), node('p', `Команды: ${draft.brief.commands||'—'}`), node('pre', draft.brief.goal));
  else if(draft.factory==='telegram-network') summary.append(node('p', `Канал: ${draft.brief.channel||'—'} · График: ${draft.brief.schedule||'daily'} · Язык: ${draft.brief.language||'ru'}`), node('pre', draft.brief.goal));
  else summary.append(node('pre', JSON.stringify({goal: draft.brief.goal, query: draft.brief.query, platforms: draft.brief.platforms, platform: draft.brief.platform, commands: draft.brief.commands, stack: draft.brief.stack, channel: draft.brief.channel, schedule: draft.brief.schedule}, null, 2)));
  surface.append(summary);
  const materials = node('section'); materials.append(node('h3', 'Материалы и допущения'), node('p', meta.hint), node('p', draft.brief.sourceNotes || 'Источники/факты не записаны. Проверь их самостоятельно до финала.')); surface.append(materials);
  const cost = node('section'); cost.append(node('h3', 'Стоимость и разрешения'), node('p', draft.factory==='content-factory' ? 'AI-генерация по этой фабрике — локальная FFmpeg-сборка, без платных вызовов. Смета генерации не рассчитана — неизвестная стоимость не означает $0.' : 'Эта фабрика работает по approved envelope: смету и reserve увидишь в Наблюдении. Подтверждается только текущий офлайн-план.'), node('p', 'Подтверждается только текущий офлайн-план. Это не разрешение на оплату, публикацию или будущий scope.')); surface.append(cost);
  checkbox('scriptReviewed', draft.factory==='content-factory' ? 'Проверил сценарий, факты и плашки сцен; они соответствуют задаче' : `Проверил бриф фабрики «${meta.label}»`, surface);
  checkbox('rights', 'Подтверждаю право использовать материалы, которые сам добавлю', surface);
  checkbox('finalReview', draft.factory==='content-factory' ? 'Проверю финальный ролик вручную перед использованием' : 'Проверю результат вручную перед использованием', surface);
  surface.append(button('Подтвердить план — ' + meta.label, 'approve', async () => { approve(draft); draft.step = 3; changed(false); await save(); status('Подтверждена текущая версия офлайн-плана: ' + meta.label); }));
}
async function request(path, method = 'GET', value) {
  const response = await fetch('/api/offline' + path, { method, ...(value === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(value) }) });
  let body; try { body = await response.json(); } catch { throw new Error('Сервер вернул некорректный ответ. Новый запрос автоматически не выполняется.'); }
  if (!response.ok) throw new Error(body.error || 'Ошибка локального сервера'); return body;
}
async function transfer() {
  if (!navigator.locks?.request) throw new Error('Нужен браузер с Web Locks');
  await navigator.locks.request(STORAGE_KEY + '.transfer', async () => {
    const plan = toPlan(draft), key = planKey(plan);
    if (draft.handoff?.key === key) {
      const matches = matchingProjects(await request('/projects'), key);
      if (matches.length === 1) { draft.handoff = { key, state: 'ready', id: matches[0].id }; changed(false); await save(); status('Найден сохранённый проект. Повторное создание не выполнялось.'); return; }
      if (matches.length > 1) throw new Error('Найдено несколько похожих проектов. Открой студию и выбери нужный; автоматически новый не создаём.');
      if (!confirm('Создание не подтверждено. Проверь историю в студии. Явно разрешить новый запрос создания? Возможен дубликат локального проекта; платной генерации нет.')) return;
    }
    draft.handoff = { key, state: 'pending', id: null }; changed(false); await save();
    try {
      const p = await request('/projects', 'POST', plan);
      if (!p || typeof p.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(p.id)) throw new Error('Некорректное подтверждение проекта');
      draft.handoff = { key, state: 'ready', id: p.id }; changed(false); await save(); status('Проект создан на локальном диске. Добавь материалы в студии.');
    } catch (e) { throw new Error('Создание/сохранение не подтверждено: ' + e.message + ' Ответы сохранены. Нажми «Проверить сохранённый проект» или открой студию; автоматического повтора нет.'); }
  });
}
function updateJourneyLink(){ const el=document.getElementById('to-studio-preset'); if(!el) return; try{ const p=toPlan(draft); el.style.display='inline'; el.href='/studio?from=journey&draft='+encodeURIComponent(JSON.stringify({title:p.title, script:p.script})); }catch{ el.style.display='none'; } }
function renderDeliver(surface) {
  if (!approved(draft)) { surface.append(node('p', 'План изменился или ещё не подтверждён. Вернись к карточкам подтверждения.', 'notice')); return; }
  const meta = FACTORIES[draft.factory];
  if(draft.factory!=='content-factory'){
    const info=node('div'); info.style.cssText='background:rgba(125,156,255,.08);border:1px solid rgba(125,156,255,.2);border-radius:14px;padding:14px';
    info.append(node('p', `Фабрика «${meta.label}» — Маршрут зафиксирован. Дальше — исполнение по скилу.`));
    if(draft.factory==='freelance-autopilot') info.append(node('p', 'Следующие шаги: поиск проектов по query → черновики ставок → gate >10% → human approval. Отправка только после твоего подтверждения.'));
    if(draft.factory==='bot-factory') info.append(node('p', 'Следующие шаги: scaffold по platform/commands → QA команд → человечий approval → публикация бота.'));
    if(draft.factory==='code-scaffold') info.append(node('p', 'Следующие шаги: scaffold → qa_commands / qa_syntax → отчёт.'));
    if(draft.factory==='telegram-network') info.append(node('p', 'Следующие шаги: контент-план (3 поста) → черновики → QA прав/фактов → публикация по расписанию после approval.'));
    const toSkills=node('a', 'Открыть скиллы фабрики'); toSkills.href='/skills'; toSkills.style.cssText='display:inline-flex;padding:10px 16px;border-radius:14px;background:#7d9cff;color:#1b2038;text-decoration:none;font-weight:600;margin-top:10px';
    const toObs=node('a', 'В Наблюдение'); toObs.href='/billing'; toObs.style.cssText='display:inline-flex;padding:10px 16px;border-radius:14px;background:#35373f;color:#ecebf4;text-decoration:none;margin-top:10px;margin-left:8px';
    surface.append(info, toSkills, toObs);
    // keep offline project transfer for traceability
    const key = planKey(toPlan(draft));
    if (draft.handoff?.key === key && draft.handoff.state === 'ready') { const link = node('a', 'Открыть проект-след в Студии'); link.id = 'studio-project'; link.href = '/studio?projectId=' + encodeURIComponent(draft.handoff.id); link.style.cssText='display:block;margin-top:12px;color:#7d9cff'; surface.append(link); }
    else { surface.append(button(draft.handoff?.key === key ? 'Проверить проект-след' : 'Создать проект-след (локально)', 'transfer', transfer)); }
    return;
  }
  const disabled = button('AI-генерация пока недоступна', 'generate', () => {}); disabled.disabled = true; disabled.setAttribute('aria-describedby', 'generation-limit'); surface.append(disabled, node('p', 'Для настоящей генерации ещё нужны API, проверенный маршрут, бюджет и реальные evals. Прототип этого не реализует.'));
  surface.lastChild.id = 'generation-limit';
  updateJourneyLink();
  const key = planKey(toPlan(draft));
  if (draft.handoff?.key === key && draft.handoff.state === 'ready') { const link = node('a', 'Открыть подготовленный проект в офлайн-студии'); link.id = 'studio-project'; link.href = '/studio?projectId=' + encodeURIComponent(draft.handoff.id); surface.append(node('p', 'Готов только план: изображения и готовую речь ещё нужно добавить самостоятельно.'), link); }
  else surface.append(button(draft.handoff?.key === key ? 'Проверить сохранённый проект' : 'Подготовить проект для ручного монтажа', 'transfer', transfer));
  surface.append(node('p', 'Этот шаг создаёт локальный проект без материалов, не MP4 и не AI-контент. После добавления материалов существующий FFmpeg-монтаж может собрать реальное видео.'));
}
function render() {
  for (const el of $('modes').querySelectorAll('button')) el.setAttribute('aria-pressed', String(el.dataset.mode === draft.mode));
  $('progress').replaceChildren(...titles.map((t, i) => { const li = node('li', t); if (i === draft.step) li.setAttribute('aria-current', 'step'); return li; }));
  const surface = $('surface'); surface.replaceChildren(node('h2', titles[draft.step])); surface.firstChild.id = 'step-title'; surface.firstChild.tabIndex = -1;
  [renderBrief, renderPlan, renderConfirm, renderDeliver][draft.step](surface);
  $('back').disabled = draft.step === 0; $('next').hidden = draft.step >= 2;
  $('next').textContent = draft.step === 0 ? 'К сценарию и сценам' : 'К материалам и подтверждению';
  if (busy) setDisabled(true);
}
function focusStep() { $('step-title').focus(); }
for (const el of $('modes').querySelectorAll('button')) el.addEventListener('click', () => action(async () => { draft.mode = el.dataset.mode; changed(false); await save(); focusStep(); }));
$('save').addEventListener('click', () => action(async () => { await save(); status('Черновик сохранён в этом браузере.'); }));
$('reload').addEventListener('click', () => action(async () => { clearTimeout(timer); await saving; if (dirty && !confirm('Загрузить сохранённую версию вместо текущих несохранённых правок?')) return; const r = readRecord(localStorage.getItem(STORAGE_KEY)); if (!r) throw new Error('Сохранённого черновика пока нет'); draft = r.draft; revision = r.revision; dirty = false; conflict = false; $('saved').textContent = 'Загружена версия r' + revision; status('Черновик продолжен.'); }));
$('new').addEventListener('click', () => action(async () => { clearTimeout(timer); await saving; if (!confirm('Заменить единственный браузерный черновик новым? Локальные проекты/материалы студии не удаляются.')) return; const nextDraft = freshDraft(); const r = await replaceRecord(localStorage, navigator.locks, nextDraft); draft = r.draft; revision = r.revision; dirty = false; conflict = false; $('saved').textContent = 'Сохранено в браузере · r' + revision; status('Создан новый браузерный черновик.'); }));
$('back').addEventListener('click', () => action(async () => { draft.step = Math.max(0, draft.step - 1); changed(false); await save(); }));
$('next').addEventListener('click', () => action(async () => {
  const ff = FACTORY_FIELDS[draft.factory] || FIELDS;
  if (draft.step === 0 && missingFields(draft).length) throw new Error('Нужны ответы: ' + missingFields(draft).map((k) => (ff.find(([key]) => key === k)||[k,k])[1]).join('; '));
  if (draft.step === 1 && draft.factory==='content-factory' && (!draft.script.trim() || !draft.scenes.length || draft.sceneScript !== draft.script)) throw new Error('Добавь сценарий и обнови сцены из абзацев');
  draft.step++; changed(false); await save();
}));
window.addEventListener('storage', (e) => { if (e.key !== STORAGE_KEY) return; conflict = true; clearTimeout(timer); error('Сохранённая версия изменена другой вкладкой. Текущие ответы остаются в форме; продолжи сохранённую версию явно.'); });
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
try { const r = readRecord(localStorage.getItem(STORAGE_KEY)); if (r) { draft = r.draft; revision = r.revision; $('saved').textContent = 'Продолжена версия r' + revision; } } catch (e) { conflict = true; error(e.message + ' Данные не перезаписаны.'); }
render();

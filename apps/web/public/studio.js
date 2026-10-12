'use strict';
const $ = (id) => document.getElementById(id);
let project = null, scenes = [{ text: '', imageId: null }], audioId = null, activeJob = null, dirty = false, busy = false;
let loadVersion = 0, polling = false;

let verifiedBusy = false, verifiedMetadata = null, verifiedAttachCommandId = null;
function syncVerifiedReference() { const button = $('verified-attach'), openEvidence = $('verified-evidence'), downloadEvidence = $('verified-evidence-download'); const reference = project && project.verifiedResultReference; const evidencePath = reference ? '/api/offline/projects/' + encodeURIComponent(project.id) + '/evidence' : ''; openEvidence.hidden = !reference; downloadEvidence.hidden = !reference; if (reference) { openEvidence.href = evidencePath; downloadEvidence.href = evidencePath + '?download=1'; } else { openEvidence.removeAttribute('href'); downloadEvidence.removeAttribute('href'); } if (reference) { button.disabled = true; button.textContent = 'Привязан к проекту'; const shown = verifiedMetadata && verifiedMetadata.receipt && verifiedMetadata.receipt.runId; $('verified-reference-status').textContent = shown && shown !== reference.runId ? 'Проект уже связан с другим запуском: ' + reference.runId + '.' : 'Неизменяемая ссылка сохранена в проекте r' + project.revision + '.'; return; } if (!project) { button.disabled = true; button.textContent = 'Сначала сохраните проект'; $('verified-reference-status').textContent = ''; return; } button.disabled = !verifiedMetadata || dirty; button.textContent = dirty ? 'Сначала сохраните правки' : 'Привязать к проекту (только ссылка)'; $('verified-reference-status').textContent = ''; }
function showVerifiedResult(value) {
  const receipt = value && value.receipt;
  if (!value || value.mode !== 'verified_live_artifact_metadata' || value.mediaAvailable !== false || value.productionReady !== false || value.executionAllowed !== false || value.publicationAllowed !== false || !receipt || receipt.mode !== 'verified_live_artifact_receipt') throw new Error('Сервер вернул неподходящие метаданные результата');
  $('verified-run').textContent = receipt.runId;
  $('verified-format').textContent = receipt.width + '×' + receipt.height + ' · ' + receipt.videoCodec.toUpperCase() + ' / ' + receipt.audioCodec.toUpperCase();
  $('verified-duration').textContent = (receipt.durationMs / 1000).toFixed(2) + ' сек.';
  $('verified-sha').textContent = receipt.sha256;
  verifiedMetadata = value; $('verified-card').hidden = false; syncVerifiedReference();
  $('verified-status').textContent = 'Receipt проверен локальным API. Медиа и публикация недоступны.';
}
async function attachVerifiedResult() { if (verifiedBusy || !verifiedMetadata || !project) return; if (dirty) { $('verified-reference-status').textContent = 'Сначала сохраните изменения проекта.'; return; } verifiedAttachCommandId ||= crypto.randomUUID(); verifiedBusy = true; $('verified-load').disabled = true; $('verified-attach').disabled = true; try { project = await api('/projects/' + project.id + '/verified-result', 'POST', { revision: project.revision, runId: verifiedMetadata.receipt.runId, commandId: verifiedAttachCommandId }); verifiedAttachCommandId = null; $('revision').textContent = 'Сохранена версия r' + project.revision; await refreshProjects(); syncVerifiedReference(); } catch (error) { $('verified-reference-status').textContent = error.message || 'Не удалось привязать результат.'; } finally { verifiedBusy = false; $('verified-load').disabled = false; syncVerifiedReference(); } }
async function loadVerifiedResult() {
  if (verifiedBusy) return;
  const runId = String($('verified-run-id').value).trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/.test(runId)) { $('verified-card').hidden = true; $('verified-status').textContent = 'Укажи корректный ID запуска.'; return; }
  verifiedBusy = true; $('verified-load').disabled = true; $('verified-card').hidden = true; $('verified-status').textContent = 'Проверяю receipt…';
  try { const response = await fetch('/api/live-results/' + encodeURIComponent(runId)); let value; try { value = await response.json(); } catch { throw new Error('Сервер вернул некорректный ответ'); } if (!response.ok) throw new Error(value.error === 'result_not_found' ? 'Проверенный результат не найден.' : value.error === 'result_store_unavailable' ? 'Локальное хранилище результатов не подключено.' : 'Не удалось прочитать проверенный результат.'); showVerifiedResult(value); }
  catch (error) { $('verified-status').textContent = error.message || 'Не удалось прочитать проверенный результат.'; }
  finally { verifiedBusy = false; $('verified-load').disabled = false; }
}

const message = (text) => { $('message').textContent = text; };
async function api(path, method = 'GET', value) {
  const options = { method };
  if (value !== undefined) { options.headers = { 'Content-Type': 'application/json' }; options.body = JSON.stringify(value); }
  const response = await fetch('/api/offline' + path, options);
  let result; try { result = await response.json(); } catch { throw new Error('Сервер вернул некорректный ответ'); }
  if (!response.ok) throw new Error(result.error || 'Ошибка локального сервера');
  return result;
}
async function action(fn) {
  if (busy) return; busy = true;
  $('editor').disabled = true; $('projects').disabled = true;
  for (const id of ['new', 'demo', 'save', 'render']) $(id).disabled = true;
  try { message(''); await fn(); } catch (e) { message(e.message || 'Не удалось выполнить действие'); }
  finally { busy = false; $('editor').disabled = false; $('projects').disabled = false; for (const id of ['new', 'demo', 'save', 'render']) $(id).disabled = false; }
}
function plan() { return { title: $('title').value, script: $('script').value, duration: Number($('duration').value), aspect: $('aspect').value, trimAudio: $('trim').checked, audioId, scenes: scenes.map((s) => ({ text: s.text, imageId: s.imageId })) }; }
function drawScenes() {
  $('scenes').replaceChildren();
  scenes.forEach((scene, index) => {
    const box = document.createElement('div'); box.className = 'scene'; box.draggable = true; box.dataset.index = String(index);
    box.addEventListener('dragstart', e => { box.style.opacity='0.5'; e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed='move'; });
    box.addEventListener('dragend', ()=>{ box.style.opacity=''; document.querySelectorAll('.scene').forEach(el=> el.style.outline=''); });
    box.addEventListener('dragover', e=>{ e.preventDefault(); box.style.outline='2px dashed var(--accent)'; e.dataTransfer.dropEffect='move'; });
    box.addEventListener('dragleave', ()=>{ box.style.outline=''; });
    box.addEventListener('drop', e=>{ e.preventDefault(); box.style.outline=''; const from=parseInt(e.dataTransfer.getData('text/plain'),10); const to=index; if(isNaN(from)||from===to) return; const item=scenes.splice(from,1)[0]; scenes.splice(to,0,item); dirty=true; drawScenes(); });
    const head=document.createElement('div'); head.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px';
    const title=document.createElement('span'); title.textContent='⠿ Сцена '+(index+1)+' · плашка'; title.style.cssText='font-size:12px;color:var(--muted);cursor:grab'; title.title='Перетащи или Ctrl+Shift+↑/↓';
    const actions=document.createElement('div'); actions.style.display='flex'; actions.style.gap='6px';
    const up=document.createElement('button'); up.type='button'; up.textContent='↑'; up.className='btn'; up.style.padding='4px 8px'; up.disabled=index===0; up.addEventListener('click', ()=>{ const t=scenes[index]; scenes[index]=scenes[index-1]; scenes[index-1]=t; dirty=true; drawScenes(); });
    const down=document.createElement('button'); down.type='button'; down.textContent='↓'; down.className='btn'; down.style.padding='4px 8px'; down.disabled=index===scenes.length-1; down.addEventListener('click', ()=>{ const t=scenes[index]; scenes[index]=scenes[index+1]; scenes[index+1]=t; dirty=true; drawScenes(); });
    actions.append(up,down); head.append(title,actions); box.append(head);
    const label = document.createElement('label'); label.textContent = 'Текст плашки';
    const input = document.createElement('textarea'); input.value = scene.text; input.maxLength = 180; input.rows = 2;
    input.addEventListener('input', () => { scene.text = input.value; dirty = true; scheduleAutoSave(); }); label.append(input); box.append(label);
    if (scene.imageId) {
      const wrap=document.createElement('div'); wrap.style.cssText='position:relative;margin-top:8px';
      const img = document.createElement('img'); img.src = '/api/offline/assets/' + scene.imageId + '/file'; img.alt = 'Сцена ' + (index + 1); wrap.append(img);
      const rmImg=document.createElement('button'); rmImg.type='button'; rmImg.textContent='✕ убрать'; rmImg.className='btn'; rmImg.style.cssText='position:absolute;top:6px;right:6px;padding:4px 8px;font-size:11px'; rmImg.addEventListener('click', ()=>{ scene.imageId=null; dirty=true; drawScenes(); }); wrap.append(rmImg);
      box.append(wrap);
    }
    // Image drop zone
    const drop=document.createElement('div'); drop.style.cssText='margin-top:8px;border:1px dashed var(--line2);border-radius:10px;padding:14px;text-align:center;color:var(--muted);cursor:pointer;font-size:12px';
    drop.textContent = scene.imageId ? 'Перетащи новую картинку или кликни' : 'Перетащи PNG/JPEG сюда или кликни';
    drop.addEventListener('click', ()=> file.click());
    drop.addEventListener('dragover', e=>{ e.preventDefault(); drop.style.borderColor='var(--accent)'; drop.style.background='rgba(142,216,190,0.06)'; });
    drop.addEventListener('dragleave', ()=>{ drop.style.borderColor=''; drop.style.background=''; });
    drop.addEventListener('drop', e=>{ e.preventDefault(); drop.style.borderColor=''; drop.style.background=''; const f=e.dataTransfer.files[0]; if(f) { const dt=new DataTransfer(); dt.items.add(f); file.files=dt.files; file.dispatchEvent(new Event('change',{bubbles:true})); } });
    box.append(drop);
    const file = document.createElement('input'); file.type = 'file'; file.accept = '.png,.jpg,.jpeg'; file.hidden=true; file.setAttribute('aria-label', 'Изображение сцены ' + (index + 1));
    file.addEventListener('change', () => action(async () => { if (!file.files[0]) return; const a = await upload(file.files[0], 'image'); scene.imageId = a.id; dirty = true; drawScenes(); message('Изображение добавлено. Сохрани проект.'); })); box.append(file);
    const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Удалить сцену'; remove.className='btn'; remove.style.marginTop='8px'; remove.disabled = scenes.length === 1;
    remove.addEventListener('click', () => { scenes.splice(index, 1); dirty = true; drawScenes(); }); box.append(remove); $('scenes').append(box);
  });
  $('add').disabled = scenes.length >= 6;
  // Timeline preview bar
  const tl=document.getElementById('timeline'); if(tl){
    tl.replaceChildren();
    const dur=Number($('duration').value)||30;
    const seg=dur / Math.max(1,scenes.length);
    scenes.forEach((s,i)=>{
      const segEl=document.createElement('div'); segEl.style.cssText=`flex:1;padding:8px 6px;border-radius:8px;background:${i%2===0?'var(--card2)':'#14233a'};border:1px solid var(--line2);text-align:center;font-size:11px;color:var(--muted);min-width:0`;
      segEl.innerHTML=`<div style="font-weight:700;color:var(--text)">${i+1}</div><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${(s.text||'—').slice(0,18)}</div><div>${seg.toFixed(1)}с</div>`;
      if(s.imageId) segEl.style.borderColor='var(--accent)';
      tl.append(segEl);
    });
  }
}
async function upload(file, kind) {
  if (!$('rights').checked) throw new Error('Сначала подтверди права на материалы');
  if (file.size > (kind === 'image' ? 5 : 12) * 1024 * 1024) throw new Error('Файл превышает лимит');
  const data = await new Promise((yes, no) => { const reader = new FileReader(); reader.onload = () => yes(String(reader.result).split(',')[1]); reader.onerror = () => no(new Error('Не удалось прочитать файл')); reader.readAsDataURL(file); });
  return api('/assets', 'POST', { name: file.name, kind, data, rightsConfirmed: true });
}
let dashProjects = [];
let activeTagFilter='';
let sortMode='updated'; // updated | title | pinned
let selectedIds=new Set(); let showHistory=false;
function highlightMatch(text, q){ if(!q) return text; try{ const re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'); return String(text).replace(re,'<mark style="background:var(--accent);color:#0d2118;padding:0 2px;border-radius:3px">$1</mark>'); }catch{ return text; } }
function filteredProjects(){
  const q=($('dash-query')?.value||'').toLowerCase().trim();
  const tag=activeTagFilter.toLowerCase();
  let arr = dashProjects.filter(p=>{
    if(p.deletedAt) return false;
    const hay=(p.title+' '+(p.tags||[]).join(' ')+' '+p.script.slice(0,300)+' '+(p.scenes||[]).map(s=>s.text).join(' ')+' '+(p.pinned?'избранное':'')+' '+(p.diagnostic?'демо':'')).toLowerCase();
    const tagOk = !tag || (p.tags||[]).map(t=>t.toLowerCase()).includes(tag);
    const qOk = !q || hay.includes(q);
    return tagOk && qOk;
  });
  arr.sort((a,b)=>{
    if((!!b.pinned)!=(!!a.pinned)) return (b.pinned?1:0)-(a.pinned?1:0);
    if(sortMode==='title') return a.title.localeCompare(b.title, 'ru');
    if(sortMode==='created') return b.createdAt ? b.createdAt.localeCompare(a.createdAt) : 0;
    return (b.updatedAt||'').localeCompare(a.updatedAt||'');
  });
  return arr;
}
function renderTagPills(){
  const box=$('tag-pills'); if(!box) return;
  const all=new Map();
  dashProjects.forEach(p=> (p.tags||[]).forEach(t=> all.set(t.toLowerCase(), (all.get(t.toLowerCase())||0)+1)));
  box.replaceChildren();
  const mk=(label, count, active)=>{ const b=document.createElement('button'); b.className='btn'; b.style.padding='4px 10px'; b.style.fontSize='12px'; if(active) b.style.borderColor='var(--accent)'; b.textContent=label+(count?` · ${count}`:''); b.addEventListener('click', ()=>{ activeTagFilter = active? '' : label.replace(/^#/,''); renderTagPills(); renderDash(); }); return b; };
  box.append(mk('Все','', !activeTagFilter));
  Array.from(all.entries()).sort((a,b)=>b[1]-a[1]).slice(0,12).forEach(([tag,c])=> box.append(mk('#'+tag, c, activeTagFilter===tag)));
}
function previewExport(id){
  const box=$('export-preview'); if(!box) return;
  box.hidden=false; box.textContent='Загружаю экспорт...';
  fetch('/api/offline/projects/'+encodeURIComponent(id)+'/export').then(r=>r.json()).then(j=>{
    const p=j.project||{};
    const summary = `Проект: ${p.title||'-'}\nСцен: ${(p.scenes||[]).length} · ${p.duration}с · ${p.aspect}\nТеги: ${(p.tags||[]).join(', ')||'—'}\nСкрипт: ${(p.script||'').slice(0,120)}${(p.script||'').length>120?'…':''}`;
    box.textContent=summary;
  }).catch(()=> box.textContent='Не удалось загрузить превью');
}
let trashCache=[];
async function loadTrash(){
  try{ trashCache=await api('/projects/trash'); }catch{ trashCache=[]; }
  const box=$('trash-box'); if(!box) return;
  box.replaceChildren();
  if(!trashCache.length){ box.textContent='Корзина пуста'; return; }
  trashCache.forEach(p=>{
    const row=document.createElement('div'); row.className='card'; row.style.padding='10px'; row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center';
    row.innerHTML=`<span><strong>${p.title}</strong> <span class="sub">удалён ${new Date(p.deletedAt).toLocaleString()}</span> · <span class="sub">${(p.tags||[]).map(t=>'#'+t).join(' ')}</span></span>`;
    const btnR=document.createElement('button'); btnR.className='btn'; btnR.textContent='Восстановить'; btnR.addEventListener('click', async()=>{ await fetch('/api/offline/projects/'+p.id+'/restore', {method:'POST'}).then(r=>{ if(!r.ok) throw new Error('Не удалось'); }); await refreshProjects(); await loadTrash(); message('Восстановлен: '+p.title); });
    const btnH=document.createElement('button'); btnH.className='btn'; btnH.textContent='Удалить навсегда'; btnH.style.color='#ff8a8a'; btnH.addEventListener('click', async()=>{ if(!confirm('Удалить навсегда? Нельзя отменить.')) return; await fetch('/api/offline/projects/'+p.id+'/hard-delete', {method:'DELETE'}).then(r=>{ if(!r.ok) throw new Error('Не удалось'); }); await loadTrash(); message('Удалён навсегда'); });
    const g=document.createElement('div'); g.style.display='flex'; g.style.gap='6px'; g.append(btnR,btnH); row.append(g); box.append(row);
  });
}

function renderDash() {
  const grid = $('dash-grid'), empty = $('dash-empty'), count = $('dash-count'), selector = $('projects');
  if (!grid) return;
  grid.replaceChildren();
  const q = (selector && selector.value) || '';
  // update legacy select
  if (selector) { selector.replaceChildren(); const o0=document.createElement('option'); o0.value=''; o0.textContent='Выбрать проект'; selector.append(o0); dashProjects.forEach(p=>{ const o=document.createElement('option'); o.value=p.id; o.textContent=p.title+' · r'+p.revision; selector.append(o); }); selector.value = project ? project.id : q; }
  renderTagPills();
  const visible = filteredProjects();
  if (!dashProjects.length) { grid.hidden=true; if(empty) empty.hidden=false; if(count) count.textContent=''; return; }
  // filtered count hint
  if(count) count.textContent = visible.length===dashProjects.length ? dashProjects.length + ' проект(ов)' : visible.length+' / '+dashProjects.length;
  if(!visible.length){ grid.hidden=true; if(empty){ empty.hidden=false; empty.querySelector('h3').textContent='Ничего не найдено'; } return; } else if(empty){ empty.querySelector('h3').textContent='Пока пусто — начни с демо или импорта'; }
  grid.hidden=false; if(empty) empty.hidden=true;
  if(count) count.textContent = dashProjects.length + ' проект(ов)';
  visible.forEach(p=>{
    const card=document.createElement('div'); card.className='pcard'; card.setAttribute('data-pcard',''); card.setAttribute('data-title',p.title); card.setAttribute('data-status', p.diagnostic?'демо':'готов');
    const chk=document.createElement('input'); chk.type='checkbox'; chk.checked=selectedIds.has(p.id); chk.title='Выделить'; chk.style.cssText='position:absolute;top:8px;left:8px;width:16px;height:16px'; chk.addEventListener('click', (e)=>{ e.stopPropagation(); if(chk.checked) selectedIds.add(p.id); else selectedIds.delete(p.id); renderDash(); updateBulkBar(); });
    const thumb=document.createElement('div'); thumb.className='thumb'; thumb.style.position='relative';
    // MP4 preview: if project has last job, show video poster (2.4: click -> modal + copy link)
    const hasVideo = p.lastJobId && p.lastJobState==='succeeded';
    const sc = hasVideo ? `<video src="/api/offline/jobs/${p.lastJobId}/file" muted loop playsinline preload="metadata" style="width:100%;height:100%;object-fit:cover" onmouseenter="this.play().catch(()=>{})" onmouseleave="this.pause()"></video>` : (p.scenes && p.scenes[0] && p.scenes[0].imageId ? `<img src="/api/offline/assets/${p.scenes[0].imageId}/file" style="width:100%;height:100%;object-fit:cover">` : '🎬 нет обложки');
    thumb.innerHTML = sc; thumb.append(chk);
    if(hasVideo){ thumb.style.cursor='pointer'; thumb.title='Нажми — плеер + копия ссылки'; thumb.addEventListener('click', (e)=>{ if(e.target===chk) return; openMp4Modal(p.lastJobId, p.title); }); }
    else if(p.scenes && p.scenes[0] && p.scenes[0].imageId){ thumb.style.cursor='pointer'; thumb.title='Открыть проект'; thumb.addEventListener('click', ()=>{ if(dirty && !confirm('Загрузить проект и заменить несохранённые правки?')) return; clearResult(); apply(p); void history(); void loadRevisions(); window.scrollTo({top:0,behavior:'smooth'}); }); }
    if(hasVideo){ const badge=document.createElement('span'); badge.className='badge'; badge.textContent='MP4'; badge.style.cssText='position:absolute;bottom:6px;right:6px;background:var(--accent);color:#0d2118'; thumb.append(badge); }
    const meta=document.createElement('div'); meta.className='meta';
    meta.innerHTML = `<span>r${p.revision}</span> · <span>${new Date(p.updatedAt).toLocaleDateString()}</span> · <span>${p.aspect==='portrait'?'9:16':'16:9'} · ${p.duration}с</span>` + ((p.tags&&p.tags.length)?` · <span>${p.tags.map(t=>'#'+t).join(' ')}</span>`:'');
    const title=document.createElement('div'); title.className='title'; const _q=($('dash-query')?.value||'').trim(); title.innerHTML=highlightMatch(p.title, _q);
    const statusEl=document.createElement('span'); statusEl.className='status '+(p.diagnostic?'status-draft':'status-ready'); statusEl.textContent=p.diagnostic?'Демо':'Готов';
    const actions=document.createElement('div'); actions.style.display='flex'; actions.style.gap='8px';
    const btnOpen=document.createElement('button'); btnOpen.className='btn btn-primary'; btnOpen.textContent='Открыть'; btnOpen.addEventListener('click', ()=>{ if(dirty && !confirm('Загрузить проект и заменить несохранённые правки?')) return; clearResult(); apply(p); void history(); void loadRevisions(); window.scrollTo({top:0,behavior:'smooth'}); });
    const btnPin=document.createElement('button'); btnPin.className='btn'; btnPin.textContent=p.pinned?'★ Открепить':'☆ В избранное'; btnPin.title='Избранное — всегда сверху'; btnPin.addEventListener('click', async ()=>{ try{ await api('/projects/'+p.id+'/pin','POST', {}); await refreshProjects(); }catch(e){ message(e.message); } });
    const btnDup=document.createElement('button'); btnDup.className='btn'; btnDup.textContent='Дублировать'; btnDup.title='Создать копию'; btnDup.addEventListener('click', async ()=>{ try{ const copy=await api('/projects/'+p.id+'/duplicate','POST', {}); dirty=false; await refreshProjects(); message('Копия: '+copy.title); }catch(e){ message(e.message); } });
    const btnExp=document.createElement('button'); btnExp.className='btn'; btnExp.textContent='Экспорт'; btnExp.title='Скачать JSON'; btnExp.addEventListener('click', ()=> exportProject(p.id));
    const btnShare=document.createElement('button'); btnShare.className='btn'; btnShare.textContent='Поделиться'; btnShare.addEventListener('click', ()=> shareProject(p.id, p.title));
    const btnPrev=document.createElement('button'); btnPrev.className='btn'; btnPrev.textContent='Превью'; btnPrev.addEventListener('click', ()=> previewExport(p.id));
    const btnDel=document.createElement('button'); btnDel.className='btn'; btnDel.textContent='Удалить'; btnDel.style.color='#ff8a8a'; btnDel.addEventListener('click', ()=> deleteProject(p.id));
    actions.append(btnOpen, btnPin, btnDup, btnExp, btnShare, btnDel);
    actions.style.flexWrap='wrap';
    card.append(thumb, title, meta, statusEl, actions);
    if(p.pinned){ card.style.borderColor='var(--accent)'; card.style.borderWidth='1.5px'; const pinEl=document.createElement('span'); pinEl.className='badge'; pinEl.textContent='★ Избранное'; pinEl.style.marginLeft='6px'; title.append(pinEl); }
    if(project && project.id===p.id){ card.style.borderColor='var(--accent)'; card.style.boxShadow='0 0 0 1px var(--accent)'; }
    grid.append(card);
  });
}
async function refreshProjects() {
  try{
    const values = await api('/projects');
    dashProjects = values.sort((a,b)=> b.updatedAt.localeCompare(a.updatedAt));
  }catch(e){ dashProjects=[]; }
  renderDash();
  void loadTrash().catch(()=>{});
  // keep legacy selector value in sync if needed
  const selector=$('projects'); if(selector && project) selector.value = project.id;
}
function apply(p) {
  project = p; verifiedAttachCommandId = null; scenes = p.scenes.map((s) => ({ ...s })); audioId = p.audioId; currentTags = (p.tags||[]).slice();
  $('title').value = p.title; $('script').value = p.script; $('duration').value = p.duration; $('aspect').value = p.aspect; $('trim').checked = p.trimAudio;
  $('audio').value = ''; $('rights').checked = false;
  $('audio-info').textContent = audioId ? 'Озвучка сохранена в проекте' : 'Озвучка пока не добавлена';
  $('revision').textContent = 'Сохранена версия r' + p.revision + (p.diagnostic ? ' · ТЕХНИЧЕСКИЙ ПРИМЕР, НЕ РЕЧЬ' : '');
  dirty = false; renderTags(); drawScenes(); setTimeout(()=>{ const t=document.getElementById('title'); if(t) t.focus(); }, 80); if (p.verifiedResultReference) { $('verified-run-id').value = p.verifiedResultReference.runId; void loadVerifiedResult(); } else syncVerifiedReference();
}
function showJob(j) {
  activeJob = ['running', 'cancelling'].includes(j.state) ? j.id : null;
  $('cancel').disabled = !activeJob;
  $('job-status').textContent = 'Версия r' + j.revision + ': ' + j.state + ' — ' + j.message;
  $('progress').value = j.progress;
  if (j.state !== 'succeeded') { $('player').pause(); $('player').hidden = true; $('download').hidden = true; $('report').hidden = true; }
  if (j.state === 'succeeded') {
    const path = '/api/offline/jobs/' + j.id;
    if ($('player').getAttribute('src') !== path + '/file') { $('player').src = path + '/file'; $('player').hidden = false; }
    $('download').href = path + '/file?download=1'; $('download').hidden = false;
    $('report').href = path + '/report'; $('report').hidden = false;
  }
}
async function history() {
  if (!project) return;
  const id = project.id, version = loadVersion; const jobs = await api('/jobs?projectId=' + id);
  if (!project || project.id !== id || version !== loadVersion) return;
  $('history').replaceChildren();
  jobs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  for (const job of jobs) {
    const row = document.createElement('p'); row.textContent = 'r' + job.revision + ' · ' + job.state + ' · ' + new Date(job.createdAt).toLocaleString();
    if (job.state === 'succeeded') { const link = document.createElement('a'); link.href = '/api/offline/jobs/' + job.id + '/file?download=1'; link.textContent = ' Скачать'; row.append(link); }
    $('history').append(row);
  }
  if (jobs[0]) showJob(jobs[0]);
}
async function loadRevisions(){
  if(!project) return;
  try{
    const revs = await fetch('/api/offline/projects/'+encodeURIComponent(project.id)+'/revisions').then(r=>r.json()).catch(()=>[]);
    const box=document.getElementById('history-box'); if(!box) return;
    const list=document.getElementById('rev-list'); if(list) list.replaceChildren();
    if(!revs.length) return;
    revs.slice().reverse().forEach((rev)=>{
      const row=document.createElement('div'); row.className='card'; row.style.padding='8px'; row.style.marginTop='6px'; row.style.display='flex'; row.style.justifyContent='space-between'; row.style.alignItems='center';
      const curRev = project.revision;
      const diffBtn=document.createElement('button'); diffBtn.className='btn'; diffBtn.textContent='r'+rev.revision+' · '+new Date(rev.updatedAt).toLocaleDateString() + (rev.revision===curRev?' · текущая':'');
      diffBtn.addEventListener('click', async ()=>{
        const detail=await fetch('/api/offline/projects/'+encodeURIComponent(project.id)+'/revisions/'+rev.revision).then(r=>r.json()).catch(()=>null);
        if(!detail) return;
        const cur={title: project.title, script: project.script, tags: project.tags, scenes: project.scenes};
        const prev={title: detail.title, script: detail.script, tags: detail.tags, scenes: detail.scenes};
        const dlg=document.getElementById('rev-diff'); if(dlg) { const html=diffRevision(prev, cur, rev.revision, curRev); if(html.startsWith('<')) { dlg.innerHTML=html; } else { dlg.textContent=html; } dlg.hidden=false; }
      });
      const restoreBtn=document.createElement('button'); restoreBtn.className='btn'; restoreBtn.textContent='Восстановить'; restoreBtn.addEventListener('click', async()=>{
        if(!confirm('Восстановить r'+rev.revision+' как новую версию? Текущая не потеряется — создастся r'+(project.revision+1)+'.')) return;
        const detail=await fetch('/api/offline/projects/'+encodeURIComponent(project.id)+'/revisions/'+rev.revision).then(r=>r.json()).catch(()=>null);
        if(!detail) return;
        $('title').value=detail.title||''; $('script').value=detail.script||''; currentTags=(detail.tags||[]).slice(); renderTags();
        import(/* dummy */'').catch(()=>{});
        // set scenes from revision
        scenes=(detail.scenes||[]).map(s=>({...s})); dirty=true; drawScenes(); message('Загружена r'+rev.revision+' — сохрани как новую версию');
      });
      row.append(diffBtn, restoreBtn); const listEl=document.getElementById('rev-list'); if(listEl) listEl.append(row);
    });
  }catch{}
}
function diffRevision(a,b, ra, rb){
  const parts=[];
  function escH(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
  function wordDiff(oldS, newS){
    const o=String(oldS||'').split(/(\s+)/), n=String(newS||'').split(/(\s+)/);
    let html='';
    const max=Math.max(o.length,n.length);
    for(let i=0;i<max;i++){
      const ov=o[i]||'', nv=n[i]||'';
      if(ov===nv) html+=escH(ov);
      else {
        if(ov) html+=`<del style="background:#3a1f2a;color:#ffa3a3;text-decoration:line-through;padding:1px 3px;border-radius:4px">${escH(ov)}</del>`;
        if(nv) html+=`<ins style="background:#14381f;color:#8ed8be;text-decoration:none;padding:1px 3px;border-radius:4px">${escH(nv)}</ins>`;
      }
    }
    return html || '<span class="sub">—</span>';
  }
  if(a.title!==b.title) parts.push(`<div style="margin:6px 0"><strong>Название</strong><br><span style="font-size:12px">`+wordDiff(a.title,b.title)+`</span></div>`);
  if((a.tags||[]).join(',') !== (b.tags||[]).join(',')) parts.push(`<div style="margin:6px 0"><strong>Теги</strong> <del style="background:#3a1f2a;color:#ffa3a3;padding:1px 4px;border-radius:4px">${escH((a.tags||[]).join(', ')||'—')}</del> → <ins style="background:#14381f;color:#8ed8be;padding:1px 4px;border-radius:4px">${escH((b.tags||[]).join(', ')||'—')}</ins></div>`);
  if(a.script!==b.script) parts.push(`<div style="margin:6px 0"><strong>Сценарий</strong> <span class="sub">${a.script.length} → ${b.script.length} символов</span><div style="font-size:12px;margin-top:4px;line-height:1.7;white-space:pre-wrap;word-break:break-word">`+wordDiff(a.script,b.script).slice(0,2000)+`</div></div>`);
  if((a.scenes||[]).length !== (b.scenes||[]).length) parts.push(`<div style="margin:6px 0"><strong>Сцен</strong> <del style="background:#3a1f2a;color:#ffa3a3;padding:1px 4px;border-radius:4px">${(a.scenes||[]).length}</del> → <ins style="background:#14381f;color:#8ed8be;padding:1px 4px;border-radius:4px">${(b.scenes||[]).length}</ins></div>`);
  else {
    (a.scenes||[]).forEach((s,i)=>{
      if(s.text!==b.scenes[i].text) parts.push(`<div style="margin:4px 0"><strong>Сцена ${i+1}</strong><br><span style="font-size:12px">`+wordDiff(s.text,b.scenes[i].text)+`</span></div>`);
      if(s.imageId!==b.scenes[i].imageId) parts.push(`<div style="margin:4px 0"><strong>Сцена ${i+1} обложка</strong> <span class="sub">${s.imageId?'была':'—'} → ${b.scenes[i].imageId?'есть':'—'}</span></div>`);
    });
  }
  if(!parts.length) return 'Без изменений текста/тегов/сцен (только метаданные)';
  return parts.join('');
}
function diffRevisionText(a,b, ra, rb){
  const lines=[];
  if(a.title!==b.title) lines.push(`title: "${a.title}" -> "${b.title}"`);
  if((a.tags||[]).join(',') !== (b.tags||[]).join(',')) lines.push(`tags: [${(a.tags||[]).join(', ')}] -> [${(b.tags||[]).join(', ')}]`);
  if(a.script!==b.script) lines.push(`script: ${a.script.length} -> ${b.script.length} символов` + (a.script!==b.script ? '\n- '+(a.script||'').slice(0,80)+'\n+ '+(b.script||'').slice(0,80) : ''));
  if((a.scenes||[]).length !== (b.scenes||[]).length) lines.push(`сцен: ${(a.scenes||[]).length} -> ${(b.scenes||[]).length}`);
  else { (a.scenes||[]).forEach((s,i)=>{ if(s.text!==b.scenes[i].text) lines.push(`сцена ${i+1}: "${s.text.slice(0,30)}" -> "${b.scenes[i].text.slice(0,30)}"`); }); }
  return lines.length ? lines.join('\n') : 'Без изменений текста/тегов/сцен (только метаданные)';
}
function clearResult() { loadVersion++; activeJob = null; $('cancel').disabled = true; $('player').pause(); $('player').removeAttribute('src'); $('player').hidden = true; $('download').hidden = true; $('report').hidden = true; $('progress').value = 0; $('history').replaceChildren(); const rl=document.getElementById('rev-list'); if(rl) rl.replaceChildren(); $('job-status').textContent = 'Сборка ещё не запускалась'; }
let autoSaveTimer=null;
function scheduleAutoSave(){
  if(autoSaveTimer) clearTimeout(autoSaveTimer);
  autoSaveTimer=setTimeout(()=>{ if(dirty && !busy && project){ void action(async()=>{ await save(); message('Автосохранение ✓'); }); } }, 2000);
}
async function importProject(file){
  if(!file) return;
  try{
    const text = await file.text();
    const bundle = JSON.parse(text);
    const res = await fetch('/api/offline/projects/import', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({bundle})});
    const j = await res.json().catch(()=>({}));
    if(!res.ok) throw new Error(j.error || 'Не удалось импортировать');
    // j is new project
    project = j; dirty=false; scenes=(j.scenes||[]).map(s=>({...s})); audioId=j.audioId||null;
    $('title').value=j.title||''; $('script').value=j.script||''; $('duration').value=j.duration||30; $('aspect').value=j.aspect||'portrait'; $('trim').checked=!!j.trimAudio;
    drawScenes(); clearResult(); await refreshProjects();
    // open imported
    apply(j); void history(); void loadRevisions();
    message('Импорт готов: '+j.title);
  }catch(e){ message(e.message || 'Ошибка импорта'); }
}
let currentTags=[];
function normalizeTag(s){ return String(s||'').trim().toLowerCase().replace(/\s+/g,'-'); }
function setTags(arr){
  currentTags = Array.from(new Set((arr||[]).map(normalizeTag).filter(Boolean))).slice(0,10);
  const input=$('tag-input'); if(input) input.value='';
  renderTags();
  dirty=true; scheduleAutoSave();
}
function renderTags(){
  const box=$('tag-box'); if(!box) return;
  box.replaceChildren();
  currentTags.forEach(t=>{
    const chip=document.createElement('span');
    chip.className='status'; chip.style.background='var(--card2)'; chip.style.cursor='pointer';
    chip.textContent='#'+t;
    chip.title='Нажми чтобы удалить';
    chip.addEventListener('click', ()=>{ currentTags=currentTags.filter(x=>x!==t); renderTags(); dirty=true; scheduleAutoSave(); });
    box.append(chip);
  });
  const hint=$('tag-hint'); if(hint) hint.textContent = currentTags.length ? currentTags.length+'/10' : 'до 10 тегов';
}
async function exportProject(id){
  try{
    const r=await fetch('/api/offline/projects/'+encodeURIComponent(id)+'/export?download=1');
    if(!r.ok){ const j=await r.json().catch(()=>({})); throw new Error(j.error || 'Не удалось экспортировать'); }
    const ct=r.headers.get('content-type')||'';
    if(ct.includes('json')){
      const blob=await r.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a'); a.href=url; a.download='ywoom-'+id.slice(0,8)+'.json'; a.click();
      setTimeout(()=>URL.revokeObjectURL(url), 2000);
      message('Экспорт скачан ✓');
    } else {
      message('Экспорт недоступен — проверь сервер');
    }
  }catch(e){ message(e.message); }
}
async function shareProject(id, title){
  try{
    const r=await fetch('/api/offline/projects/'+encodeURIComponent(id)+'/share', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({})});
    const j=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(j.error || 'Не удалось создать ссылку');
    const url = location.origin + j.url;
    const box=document.getElementById('share-notice');
    if(box){ box.hidden=false; box.innerHTML=`Шара <code>${j.shareId||''}</code> · <a href="${j.url}" style="color:var(--accent)">Открыть</a> · <button class="btn" id="share-copy">Копировать ссылку</button>`; const b=box.querySelector('#share-copy'); if(b) b.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(url); message('Ссылка скопирована ✓'); }catch{ prompt('Скопируй:', url); } }); }
    if(navigator.share){
      try{ await navigator.share({title: title||'Ywoom проект', url}); message('Поделился ✓'); return; }catch{}
    }
    if(navigator.clipboard){
      await navigator.clipboard.writeText(url);
      message('Ссылка скопирована: '+url);
    } else {
      prompt('Скопируй ссылку:', url);
    }
  }catch(e){ message(e.message); }
}
async function deleteProject(id){
  if(!confirm('Удалить в корзину? Можно восстановить в Настройках.')) return;
  try{ await api('/projects/'+id, 'DELETE'); if(project && project.id===id){ project=null; scenes=[{text:'',imageId:null}]; audioId=null; dirty=false; drawScenes(); clearResult(); $('title').value=''; $('script').value=''; $('revision').textContent=''; } await refreshProjects(); message('Проект в корзине — восстанови в Настройках'); }catch(e){ message(e.message); }
}
async function save() {
  const value = plan();
  project = project ? await api('/projects/' + project.id, 'PUT', { revision: project.revision, plan: value, tags: currentTags }) : await api('/projects', 'POST', {...value, tags: currentTags});
  dirty = false; $('revision').textContent = 'Сохранена версия r' + project.revision + (project.diagnostic ? ' · ТЕХНИЧЕСКИЙ ПРИМЕР' : ''); await refreshProjects(); syncVerifiedReference(); return project;
}
document.getElementById('editor')?.addEventListener('input', () => { dirty = true; syncVerifiedReference(); scheduleAutoSave(); });
document.getElementById('new')?.addEventListener('click', () => { if (busy || (dirty && !confirm('Несохранённые правки будут потеряны. Создать новый проект?'))) return; clearResult(); project = null; verifiedMetadata = null; verifiedAttachCommandId = null; document.getElementById('verified-card') && (document.getElementById('verified-card').hidden = true); audioId = null; scenes = [{ text: '', imageId: null }]; $('title').value = ''; $('script').value = ''; $('duration').value = 30; $('trim').checked = false; $('rights').checked = false; document.getElementById('audio-info') && (document.getElementById('audio-info').textContent = 'Озвучка пока не добавлена'); $('revision').textContent = ''; document.getElementById('projects') && (document.getElementById('projects').value = ''); dirty = false; drawScenes(); syncVerifiedReference(); });
document.getElementById('projects')?.addEventListener('change', () => action(async () => { const sel=document.getElementById('projects'); if (!sel || !sel.value) return; if (dirty && !confirm('Загрузить проект и заменить несохранённые правки?')) { sel.value = project ? project.id : ''; return; } const p = await api('/projects/' + sel.value); clearResult(); apply(p); await history(); }));
document.getElementById('demo')?.addEventListener('click', () => action(async () => { if (dirty && !confirm('Заменить текущий черновик техническим примером?')) return; const p = await api('/demo', 'POST', {}); clearResult(); apply(p); await refreshProjects(); message('Готов технический пример. Нажми «Сохранить и собрать MP4». Аудио — тестовый сигнал, не речь.'); }));
document.getElementById('split')?.addEventListener('click', () => { const parts = $('script').value.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean); if (!parts.length || parts.length > 6) { message('Нужны 1–6 абзацев. Поделить текст можно пустыми строками.'); return; } if (scenes.some((s) => s.imageId) && !confirm('Новый план заменит привязки изображений текущих сцен. Продолжить?')) return; scenes = parts.map((text) => ({ text: text.slice(0, 160), imageId: null })); dirty = true; drawScenes(); message('Абзацы разбиты на сцены. Плашки взяты из начала абзацев — проверь и отредактируй их.'); });
document.getElementById('add')?.addEventListener('click', () => { if (scenes.length < 6) { scenes.push({ text: '', imageId: null }); dirty = true; drawScenes(); } });
document.getElementById('audio')?.addEventListener('change', () => action(async () => { const el=document.getElementById('audio'); if (!el || !el.files[0]) return; const a = await upload(el.files[0], 'audio'); audioId = a.id; dirty = true; const ai=document.getElementById('audio-info'); if(ai) ai.textContent = a.name + ' · ' + a.duration.toFixed(2) + ' сек. Сохрани проект.'; }));
document.getElementById('save')?.addEventListener('click', () => action(async () => { await save(); message('Проект сохранён локально.'); }));
document.getElementById('render')?.addEventListener('click', () => action(async () => { const p = await save(); const j = await api('/projects/' + p.id + '/render', 'POST', { revision: p.revision }); showJob(j); message('Сборка запущена. Сценарий хранится, но программа не генерирует озвучку.'); }));
document.getElementById('cancel')?.addEventListener('click', () => action(async () => { if (activeJob) showJob(await api('/jobs/' + activeJob + '/cancel', 'POST', {})); }));
document.getElementById('verified-load')?.addEventListener('click', () => { void loadVerifiedResult(); });
document.getElementById('verified-attach')?.addEventListener('click', () => { void attachVerifiedResult(); });
document.getElementById('verified-run-id')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); void loadVerifiedResult(); } });
setInterval(async () => { if (!project || busy || polling) return; polling = true; try { await history(); } catch (e) { message(e.message); } finally { polling = false; } }, 1500);
window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
// 2.5: search revisions + date/tag filter in dashboard
let dashDateFilter=''; let dashTagFilter2=''; let revQuery='';
function applyDashFiltersExtra(arr){
  if(dashDateFilter){
    arr = arr.filter(p=> (p.updatedAt||'').slice(0,10) >= dashDateFilter);
  }
  if(dashTagFilter2){
    const t=dashTagFilter2.toLowerCase();
    arr = arr.filter(p=> (p.tags||[]).map(x=>String(x).toLowerCase()).includes(t));
  }
  return arr;
}
const _origFiltered2 = filteredProjects;
filteredProjects = function(){
  let arr=_origFiltered2();
  arr=applyDashFiltersExtra(arr);
  return arr;
};
// patch renderTagPills to also update dashTagFilter2 select
// rev filter UI will be injected into history-box
function injectDashExtraControls(){
  const dash=document.getElementById('dash');
  if(!dash || document.getElementById('dash-extra')) return;
  const bar=document.createElement('div'); bar.id='dash-extra'; bar.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:6px 0';
  bar.innerHTML = `<label class="sub">С даты <input id="dash-date" type="date" style="padding:6px 8px;border-radius:8px;border:1px solid var(--line2);background:var(--bg2);color:var(--text);font-size:12px"></label><label class="sub">Тег <input id="dash-tag2" placeholder="#тег" style="padding:6px 8px;border-radius:8px;border:1px solid var(--line2);background:var(--bg2);color:var(--text);font-size:12px;width:120px"></label><label class="sub">Сортировка <select id="dash-sort" class="btn" style="padding:6px 8px;font-size:12px"><option value="updated">Обновлённые</option><option value="title">А-Я</option><option value="created">Новые</option></select></label>`;
  dash.prepend(bar);
  document.getElementById('dash-sort').value=sortMode;
  document.getElementById('dash-date').addEventListener('change', (e)=>{ dashDateFilter=e.target.value||''; renderDash(); });
  document.getElementById('dash-tag2').addEventListener('input', (e)=>{ dashTagFilter2=e.target.value.replace(/^#/,'')||''; renderDash(); });
  document.getElementById('dash-sort').addEventListener('change', (e)=>{ sortMode=e.target.value||'updated'; renderDash(); });
}
setTimeout(injectDashExtraControls, 200);
function injectRevSearch(){
  const box=document.getElementById('history-box'); if(!box || document.getElementById('rev-q')) return;
  const inp=document.createElement('input'); inp.id='rev-q'; inp.placeholder='Поиск по ревизиям — заголовок/теги/скрипт'; inp.style.cssText='width:100%;padding:8px 10px;border-radius:10px;border:1px solid var(--line2);background:var(--bg2);color:var(--text);margin:6px 0;font-size:12px';
  inp.addEventListener('input', ()=>{ revQuery=(inp.value||'').toLowerCase().trim(); if(project) void loadRevisions(); });
  box.prepend(inp);
}
// hook loadRevisions to filter by revQuery
const _origLoadRevisions = loadRevisions;
loadRevisions = async function(){
  await _origLoadRevisions();
  // after original, filter rows by revQuery
  if(!revQuery) return;
  const list=document.getElementById('rev-list'); if(!list) return;
  Array.from(list.children).forEach(row=>{
    const t=(row.textContent||'').toLowerCase();
    row.hidden = t.indexOf(revQuery)===-1;
  });
};
const _origToggleHistory2 = toggleHistory;
toggleHistory = function(){ _origToggleHistory2(); injectRevSearch(); };
injectRevSearch();
// Header quick actions for current project
(()=>{ const bar=document.querySelector('[data-studio-actions]'); if(bar){
  const bE=document.createElement('button'); bE.className='btn'; bE.textContent='Экспорт'; bE.title='Ctrl+E'; bE.addEventListener('click', ()=> project && exportProject(project.id)); bar.append(bE);
  const bS=document.createElement('button'); bS.className='btn'; bS.textContent='Поделиться'; bS.addEventListener('click', ()=> project && shareProject(project.id, project.title)); bar.append(bS);
  const bI=document.createElement('button'); bI.className='btn'; bI.textContent='Импорт'; bI.title='Загрузить ywoom-*.json'; bI.addEventListener('click', ()=> $('import-file')?.click()); bar.append(bI);
  // also wire dash import
  const dashImp=$('import-file'); if(dashImp){ dashImp.addEventListener('change', ()=>{ const f=dashImp.files && dashImp.files[0]; if(f){ importProject(f); dashImp.value=''; } }); }
}})();
// Keyboard shortcuts: Ctrl+S save, Ctrl+N new, Ctrl+E export
window.addEventListener('keydown', (e)=>{
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='s'){ e.preventDefault(); if(!busy) $('save').click(); }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='n'){ e.preventDefault(); if(!busy) $('new').click(); }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='e'){ e.preventDefault(); if(project) exportProject(project.id); }
  if(e.ctrlKey && e.shiftKey && e.key==='ArrowUp'){ e.preventDefault(); const idx=scenes.findIndex((_,i)=> document.activeElement && document.activeElement.closest('.scene')?.dataset.index==String(i)); if(idx>0){ const t=scenes[idx]; scenes[idx]=scenes[idx-1]; scenes[idx-1]=t; dirty=true; scheduleAutoSave(); drawScenes(); } }
  if(e.ctrlKey && e.shiftKey && e.key==='ArrowDown'){ e.preventDefault(); const idx=scenes.findIndex((_,i)=> document.activeElement && document.activeElement.closest('.scene')?.dataset.index==String(i)); if(idx>=0 && idx<scenes.length-1){ const t=scenes[idx]; scenes[idx]=scenes[idx+1]; scenes[idx+1]=t; dirty=true; scheduleAutoSave(); drawScenes(); } }
  if(e.key==='?' && !e.ctrlKey && !e.metaKey && !e.altKey && (e.target.tagName==='BODY' || e.target.id==='dash-query')){ e.preventDefault(); const h=document.getElementById('help-overlay'); if(h) h.hidden=!h.hidden; }
  if((e.ctrlKey||e.metaKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); const q=document.getElementById('dash-query'); if(q){ q.focus(); q.select(); } }
  if(e.key==='/' && !e.ctrlKey && !e.metaKey && e.target.tagName==='BODY'){ e.preventDefault(); const q=document.getElementById('dash-query'); if(q){ q.focus(); } }
  if(e.key==='Escape'){ const h=document.getElementById('help-overlay'); if(h && !h.hidden) h.hidden=true; }
});
drawScenes(); refreshProjects().catch((e) => message('Не удалось загрузить локальные проекты: ' + e.message));
// help overlay (?) — create once
(() => {
  if(document.getElementById('help-overlay')) return;
  const ov=document.createElement('div'); ov.id='help-overlay'; ov.hidden=true; ov.style.cssText='position:fixed;inset:0;background:rgba(3,7,15,0.72);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;z-index:70;padding:18px';
  ov.innerHTML=`<div class="onboard-card" style="max-width:560px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><strong>Горячие клавиши</strong><button class="btn" onclick="document.getElementById('help-overlay').hidden=true">✕</button></div><div class="sub" style="line-height:1.9;margin-top:10px"><span class="kbd">Ctrl</span> + <span class="kbd">S</span> — сохранить &nbsp; <span class="kbd">Ctrl</span> + <span class="kbd">N</span> — новый<br><span class="kbd">Ctrl</span> + <span class="kbd">E</span> — экспорт &nbsp; <span class="kbd">Ctrl</span> + <span class="kbd">Shift</span> + <span class="kbd">↑/↓</span> — порядок сцен<br><span class="kbd">?</span> — эта подсказка &nbsp; <span class="kbd">Ctrl</span> + <span class="kbd">K</span> / <span class="kbd">/</span> — поиск &nbsp; <span class="kbd">Esc</span> — закрыть<br><span class="kbd">Enter</span> в тегах — добавить тег &nbsp; Hover на карточке — превью MP4</div><p class="sub" style="margin-top:8px">Нажми <span class="kbd">?</span> ещё раз чтобы закрыть.</p></div>`;
  ov.addEventListener('click', (e)=>{ if(e.target===ov) ov.hidden=true; });
  ov.hidden=true; ov.style.display='none';
  // toggle display flex when not hidden
  const obs=new MutationObserver(()=>{ ov.style.display = ov.hidden ? 'none' : 'flex'; });
  obs.observe(ov, {attributes:true, attributeFilter:['hidden']});
  document.body.append(ov);
})();
// 3.1: map share deeplink ?share= -> friendly UI + copy
(function(){
  const shareBox = document.getElementById('share-notice');
  if(shareBox){
    const qs=new URLSearchParams(location.search);
    const sid=qs.get('share');
    if(sid) { shareBox.hidden=false; shareBox.textContent='Шара '+sid+' — открываю…'; }
  }
})();
// 2.6: trash — restore picker for revision choice (uses revs) + clear already exists
async function restoreWithPicker(projectId){
  try{
    const revs=await fetch('/api/offline/projects/'+encodeURIComponent(projectId)+'/revisions').then(r=>r.json()).catch(()=>[]);
    const box=document.getElementById('trash-box'); if(!box) return;
    // simple prompt fallback: restore latest is default; if multiple revs ask
    if(revs.length>1){
      const v=prompt('Восстановить: введи номер ревизии r (1..'+revs.length+'), или оставь пустым для последней r'+revs[revs.length-1].revision);
      if(v && String(v).trim()){
        const n=Number(String(v).trim().replace(/^r/i,''));
        if(Number.isFinite(n)){
          const rev=revs.find(x=>x.revision===n);
          if(rev){
            // load that rev then restore + save as new
            await fetch('/api/offline/projects/'+encodeURIComponent(projectId)+'/restore', {method:'POST'});
            const p=await api('/projects/'+projectId);
            const cur=p;
            const patch={ revision: cur.revision, plan: { title: rev.title, script: rev.script, duration: rev.duration||30, aspect: rev.aspect||'portrait', trimAudio: !!rev.trimAudio, audioId: rev.audioId||cur.audioId, scenes: rev.scenes||cur.scenes }, tags: rev.tags||cur.tags };
            await api('/projects/'+projectId, 'PUT', patch);
            await refreshProjects(); await loadTrash(); message('Восстановлен r'+n+' как новая версия ✓'); return;
          }
        }
      }
    }
  }catch{}
  await fetch('/api/offline/projects/'+projectId+'/restore', {method:'POST'}).then(r=>{ if(!r.ok) throw new Error('Не удалось'); });
  await refreshProjects(); await loadTrash(); message('Восстановлен ✓');
}
// patch loadTrash restore button to use picker when invoked from settings too
const _origLoadTrash = loadTrash;
loadTrash = async function(){
  await _origLoadTrash();
  // after render, replace restore handlers with picker (re-bind)
  const box=document.getElementById('trash-box'); if(!box) return;
  // handlers already bound; picker variant is available via restoreWithPicker for future calls
};
// also add ? button in header
(() => {
  const top=document.querySelector('.app-top-actions'); if(!top || document.getElementById('help-btn')) return;
  const b=document.createElement('button'); b.id='help-btn'; b.className='btn'; b.textContent='?'; b.title='Горячие клавиши (?)'; b.addEventListener('click', ()=>{ const h=document.getElementById('help-overlay'); if(h) h.hidden=!h.hidden; });
  top.prepend(b);
})();
document.getElementById('bulk-pin')?.addEventListener('click', async ()=>{ const ids=Array.from(selectedIds); for(const id of ids){ try{ await api('/projects/'+id+'/pin','POST', {}); }catch{} } await refreshProjects(); clearSelection(); });
document.getElementById('bulk-delete')?.addEventListener('click', async ()=>{ const ids=Array.from(selectedIds); if(!confirm('Удалить '+ids.length+' проектов в корзину?')) return; for(const id of ids){ try{ await api('/projects/'+id,'DELETE'); }catch{} } await refreshProjects(); clearSelection(); });
async function bulkZipExport(ids){
  if(!ids.length) return;
  const bundles=[];
  for(const id of ids){
    try{
      const r=await fetch('/api/offline/projects/'+encodeURIComponent(id)+'/export');
      if(!r.ok) continue;
      const j=await r.json();
      bundles.push(j);
    }catch{}
  }
  if(!bundles.length){ message('Не удалось собрать экспорт'); return; }
  const payload = bundles.length===1 ? bundles[0] : { schemaVersion:1, mode:'ywoom_export_zip_v1', exportedAt: new Date().toISOString(), version:'2.9', projects: bundles.map(b=>b.project), count: bundles.length, note:'Архив '+bundles.length+' проектов Ywoom' };
  const blob=new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download= bundles.length===1 ? 'ywoom-'+ids[0].slice(0,8)+'.json' : 'ywoom-bundle-'+Date.now()+'.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  message('Экспортировано '+bundles.length+' в один файл ✓');
}
document.getElementById('bulk-export')?.addEventListener('click', async ()=>{
  const ids=Array.from(selectedIds);
  if(!ids.length){ message('Выдели проекты'); return; }
  if(ids.length===1){ exportProject(ids[0]); return; }
  if(!confirm('Собрать '+ids.length+' проектов в один архив JSON?')) return;
  await bulkZipExport(ids);
});
document.getElementById('export-all')?.addEventListener('click', async ()=>{
  const vis=filteredProjects();
  if(!vis.length){ message('Нет проектов для экспорта'); return; }
  const mode = vis.length>6 && confirm('Собрать все '+vis.length+' в один архив? ОК — один файл, Отмена — по одному.');
  if(mode){ await bulkZipExport(vis.map(p=>p.id)); }
  else {
    if(!confirm('Экспорт всех видимых — '+vis.length+' шт. Скачать по очереди?')) return;
    for(const p of vis){ await exportProject(p.id); await new Promise(r=>setTimeout(r,700)); }
    message('Экспортировано '+vis.length+' проектов');
  }
});
document.getElementById('clear-filters')?.addEventListener('click', ()=>{
  const q=document.getElementById('dash-query'); if(q) q.value='';
  activeTagFilter=''; sortMode='updated';
  renderDash(); updateBulkBar();
  message('Фильтры сброшены');
});
document.getElementById('bulk-tag')?.addEventListener('click', async ()=>{
  const tag=prompt('Тег для выбранных ('+selectedIds.size+'): латиница/кириллица, до 20, _/-');
  if(!tag) return;
  const norm=String(tag).trim().toLowerCase();
  if(!/^[a-z0-9\u0430-\u044f\u0451_-]+$/.test(norm) || norm.length>20){ alert('Тег: буквы/цифры/_/-, до 20'); return; }
  const ids=Array.from(selectedIds);
  for(const id of ids){
    try{
      const p=dashProjects.find(x=>x.id===id); if(!p) continue;
      const tags=Array.from(new Set([...(p.tags||[]), norm])).slice(0,10);
      await api('/projects/'+id, 'PUT', { revision: p.revision, plan: { title:p.title, script:p.script, duration:p.duration, aspect:p.aspect, trimAudio:p.trimAudio, audioId:p.audioId, scenes:p.scenes }, tags });
    }catch(e){ console.error(e); }
  }
  await refreshProjects();
});
document.getElementById('bulk-untag')?.addEventListener('click', async ()=>{
  const tag=prompt('Удалить тег у выбранных:');
  if(!tag) return;
  const norm=String(tag).trim().toLowerCase();
  const ids=Array.from(selectedIds);
  for(const id of ids){
    try{
      const p=dashProjects.find(x=>x.id===id); if(!p) continue;
      const tags=(p.tags||[]).filter(t=>t.toLowerCase()!==norm);
      await api('/projects/'+id, 'PUT', { revision: p.revision, plan: { title:p.title, script:p.script, duration:p.duration, aspect:p.aspect, trimAudio:p.trimAudio, audioId:p.audioId, scenes:p.scenes }, tags });
    }catch(e){ console.error(e); }
  }
  await refreshProjects();
});
function clearSelection(){ selectedIds.clear(); renderDash(); updateBulkBar(); message('Выбор снят'); }
function updateBulkBar(){ const bar=document.getElementById('bulk-bar'), cnt=document.getElementById('bulk-count'); if(!bar) return; const n=selectedIds.size; bar.hidden = n===0; bar.style.display = n===0 ? 'none' : 'flex'; if(cnt) cnt.textContent = n + ' выбрано'; const vis=filteredProjects().length; const sa=document.getElementById('select-all'); if(sa) sa.textContent = n===vis && vis>0 ? 'Снять все' : 'Выбрать все'; }
function toggleHistory(){ const box=document.getElementById('history-box'); if(!box) return; box.hidden = !box.hidden; const btn=document.getElementById('toggle-history'); if(btn) btn.textContent = box.hidden ? 'История версий' : 'Скрыть историю'; if(!box.hidden && project) { void history(); void loadRevisions(); } }
document.getElementById('bulk-clear')?.addEventListener('click', clearSelection);
document.getElementById('toggle-history')?.addEventListener('click', toggleHistory);
async function checkLimits(){
  try{ const r=await fetch('/api/billing/limits'); const j=await r.json(); const full = !j.unlimited && dashProjects.filter(p=>!p.deletedAt).length >= j.maxProjects; const btn=document.getElementById('new'); if(btn){ btn.disabled=full; btn.title=full?'Лимит '+j.maxProjects+' — перейди на Pro':'Новый проект'; } const badge=document.getElementById('limit-badge'); if(badge){ badge.textContent = j.unlimited ? '' : j.projects+'/'+j.maxProjects+' ('+j.plan+')'; badge.hidden = j.unlimited || j.plan!=='free'; } }catch{} }
// refresh limits after each refresh
const _origRefreshProjects = refreshProjects;
refreshProjects = async function(){ const r=await _origRefreshProjects(); await checkLimits(); updateBulkBar(); return r; };
checkLimits();
document.getElementById('select-all')?.addEventListener('click', ()=>{ const vis=filteredProjects(); if(selectedIds.size===vis.length) selectedIds.clear(); else vis.forEach(p=>selectedIds.add(p.id)); renderDash(); updateBulkBar(); });

// 2.4: MP4 modal player + copy link
function openMp4Modal(jobId, title){
  const id='mp4-modal';
  let ov=document.getElementById(id);
  if(!ov){
    ov=document.createElement('div'); ov.id=id; ov.style.cssText='position:fixed;inset:0;background:rgba(3,7,15,0.82);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:75;padding:18px';
    ov.innerHTML=`<div style="width:min(760px,96vw);background:var(--card);border:1px solid var(--line2);border-radius:16px;padding:16px"><div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><strong id="mp4-modal-title">MP4</strong><button class="btn" id="mp4-close">✕</button></div><video id="mp4-modal-video" controls playsinline style="width:100%;margin-top:12px;border-radius:12px;background:#0e1422"></video><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><a id="mp4-download" class="btn btn-primary">Скачать MP4</a><a id="mp4-report" class="btn">Отчёт</a><button id="mp4-copy" class="btn">Копировать ссылку</button></div></div>`;
    ov.addEventListener('click', (e)=>{ if(e.target===ov) ov.remove(); });
    document.body.append(ov);
    ov.querySelector('#mp4-close').addEventListener('click', ()=> ov.remove());
  }
  ov.querySelector('#mp4-modal-title').textContent = title || 'MP4 плеер';
  const v=ov.querySelector('#mp4-modal-video');
  v.src='/api/offline/jobs/'+encodeURIComponent(jobId)+'/file';
  v.play().catch(()=>{});
  ov.querySelector('#mp4-download').href='/api/offline/jobs/'+encodeURIComponent(jobId)+'/file?download=1';
  ov.querySelector('#mp4-report').href='/api/offline/jobs/'+encodeURIComponent(jobId)+'/report';
  ov.querySelector('#mp4-report').target='_blank';
  ov.querySelector('#mp4-copy').onclick=async()=>{
    const u=location.origin + '/api/offline/jobs/'+encodeURIComponent(jobId)+'/file';
    try{ if(navigator.clipboard) await navigator.clipboard.writeText(u); else prompt('Скопируй:', u); message('Ссылка скопирована ✓'); }catch{ prompt('Скопируй:', u); }
  };
  ov.style.display='flex';
  ov.addEventListener('keydown', (e)=>{ if(e.key==='Escape') ov.remove(); });
}
document.getElementById('dash-query')?.addEventListener('input', ()=> renderDash());
document.getElementById('tag-input')?.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ e.preventDefault(); const v=(e.target.value||'').trim(); if(v){ currentTags = Array.from(new Set([...currentTags, normalizeTag(v)])).slice(0,10); renderTags(); dirty=true; scheduleAutoSave(); e.target.value=''; } } });
document.getElementById('tag-add')?.addEventListener('click', ()=>{ const inp=$('tag-input'); const v=(inp.value||'').trim(); if(v){ currentTags = Array.from(new Set([...currentTags, normalizeTag(v)])).slice(0,10); renderTags(); dirty=true; scheduleAutoSave(); inp.value=''; } });
if (typeof URLSearchParams !== 'undefined' && window.location) {
  const qs=new URLSearchParams(window.location.search);
  const initialVerifiedRun=qs.get('verifiedRun'); if(initialVerifiedRun){ $('verified-run-id').value=initialVerifiedRun; void loadVerifiedResult(); }
  const shareId=qs.get('share');
  if(shareId && /^[A-Za-z0-9_-]{1,16}$/.test(shareId)){
    fetch('/api/offline/share/'+encodeURIComponent(shareId)).then(r=>r.json()).then(j=>{
      if(j.project){ if(dirty && !confirm('Загрузить шару и заменить несохранённые правки?')) return; clearResult(); apply(j.project); void history(); void loadRevisions(); message('Шара загружена: '+j.project.title); }
    }).catch(()=>{});
  }
  const jProjectId=qs.get('projectId');
  if(jProjectId && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(jProjectId)){
    fetch('/api/offline/projects/'+encodeURIComponent(jProjectId)).then(r=>r.json()).then(p=>{
      if(p && p.id){ if(dirty && !confirm('Загрузить проект из Маршрута и заменить несохранённые правки?')) return; clearResult(); apply(p); void history(); void loadRevisions(); message('Проект из Маршрута загружен: '+p.title); }
    }).catch(()=>{});
  }
  const fromJourney=qs.get('from');
  if(fromJourney==='journey' && qs.get('draft')){
    try{
      const draftParam = JSON.parse(decodeURIComponent(qs.get('draft')||''));
      if(draftParam && draftParam.title){ $('title').value=draftParam.title.slice(0,120); $('script').value=(draftParam.script||'').slice(0,4000); dirty=true; message('Черновик из Маршрута — проверь и сохрани'); }
    }catch{}
  }
}

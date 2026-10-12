'use strict';
const $ = (id) => document.getElementById(id);
async function jget(p) { const r = await fetch(p); const j = await r.json().catch(() => ({})); return { ok: r.ok, status: r.status, j }; }
async function jpost(p, body) { const r = await fetch(p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }); const j = await r.json().catch(() => ({})); return { ok: r.ok, status: r.status, j }; }
// 2.8: promo mock + history (localStorage-backed for prototype)
const PROMO_CODES = { 'YWOOM2026': { plan:'pro', days:7, note:'Промокод YWOOM2026 — Pro 7д' }, 'WELCOME': { plan:'pro', days:3, note:'WELCOME — Pro 3д' } };
function pushHistory(entry){
  try{ const k='ywoom_billing_history'; const arr=JSON.parse(localStorage.getItem(k)||'[]'); arr.unshift({ ...entry, at: new Date().toISOString() }); localStorage.setItem(k, JSON.stringify(arr.slice(0,20))); }catch{}
}
function renderHistory(){
  const box=document.getElementById('billing-history'); if(!box) return;
  try{
    const arr=JSON.parse(localStorage.getItem('ywoom_billing_history')||'[]');
    if(!arr.length){ box.innerHTML='<span class="sub">История подписок — ещё пусто. Смени тариф или примени промокод.</span>'; return; }
    box.innerHTML = arr.map(e=> `<div style="display:flex;justify-content:space-between;gap:12px;padding:6px 0;border-bottom:1px solid var(--line)"><span>${e.text||e.plan||''}</span><span class="sub">${new Date(e.at).toLocaleString()}</span></div>`).join('');
  }catch{ box.textContent='—'; }
}
const PLAN_META = {
  free:   { accent:'#8ab4ff', badge:'Старт', feats:['До 3 проектов','Студия локально','Сообщество'] },
  pro:    { accent:'#8ed8be', badge:'Популярный', feats:['Без лимитов проектов','Приоритетная сборка','Поддержка'] },
  studio: { accent:'#e8c36a', badge:'Команды', feats:['Всё из Pro','Команды и роли','Приоритет'] },
};
async function refresh() {
  let limits=null;
  try{ const r=await jget('/api/billing/limits'); if(r.ok) limits=r.j; }catch{}
  const { ok, j } = await jget('/api/billing/plans');
  if (!ok) { $('plans-list').textContent = 'Не удалось загрузить тарифы'; return; }
  const plans = j;
  const cur = await jget('/api/billing/subscription');
  const sub = cur.ok ? cur.j.subscription : null;
  const curPlan = sub ? sub.plan : null;
  const needLogin = cur.status===401;
  $('plans-list').replaceChildren();
  for (const p of plans) {
    const m = PLAN_META[p.id] || {};
    const isActive = curPlan===p.id;
    const card=document.createElement('div');
    card.className='card';
    card.style.cssText='display:flex;flex-direction:column;gap:10px;position:relative';
    if(p.id==='pro') card.style.borderColor='#2e4a3f';
    const top=document.createElement('div'); top.style.cssText='display:flex;justify-content:space-between;align-items:center;gap:8px';
    const h=document.createElement('div'); h.innerHTML=`<div style="font-weight:800">${p.name} · ${p.price}</div><div style="color:var(--muted);font-size:12px">${p.note}</div>`;
    const badge=document.createElement('span'); badge.className='status'; badge.style.background=m.accent ? m.accent+'22' : ''; badge.textContent=isActive?'Активен':(m.badge||'');
    top.append(h,badge); card.append(top);
    const ul=document.createElement('ul'); ul.style.cssText='margin:6px 0 0 18px;color:var(--muted);font-size:13px';
    (m.feats||[]).forEach(f=>{ const li=document.createElement('li'); li.textContent=f; ul.append(li); });
    card.append(ul);
    const btn=document.createElement('button'); btn.className=isActive?'btn':'btn btn-primary'; btn.textContent=isActive?'Активен · '+p.id: `Выбрать ${p.id}`;
    btn.disabled=isActive;
    if(!isActive && needLogin) btn.title='Сначала войди';
    btn.addEventListener('click', async ()=>{
      if(needLogin){ $('sub-status').textContent='Сначала войди — подписка привязана к сессии.'; return; }
      btn.disabled=true; btn.textContent='...';
      const res = await jpost('/api/billing/subscribe', { plan: p.id });
      $('sub-status').textContent = res.ok ? `Готово: ${res.j.subscription.plan} (${res.j.subscription.status})` : `Ошибка: ${res.j.error || res.status}`;
      await refresh();
    });
    card.append(btn);
    if(isActive){
      const row=document.createElement('p'); row.className='sub'; row.textContent=`Текущая: ${sub.plan} · ${sub.status} · с ${new Date(sub.createdAt).toLocaleString()}`;
      const cancel=document.createElement('button'); cancel.className='btn'; cancel.textContent='Отменить'; cancel.style.marginTop='6px';
      cancel.addEventListener('click', async ()=>{ const r=await jpost('/api/billing/cancel', {}); $('sub-status').textContent=r.ok ? 'Отменена' : r.j.error; await refresh(); });
      card.append(row,cancel);
    }
    $('plans-list').append(card);
  }
  // Ledger / reserve observer (COST_VISIBILITY.md >10% gate)
  try{ const s=await jget('/api/storage'); const st=await jget('/api/health'); const g=s.ok&&s.j; const h=st.ok&&st.j;
    const obs=document.getElementById('observer-ledger'); if(obs){ const mib = g && g.totalAssetMiB != null ? g.totalAssetMiB : '0.00'; obs.innerHTML = g ? `<div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12px"><span>Проектов: ${g.projects}</span><span>Сборок: ${g.jobs}</span><span>Материалов: ${g.assets}</span><span>${mib} MiB</span><span>·</span><span>Mode: ${h? h.mode : '—'}</span><span class="m">Gate >10%: forecast*10>baseline*11 → pause · см. freelance-autopilot / model-switch</span></div>` : '—'; } }catch{}
  const limText = limits ? `Лимит: ${limits.plan} — ${limits.unlimited ? 'без лимита' : limits.maxProjects+' проекта'} · Free 3 / Pro 100` : '';
  if(limText) $('sub-status').textContent = limText + (needLogin ? ' · войди чтобы сменить тариф' : '');
  else if(!sub) $('sub-status').textContent = needLogin ? 'Войди чтобы выбрать тариф — подписка привязана к сессии.' : 'Тариф не выбран.';
  else $('sub-status').textContent = '';
  // 2.7/2.8: storage chart placeholder + promo UI is rendered separately after refresh
  renderPromoBox(); renderHistory();
  // trial button
  const trialBox=document.getElementById('trial-box');
  if(trialBox){
    const isPro = sub && sub.plan==='pro' && sub.status==='active';
    const isTrial = sub && sub.trialUntil && new Date(sub.trialUntil) > new Date();
    const hasTrial = isTrial;
    if(isTrial){
      const daysLeft = Math.ceil((new Date(sub.trialUntil).getTime() - Date.now())/86400000);
      trialBox.innerHTML = `Пробный Pro до ${new Date(sub.trialUntil).toLocaleDateString()} · осталось ${daysLeft} дн. ✓`;
      trialBox.hidden=false;
    } else if(!isPro && !needLogin){
      trialBox.innerHTML = `<button id="trial-btn" class="btn btn-primary">Попробовать Pro 7 дней — бесплатно</button> <span class="sub">Снимет лимит Free</span>`;
      trialBox.hidden=false;
      document.getElementById('trial-btn')?.addEventListener('click', async ()=>{
        const r=await jpost('/api/billing/trial', {});
        if(r.ok){ $('sub-status').textContent='Триал активирован до '+new Date(r.j.trialUntil).toLocaleDateString(); await refresh(); }
        else $('sub-status').textContent='Не удалось: '+(r.j.error||r.status);
      });
    } else trialBox.hidden=true;
  }
}
const loginBtn=$('login'), meBtn=$('me');
if(loginBtn) loginBtn.addEventListener('click', async ()=>{
  const email=$('email').value.trim();
  if(!email){ $('auth-status').textContent='Укажи email'; return; }
  const { ok, j, status } = await jpost('/api/auth/login', { email });
  $('auth-status').textContent = ok ? `Вход: ${j.userId}` : `Ошибка ${status}: ${j.error || ''}`;
  await refresh();
});
if(meBtn) meBtn.addEventListener('click', async ()=>{
  const { ok, j, status } = await jget('/api/auth/me');
  $('auth-status').textContent = ok ? `Сессия: ${j.userId}` : `Нет сессии ${status}: ${j.error || ''}`;
});
function renderPromoBox(){
  const box=document.getElementById('promo-box');
  if(!box) return;
  // keep inner if already wired
  if(box.dataset.wired) { return; }
  box.dataset.wired='1';
  const input=document.getElementById('promo-input');
  const btn=document.getElementById('promo-apply');
  const msg=document.getElementById('promo-msg');
  if(!input || !btn) return;
  btn.addEventListener('click', async ()=>{
    const code=String(input.value||'').trim().toUpperCase();
    const promo=PROMO_CODES[code];
    if(!promo){ if(msg) msg.textContent='Неверный промокод. Попробуй YWOOM2026 или WELCOME.'; return; }
    const me=await jget('/api/auth/me');
    if(!me.ok){ if(msg) msg.textContent='Сначала войди.'; return; }
    const r=await jpost('/api/billing/trial', {});
    // fallback: subscribe pro directly if trial not available
    if(!r.ok){
      const s=await jpost('/api/billing/subscribe', { plan: promo.plan });
      if(!s.ok){ if(msg) msg.textContent='Не удалось: '+(s.j.error||s.status); return; }
      pushHistory({ plan: promo.plan, text: promo.note + ' ✓ (subscribe)' }); if(msg) msg.textContent=promo.note+' ✓';
    } else {
      pushHistory({ plan: promo.plan, text: promo.note + ' ✓ (trial)' }); if(msg) msg.textContent=promo.note+' ✓';
    }
    await refresh();
  });
}
refresh().catch(()=>{});

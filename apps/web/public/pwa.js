'use strict';
(function(){
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  if (isStandalone) return;
  try {
    if (localStorage.getItem('ywoom_pwa_never')==='1') return;
    const until = Number(localStorage.getItem('ywoom_pwa_dismissed_until')||0);
    if (until && Date.now() < until) return;
  } catch {}

  function isMobileDevice() {
    return window.matchMedia('(max-width: 768px)').matches || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }
  function isIOS() { return /iPhone|iPad|iPod/i.test(navigator.userAgent); }

  let deferred = null;

  const bar = document.createElement('div');
  bar.id='pwa-install';
  bar.hidden=true;
  bar.setAttribute('role','region');
  bar.setAttribute('aria-label','Установка приложения');
  bar.style.cssText='position:fixed;bottom:18px;left:50%;transform:translateX(-50%);background:#35373f;color:#ecebf4;padding:10px 14px 10px 14px;border-radius:18px;box-shadow:0 8px 24px rgba(0,0,0,.4),0 2px 8px rgba(0,0,0,.2);display:flex;gap:10px;align-items:center;z-index:60;max-width:calc(100vw - 24px);border:1px solid rgba(255,255,255,.08)';

  function buildBar(){
    const mobile = isMobileDevice();
    const title = mobile ? 'Установить Ywoom на телефон' : 'Установить Ywoom на компьютер';
    const sub = mobile ? 'Быстрый доступ с главного экрана' : 'Быстрый запуск с рабочего стола';
    const btnLabel = deferred ? 'Установить' : (isIOS() ? 'Как установить' : 'Установить');
    bar.innerHTML = ''
      + '<div style="display:flex;align-items:center;gap:10px;min-width:0;flex:1">'
      + '<div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7d9cff,#a58cf5);display:flex;align-items:center;justify-content:center;color:#1b2038;font-weight:800;flex:none">Y</div>'
      + '<div style="min-width:0;line-height:1.2">'
      + '<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+title+'</div>'
      + '<div class="m" style="font-size:11px;color:#b8b9c8;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+sub+'</div>'
      + '</div></div>'
      + '<button data-pwa-install style="padding:8px 14px;border-radius:14px;font-size:13px;font-weight:600;color:#1b2038;background:#7d9cff;border:0;white-space:nowrap;flex:none;cursor:pointer">'+btnLabel+'</button>'
      + '<button data-pwa-close aria-label="Закрыть" style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;color:#b8b9c8;flex:none;cursor:pointer;font-size:13px">✕</button>';
    if (window.innerWidth < 360) {
      const s = bar.querySelector('.m');
      if (s) s.style.display='none';
    }
  }

  function mount(){
    try { if (bar.parentNode !== document.body) document.body.append(bar); } catch {}
    buildBar();
  }
  function show(){
    if (!bar.hidden) return;
    try {
      if (localStorage.getItem('ywoom_pwa_never')==='1') return;
      const u = Number(localStorage.getItem('ywoom_pwa_dismissed_until')||0);
      if (u && Date.now() < u) return;
    } catch {}
    const mobile = isMobileDevice();
    if (mobile && window.innerWidth <= 640) {
      bar.style.left='12px';
      bar.style.right='12px';
      bar.style.transform='none';
      bar.style.bottom='12px';
      bar.style.maxWidth='none';
      bar.style.width='auto';
    } else {
      bar.style.left='50%';
      bar.style.right='auto';
      bar.style.transform='translateX(-50%)';
      bar.style.bottom='18px';
      bar.style.maxWidth='calc(100vw - 24px)';
      bar.style.width='auto';
    }
    buildBar();
    bar.hidden=false;
  }
  function hideAndDismiss(days){
    bar.hidden=true;
    try { localStorage.setItem('ywoom_pwa_dismissed_until', String(Date.now()+days*24*3600*1000)); } catch {}
  }
  function showDismissChoice(){
    const ov = document.createElement('div');
    ov.setAttribute('role','dialog');
    ov.setAttribute('aria-modal','true');
    ov.setAttribute('aria-label','Скрыть баннер установки');
    ov.style.cssText='position:fixed;inset:0;background:rgba(10,12,20,.62);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:16px;z-index:71';
    ov.innerHTML='<div style="background:#35373f;color:#ecebf4;border-radius:20px;padding:18px;max-width:380px;width:100%;box-shadow:0 12px 32px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.08);display:flex;flex-direction:column;gap:12px">'
      + '<div style="font-weight:600;font-size:14px">Скрыть баннер установки?</div>'
      + '<div style="font-size:12px;color:#b8b9c8;line-height:1.4">Где найти позже: боковое меню → <a href="/install" style="color:#b7c8ff">Установка · скачать</a> — страница с пояснениями по каждому устройству и ссылками на маркеты.</div>'
      + '<div style="display:flex;gap:8px;flex-wrap:wrap">'
      + '<button data-dismiss-week style="flex:1;padding:10px 12px;border-radius:12px;background:#4a4c57;color:#ecebf4;border:1px solid rgba(255,255,255,.10);font-weight:600;cursor:pointer">На неделю</button>'
      + '<button data-dismiss-never style="flex:1;padding:10px 12px;border-radius:12px;background:#7d9cff;color:#1b2038;border:0;font-weight:600;cursor:pointer">Навсегда</button>'
      + '</div>'
      + '<button data-dismiss-cancel style="padding:8px 12px;border-radius:12px;background:transparent;color:#b8b9c8;border:1px solid rgba(255,255,255,.10);font-size:12px;cursor:pointer">Отмена</button>'
      + '</div>';
    function closeOv(){ ov.remove(); }
    ov.addEventListener('click', function(e){
      const t=e.target;
      if(!(t instanceof Element)) return;
      if(t.closest('[data-dismiss-week]')){ bar.hidden=true; hideAndDismiss(7); closeOv(); return; }
      if(t.closest('[data-dismiss-never]')){ bar.hidden=true; try{ localStorage.setItem('ywoom_pwa_never','1'); }catch{} closeOv(); return; }
      if(t.closest('[data-dismiss-cancel]') || t===ov) closeOv();
    });
    document.body.append(ov);
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
  window.addEventListener('resize', function(){ if (!bar.hidden) { buildBar(); show(); } });

  window.addEventListener('beforeinstallprompt', function(e){
    e.preventDefault();
    deferred=e;
    show();
    buildBar();
  });
  setTimeout(function(){
    if (isIOS() && !isStandalone && bar.hidden) show();
  }, 1500);

  bar.addEventListener('click', async function(e){
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest('[data-pwa-close]')) { showDismissChoice(); return; }
    if (t.closest('[data-pwa-install]')) {
      if (deferred) {
        try {
          await deferred.prompt();
          const ch = await deferred.userChoice;
          if (ch && ch.outcome==='accepted') {
            bar.hidden=true;
            try{ localStorage.removeItem('ywoom_pwa_dismissed_until'); localStorage.removeItem('ywoom_pwa_never'); }catch{}
          } else hideAndDismiss(1);
        } catch { hideAndDismiss(1); }
        finally { deferred=null; }
      } else if (isIOS()) {
        const ov = document.createElement('div');
        ov.style.cssText='position:fixed;inset:0;background:rgba(10,12,20,.72);backdrop-filter:blur(6px);display:flex;align-items:flex-end;justify-content:center;padding:16px;z-index:70';
        ov.innerHTML='<div style="background:#35373f;color:#ecebf4;border-radius:20px;padding:20px;max-width:420px;width:100%;box-shadow:0 12px 32px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.08)">'
          + '<div style="font-weight:600;margin-bottom:8px">Как установить на iPhone</div>'
          + '<div style="font-size:13px;color:#b8b9c8;line-height:1.5">Нажми <span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid rgba(255,255,255,.15);border-radius:6px;vertical-align:middle">⎆</span> «Поделиться» внизу Safari → «На экран «Домой»» → Добавить. Подробнее — <a href="/install" style="color:#b7c8ff">/install</a>.</div>'
          + '<button style="margin-top:14px;width:100%;padding:10px;border-radius:12px;background:#7d9cff;color:#1b2038;border:0;font-weight:600;cursor:pointer">Понятно</button></div>';
        ov.addEventListener('click', function(ev){ if (ev.target===ov || ev.target instanceof HTMLButtonElement) ov.remove(); });
        document.body.append(ov);
      } else {
        // desktop: go to install page alternative
        location.href='/install';
      }
    }
  });
  window.addEventListener('appinstalled', function(){ bar.hidden=true; try{ localStorage.removeItem('ywoom_pwa_dismissed_until'); localStorage.removeItem('ywoom_pwa_never'); }catch{} });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(function(){});

  window.__pwaTest = { show: show, hide: function(){ bar.hidden=true; }, isMobile: isMobileDevice, isIOS: isIOS, showDismissChoice: showDismissChoice };
})();

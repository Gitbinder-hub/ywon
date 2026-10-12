'use strict';
(function(){
  const path = location.pathname;
  function activeFor(href){
    if(href==='/' && path==='/') return true;
    if(href!=='/' && path.startsWith(href)) return true;
    return false;
  }
  document.addEventListener('DOMContentLoaded', ()=>{
    document.querySelectorAll('.side-nav a').forEach(a=>{
      const href=a.getAttribute('href');
      if(href && activeFor(href)) a.classList.add('active');
    });
    // onboarding: show once
    const key='ywoom_onboard_seen_v1';
    const onboard=document.getElementById('onboarding');
    if(onboard && !localStorage.getItem(key)){
      onboard.style.display='flex';
      const close=()=>{
        localStorage.setItem(key,'1');
        onboard.style.display='none';
      };
      const _c0=onboard.querySelectorAll('[data-close-onboard]'); if(_c0.length) _c0.forEach(b=> b.addEventListener('click', close));
      if(onboard) onboard.addEventListener('click', (e)=>{ if(e.target===onboard) close(); });
    } else if(onboard){
      onboard.style.display='none';
    }

    // studio onboarding: show once on /studio
    const skey='ywoom_studio_onboard_seen_v16';
    const sob=document.getElementById('studio-onboarding');
    if(sob && path.startsWith('/studio') && !localStorage.getItem(skey)){
      sob.style.display='flex';
      const sclose=()=>{
        localStorage.setItem(skey,'1');
        sob.style.display='none';
      };
      const _c1=sob.querySelectorAll('[data-close-studio]'); if(_c1.length) _c1.forEach(b=> b.addEventListener('click', sclose));
      if(sob) sob.addEventListener('click', (e)=>{ if(e.target===sob) sclose(); });
    } else if(sob){
      sob.style.display='none';
    }
    // dashboard search filter
    const q=document.getElementById('dash-query');
    if(q){
      q.addEventListener('input', ()=>{
        const v=q.value.toLowerCase().trim();
        document.querySelectorAll('[data-pcard]').forEach(card=>{
          const t=(card.getAttribute('data-title')||'').toLowerCase();
          const s=(card.getAttribute('data-status')||'').toLowerCase();
          card.style.display = (!v || t.includes(v) || s.includes(v)) ? '' : 'none';
        });
      });
    }
  });
})();

'use strict';
(function(){
  var nav = document.getElementById('yw-nav');
  var burger = document.querySelector('.yw-burger');
  var backdrop = document.getElementById('yw-nav-backdrop');
  var arrow = document.getElementById('yw-nav-arrow');
  if(!nav || !burger || !backdrop) return;

  var isDesktop = function(){ return window.matchMedia('(min-width: 901px)').matches; };
  var COLLAPSE_KEY = 'ywoom_nav_collapsed';
  var HIDDEN_KEY = 'ywoom_nav_hidden';

  var focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1")]';
  var lastFocus = null;
  var touchStartX = 0;
  var touchStartY = 0;

  function isOpen(){ return nav.classList.contains('is-open'); }

  function getFocusable(){
    return Array.prototype.slice.call(nav.querySelectorAll(focusableSelector)).filter(function(el){ return el.offsetParent !== null || el === document.activeElement; });
  }

  function applyCollapsed(on){
    if(on) document.body.classList.add('nav-collapsed');
    else document.body.classList.remove('nav-collapsed');
    try{ localStorage.setItem(COLLAPSE_KEY, on ? '1' : '0'); }catch(e){}
    try{ window.dispatchEvent(new Event('resize')); }catch(e){}
  }
  function applyHidden(on){
    if(on){
      document.body.classList.add('nav-hidden');
      document.body.classList.remove('nav-collapsed');
      try{ localStorage.setItem(HIDDEN_KEY, '1'); localStorage.setItem(COLLAPSE_KEY, '0'); }catch(e){}
    } else {
      document.body.classList.remove('nav-hidden');
      try{ localStorage.setItem(HIDDEN_KEY, '0'); }catch(e){}
    }
    try{ window.dispatchEvent(new Event('resize')); }catch(e){}
  }
  try{
    var savedC = localStorage.getItem(COLLAPSE_KEY);
    var savedH = localStorage.getItem(HIDDEN_KEY);
    if(savedH === '1' && isDesktop()) applyHidden(true);
    else if(savedC === '1' && isDesktop()) applyCollapsed(true);
  }catch(e){}

  function syncArrow(){
    if(!arrow) return;
    var collapsed = document.body.classList.contains('nav-collapsed');
    var hidden = document.body.classList.contains('nav-hidden');
    if(collapsed || hidden){
      arrow.hidden=false;
      arrow.style.display='inline-flex';
      arrow.textContent = hidden ? '›' : '‹';
      arrow.setAttribute('aria-label', hidden ? 'Развернуть меню' : 'Скрыть меню полностью');
    } else {
      arrow.hidden=true;
      arrow.style.display='none';
    }
  }
  syncArrow();
  var _origApplyCollapsed = applyCollapsed;
  applyCollapsed = function(on){
    _origApplyCollapsed(on);
    if(on) applyHidden(false);
    syncArrow();
  };
  var _origApplyHidden = applyHidden;
  applyHidden = function(on){
    _origApplyHidden(on);
    syncArrow();
  };

  function open(){
    if(isOpen()) return;
    lastFocus = document.activeElement;
    nav.classList.add('is-open');
    backdrop.hidden = false;
    void backdrop.offsetWidth;
    backdrop.classList.add('is-open');
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded','true');
    document.body.classList.add('nav-open');
    var focusable = getFocusable();
    if(focusable.length) focusable[0].focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close(){
    if(!isOpen()) return;
    nav.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded','false');
    document.body.classList.remove('nav-open');
    document.removeEventListener('keydown', onKeydown);
    setTimeout(function(){
      if(!isOpen()) backdrop.hidden = true;
    }, 260);
    if(lastFocus && lastFocus.focus) try{ lastFocus.focus(); }catch(e){}
    try{ window.dispatchEvent(new Event('resize')); }catch(e){}
  }

  function toggle(){
    if(isDesktop()){
      var hidden = document.body.classList.contains('nav-hidden');
      if(hidden){ applyHidden(false); applyCollapsed(true); return; }
      var collapsed = document.body.classList.contains('nav-collapsed');
      applyCollapsed(!collapsed);
      return;
    }
    if(isOpen()) close(); else open();
  }

  function onKeydown(e){
    if(e.key === 'Escape' || e.key === 'Esc'){
      if(isDesktop() && document.body.classList.contains('nav-hidden')){
        applyHidden(false);
        e.preventDefault();
        return;
      }
      if(isDesktop() && document.body.classList.contains('nav-collapsed')){
        applyCollapsed(false);
        e.preventDefault();
        return;
      }
      e.preventDefault(); close(); return;
    }
    if(e.key === 'Tab'){
      var focusable = getFocusable();
      if(!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if(e.shiftKey){
        if(document.activeElement === first){ e.preventDefault(); last.focus(); }
      } else {
        if(document.activeElement === last){ e.preventDefault(); first.focus(); }
      }
    }
  }

  burger.addEventListener('click', function(e){ e.preventDefault(); toggle(); });
  if(arrow) arrow.addEventListener('click', function(e){
    e.preventDefault();
    var hidden = document.body.classList.contains('nav-hidden');
    var collapsed = document.body.classList.contains('nav-collapsed');
    if(hidden){ applyHidden(false); }
    else if(collapsed){ applyHidden(true); }
    else { applyCollapsed(true); }
  });
  backdrop.addEventListener('click', close);

  nav.addEventListener('click', function(e){
    var a = e.target.closest('a[href]');
    if(a) close();
  });

  nav.addEventListener('touchstart', function(e){
    if(e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, {passive:true});
  nav.addEventListener('touchend', function(e){
    if(!isOpen()) return;
    var t = e.changedTouches[0];
    if(!t) return;
    var dx = t.clientX - touchStartX;
    var dy = t.clientY - touchStartY;
    if(dx < -40 && Math.abs(dy) < 80) close();
  }, {passive:true});

  backdrop.addEventListener('touchstart', function(e){
    if(e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
  }, {passive:true});
  backdrop.addEventListener('touchend', function(e){
    var t = e.changedTouches[0];
    if(!t) return;
    if(t.clientX - touchStartX < -30) close();
  }, {passive:true});

  var mq = window.matchMedia('(min-width: 901px)');
  function onBreakpointChange(e){
    if(e.matches) close();
    else {
      document.body.classList.remove('nav-collapsed');
      document.body.classList.remove('nav-hidden');
      syncArrow();
    }
  }
  if(mq.addEventListener) mq.addEventListener('change', onBreakpointChange);
  else if(mq.addListener) mq.addListener(onBreakpointChange);
})();

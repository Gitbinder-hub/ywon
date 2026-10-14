'use strict';
/* Ywoom splash — first-visit preload (once per calendar day) */
(() => {
  const KEY = 'ywoom_splash_seen';
  function todayLocal() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + da;
  }
  function isSeenToday() {
    try { return localStorage.getItem(KEY) === todayLocal(); } catch (_) { return false; }
  }
  function markSeen() {
    try { localStorage.setItem(KEY, todayLocal()); } catch (_) {}
  }
  const s = document.getElementById('ys');
  if (!s) return;
  if (isSeenToday()) {
    document.documentElement.classList.remove('ys-lock');
    s.remove();
    dispatchEvent(new Event('ywoom:splash-done'));
    window.YwoomSplash = {
      ready() { dispatchEvent(new Event('ywoom:splash-done')); },
      skip() {}
    };
    return;
  }
  document.documentElement.classList.add('ys-lock');
  const rm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  let minOk = false, ready = false, closed = false;
  const R = Math.random, NS = 'http://www.w3.org/2000/svg';
  let actx = null;
  let pendingHits = [];
  function ensureCtx() {
    if (actx) { if (actx.state === 'suspended') actx.resume().catch(() => {}); return actx; }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      actx = new Ctx();
      if (actx.state === 'suspended') actx.resume().catch(() => {});
      return actx;
    } catch (_) { return null; }
  }
  function subHit(ctx, vol) {
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + 0.55);
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(vol, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.75);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.8);
  }
  function shimmer(ctx, vol) {
    const t = ctx.currentTime;
    ;[880, 1320].forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol * (i ? 0.32 : 0.42), t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + 1.0);
    });
  }
  function whoosh(ctx, vol) {
    const t = ctx.currentTime;
    const len = Math.floor(ctx.sampleRate * 0.85);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.15);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filt = ctx.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(700, t);
    filt.frequency.linearRampToValueAtTime(3200, t + 0.55);
    filt.Q.value = 0.85;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.32, t + 0.07);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.85);
    src.connect(filt).connect(g).connect(ctx.destination);
    src.start(t);
    src.stop(t + 0.9);
  }
  function swell(ctx, vol) {
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.linearRampToValueAtTime(165, t + 1.1);
    f.type = 'lowpass';
    f.frequency.setValueAtTime(900, t);
    f.frequency.linearRampToValueAtTime(2200, t + 1.1);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol * 0.22, t + 0.35);
    g.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    o.connect(f).connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + 1.5);
  }
  function playCinematic(kind) {
    const ctx = ensureCtx();
    if (!ctx) return false;
    if (ctx.state !== 'running') return false;
    const v = rm ? 0.09 : 0.16;
    if (kind === 'whoosh') whoosh(ctx, v);
    else if (kind === 'hit') { subHit(ctx, rm ? v * 0.7 : v); shimmer(ctx, rm ? v * 0.6 : v); }
    else if (kind === 'swell') swell(ctx, rm ? v * 0.8 : v);
    return true;
  }
  function scheduleCinematic(delay, kind) {
    setTimeout(() => {
      if (playCinematic(kind)) return;
      pendingHits.push(kind);
      const ctx = ensureCtx();
      if (!ctx) return;
      const onGesture = () => {
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        const q = pendingHits.slice(); pendingHits.length = 0;
        let off = 0;
        q.forEach((k) => { setTimeout(() => playCinematic(k), off); off += 90; });
        removeEventListener('click', onGesture);
        removeEventListener('keydown', onGesture);
        removeEventListener('touchstart', onGesture);
      };
      addEventListener('click', onGesture, { once: true });
      addEventListener('keydown', onGesture, { once: true });
      addEventListener('touchstart', onGesture, { once: true });
      ctx.resume().catch(() => {});
    }, delay);
  }
  setTimeout(() => { ensureCtx(); }, 120);
  addEventListener('click', () => { if (actx && actx.state === 'suspended') actx.resume().catch(() => {}); }, { once: true });
  addEventListener('keydown', () => { if (actx && actx.state === 'suspended') actx.resume().catch(() => {}); }, { once: true });
  if (rm) {
    scheduleCinematic(520, 'whoosh');
    scheduleCinematic(780, 'hit');
    scheduleCinematic(1080, 'swell');
  } else {
    scheduleCinematic(1450, 'whoosh');
    scheduleCinematic(2450, 'hit');
    scheduleCinematic(5200, 'swell');
  }
  const mesh = s.querySelector('.mesh'), cols = 11, rows = 7, x0 = -160, y0 = -110, cw = 1920 / cols, ch = 1120 / rows, P = [];
  for (let r = 0; r <= rows; r++) { P[r] = []; for (let c = 0; c <= cols; c++) { const e = !r || !c || r == rows || c == cols; P[r][c] = [x0 + c * cw + (e ? 0 : (R() - .5) * cw * .6), y0 + r * ch + (e ? 0 : (R() - .5) * ch * .6)]; } }
  function tri(a, b, c) {
    const p = document.createElementNS(NS, 'polygon'), mx = (a[0] + b[0] + c[0]) / 3, my = (a[1] + b[1] + c[1]) / 3,
      d = Math.hypot(mx - 800, (my - 430) * 1.3), h = (215 + Math.max(0, Math.min(1, mx / 1600)) * 110 + R() * 16 - 8) | 0, L = 5 + R() * 6;
    p.setAttribute('points', a + ' ' + b + ' ' + c);
    p.style.cssText = '--c:hsl(' + h + ' 30% ' + L.toFixed(1) + '%);--l:hsl(' + h + ' 55% ' + (L + 14 + R() * 6).toFixed(1) + '%);--k:' + (d / 900 * 1.1).toFixed(2) + 's;--j:' + (R() * 1.2).toFixed(2) + 's';
    mesh.appendChild(p);
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const a = P[r][c], b = P[r][c + 1], d = P[r + 1][c], e = P[r + 1][c + 1]; if (R() < .5) { tri(a, b, d); tri(b, e, d); } else { tri(a, b, e); tri(a, e, d); } }
  const tail = s.querySelector('.tail');
  for (let g = 1; g <= 3; g++) { const c = tail.cloneNode(true); c.setAttribute('class', 'ghost'); c.style.setProperty('--g', (g * .08).toFixed(2) + 's'); c.querySelectorAll('defs,.g0,.gd,.ef').forEach(n => n.remove()); tail.parentNode.insertBefore(c, tail); }
  const mark = s.querySelector('.mark');
  for (let i = 0; i < 10; i++) { const e = document.createElement('i'); e.className = 'sp'; e.style.cssText = '--a:' + (i * 36 + R() * 20 - 10).toFixed(1) + 'deg;--r:' + (60 + R() * 90 | 0) + 'px;animation-delay:calc(var(--hit) + ' + (R() * .06).toFixed(2) + 's)'; mark.appendChild(e); }
  function close() {
    if (closed) return;
    closed = true;
    markSeen();
    document.documentElement.classList.remove('ys-lock');
    s.classList.add('out');
    setTimeout(() => { s.remove(); dispatchEvent(new Event('ywoom:splash-done')); }, 1300);
  }
  const go = () => { if (minOk && ready) close(); };
  setTimeout(() => { minOk = true; go(); }, rm ? 1300 : 5800);
  setTimeout(close, 12000);
  if (!s.hasAttribute('data-manual')) { document.readyState === 'complete' ? ready = true : addEventListener('load', () => { ready = true; go(); }); }
  window.YwoomSplash = { ready() { ready = true; go(); }, skip: close };
  const skipBtn = s.querySelector('.skip');
  if (skipBtn) skipBtn.onclick = close;
  addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
})();

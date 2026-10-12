// Ywoom 3.1 — offline shell cache (PWA). Only caches shell, never /api.
'use strict';
const CACHE = 'ywoom-shell-3.1l';
const SHELL = ['/', '/design.css', '/home.js', '/pwa.js', '/studio', '/billing', '/settings', '/skills', '/journey', '/style.css', '/shell.css', '/skills.css', '/studio.css', '/shell.js', '/app.js', '/studio.js', '/billing.js', '/skills.js', '/journey.js', '/journey-core.js', '/manifest.webmanifest', '/Ywoom.ico'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return;
  if (e.request.method !== 'GET') return;
  const isShell = SHELL.includes(url.pathname) || SHELL.includes(url.pathname.replace(/\/$/, '') + '/') || url.pathname === '/';
  if (!isShell) return;
  e.respondWith(
    caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});

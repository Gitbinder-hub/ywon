# B030 — 3.0 PWA + мобильная полировка + облако-заглушка / REVIEW

Дата: 2026-10-11 · ветка bootstrap/spec-v04-foundation · FAST_PROTOTYPE (только `node --check`)

## Цель 3.0
Крупный прыжок после 2.9: PWA-обвязка + мобильная полировка + видимая «облако (скоро)» — без ломки API и без реального облака.

## Что сделано (поверх 2.9)
- **Версия 3.0 везде:** `apps/api/src/server.ts VERSION='3.0'`, `apps/api/src/offline.ts` export `3.0`, все HTML `3.0` (`index/studio/billing/journey/settings/skills`), `settings` — `Мастерская 3.0` + `Setup-3.0.exe` + ченджлог `3.0 — PWA...`, `QvunaInstaller.cs DisplayVersion 3.0`.
- **PWA:** `apps/web/public/manifest.webmanifest` (name Ywoom, standalone, theme #0f141e, /Ywoom.ico) + `sw.js` (CACHE `ywoom-shell-3.0`, shell-only `cache.addAll`, `skipWaiting/claim`, never `/api/`, cache-first для shell) + `server.ts` отдаёт `manifest.webmanifest` и `sw.js` + все HTML получили `<link rel="manifest">` + `<meta theme-color>` + `navigator.serviceWorker.register("/sw.js")`.
- **Установка PWA:** `index.html` — бейдж `3.0 · PWA + локально`, текст «теперь и как PWA на телефоне. Облако — скоро.» + `beforeinstallprompt` кнопка «Установить как приложение» (`deferred.prompt()`).
- **Мобильная полировка:** `shell.css` — `--safe-area-inset-*`, `display-mode: standalone` паддинг, `settings.html` — карточка `Система · 3.0 PWA` с подсказкой про установку и `TR-02/03/05`, `index` онбординг `3.0`.
- **Сборка:** `C:\Temp\build_30.py` — `VERSION 3.0`, sync включает `manifest.webmanifest/sw.js` + `RELEASE_NOTES_3.0.md`, `PLATFORM:x64` сохранён, `skills/recipes` копируются.

## Сохранено из 2.9 (не регресс)
- 2.3 zip + diff +/−, 2.4 плеер, 2.5 поиск ревизий + фильтры, 2.6 корзина с picker, 2.7 график + очистка кэша, 2.8 промокод+история, 2.9 a11y — всё в `studio.js/billing.js/settings.html/shell.css` на месте.

## Сборка 3.0
- `payload_stage` 303 файла (+ `manifest.webmanifest`, `sw.js`, `RELEASE_NOTES_3.0.md` к 300)
- `Ywon-Companion-3.0.zip` 804882 sha `fcec3ce64313bc512c1a60cafc5deed665c8ffa923f02012998d150581fce614`
- `Ywon-Companion-Setup-3.0.exe` 827392 sha `85b16aaf0a40f67ebfb57ff4c56177bac1974c607eed8cd674f5b03d8e4df47e`
- `QvunaTray.exe` x64 33280 sha `cac6e97a738068136825e48ea2a9230f1b58f0ddb4707bba75aa7386f648f918`
- `manifest.json` `version 3.0` `payloadFiles 303` `payloadZip Ywon-Companion-3.0.zip` `notes: "3.0: PWA + мобильная полировка + облако (скоро) — без ломки API"`
- Билд: `python -I C:\Temp\build_30.py` (csc 4.0 winexe /platform:x64), алиасы `Setup-2.0..3.0` / `2.0..3.0.zip` копии.

## Верификация
- `node --check server.ts/studio.js/billing.js/sw.js/app.js` — RC0.
- Live `C:\Temp\live30.py` (random port): `version 3.0 PASS, /manifest.webmanifest 200, /sw.js 200, /api/skills 200, /skills 200, POST 201, export 3.0 PASS, manifest in index + sw exists PASS` — **ALL LIVE 3.0 PASS**.
- Дев 3000: перезапущен как 3.0 — `GET /api/version 200 {"version":"3.0"...}` PASS, F5.
- PWA install prompt — ручная проверка на десктопе/Андроиде (Chrome/Edge) NOT_RUN (нужен HTTPS или `http://127.0.0.1:3000` + devtools Application).

## Риски/ограничения 3.0
- Облако — только текст «скоро», без бэкапа/синка (TR-02/03/05) — не выдавать за рабочий синк.
- SW кэширует только shell, `/api/` всегда сеть — оффлайн CRUD не работает без сервера (ок для пилота).
- Требуется HTTPS для install на не-localhost; на `127.0.0.1:3000` — ок через devtools.

## Файлы/команды
- Изменены: `server.ts`, `offline.ts`, `shell.css`, все HTML, `settings.html`, `index.html`, `RELEASE_NOTES_3.0.md`; созданы: `manifest.webmanifest`, `sw.js`.
- Билд: `python -I C:\Temp\build_30.py` → `outputs/companion-windows-installer-2026-10-06/`
- Live: `python -I C:\Temp\live30.py` · Дев: `node apps/api/src/server.ts` (cwd корень, убить старый на 3000).

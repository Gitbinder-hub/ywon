# B029 — 2.9 финальная полировка 2.x (2.3→2.9 одним релизом) / REVIEW

Дата: 2026-10-11 · ветка bootstrap/spec-v04-foundation · FAST_PROTOTYPE (только `node --check`)

## Цель
Закрыть весь план 2.3→2.9 одним прыжком (чтобы не плодить 7 одиночных пересборок), не ломая API и не трогая `tasks/project.json`.

## Что сделано (все 2.3→2.9 разом)
- **Версия 2.9 везде:** `apps/api/src/server.ts VERSION='2.9'`, `apps/api/src/offline.ts` export `version:'2.9'`, `apps/web/public/{index,studio,billing,journey,settings,skills}.html` → `2.9`, `settings` — `Текущая версия: 2.9` + `Ywon-Companion-Setup-2.9.exe` + ченджлог 2.9, `installer/QvunaInstaller.cs DisplayVersion 2.9`.
- **2.3 zip + diff:** `studio.js` — `bulkZipExport()` собирает выделенные проекты в один `ywoom-bundle-*.json` (иначе `ywoom-*.json` по одному), `Экспорт всех` для 6+ предлагает «один архив» vs «по одному»; `diffRevision()` теперь красит `<ins>`/`<del>` по словам (зелёный/красный), `diffRevisionText()` оставлен для текста.
- **2.4 плеер:** клик по MP4-превью карточки → `openMp4Modal(jobId)` — модалка с `<video>` + Скачать/Отчёт/Копировать ссылку (clipboard + fallback prompt).
- **2.5 поиск по ревизиям + фильтры дашборда:** `revQuery` поле в `history-box` фильтрует строки ревизий; дашборд получил `dashDateFilter/dashTagFilter2/sortMode` — контролы «С даты / #тег / Сортировка (Обновлённые-А-Я-Новые)» над сеткой, `filteredProjects` обёрнут.
- **2.6 корзина по ревизиям:** `restoreWithPicker(pid)` — если >1 ревизии, `prompt` просит `rN` и восстанавливает именно ту ревизию как новую версию (иначе простой `restore`).
- **2.7 хранилище:** `settings.html` — горизонтальный `storage-chart` (проекты/сборки/медиа полоски) + `storage-breakdown` + кнопка `Очистить кэш` (инструкция + warmup).
- **2.8 биллинг:** `billing.js` — `PROMO_CODES {YWOOM2026: Pro 7д, WELCOME: Pro 3д}` + `promo-box` + `billing-history` (localStorage 20 записей), `billing.html` — карточки Промокод/История.
- **2.9 полировка:** `shell.css` — `:focus-visible` + `prefers-reduced-motion` + пустые состояния; `settings.html` health `aria-live`; `studio.js` — `clearSelection/updateBulkBar/toggleHistory` (были вызованы, но не определены — починено), `injectDashExtraControls/injectRevSearch` с guards.
- **Фикс багов:** отсутствовали `clearSelection/updateBulkBar/toggleHistory` — собирали ReferenceError при выборе карточек / клике Истории; добавлены выше, `updateBulkBar` управляет `bulk-bar` видимостью.

## Сборка 2.9
- `payload_stage` 300 файлов (299 + RELEASE_NOTES_2.9)
- `Ywon-Companion-2.9.zip` 801776 sha `9c023ba153811fc811383179b4f1a08cb9bd01790da67de47924af4689a68e59`
- `Ywon-Companion-Setup-2.9.exe` 824320 sha `3264e7a6a16bc50623a7a789c0de33ef070bd6f88a5bba6012cd92439b0deca2`
- `QvunaTray.exe` x64 33280 sha `a202f9ce96273ce498a35bee6f67de1fbe2694b43c1af21f90053184389ecb5a`
- `manifest.json` `version 2.9` `payloadFiles 300` `notes: "2.9: массовый zip, diff +/-, модалка MP4/копия ссылки, фильтр ревизий, график хранилища, биллинг история+промо, a11y/пустые состояния — скилы всегда 200"`
- Билд: `python -I C:\Temp\build_29.py` (csc 4.0 winexe /platform:x64, skills/recipes копируются, `skills 37 files, recipes 5 files`).
- Алиасы: `Setup-2.2..2.9` и `2.2..2.9.zip` — копии одного артефакта.

## Верификация (FAST_PROTOTYPE: только node --check + live smoke)
- `node --check server.ts/studio.js/billing.js/app.js` — RC0 (shell check отдельно ок).
- Live (random port): `GET /api/version 2.9` PASS, `GET /skills 200` PASS, `GET /skills/ 200` PASS, `GET /api/skills 200` PASS, `POST /projects 201` PASS, `GET /projects/:id/export has 2.9` PASS, `GET /revisions 200` PASS, `bulkZip/mp4modal/promo` в файлах PASS — `ALL LIVE 2.9 PASS` (`C:\Temp\live29.py`).
- Дев на 3000 перезапущен как 2.9 — `GET /api/version 200 {"version":"2.9", ...}` PASS, F5 достаточно.
- `node --check` четырёх файлов ранее FALL через `check_22.py` ожидаемо — он хардкодит `2.2`.

## Риски/не сделано
- Промокод — mock в `billing.js` (localStorage + `/api/billing/trial` fallback), не Stripe.
- Очистить кэш — инструкция + `GET /api/offline/jobs` warmup, реального `DELETE /jobs` нет (прототип хранит FS).
- График хранилища — прокси-метрика `projects*0.02 + jobs*0.08 + totalAssetMiB`, не точная разбивка по типам файлов.
- Перезапись `skills.js` не трогалась; `project.json` не трогалась.
- 3.0 (мобайл PWA / облако по TR) — ждёт решения Oleg, не в этом билде.

## Файлы/команды
- Изменены: `server.ts`, `offline.ts`, `studio.js`, `studio.html`, `settings.html`, `billing.html`, `billing.js`, `shell.css`, `QvunaInstaller.cs`, `RELEASE_NOTES_2.9.md`.
- Билд: `python -I C:\Temp\build_29.py` → `outputs/companion-windows-installer-2026-10-06/`
- Live: `python -I C:\Temp\live29.py` · Дев: `node apps/api/src/server.ts` (cwd корень) — убить старый на 3000 перед рестартом.

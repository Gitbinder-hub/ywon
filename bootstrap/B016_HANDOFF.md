# B016 — 0.16 онбординг студии + лимиты Free/Pro + Проверить обновления / REVIEW

Дата: 2026-10-10..11 · ветка bootstrap/spec-v04-foundation · FAST_PROTOTYPE

## Цель 0.16 (по плану после 0.15)
- Онбординг в Студии (один показ)
- Лимиты Free/Pro реально режут (не бейдж)
- "Проверить обновления" (локально)

## Что сделано

### 1. Починка кодировки (блокер из 0.15)
- `apps/web/public/studio.html`, `billing.html`, `settings.html` были double-encoded utf8 (utf8 → cp1252 → utf8): заголовки `Ywoom — Студия/Подписки/Настройки` ломались + битые байты `0x9d/0x98` не давали декод. Починены hybrid `cp1252` fallback `latin1` → `utf-8` decode, BOM сохранён. Проверка: `Студия/Завод/Подписки/Настройки` в каждом из 6 html, `node --check` 7 файлов OK.

### 2. Billing — лимиты
- `apps/api/src/billing.ts` + `getPlan(userId|null): Plan`, `maxProjects(plan): number` — Free 3, Pro 100, Studio Infinity. `listPlans` note обновлён.
- `apps/api/src/server.ts` — `VERSION='0.16'`, роут `GET /api/version` → `{version:'0.16'}`, `GET /api/updates` → `{current,latest,upToDate}`, `GET /api/billing/limits` → `{plan,maxProjects,unlimited}` по сессии (без сессии = free). `FACTORY.cmd` уже ставит `Ywoom_SESSION_SECRET=dev-secret-32-chars-long-for-proto` по умолчанию, без него `POST /api/auth/login` давал 503 (починено для локального запуска).
- `apps/api/src/offline.ts` — импорт `getSessionUser`+`billing`, `POST /api/offline/projects` и `POST /api/offline/demo` теперь считают `readdir(.Ywoom-offline/projects)` и кидают `Problem 402` `Лимит Free — 3 проекта…` / `Лимит проектов исчерпан` когда `cnt >= maxProjects(plan)`.
- `apps/web/public/billing.js` — `GET /api/billing/limits` и подпись `Лимит: free — 3 проекта / pro — 100` + `unlimited`.
- `apps/web/public/billing.html` — `Ywoom 0.15 → 0.16`, note `В 0.16 лимиты Free/Pro реально режут`.

### 3. Онбординг студии
- `apps/web/public/shell.js` — `ywoom_studio_onboard_seen_v16` на `/studio`, `#studio-onboarding` show once, `data-close-studio`, клик по overlay.
- `apps/web/public/shell.css` — уже имел `.onboarding/.onboard-card/.onboard-steps` (использован).
- `apps/web/public/studio.html` — добавлен `#studio-onboarding` (3 шага: дашборд/Новый/Демо → сценарий→озвучка/картинки до 6 сцен → Сохранить→Собрать MP4, Free 3/Pro без лимита, `Ctrl+S/N`, проверка обновлений в Настройках).

### 4. Проверить обновления
- `apps/web/public/settings.html` — секция Обновления переписана: `Текущая версия: 0.16 · канал local`, кнопка `#check-updates` + `#upd-status`, `fetch /api/updates` → `У тебя свежая версия 0.16 ✓`, `fetch /api/health` остаётся. `journey.html` `0.15→0.16`.

### 5. Инсталлятор / сборка
- `installer/QvunaInstaller.cs` — `DisplayVersion 0.12→0.16`, `Ywoom 0.15 — Установка → 0.16`.
- `installer/QvunaTray.cs` — без изменений (x64 winexe 33280 sha `29fef19a6fbd3ff4419cc73d03b145ea9f465f6e95189763013ad7da9ac2978f`).
- `build_016.py` (скопирован из `C:\Temp\build_016b.py`) — sync 27 файлов в `payload_stage`, x64 tray compile, `Ywoom.ico`, packages sync, `Ywon-Companion-0.16.zip` 265 файлов + `Ywon-Companion-Setup-0.16.exe`.

## Сборка 0.16
- `outputs/companion-windows-installer-2026-10-06/payload_stage` 265 файлов
- `Ywon-Companion-0.16.zip` 750869 sha256 `5dae17c3d587c1a678c5c856d985d10bb0129addbd3388402ac0c2fa8ecc0e58`
- `Ywon-Companion-Setup-0.16.exe` 773120 sha256 `d180dde3decfd012eb4c8b8b65116744afab8f50d554feff9160827500f5d9e1`
- `uninstall.exe` 7168
- `manifest.json` version 0.16, `notes: "0.16: studio onboarding + billing limits Free3/Pro100 + updates check"`, `tray: QvunaTray.exe 33280`
- Запуск: `python build_016.py` (требует `csc.exe` 4.0) или `python -I C:\Temp\build_016b.py`; установка `%LOCALAPPDATA%\Ywon\Ywon Companion`, ярлыки `Start/Ywon.lnk` + `Desktop/Ywon Companion.lnk`, `FACTORY.cmd` на 3000, `http://127.0.0.1:3000`.

## Верификация
- `node --check` (FAST_PROTOTYPE): `server.ts`, `app.js`, `studio.js`, `billing.js` — RC0; плюс `billing.ts`, `offline.ts`, `shell.js` — RC0.
- Live server (эпhemeral port, `Ywoom_SESSION_SECRET=dev-secret-32-chars-long-for-proto`): `GET /api/version` 200 `0.16`, `GET /api/updates` 200 `upToDate:true`, `GET /api/billing/limits` 200 `free 3`, `POST /api/offline/projects` 3×201, 4-й free 402 `Лимит Free`, `POST /api/auth/login` 200, `POST /api/billing/subscribe pro` 200, `GET /api/billing/limits` с кукой 200 `pro 100`, `POST /api/offline/projects` с pro 201 — PASS. Clean 4 `T` проектов.
- Ручная проверка: студия onboarding один раз, shell поиск, дашборд, timeline/drag — как в 0.15, не регрессило; биллинг лимит баннер; настройки `Проверить обновления` → `свежая версия 0.16 ✓`.

## Что НЕ делалось / NOT_RUN
- Подпись MSI/MSIX, Win11, auto-update по сети, Stripe/DB — не в скоупе 0.16 (mock in-memory).
- Миграция Postgres / S3 / реальный `live` режим — `productReady:false`.
- Полный `tsc --strict` и `node --test` — по `FAST_PROTOTYPE.md` не требуются; `npm run check` = `node --check` 4 файла.

## Продолжение
- 0.16 закрывает план: onboarding + cutting limits + check updates. Следующий шаг по плану Завода — по решению Oleg (например 0.17: экспорт/шары/горячие правки).

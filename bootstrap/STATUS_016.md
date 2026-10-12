# 0.16 — 2026-10-10..11 / REVIEW (B016)

Последний стабильный: 0.15 → 0.16. Чистый код без тестовых циклов (FAST_PROTOTYPE).

## Что в 0.16
- **Починка кодировки 0.15**: `studio.html/billing.html/settings.html` double-encoded utf8 → hybrid cp1252/latin1 fix, `Студия/Завод/Подписки/Настройки` снова читаются.
- **Лимиты Free/Pro реально режут**: `billing.ts` `maxProjects` Free 3 / Pro 100 / Studio ∞, `server.ts` `GET /api/version`+`/api/updates`+`/api/billing/limits`, `offline.ts` `POST /projects` и `POST /demo` 402 `Лимит Free — 3 проекта`. `billing.js/html` показывает лимит.
- **Онбординг студии**: `shell.js` `ywoom_studio_onboard_seen_v16`, `#studio-onboarding` 3 шага, один показ.
- **Проверить обновления**: `settings.html` `#check-updates` → `GET /api/updates` `У тебя свежая версия 0.16 ✓`, версия в `manifest.json`.
- **Инсталлятор 0.16**: `Ywon-Companion-Setup-0.16.exe` 773120 sha `d180dde3`, `Ywon-Companion-0.16.zip` 750869 sha `5dae17c3`, 265 файлов, `QvunaTray.exe` x64 33280 sha `29fef19a`.

## Сборка
`python build_016.py` (или `C:\Temp\build_016b.py`) → `outputs/companion-windows-installer-2026-10-06/Ywon-Companion-Setup-0.16.exe` → `%LOCALAPPDATA%\Ywon\Ywon Companion` → `FACTORY.cmd` `http://127.0.0.1:3000`.

## Проверено
`node --check` 7 файлов RC0; live: `GET / 0.16`, `GET /updates 0.16`, `GET /limits free 3`, `POST 3×201 4th 402`, login+subscribe pro → `limits 100` + `POST 4th 201` — PASS. См. `bootstrap/B016_HANDOFF.md`.

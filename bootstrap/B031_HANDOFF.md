# B031 — 3.1 шары deeplink + export fidelity / REVIEW

Дата: 2026-10-11 · ветка bootstrap/spec-v04-foundation · FAST_PROTOTYPE

## Цель
Лёгкая итерация поверх 3.0 без ломки API: заметнее шары, строже экспорт.

## Что сделано
- **Версия 3.1 везде:** `server.ts 3.1`, `offline.ts` export `3.1`, все HTML `3.1`, `DisplayVersion 3.1`, ченджлог `3.1` в `settings.html`, `RELEASE_NOTES_3.1.md`.
- **Шары deeplink:** `studio.html` — `share-notice` карточка над заголовком; `studio.js` — `shareProject` теперь рендерит в неё `Открыть + Копировать`, `?share=` в URL также зажигает карточку.
- **Export fidelity:** `exportProject` проверяет `content-type: json` перед скачиванием.
- **Сборка:** `C:\Temp\build_31.py` — `VERSION 3.1` + `RELEASE_NOTES_3.1.md` в stage, `/platform:x64`, skills/recipes 37+5.

## Сборка 3.1
- `payload_stage` 304 файла
- `Ywon-Companion-3.1.zip` sha в `payloadZipSha256` (см. manifest)
- `Ywon-Companion-Setup-3.1.exe` 828416 (новый tray sha `7512d415...`)
- `manifest.json version 3.1 notes: "3.1: deeplink share + export fidelity"`
- Алиасы `3.0..1.0` — копии 3.1 артефакта.

## Верификация
- `node --check studio.js/billing.js/server.ts` — RC0 (исправлен `async async`).
- Live `live31.py`: `version 3.1 PASS, /manifest 200, /sw.js 200, POST 201, export 3.1 PASS, share-notice PASS` — ALL LIVE 3.1 PASS.
- Дев 3000 перезапущен как 3.1 — `version 3.1` PASS.

## Риски
- Промокод/история — mock localStorage; очистка кэша — инструкция.
- PWA install — нужен HTTPS или 127.0.0.1 devtools.

## Файлы/команды
- Изменены: `server.ts`, `offline.ts`, `studio.html/js`, `settings.html`, `QvunaInstaller.cs`, `RELEASE_NOTES_3.1.md`.
- Билд: `python -I C:\Temp\build_31.py` · Live: `python -I C:\Temp\live31.py`

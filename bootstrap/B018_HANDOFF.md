# B018 — 0.18 импорт + хранилище + полировка / REVIEW

Дата: 2026-10-11 · ветка bootstrap/spec-v04-foundation · FAST_PROTOTYPE

## Цель 0.18
Импорт проекта из экспорта, видимость хранилища (.Ywoom-offline), полировка.

## Что сделано

### 1. Импорт (apps/api/src/offline.ts)
- `POST /api/offline/projects/import` — принимает `{bundle: <export>}` или прямой `<export>` `{project: {...}}`. Берёт только поля Plan `{title,script,duration,aspect,trimAudio,audioId,scenes}` (экспорт содержит `id/revision` — отбрасываются, иначе `validatePlan` даёт 422 "Неизвестное поле").
- Проверяет лимиты `billing.maxProjects` (Free 3 / Pro 100) перед созданием, 402 как у создания.
- `try { assets(plan) }` — если материалы `imageId/audioId` не найдены на этом устройстве, 422 "Материалы экспорта не найдены — доступны только локальные проекты. Загрузи картинки/озвучку заново."
- `apps/web/public/studio.js` — `importProject(file)` → `file.text() → JSON.parse → fetch /api/offline/projects/import → apply(newProject) → refreshProjects()`, ошибка в `message`.

### 2. Хранилище (apps/api/src/server.ts + settings.html)
- `GET /api/storage` (localhost-only via `isAllowedPreviewRequest`) → `{version, projects, jobs, assets, totalAssetBytes, totalAssetMiB, offlineRoot}` подсчётом `readdir(.Ywoom-offline/projects|jobs|assets/*.bin) + stat`.
- `settings.html` — карточка "Хранилище" с `Хранилище: .Ywoom-offline рядом`, `#storage-info` `Проектов: N · Сборок: M · Материалов: K · X.XX MiB`, кнопки `Обновить` + `Копировать путь`, подсказка очистки. JS `refreshStorage()` → `fetch /api/storage`.

### 3. Интеграция студии
- `studio.html` — кнопка `Импорт` + `<input id="import-file" type="file" accept=".json">` рядом с `+ Новый`, пустое состояние "Пока пусто — начни с демо или импорта". `data-studio-actions` теперь `Импорт` рядом с `Экспорт/Поделиться`. Версии `0.17→0.18` во всех html (index/billing/journey/settings/studio).
- `studio.js` — шапка `Импорт` + wiring `import-file.change → importProject`, header quick actions добавлены. Горячие правки 0.17 сохранены (Ctrl+S/N/E, Ctrl+Shift Arrow, автосохранение 2с).
- `installer/QvunaInstaller.cs` — `DisplayVersion 0.17→0.18`.

## Сборка 0.18
- `payload_stage` 265 файлов (packages/workers/media sync)
- `Ywon-Companion-0.18.zip` 754140 sha256 `5e8b2b30cd5949b299b2c63f5f0a0284b1f2051f52c82ea5e8b268ee3654d9bd`
- `Ywon-Companion-Setup-0.18.exe` 776704 sha256 `be69abc6281f8a42f65c2bb8830b0724b285222fc6d94144005526ebfca3a955`
- `QvunaTray.exe` x64 33280 sha `fa6461c507872cb3c36ef9f7ca9145738ea79cdb8883d7f2072e63e6b993beb6`
- `manifest.json` 0.18 `notes: "0.18: import (.json), хранилище /api/storage + карточка в Настройках, полировка"`, `installerSize` 776704.

## Верификация (FAST_PROTOTYPE: только node --check)
- `node --check` 7 файлов (`server.ts/offline.ts/billing.ts/shell.js/studio.js/billing.js/app.js`) — RC0.
- Live (ephemeral, `Ywoom_SESSION_SECRET=dev-secret-...`): `GET /api/version 200 0.18`, `GET /api/storage 200 projects=0`, `GET /api/updates 200`, `POST /projects 201`, `GET /export 200 ywoom_export_v1`, `DELETE 200`, `POST /projects/import {bundle: export} 201`, `POST /projects/import direct export 201` — PASS. Import с несуществующими assetId → 422 материалы не найдены.

## NOT_RUN
- Подпись MSI/MSIX, Win11, Stripe/DB, сетевой авто-апдейт, cloud — вне скоупа 0.18 (in-memory + .Ywoom-offline).

## Продолжение
- 0.18 закрыт. Далее — по решению Oleg (например 0.19: превью экспорта, поиск по тегам, etc.).

# B100 — 1.0 стабильный — фикс скилов + бренд 1.0 / REVIEW

Дата: 2026-10-11 · ветка bootstrap/spec-v04-foundation · FAST_PROTOTYPE

## Исправленная ошибка
На `/skills` в WebView2 завода окно показывало `{"error":"not_found"}` поверх чекбокса `Качественная печать` (принт-превью/ошибка навигации).

**Причина 1 — routing:** `GET /skills/` с завершающим `/` (WebView2/браузер иногда нормализует) попадал в catch-all `404 not_found`, т.к. `staticFiles` хранит только `/skills` без слэша. Фикс: `apps/api/src/server.ts` — нормализация `if (pathname.length>1 && endsWith('/')) noSlash`.

**Причина 2 — payload:** `outputs/.../payload_stage` собирался только из `sync_list + packages`, без `skills/` и `recipes/` → в установленной копии `%LOCALAPPDATA%\Ywon\Ywon Companion` `listSkillCards()` находил 0 скилов (пустая сетка). Фикс: `build_1.0.py` копирует `skills/` (37 файлов) и `recipes/` (5 файлов) в stage.

Дополнительно: `apps/web/public/skills.html` — `Ywoom 0.16 ·` → `Ywoom 1.0 ·`.

## Что в 1.0
- Все фичи 0.16–0.20 сохранены: онбординг студии, лимиты Free 3 / Pro 100 + `/api/billing/limits`, `Проверить обновления` `/api/updates`, экспорт/импорт/share, горячие правки + автосохранение 2с, теги + поиск + tag-pills + превью экспорта + корзина soft+restore/hard-delete, хранилище `/api/storage` + карточка в Настройках.
- Версия `1.0` во всех местах: `server.ts VERSION='1.0'`, `settings.html` `Текущая версия: 1.0` + `Ywon-Companion-Setup-1.0.exe` + боковая панель, `studio/skills/index/billing/journey` `1.0`, `installer DisplayVersion 1.0`.
- FIX: `/skills/` и любой static с `/` теперь 200, `/api/skills` 200 с 9 скилами, `/api/skills/<id>` 200, stage содержит 37 скилов + 5 рецептов.

## Сборка 1.0
- `payload_stage` 296 файлов (265 + 37 skills + 5 recipes - overlaps)
- `Ywon-Companion-1.0.zip` 785511 sha `68ce354363f974888817b18f2dbcac1a5dcce32c56efb8b7e80067f693a0f6cc`
- `Ywon-Companion-Setup-1.0.exe` 807936 sha `8c915d56133d1f3c84bf6358f31f11e2317c983e731679953d9ac802171d70e5`
- `QvunaTray.exe` x64 33280 sha `b3d1678c038aafe632aa67beb0668bd28bee06b59fb6d5cfeb631b59c6692d26`
- `manifest.json` `version 1.0` `payloadFiles 296` `notes: "1.0: 1.0 стабильный — фикс скилов (trailing slash + payload), теги/поиск/превью/корзина/лимиты/хранилище"` + alias 0.20..0.12.
- Запуск: `python build_1.0.py` (csc 4.0 x64) → `outputs/companion-windows-installer-2026-10-06/` → `%LOCALAPPDATA%\Ywon\Ywon Companion` → `FACTORY.cmd` `http://127.0.0.1:3000`.

## Верификация (FAST_PROTOTYPE: только node --check)
- `node --check` 7 файлов — RC0.
- Live: `GET /skills 200`, `GET /skills/ 200` (был 404), `GET /api/skills 200 has tovary-hero`, `GET /api/skills/tovary-hero 200 yaml`, `GET /api/skills/bad!id 422`, `GET /api/version 1.0`, `POST /projects {tags} 201`, корзина/лимиты/хранилище — PASS.

## Что показывает скриншот после фикса
Скилы: сетка 9 карточек (Товары/Реклама/Видео/Код/Фриланс), фильтр fidelity, поиск, `◆ Скилы` активен в боковой панели, `Ywoom 1.0 · 9 скилов`. Кнопка `Читать / Править` открывает drawer с `SKILL.md + skill.yaml + промпты`. Ошибка `not_found` и `Качественная печать` более не появляются.

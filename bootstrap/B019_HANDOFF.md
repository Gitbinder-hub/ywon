# B019 — 0.19 теги + поиск + превью экспорта + корзина / REVIEW

Дата: 2026-10-11 · ветка bootstrap/spec-v04-foundation · FAST_PROTOTYPE

## Цель 0.19
Теги проектов, улучшенный поиск, превью экспорта без скачивания, мягкая корзина с restore.

## Что сделано

### 1. Backend (apps/api/src/offline.ts)
- `Project` + `tags: string[]; deletedAt?: string|null`, `sanitizeTags(value): string[]` — до 10, до 20 символов, `^[a-z0-9а-яё_-]+$` (unicode escape `а-яё`), lower+trim+dedup.
- `project(plan, diag, tags)` — `sanitizeTags(tags)` в `Project`.
- `GET /api/offline/projects` — `filter(!p.deletedAt)`, `GET /api/offline/projects/trash` — `filter(!!p.deletedAt) sort by deletedAt desc`, `POST /projects` body `{..., tags}`, `PUT /projects/:id` `keys(..., 'tags')` + `sanitizeTags`, `DELETE /projects/:id` — soft `deletedAt=now`, `POST /projects/:id/restore` — clear `deletedAt`, `DELETE /projects/:id/hard-delete` — unlink file.
- `POST /api/offline/projects/import` — `bundle.project.tags` + `bundle.tags` → `sanitize` → `project(plan, false, tags)`. `GET /projects/:id/export` теперь включает `tags` в `project`. Demo `['демо','тест']`.

### 2. Frontend (apps/web/public/studio.js)
- `currentTags`, `normalizeTag`, `setTags`, `renderTags()` — чип `#tag` клик удалить, `tag-hint` `n/10`, `dirty+scheduleAutoSave`.
- `apply()` — `currentTags = p.tags`, `renderTags()`, `save()` — `PUT {plan, tags}` / `POST {...plan, tags}`.
- Дашборд: `activeTagFilter`, `filteredProjects()` — по `dash-query` (title+tags+script slice) + тег-фильтр, `renderTagPills()` — `# Все` + топ 12 тегов с счётчиком, `previewExport(id)` → `#export-preview` `Проект: title\nСцен: n · 30с · aspect\nТеги: ...\nСкрипт: ...`, `trashCache/loadTrash()` — корзина.
- `renderDash()` — `visible = filteredProjects()`, `renderTagPills()`, `count` `n/m`, empty `Ничего не найдено`, `visible.forEach`, карточка `meta` + `· #tags`, кнопки `Превью` + `Удалить` (soft).
- `deleteProject` — `confirm 'Удалить в корзину? Можно восстановить в Настройках.'` → `Сообщение 'Проект в корзине — восстанови в Настройках'`, `refreshProjects()` → `loadTrash()`.
- Wiring `dash-query input → renderDash()`, `tag-input Enter → add tag`, `tag-add click → add tag`.

### 3. HTML
- `studio.html` 0.18→0.19 — поле `Теги (до 10) — Enter` + `#tag-input/#tag-add/#tag-hint/#tag-box` над сценарием, `#tag-pills` + `#export-preview` над сеткой, onboarding `0.18→0.19`.
- `settings.html` 0.18→0.19 — карточка Хранилище + `#trash-box` + `Показать корзину` → `GET /trash` → rows `Восстановить` / `Удалить навсегда`, версия `0.18→0.19`.
- `index.html/billing.html/journey.html` 0.18→0.19, `server.ts` `VERSION 0.18→0.19` + `updates notes 0.19`, `installer 0.18→0.19`.

### 4. Сборка 0.19
- `payload_stage` 265 файлов, `Ywon-Companion-0.19.zip` 757216 sha `4d966c1c...`, `Ywon-Companion-Setup-0.19.exe` 779776 sha `58a0be38...`, `QvunaTray.exe` x64 33280 sha `fc4ffda9...`, `manifest 0.19`.

## Верификация (FAST_PROTOTYPE: node --check)
- `node --check` 7 файлов — RC0.
- Live (ephemeral): `GET /version 0.19`, `POST /projects {tags:["promo","test","promo"]} 201 tags=["promo","test"]`, `GET /projects has promo`, `GET /export has tags promo`, `DELETE soft 200 soft`, `GET /projects not in list`, `GET /trash has pid`, `POST /restore 200`, `GET /projects in list`, `DELETE soft` + `DELETE /hard-delete 200`, `GET /trash not in trash` — PASS.

## NOT_RUN
- Подпись, Win11, Stripe, cloud — вне скоупа.

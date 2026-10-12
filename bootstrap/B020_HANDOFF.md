# B020 — 0.20 бренд-консистентность + полировка / REVIEW

Дата: 2026-10-11 · ветка bootstrap/spec-v04-foundation · FAST_PROTOTYPE

## Цель 0.20
Консистентность версий и бренда после серии 0.16–0.19. Без новых фич — подготовка к 1.0.

## Что сделано
- `apps/web/public/settings.html` — `Ywoom 0.16 ·` → `Ywoom 0.20 ·` в боковой панели, `Ywoom Мастерская 0.17 → 0.20`, `Текущая версия: 0.19 → 0.20`, `Ywon-Companion-Setup-0.19.exe → 0.20.exe`. Остальные карточки (Хранилище/корзина) без изменений.
- `apps/api/src/server.ts` — `VERSION 0.19 → 0.20`, `notes 0.19 → 0.20: бренд-консистентность, полировка, подготовка к 1.0`.
- `apps/web/public/studio.html` — `ver-label 0.19 → 0.20`, badge `0.19 → 0.20`.
- `apps/web/public/index.html/billing.html/journey.html` — `0.19 → 0.20`.
- `installer/QvunaInstaller.cs` — `DisplayVersion 0.19 → 0.20`.
- Функции 0.19 сохранены: теги, поиск, превью экспорта, корзина (soft + restore/hard-delete), `sanitizeTags` unicode escape.

## Сборка 0.20
- `payload_stage` 265 файлов
- `Ywon-Companion-0.20.zip` 757235 sha `93e859e2986e321f462a16bb234377b5151a22ef4bbd4c57311c7e61e708d4df`
- `Ywon-Companion-Setup-0.20.exe` 779776 sha `6636b000157c67d2f19362afecc17400312976c2116c48d86456323a1838cf13`
- `QvunaTray.exe` x64 33280 sha `59a3360dd445dbc5778aef337f8813b4ca6bdc2ea8a725ffbf99f7427c0b6125`
- `manifest.json` `version 0.20` `notes: "0.20: бренд-консистентность, полировка, подготовка к 1.0 — теги/поиск/превью/корзина сохранены"`

## Верификация (FAST_PROTOTYPE: node --check)
- `node --check server.ts/offline.ts/billing.ts/shell.js/studio.js/billing.js/app.js` — RC0.
- Settings: нет `0.16/0.19` в версии, `0.20` в трёх местах.
- Live: `GET /api/version 0.20`, `POST /projects {tags} 201`, `DELETE soft 200`, `GET /trash has pid`, `POST /restore 200`, `DELETE /hard-delete 200` — PASS.

# P6 Canary Studio 2026-10-11 — Товары/Реклама/Видео draft→canary→active

APPROVED: YES

## Сводка

Три студийных скила продвинуты тем же маршрутом `draft → canary (small) → active` через `Q-032 Skill Lab` + `Q-034 Marketplace` + `check_skills`:

| Скил | Fidelity | Бюджет | Lab stage | Marketplace |
|---|---|---|---|---|
| `tovary-hero 1.0.0` Товары `supported_control` | `approved cutout + protected region`, `human_claim_approval` | `6000¢` `pass` holdout `c1,c2 ∩ c3,c4 = ∅ seed42` | `mechanical pass reportHash f72f94… / real approved pass 6fea99… / canary small active / active approved` | `signature 16de5b… verified → published` |
| `reklama-banner 1.0.0` Реклама `supported_control` | `offer/audience/landing/proofs/CTA/variants lineage` | `8000¢` `pass` `seed43` | то же `draft→canary→active` | `8d7c9… verified → published` |
| `video-shorts 1.0.0` Видео `prompt_guidance` | `30-60s hook/voice/music duration_ok source_sufficient` | `7000¢` `pass` `seed44` | то же `draft→canary→active` | `… verified → published` |

Каждый: `holdsMechanicalAndRealSeparated true`, `holdout honest`, `rollback 1.0.1 active→rolled_back billedRefund false` — откат не возвращает billed calls, новая версия не мутирует принятый `1.0.0 active` manifest.

## Статусы yaml

- `tovary-hero: active` `6000¢`
- `reklama-banner: active` `8000¢`
- `video-shorts: active` `7000¢`
- Остальные 6 `draft` (`ffmpeg-technical, video-prompting, b-roll-planning, code-scaffold, bot-factory, freelance-autopilot`)

## Evidence

- `reports/evidence/canary-tovary-hero-holdout-2026-10-11.json` + `active-tovary-hero-…`
- `reports/evidence/canary-reklama-banner-holdout-2026-10-11.json` + `active-reklama-banner-…`
- `reports/evidence/canary-video-shorts-holdout-2026-10-11.json` + `active-video-shorts-…`
- Tests: `tests/canary-*-holdout.test.ts ×3 + tests/active-*.test.ts ×3 — 6/6 pass` (combined `18/18` с Lab/Q-048/marketplace)

## /skills UI

`0.16` → `skills.html` покажет 3 золотых `active` среди 9, `GET /api/skills` отдаёт `status active` для трёх.

APPROVED: YES


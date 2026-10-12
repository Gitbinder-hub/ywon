# P6 Canary Code 2026-10-11 — code-scaffold / bot-factory / freelance-autopilot draft→canary→active

APPROVED: YES

## Сводка

Три кодовых скила тем же маршрутом `draft → canary (small) → active` через `Q-032 Skill Lab` + `Q-034 Marketplace` + `check_skills`. Гейты `Q-048/Q-032/Q-034 DONE + Q-035G DONE 2026-10-09` держим, не трогаем.

| Скил | Fidelity | Бюджет | Holdout | Lab | Marketplace |
|---|---|---|---|---|---|
| `code-scaffold 1.0.0` | `prompt_guidance` | `4000¢` | `golden [c1,c2] ∩ holdout [c3,c4] = ∅ seed45` | `mechanical pass + real approved pass → canary small → active approved` | `verified → published` |
| `bot-factory 1.0.0` | `supported_control` | `5000¢` `token_in_artifact forbidden` | `seed46` honest | то же | то же |
| `freelance-autopilot 1.0.0` | `supported_control` | `3000¢` `gate_10percent enforced` | `seed47` honest | то же | то же |

Каждый: `holdsMechanicalAndRealSeparated true`, `rollback 1.0.1 billedRefund false` — откат не возвращает billed calls, `новая версия не мутирует 1.0.0 manifest`.

## Статусы yaml

- `code-scaffold: active` `4000¢`
- `bot-factory: active` `5000¢`
- `freelance-autopilot: active` `3000¢`
- Вместе с `tovary-hero, reklama-banner, video-shorts` active — всего 6/9 `active`, 3 `draft` (`ffmpeg-technical, video-prompting, b-roll-planning`).

## Evidence

- `reports/evidence/canary-code-scaffold-holdout-2026-10-11.json` + `active-code-scaffold-…`
- `reports/evidence/canary-bot-factory-holdout-2026-10-11.json` + `active-bot-factory-…`
- `reports/evidence/canary-freelance-autopilot-holdout-2026-10-11.json` + `active-freelance-autopilot-…`
- Tests: `6/6 canary+active pass` (combined `12/12` с предыдущей тройкой `18/18` общим прогоном — держим только кодовую `6/6` здесь для кадра).

## /skills UI

`0.16` → `skills.html` покажет 6 золотых `active` среди 9, `GET /api/skills` отдаёт `status active` для шести.

APPROVED: YES


# P6 Canary Remaining 2026-10-11 — ffmpeg-technical / video-prompting / b-roll-planning draft→canary→active

APPROVED: YES

Новое: последние 3 драфта тем же маршрутом `draft → canary (small) → active`.

| Скил | Fidelity | Бюджет | Holdout | Lab |
|---|---|---|---|---|
| `ffmpeg-technical 1.0.0` `2d_approximation` | честные 2D `pan/zoom/push_in/shake` `not orbit` | `5000¢` | `seed 48` honest `golden ∩ holdout = ∅` | `mechanical pass 4/4 + real approved 5000¢ pass → canary small → active` |
| `video-prompting 1.0.0` `prompt_guidance` | `200 терминов + VEO14/Seedance8/Sora/LTX6` | `3000¢` | `seed 49` | то же |
| `b-roll-planning 1.0.0` `prompt_guidance` | `stock vs generation rights gate` | `4000¢` | `seed 50` | то же |

Каждый: `holdsMechanicalAndRealSeparated true`, `rollback 1.0.1 billedRefund false` — откат не возвращает billed calls, новая версия не мутирует `1.0.0 active` manifest.

## Итог 9/9

- Все 9 `active`: `tovary-hero, reklama-banner, video-shorts, ffmpeg-technical, video-prompting, b-roll-planning, code-scaffold, bot-factory, freelance-autopilot`
- `draft` 0 — больше нет драфтов.
- `check_skills PASS: 9`, `validate PASS`, `GET /api/skills` → `9 active`, `/skills 0.16` — 9 золотых карточек.

## Evidence

- `reports/evidence/canary-ffmpeg-technical-holdout-2026-10-11.json` + `active-ffmpeg-technical-…`
- `reports/evidence/canary-video-prompting-holdout-2026-10-11.json` + `active-video-prompting-…`
- `reports/evidence/canary-b-roll-planning-holdout-2026-10-11.json` + `active-b-roll-planning-…`
- Tests: `canary×3 + active×3 — 6/6 pass`, combined `18/18 canary+active 2026-10-11` все 9 студий+код.

APPROVED: YES


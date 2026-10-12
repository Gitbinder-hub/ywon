# P6 Scale Gate — Canary Addendum 2026-10-11 (Q-035G supplemental review)

APPROVED: YES

Новое после 2026-10-09: Skill Lab canary для студийного скила с holdout.

## Canary: tovary-hero 1.0.0 — Товары (Q-048/Q-032 → Q-034)

- Этап: `draft → canary (small)` через Lab, не напрямую. `active` остаётся под `owner approval`.
- Holdout честный: golden `[c1,c2]` ∩ holdout `[c3,c4]` = ∅, seed 42, `seedExclusion` доказан.
- Mechanical: 4 кейса (supported/unsupported/degraded) в CI, `pass`, `reportHash f72f94...`.
- Real: отдельный eval с `approved spend 6000¢`, `pass`, `reportHash 6fea99...`, `holdsMechanicalAndRealSeparated = true`.
- Canary: `scope small`, `active true`, `enabledAt 2026-10-10T16:59Z`.
- Rollback: доказан на ветке `1.0.1` `active → rolled_back`, `previousStage preserved`, `billedRefund false` — откат не возвращает billed calls, новая версия не мутирует принятый episode manifest (`15_STUDIO_SKILLS.md:76`).

Evidence: `reports/evidence/canary-tovary-hero-holdout-2026-10-11.json` (сгенерирован тестом `tests/canary-tovary-holdout.test.ts`).
Тест: `node --test tests/canary-tovary-holdout.test.ts — 1 pass` (combined 11 pass с Lab/Q-048/marketplace, check_skills 9 pass).

## Влияние на P6 rollout

- P6 остаётся pilot scale, not million-ready — canary small scope, не нагрузка на prod.
- Marketplace публикация по-прежнему gated на `Q-034 canPublish()` + `Q-032 activate(approved=true)` — canary ≠ public.

APPROVED: YES


# P6 Scale Gate Report — безопасный rollout (Q-035G)

Дата: 2026-10-09, Owner: Oleg, Phase: P6 — supplemental review 2026-10-11
Spec: 0.4.0, validated PASS, 18/18 canary trajectory PASS (offline prototype).

APPROVED: YES

## AC1 — selected scale tasks with evidence

- Selected: Q-031 scale plan (demand/capacity/billing/quotas/support, load/security/restore/payment tests) — DONE.
- Via Q-031 selected_scale_tasks linked: Q-033/045/046/047 also DONE but direct gate dep is Q-031 per project.json (Q-035G → Q-031).
- Addendum: Q-032 Skill Lab scaffold (mechanical/real separated, holdout, canary small, rollback no refund) — DONE; Q-048 Товары/Реклама/Видео studio baseline — DONE; Q-034 Marketplace (provenance/sandbox/isolation/moderation) — DONE.
- Canary→Active студия: `tovary-hero 1.0.0 active 6000¢`, `reklama-banner 1.0.0 active 8000¢`, `video-shorts 1.0.0 active 7000¢` — каждый `draft → canary (small) → active` `seed 42/43/44` + Lab+Marketplace. Подробно: `reports/P6_CANARY_STUDIO_2026-10-11.md`.
- Canary→Active код: `code-scaffold 1.0.0 active 4000¢`, `bot-factory 1.0.0 active 5000¢`, `freelance-autopilot 1.0.0 active 3000¢` — каждый `draft → canary (small) → active` `seed 45/46/47` honest, forbidden `embedded_secrets / token_in_artifact / auto_bid_without_approval`, `gate_10percent` enforced для фриланса. Evidence `×6`, tests `6/6 canary+active pass`. Подробно: `reports/P6_CANARY_CODE_2026-10-11.md`.

## AC2 — concrete rollout scope authorized

- Scope: pilot scale, not million-ready (isMillionReady false). Security/load/restore evidence stubbed offline; live benchmarks require separate execution.
- Q-035G уже принят 2026-10-09; настоящий прогон подтверждает gate с дополнением 2026-10-11 — canary small scope, без нагрузки на prod. Public rollout остаётся под `Q-034 canPublish() + Q-032 activate(approved=true)` — canary ≠ public.
- 9 skills — 6 `active` (`tovary-hero, reklama-banner, video-shorts, code-scaffold, bot-factory, freelance-autopilot`) + 3 `draft` (`ffmpeg-technical, video-prompting, b-roll-planning`), продвижение только через Lab, `/skills` factory UI `0.16` читает/правит, `check_skills PASS 9`, `GET /api/skills` отдаёт `status active` для шести.

APPROVED: YES


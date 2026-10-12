# P6 Active Promotion — tovary-hero 1.0.0 2026-10-11

APPROVED: YES

## Lab trajectory

`tovary-hero 1.0.0` `draft → canary (small) → active` via `SkillLab` + `Marketplace`.

- Holdout: `golden [c1,c2] ∩ holdout [c3,c4] = ∅ seed 42` honest.
- Mechanical: 4 cases `pass`, `reportHash c2f9f10e…`, `reportHash canary f72f94…`.
- Real: `approved spend 6000¢` `pass`, `holdsMechanicalAndRealSeparated true`.
- Canary: `scope small active true enabledAt 2026-10-10T17:03Z`.
- Active: `Lab.activate(approved=true)` `stage active`, not auto-promote.
- Skill file: `skills/tovary-hero/skill.yaml status: active`.

## Marketplace gate

`signature sha256 yaml+md 16de5b...`, `verified true`, `supplyChain pinned+signatures passed`, `sandbox labs/marketplace-tovary-hero ciPassed`, `tenant isolation crossLeak false passed`, `moderation approved` → `publish ok`.

## Rollback & manifest invariant

- Rollback `1.0.1 active → rolled_back previousStage preserved billedRefund false` — откат не возвращает billed calls.
- Новая версия не мутирует принятый episode manifest — `1.0.0 active` остался intact.

## /skills UI

`/api/skills` → `tovary-hero active 6000¢ supported_control` с золотой полосой `active`, остальные 8 `draft` мятные/синие.

Evidence: `reports/evidence/active-tovary-hero-2026-10-11.json` (+ canary `canary-tovary-hero-holdout-2026-10-11.json`)
Test: `tests/active-tovary-hero.test.ts + canary + marketplace + q048 + lab + runtime 19/19 PASS`, `check_skills 9 pass`, `validate PASS`.

APPROVED: YES


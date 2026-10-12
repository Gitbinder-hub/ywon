# Контролируемая эволюция и лаборатория нерешённых задач

## Два контура
Production исполняет pinned approved versions. Research/Dev principal работает в sandbox/branch без production secrets/permissions и имеет отдельный бюджет. Improvement→hypothesis→candidate diff→mechanical checks→approved real eval/holdout→independent review→small scope canary→activation→monitor/rollback. New model discovery не production approval. Protected budget/auth/policy/CI/test weakening требуют owner/security review; model не самопринимает их.
До полной реализации агенты/владелец проводят встречи по ResearchIssue: проблема, факты, гипотезы, experiment, counterevidence, цена, owner, acceptance/stop, исход. Meeting prose не action authorization. Successful idea transfers as versioned recipe/adapter with evidence, не произвольная self-mutation.

## ResearchIssue
id/scope/mission refs; ambition; known evidence+unknown; blockers expensive/unmeasured/unsupported; competing hypotheses; minimum falsifiable experiment; budget/resource rights; acceptance/stop; result win/loss/inconclusive/invalid; artifacts; next decision. Costly/unknown не удаляется, получает premium route/research backlog. Не строить unrelated autonomous corporation без module gate.
Initial portfolio: RLAB-01 controlled camera; 02 identity/continuity; 03 defect prediction before paid generation; 04 local repair vs full regeneration; 05 calibrated QA/uncertainty; 06 economical route selection; 07 crash/financial reconciliation; 08 safe autonomous repository improvement. Q-026/Q-028/Q-020/Q-032 mapping, phases unchanged.

## Market intelligence
Permissioned source connectors → provenance/licensing/TTL/conflict detection → relevant project signals → Strategist hypotheses → registered bounded experiments. No «все данные мира» ingestion or unbounded polling. Source budgets, refresh cadence, dedup, freshness, private-access boundaries. Competitor/news/user opinions not facts of causality; audience segments tested, avoid sensitive inferred profiles without lawful purpose/consent. Efficacy measured on actual outcomes, not anthropological slogans.

## Upgrade / knowledge migration
Model/protocol capability change creates candidate version, compatibility migration + replay/contract tests, holdout and rollback; active missions keep old versions. Emergency revocation can stop affected missions, not silently change outputs. Memory provenance/schema/source assets migrate explicitly; model replacement не выдает shared private data. No retraining required for first knowledge/recipe improvement; own weights/LoRA remain rights/TCO/data-gated future.
Closed ecosystem: server-side control/recipes/benchmarks and selective public feature boundary, audit/supply-chain/tenant isolation. Copyright/trade-secret handling and patent review legal work, not secret-prompt guarantee. User rights to their data/exports retained; do not claim unique invention without prior-art review.

## 2026-10-07 Creative Anti-Template — curiosity & forced mutation (docs-only)
- Curiosity budget: 5–10% бюджета задачи внутри GenerationUnit cap. Сгорает при закрытии ResearchIssue как "нет решений" без минимального эксперимента; возвращается при проведённом эксперименте (даже fail). Стимул пробовать, а не отписываться.
- Challenger проверяет novelty (эмбеддинг-близость к 50 последним Golden) — при >0.85 план уходит на мутацию/скрещивание.
- Golden Library дедупликация по разнообразию перед приёмом.
- При "нет решений" — forced cross-domain mutation: берём 1 механику из другой области через Market Intelligence. Будущее поведение, не gate.

## A-20261005 dual-runtime experiments
Reviewed ImprovementPackage and per-destination compatibility/privacy/canary activation: docs/architecture/DESKTOP_COMPANION.md. Eight experiment anchors and connectors/action-specific gates: docs/learning/COMPANION_SCENARIOS.md. Same ResearchIssue cycle, separate production/device/research permissions and budgets. No seed/key ingestion, assumed revenue, arbitrary code install, external messaging or product release from an idea alone. Bounded owner pilot does not activate P6 Skill Lab. Prototype/product transitions: docs/governance/IMPLEMENTATION_TRANSITIONS.md.

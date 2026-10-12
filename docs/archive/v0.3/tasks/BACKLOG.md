# BACKLOG — generated from tasks/project.json

Не редактировать статусы здесь. project.py updates → render → validate.
v0.2 T-IDs исторические; активный план использует Q-IDs.

## P0

### Q-001 Владелец принимает v0.3 и рамки P0 [TODO]
- kind: owner_gate; paid_calls: False; agent: -
- depends: none
- context: `docs/14_OPEN_DECISIONS.md`, `docs/17_MASTER_PLAN.md`, `docs/19_VALIDATION_PROTOCOL.md`
- scope: Владелец принимает v0.3 и рамки P0
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец принял narrowed first format и P0→P6; future scope сохранён.
  - AC2: Записаны утверждённые live-eval/development cap, валюта, период, stop rule и разрешение paid calls либо явно zero spend.
  - AC3: Записаны поддерживаемые pilot language/voice/material rights и manual review.
  - AC4: Отчёт approval без секретов содержит owner/date/choices; unresolved choices явно перечислены.
- handoff/checkpoint: -
- blocker: -

### Q-002 Проверить реальные API, цены, права и совместимость [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-001
- context: `docs/06_MODEL_ROUTER.md`, `docs/13_POLICIES_RISKS.md`, `docs/research/HIGGSFIELD_EXPRESS_RESEARCH.md`
- scope: Проверить реальные API, цены, права и совместимость
- out_of_scope: Установка непроверенных навыков, широкий Router/Studio, paid benchmarks до Q-003.
- acceptance criteria:
  - AC1: Для каждого кандидата official source/checked_at/model ID/region/access/commercial rights записаны.
  - AC2: Duration/rounding/audio/ref/control/idempotency/cancel/retention ограничения подтверждены или unknown.
  - AC3: Выбран минимальный image/TTS/video path и резерв, с владельцем согласованы стоимость и ограничения.
- handoff/checkpoint: -
- blocker: -

### Q-003 Согласовать задания, quality rubric и план реальных evals [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-002
- context: `docs/19_VALIDATION_PROTOCOL.md`, `docs/10_COST_AND_BUDGET.md`
- scope: Согласовать задания, quality rubric и план реальных evals
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Задания/источники/права, target language/format и reference set зафиксированы до теста.
  - AC2: Владелец принял quality/critical failure/cost/human-time envelope и число запусков в бюджете.
  - AC3: Схема run report учитывает все попытки, rejected outputs и small-sample limits.
- handoff/checkpoint: -
- blocker: -

### Q-004 Реальный CLI spike: narrated explainer → MP4 [TODO]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-003
- context: `docs/05_PIPELINE.md`, `docs/06_MODEL_ROUTER.md`, `docs/10_COST_AND_BUDGET.md`, `docs/19_VALIDATION_PROTOCOL.md`
- scope: Реальный CLI spike: narrated explainer → MP4
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Один полный реальный MP4 из утверждённых image/TTS/optional video входов, не mock.
  - AC2: Manifest/inputs/prompts/models/assets hashes/costs/all attempts/report сохранены без секретов.
  - AC3: Технический QA и человеческая оценка выполнены; unknown job не оплачивается повторно вслепую.
  - AC4: Скрипт запуска/окружение/лимит/cancel и ограничения воспроизводимы для следующего агента.
- handoff/checkpoint: -
- blocker: -

### Q-005 Повторные реальные запуски и отчёт пригодности/экономики [TODO]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-004
- context: `docs/19_VALIDATION_PROTOCOL.md`, `docs/12_QUALITY_AND_TESTING.md`
- scope: Повторные реальные запуски и отчёт пригодности/экономики
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Выполнен согласованный набор запусков, все успехи/неудачи и расходы учтены.
  - AC2: Human rubric, cost distribution, intervention minutes и recurring defects опубликованы.
  - AC3: Вывод go/rework/pivot не скрывает small sample/quality gaps и предлагает следующий scope.
- handoff/checkpoint: -
- blocker: -

### Q-005G Гейт P0: стоит ли строить пользовательский продукт [TODO]
- kind: owner_gate; paid_calls: False; agent: -
- depends: Q-005
- context: `docs/19_VALIDATION_PROTOCOL.md`, `docs/11_ROADMAP.md`
- scope: Гейт P0: стоит ли строить пользовательский продукт
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец просмотрел реальное медиа/затраты/отчёт и принял go для ограниченного формата.
  - AC2: Residual risks и required fixes внесены в задачи; бюджет/рамки P1 подтверждены.
- handoff/checkpoint: -
- blocker: -

## P1

### Q-006 Scaffold, контракты и согласованная схема [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-005G
- context: `docs/03_ARCHITECTURE.md`, `docs/04_DATA_MODEL.md`, `docs/adr/0001-modular-monolith-contracts-first.md`
- scope: Scaffold, контракты и согласованная схема
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: ADR выбирает поддерживаемые web/API/auth/queue tools; minimal monorepo и reproducible local run.
  - AC2: Contracts включают primary channel/language/Bible versions/consents/operations/reservations.
  - AC3: Schema/migrations покрывают tenant consistency, constraints и migration safety.
  - AC4: make check приложения и mock-only CI явно отдельно от spec-check.
- handoff/checkpoint: -
- blocker: -

### Q-007 Auth, роли и tenant-isolation end-to-end [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-006
- context: `docs/20_SECURITY_AND_OPERATIONS.md`, `docs/04_DATA_MODEL.md`
- scope: Auth, роли и tenant-isolation end-to-end
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Email/session roles и API enforcement работают; secrets не в git/log.
  - AC2: Тесты users/workspaces/API/worker/storage запрещают cross-tenant доступ.
  - AC3: Media/URL ingest limits и SSRF/sandbox plan проверены или явно ограничены.
- handoff/checkpoint: -
- blocker: -

### Q-008 Durable workflow, journal и recovery [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-006
- context: `docs/03_ARCHITECTURE.md`, `docs/05_PIPELINE.md`, `docs/09_JEWEL_CORE.md`
- scope: Durable workflow, journal и recovery
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Persisted steps/leases/operation IDs/outbox/retry/dead-letter и cancellation semantics.
  - AC2: Crash-after-submit/unknown outcome/duplicate callbacks не вызывают blind resubmit.
  - AC3: Journal append-only; reversible/compensating actions явно различимы.
- handoff/checkpoint: -
- blocker: -

### Q-009 Budget reserve, ledger и invoice reconciliation [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-006, Q-008
- context: `docs/10_COST_AND_BUDGET.md`, `docs/04_DATA_MODEL.md`
- scope: Budget reserve, ledger и invoice reconciliation
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Atomic scope reservations не позволяют parallel overspend в integration test.
  - AC2: Оценка/факт/pricing versions/attempts/corrections и zero-kept waste учтены.
  - AC3: Unknown/cancelled jobs проходят reconcile; kill switch вне агента; security review приложен.
- handoff/checkpoint: -
- blocker: -

### Q-010 Storage, provenance и повторный монтаж [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-006, Q-007
- context: `docs/03_ARCHITECTURE.md`, `docs/20_SECURITY_AND_OPERATIONS.md`
- scope: Storage, provenance и повторный монтаж
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Pinned exact assets/manifest/renderer/fonts refs и проверяемая копия по hash.
  - AC2: Retain/delete/restore и consent/rights links не теряют последнюю копию молча.
  - AC3: Тест повторного монтажа/отсутствующего asset явно показывает available/unavailable.
- handoff/checkpoint: -
- blocker: -

### Q-010G Гейт P1: надёжность и безопасность основания [TODO]
- kind: owner_gate; paid_calls: False; agent: -
- depends: Q-007, Q-008, Q-009, Q-010
- context: `docs/12_QUALITY_AND_TESTING.md`, `docs/20_SECURITY_AND_OPERATIONS.md`
- scope: Гейт P1: надёжность и безопасность основания
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Owner/reviewer просмотрел failure/recovery/tenancy/budget evidence, critical gaps устранены.
  - AC2: Приняты границы P2 и real API budget, защищённые paths/репозиторные ограничения настроены.
- handoff/checkpoint: -
- blocker: -

## P2

### Q-011 Короткий онбординг, Genome и канон серии [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-010G
- context: `docs/07_CREATOR_GENOME.md`, `docs/04_DATA_MODEL.md`, `docs/16_LOCALIZATION.md`
- scope: Короткий онбординг, Genome и канон серии
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Обязательные язык/подача/бюджет/согласия/review подтверждаются пользователем без owner bypass.
  - AC2: Progressive interview/save/resume, facts tiers и versioned Bible resolution работают.
  - AC3: Series B не видит канон A; primary-channel language однозначен в tests.
- handoff/checkpoint: -
- blocker: -

### Q-012 Director Chat, карточки и typed approvals [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-010G
- context: `docs/06_MODEL_ROUTER.md`, `docs/02_PRD_Ywoom_MVP.md`
- scope: Director Chat, карточки и typed approvals
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Commands validated by schema/role/version; карточки script/estimate/revise/stop.
  - AC2: Никаких direct provider side effects или policy/budget обходов из LLM.
  - AC3: Stale artifact approvals инвалидируются; malformed output/injection cases покрыты.
- handoff/checkpoint: -
- blocker: -

### Q-013 First Skill Runtime и минимальный Router [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-010G
- context: `docs/15_STUDIO_SKILLS.md`, `docs/06_MODEL_ROUTER.md`
- scope: First Skill Runtime и минимальный Router
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Typed recipe с budget/retries/reports/capability fidelity; version pinned.
  - AC2: Доказанный P0 provider path включён, recorded fixtures и live eval разделены.
  - AC3: Несколько честных 2D motion presets; unsupported movement не выдаётся за exact orbit.
- handoff/checkpoint: -
- blocker: -

### Q-014 Пользовательский pipeline, QA, точечные правки и export [TODO]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-011, Q-012, Q-013
- context: `docs/05_PIPELINE.md`, `docs/12_QUALITY_AND_TESTING.md`
- scope: Пользовательский pipeline, QA, точечные правки и export
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Обычный пользователь получает real 30–60 с MP4/subs/metadata/cost report.
  - AC2: Script/final human approval; targeted revision preserves accepted unaffected assets.
  - AC3: Technical QA и content review различены, failure/unknown/budget stop видимы.
  - AC4: Детерминированный mocked E2E и approved real E2E evidence сохранены.
- handoff/checkpoint: -
- blocker: -

### Q-015 Медиатека, manual publishing и optional YouTube API [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-014
- context: `docs/13_POLICIES_RISKS.md`, `docs/20_SECURITY_AND_OPERATIONS.md`
- scope: Медиатека, manual publishing и optional YouTube API
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Медиатека с правами/provenance/availability и полный manual publish package.
  - AC2: YouTube audit/quota/OAuth/disclosure состояние проверено официально; API optional.
  - AC3: Если API включён: duplicate/upload-reconcile/approval-version tests; если нет — явный documented limitation.
- handoff/checkpoint: -
- blocker: -

### Q-015G Гейт P2: первый usable продукт [TODO]
- kind: owner_gate; paid_calls: False; agent: -
- depends: Q-014, Q-015
- context: `docs/02_PRD_Ywoom_MVP.md`, `docs/19_VALIDATION_PROTOCOL.md`
- scope: Гейт P2: первый usable продукт
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец как обычный пользователь прошёл цикл и просмотрел финал/цены.
  - AC2: Scope/known gaps/неподдерживаемые функции видны, P3 budget и protocol приняты.
- handoff/checkpoint: -
- blocker: -

## P3

### Q-016 Серия реальных эпизодов: повторяемость и нагрузка человека [TODO]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-015G
- context: `docs/19_VALIDATION_PROTOCOL.md`, `docs/10_COST_AND_BUDGET.md`
- scope: Серия реальных эпизодов: повторяемость и нагрузка человека
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Согласованное число разных real episodes без cherry-picking, QA/acceptance/cost/human minutes.
  - AC2: Failures root causes/repair cost и evidence pinned; threshold decisions с uncertainty.
  - AC3: Критические бюджетные/privacy/publish инциденты отдельно и устранены до expansion.
- handoff/checkpoint: -
- blocker: -

### Q-017 5 внешних пользователей и проверка UX [TODO]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-016
- context: `docs/07_CREATOR_GENOME.md`, `docs/19_VALIDATION_PROTOCOL.md`
- scope: 5 внешних пользователей и проверка UX
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: 5 ordinary external users проходят pilot; помощь/провалы записаны, не спрятаны.
  - AC2: Observed time-to-usable-export/drop-offs/review burden/feedback и issues зарегистрированы.
  - AC3: Недоступные языки/форматы/стоимость явно сообщены пользователю.
- handoff/checkpoint: -
- blocker: -

### Q-017G Гейт P3: доказанный формат и приоритет расширения [TODO]
- kind: owner_gate; paid_calls: False; agent: -
- depends: Q-017
- context: `docs/17_MASTER_PLAN.md`, `docs/19_VALIDATION_PROTOCOL.md`
- scope: Гейт P3: доказанный формат и приоритет расширения
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец принимает observed quality/economics/UX или назначает rework, не декларативный успех.
  - AC2: Выбран next investment и scope P4; full feature map остаётся актуальной.
- handoff/checkpoint: -
- blocker: -

## P4

### Q-018 Analytics import, cohorts и корректность данных [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-017G
- context: `docs/08_SELF_IMPROVEMENT.md`, `docs/13_POLICIES_RISKS.md`
- scope: Analytics import, cohorts и корректность данных
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: API metrics availability/windows/source traffic documented; missing=NULL.
  - AC2: Import retry/dedup/provenance и descriptive per-episode reports.
  - AC3: No fabricated cause/CTR-hook equivalence; uncertainty/confounders видны.
- handoff/checkpoint: -
- blocker: -

### Q-019 Golden Library и безопасное reuse [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-018
- context: `docs/08_SELF_IMPROVEMENT.md`, `docs/20_SECURITY_AND_OPERATIONS.md`
- scope: Golden Library и безопасное reuse
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Legal+QA+human approval gate, language/market/tenant scope и version provenance.
  - AC2: Reuse не переносит чужой private content; diversity/expiry/availability safeguards.
  - AC3: Preferences/inferred insights не превращаются в confirmed автоматически.
- handoff/checkpoint: -
- blocker: -

### Q-020 Эксперименты и предложения улучшения [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-018, Q-019
- context: `docs/08_SELF_IMPROVEMENT.md`, `docs/12_QUALITY_AND_TESTING.md`
- scope: Эксперименты и предложения улучшения
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Pre-register design/sample/window/primary metric/cost/stop rules и evidence.
  - AC2: win/loss/inconclusive/invalid supported; no forced success to deadline.
  - AC3: Strategy changes proposed to owner; experiments separately tested on known datasets.
- handoff/checkpoint: -
- blocker: -

### Q-020G Гейт P4 и выбор Studio-ветки [TODO]
- kind: owner_gate; paid_calls: False; agent: -
- depends: Q-020
- context: `docs/17_MASTER_PLAN.md`, `docs/15_STUDIO_SKILLS.md`
- scope: Гейт P4 и выбор Studio-ветки
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец принимает корректность observations/reuse/experiments.
  - AC2: Выбрана одна/несколько P5 веток по demand/cost; бюджет и limits подтверждены.
- handoff/checkpoint: -
- blocker: -

## P5

### Q-025 Декомпозиция выбранной P5 ветки и real benchmark [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-020G
- context: `docs/17_MASTER_PLAN.md`, `docs/15_STUDIO_SKILLS.md`, `docs/19_VALIDATION_PROTOCOL.md`
- scope: Декомпозиция выбранной P5 ветки и real benchmark
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Созданы bounded implementation tasks/evals для принятой ветки, связи features и dependency DAG.
  - AC2: Q-030G зависит от всех выбранных implementation tasks, не только планирования.
  - AC3: Каждый claim camera/control/identity/voice/rights имеет ограничения и проверку.
- handoff/checkpoint: -
- blocker: -

### Q-026 Cinema/camera/Blender/multishot expansion [TODO] [DEFERRED/disabled]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-025
- context: `docs/15_STUDIO_SKILLS.md`
- scope: Cinema/camera/Blender/multishot expansion
- out_of_scope: Другие P5 ветки; активировать только по Q-025 decomposition/owner-approved scope.
- acceptance criteria:
  - AC1: Per-preset fidelity/control inputs/geometry constraints verified on real outputs.
  - AC2: Continuity drift/anchor references measured; no false free fallback.
- handoff/checkpoint: -
- blocker: -

### Q-027 Автомонтаж исходников и advanced timeline [TODO] [DEFERRED/disabled]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-025
- context: `docs/15_STUDIO_SKILLS.md`, `docs/02_PRD_Ywoom_MVP.md`
- scope: Автомонтаж исходников и advanced timeline
- out_of_scope: Другие P5 ветки; активировать только по Q-025 decomposition/owner-approved scope.
- acceptance criteria:
  - AC1: Raw ingest/ASR/reframe/candidate clips with insufficient_material path.
  - AC2: Real raw sources evaluated; actual editor export compatibility documented.
- handoff/checkpoint: -
- blocker: -

### Q-028 Персонажи/twin/lipsync/localization [TODO] [DEFERRED/disabled]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-025
- context: `docs/15_STUDIO_SKILLS.md`, `docs/16_LOCALIZATION.md`
- scope: Персонажи/twin/lipsync/localization
- out_of_scope: Другие P5 ветки; активировать только по Q-025 decomposition/owner-approved scope.
- acceptance criteria:
  - AC1: Consent/license/identity QA calibration and specific provider compatibility.
  - AC2: Dub timing/text fonts/lipsync checked on real cases, budget per language.
- handoff/checkpoint: -
- blocker: -

### Q-029 Long/Carousel/UGC/VFX/apps expansion [TODO] [DEFERRED/disabled]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-025
- context: `docs/15_STUDIO_SKILLS.md`, `docs/05_PIPELINE.md`
- scope: Long/Carousel/UGC/VFX/apps expansion
- out_of_scope: Другие P5 ветки; активировать только по Q-025 decomposition/owner-approved scope.
- acceptance criteria:
  - AC1: Chosen format has bounded requirements/rights/real evaluation.
  - AC2: No fake testimonial, long chaining guarantee or declared superiority without comparison.
- handoff/checkpoint: -
- blocker: -

### Q-030G Гейт P5: выбранная ветка доказана [TODO]
- kind: owner_gate; paid_calls: False; agent: -
- depends: Q-025
- context: `docs/17_MASTER_PLAN.md`, `docs/19_VALIDATION_PROTOCOL.md`
- scope: Гейт P5: выбранная ветка доказана
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Зависимости включают принятые implementation tasks выбранной ветки, есть real evidence.
  - AC2: Owner принимает quality/cost/limits выбранной ветки и scope P6.
- handoff/checkpoint: -
- blocker: -

## P6

### Q-031 План безопасного SaaS-масштаба и unit economics [TODO]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-030G
- context: `docs/20_SECURITY_AND_OPERATIONS.md`, `docs/10_COST_AND_BUDGET.md`
- scope: План безопасного SaaS-масштаба и unit economics
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Demand/capacity/billing/credits/quotas/support/abuse priorities и acceptance plan.
  - AC2: Нет декларации million-ready: load/security/restore/payment tests определены.
  - AC3: Tasks для выбранных scale features созданы; гейт Q-035G зависит от фактической реализации.
- handoff/checkpoint: -
- blocker: -

### Q-032 Skill Lab, Model Scout и контролируемый Ops staging [TODO] [DEFERRED/disabled]
- kind: implementation; paid_calls: True; agent: -
- depends: Q-031
- context: `docs/08_SELF_IMPROVEMENT.md`, `docs/09_JEWEL_CORE.md`, `docs/20_SECURITY_AND_OPERATIONS.md`
- scope: Skill Lab, Model Scout и контролируемый Ops staging
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Mechanical/real eval/holdout/canary separated; approved cost и rollback.
  - AC2: Scout candidates verified; code proposals sandbox/branch/CI, no self-edit protected policy.
  - AC3: Production actions independent approval, tool/access controls and monitoring proved.
- handoff/checkpoint: -
- blocker: -

### Q-033 Quotas/billing/support/load/restore/security rollout [TODO] [DEFERRED/disabled]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-031
- context: `docs/20_SECURITY_AND_OPERATIONS.md`
- scope: Quotas/billing/support/load/restore/security rollout
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Реальные scale tasks/limits/load tests/billing reconciliation, support and incident runbooks.
  - AC2: Backup restore/tenant/abuse controls independently reviewed; no unsafe production permissions.
- handoff/checkpoint: -
- blocker: -

### Q-034 Marketplace и пользовательские навыки [TODO] [DEFERRED/disabled]
- kind: implementation; paid_calls: False; agent: -
- depends: Q-031
- context: `docs/15_STUDIO_SKILLS.md`, `docs/20_SECURITY_AND_OPERATIONS.md`
- scope: Marketplace и пользовательские навыки
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Skill provenance/licenses/sandbox/moderation/tenant isolation tested.
  - AC2: Demand/economics/support/security acceptance from owner before public rollout.
- handoff/checkpoint: -
- blocker: -

### Q-035G Гейт P6: принятый безопасный rollout [TODO]
- kind: owner_gate; paid_calls: False; agent: -
- depends: Q-031
- context: `docs/17_MASTER_PLAN.md`, `docs/20_SECURITY_AND_OPERATIONS.md`
- scope: Гейт P6: принятый безопасный rollout
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Gate dependencies contain selected implemented scale tasks; independent security/load/restore evidence.
  - AC2: Owner authorizes concrete rollout scope, spending, incident response and remaining future features.
- handoff/checkpoint: -
- blocker: -


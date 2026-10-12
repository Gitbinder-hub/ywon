# BACKLOG — generated from tasks/project.json

Не редактировать статусы здесь. project.py updates → render → validate.
v0.2 T-IDs исторические; активный план использует Q-IDs.

## P0

### Q-001 Владелец принимает v0.4 и рамки P0 [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: none
- context: `docs/governance/14_OPEN_DECISIONS.md`, `docs/product/17_MASTER_PLAN.md`, `docs/quality/19_VALIDATION_PROTOCOL.md`, `docs/CHANGE_IMPACT_v0.4.md`, `docs/localization/LANGUAGE_COVERAGE.md`
- scope: Владелец принимает v0.4 и рамки P0
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец принял evidence-first P0→P6, расширенный базовый P2 и отдельный all-client release gate; future scope сохранён.
  - AC2: Записаны утверждённые live-eval/development cap, валюта, период, stop rule и разрешение paid calls либо явно zero spend.
  - AC3: Записаны поддерживаемые pilot language/voice/material rights и manual review.
  - AC4: Отчёт approval без секретов содержит owner/date/choices; unresolved choices явно перечислены.
- handoff/checkpoint: handoffs/Q-001.json
- blocker: -

### Q-002 Проверить реальные API, цены, права и совместимость [DONE]
- kind: implementation; paid_calls: False; agent: cline/act
- depends: Q-001
- context: `docs/production/06_MODEL_ROUTER.md`, `docs/security/13_POLICIES_RISKS.md`, `docs/research/HIGGSFIELD_EXPRESS_RESEARCH.md`
- scope: Проверить реальные API, цены, права и совместимость
- out_of_scope: Установка непроверенных навыков, широкий Router/Studio, paid benchmarks до Q-003.
- acceptance criteria:
  - AC1: Для каждого кандидата official source/checked_at/model ID/region/access/commercial rights записаны.
  - AC2: Duration/rounding/audio/ref/control/idempotency/cancel/retention ограничения подтверждены или unknown.
  - AC3: Выбран минимальный image/TTS/video path и резерв, с владельцем согласованы стоимость и ограничения.
- handoff/checkpoint: handoffs/Q-002.json
- blocker: -

### Q-003 Согласовать задания, quality rubric и план реальных evals [DONE]
- kind: implementation; paid_calls: False; agent: cline/act
- depends: Q-002
- context: `docs/quality/19_VALIDATION_PROTOCOL.md`, `docs/economics/10_COST_AND_BUDGET.md`
- scope: Согласовать задания, quality rubric и план реальных evals
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Задания/источники/права, target language/format и reference set зафиксированы до теста.
  - AC2: Владелец принял quality/critical failure/cost/human-time envelope и число запусков в бюджете.
  - AC3: Схема run report учитывает все попытки, rejected outputs и small-sample limits.
- handoff/checkpoint: handoffs/Q-003.json
- blocker: -

### Q-004 Реальный CLI spike: narrated explainer → MP4 [DONE]
- kind: implementation; paid_calls: True; agent: cline/act
- depends: Q-003
- context: `docs/production/05_PIPELINE.md`, `docs/production/06_MODEL_ROUTER.md`, `docs/economics/10_COST_AND_BUDGET.md`, `docs/quality/19_VALIDATION_PROTOCOL.md`
- scope: Реальный CLI spike: narrated explainer → MP4
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Один полный реальный MP4 из утверждённых image/TTS/optional video входов, не mock.
  - AC2: Manifest/inputs/prompts/models/assets hashes/costs/all attempts/report сохранены без секретов.
  - AC3: Технический QA и человеческая оценка выполнены; unknown job не оплачивается повторно вслепую.
  - AC4: Скрипт запуска/окружение/лимит/cancel и ограничения воспроизводимы для следующего агента.
- handoff/checkpoint: handoffs/Q-004.json
- blocker: -

### Q-005 Повторные реальные запуски и отчёт пригодности/экономики [DONE]
- kind: implementation; paid_calls: True; agent: cline/act
- depends: Q-004
- context: `docs/quality/19_VALIDATION_PROTOCOL.md`, `docs/quality/12_QUALITY_AND_TESTING.md`
- scope: Повторные реальные запуски и отчёт пригодности/экономики
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Выполнен согласованный набор запусков, все успехи/неудачи и расходы учтены.
  - AC2: Human rubric, cost distribution, intervention minutes и recurring defects опубликованы.
  - AC3: Вывод go/rework/pivot не скрывает small sample/quality gaps и предлагает следующий scope.
- handoff/checkpoint: handoffs/Q-005.json
- blocker: -

### Q-005G Гейт P0: стоит ли строить пользовательский продукт [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: Q-005
- context: `docs/quality/19_VALIDATION_PROTOCOL.md`, `docs/governance/11_ROADMAP.md`
- scope: Гейт P0: стоит ли строить пользовательский продукт
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец просмотрел реальное медиа/затраты/отчёт и принял go для ограниченного формата.
  - AC2: Residual risks и required fixes внесены в задачи; бюджет/рамки P1 подтверждены.
- handoff/checkpoint: handoffs/Q-005G.json
- blocker: -

## P1

### Q-006 Scaffold, контракты и согласованная схема [DONE]
- kind: implementation; paid_calls: False; agent: cline/act
- depends: Q-005G
- context: `docs/architecture/03_ARCHITECTURE.md`, `docs/architecture/04_DATA_MODEL.md`, `docs/adr/0001-modular-monolith-contracts-first.md`, `docs/architecture/EDITABLE_DOCUMENT_CONTRACT.md`, `docs/architecture/PLATFORM_SHELL.md`
- scope: Scaffold, контракты и согласованная схема
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: ADR выбирает поддерживаемые web/API/auth/queue tools; minimal monorepo и reproducible local run.
  - AC2: Contracts включают primary channel/language/Bible versions/consents/operations/reservations.
  - AC3: Schema/migrations покрывают tenant consistency, constraints и migration safety.
  - AC4: make check приложения и mock-only CI явно отдельно от spec-check.
- handoff/checkpoint: handoffs/Q-006.json
- blocker: -

### Q-007 Auth, роли и tenant-isolation end-to-end [DONE]
- kind: implementation; paid_calls: False; agent: cline/Ywon-PC
- depends: Q-006
- context: `docs/security/20_SECURITY_AND_OPERATIONS.md`, `docs/architecture/04_DATA_MODEL.md`
- scope: Auth, роли и tenant-isolation end-to-end
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Email/session roles и API enforcement работают; secrets не в git/log.
  - AC2: Тесты users/workspaces/API/worker/storage запрещают cross-tenant доступ.
  - AC3: Media/URL ingest limits и SSRF/sandbox plan проверены или явно ограничены.
- handoff/checkpoint: handoffs/Q-007.json
- blocker: -

### Q-008 Durable workflow, journal и recovery [DONE]
- kind: implementation; paid_calls: False; agent: cline/Ywon-PC
- depends: Q-006
- context: `docs/architecture/03_ARCHITECTURE.md`, `docs/production/05_PIPELINE.md`, `docs/production/09_JEWEL_CORE.md`
- scope: Durable workflow, journal и recovery
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Persisted steps/leases/operation IDs/outbox/retry/dead-letter и cancellation semantics.
  - AC2: Crash-after-submit/unknown outcome/duplicate callbacks не вызывают blind resubmit.
  - AC3: Journal append-only; reversible/compensating actions явно различимы.
- handoff/checkpoint: handoffs/Q-008.json
- blocker: -

### Q-009 Budget reserve, ledger и invoice reconciliation [DONE]
- kind: implementation; paid_calls: False; agent: cline/Ywon-PC
- depends: Q-006, Q-008
- context: `docs/economics/10_COST_AND_BUDGET.md`, `docs/architecture/04_DATA_MODEL.md`, `docs/economics/COST_VISIBILITY.md`
- scope: Budget reserve, ledger и invoice reconciliation
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Atomic scope reservations не позволяют parallel overspend в integration test.
  - AC2: Оценка/факт/pricing versions/attempts/corrections и zero-kept waste учтены.
  - AC3: Unknown/cancelled jobs проходят reconcile; kill switch вне агента; security review приложен.
- handoff/checkpoint: handoffs/Q-009.json
- blocker: -

### Q-010 Storage, provenance и повторный монтаж [DONE]
- kind: implementation; paid_calls: False; agent: cline/Ywon-PC
- depends: Q-006, Q-007
- context: `docs/architecture/03_ARCHITECTURE.md`, `docs/security/20_SECURITY_AND_OPERATIONS.md`
- scope: Storage, provenance и повторный монтаж
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Pinned exact assets/manifest/renderer/fonts refs и проверяемая копия по hash.
  - AC2: Retain/delete/restore и consent/rights links не теряют последнюю копию молча.
  - AC3: Тест повторного монтажа/отсутствующего asset явно показывает available/unavailable.
- handoff/checkpoint: handoffs/Q-010.json
- blocker: -

### Q-010G Гейт P1: надёжность и безопасность основания [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: Q-007, Q-008, Q-009, Q-010, Q-036, Q-037, Q-044
- context: `docs/quality/12_QUALITY_AND_TESTING.md`, `docs/security/20_SECURITY_AND_OPERATIONS.md`
- scope: Гейт P1: надёжность и безопасность основания
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Owner/reviewer просмотрел failure/recovery/tenancy/budget evidence, critical gaps устранены.
  - AC2: Приняты границы P2 и real API budget, защищённые paths/репозиторные ограничения настроены.
- handoff/checkpoint: handoffs/Q-010G.json
- blocker: -

### Q-036 Media-neutral editable document/data contracts [DONE]
- kind: implementation; paid_calls: False; agent: cline/Ywon-PC
- depends: Q-006
- context: `docs/architecture/EDITABLE_DOCUMENT_CONTRACT.md`, `docs/architecture/04_DATA_MODEL.md`
- scope: Media-neutral editable document/data contracts
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Typed content item/variant/document/revision/layer/timeline/text contracts и episode relations; no fake text/image episodes.
  - AC2: Tenant-consistent FK, optimistic concurrency/base revision, approval hash, retention/source refs and safe migration tests.
  - AC3: Preview/server renderer capability schema и unsupported nodes outcomes определены; exact tool choice separate ADR.
- handoff/checkpoint: handoffs/Q-036.json
- blocker: -

### Q-037 Cost estimate projections, baseline и >10% alerts [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-009
- context: `docs/economics/COST_VISIBILITY.md`
- scope: Cost estimate projections, baseline и >10% alerts
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Immutable estimate/item pricing baseline and explicit amendments, confirmed/pending/reserve projection without double counting.
  - AC2: Strict >10%, cumulative/zero/FX/stale prices/hard cap/headroom decisions tested before new paid submit.
  - AC3: Notifications reference scoped baseline, dedup/version and ack vs approval semantics; all attempts final report data.
- handoff/checkpoint: handoffs/Q-037.json
- blocker: -

### Q-044 Factory boundary для будущей JEWEL shell [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-006, Q-007
- context: `docs/architecture/PLATFORM_SHELL.md`
- scope: Factory boundary для будущей JEWEL shell
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Typed module commands/deep links/scoped delegation and distinct module permissions; current monolith retained.
  - AC2: Cross-module private data cannot transfer without explicit permission/purpose; tests for wrong tenant/revocation/role escalation.
  - AC3: Future personal shell not implemented; independent Factory access/export and boundary versioning documented.
- handoff/checkpoint: handoffs/Q-044.json
- blocker: -

## P2

### Q-011 Короткий онбординг, Genome и канон серии [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-010G
- context: `docs/product/07_CREATOR_GENOME.md`, `docs/architecture/04_DATA_MODEL.md`, `docs/localization/16_LOCALIZATION.md`, `docs/product/MANUAL_JOURNEY.md`
- scope: Короткий онбординг, Genome и канон серии
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Обязательные язык/подача/бюджет/согласия/review подтверждаются пользователем без owner bypass.
  - AC2: Progressive interview/save/resume, facts tiers и versioned Bible resolution работают.
  - AC3: Series B не видит канон A; primary-channel language однозначен в tests.
- handoff/checkpoint: handoffs/Q-011.json
- blocker: -

### Q-012 Director Chat, карточки и typed approvals [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-010G
- context: `docs/production/06_MODEL_ROUTER.md`, `docs/product/02_PRD_QWOOM_MVP.md`, `docs/production/FOUR_ROLES.md`, `docs/economics/COST_VISIBILITY.md`
- scope: Director Chat, карточки и typed approvals
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Commands validated by schema/role/version; карточки script/estimate/revise/stop.
  - AC2: Никаких direct provider side effects или policy/budget обходов из LLM.
  - AC3: Stale artifact approvals инвалидируются; malformed output/injection cases покрыты.
- handoff/checkpoint: handoffs/Q-012.json
- blocker: -

### Q-013 First Skill Runtime и минимальный Router [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-010G
- context: `docs/production/15_STUDIO_SKILLS.md`, `docs/production/06_MODEL_ROUTER.md`
- scope: First Skill Runtime и минимальный Router
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Typed recipe с budget/retries/reports/capability fidelity; version pinned.
  - AC2: Доказанный P0 provider path включён, recorded fixtures и live eval разделены.
  - AC3: Несколько честных 2D motion presets; unsupported movement не выдаётся за exact orbit.
- handoff/checkpoint: handoffs/Q-013.json
- blocker: -

### Q-014 Пользовательский pipeline, QA, точечные правки и export [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-011, Q-012, Q-013, Q-039, Q-042
- context: `docs/production/05_PIPELINE.md`, `docs/quality/12_QUALITY_AND_TESTING.md`, `docs/studio/VIDEO_EDITOR.md`, `docs/studio/TEXT_AND_SEQUENCE_EDITOR.md`, `docs/quality/STUDIO_ACCEPTANCE.md`
- scope: Пользовательский pipeline, QA, точечные правки и export
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Обычный пользователь получает real 30–60 с MP4/subs/metadata/cost report.
  - AC2: Script/final human approval; targeted revision preserves accepted unaffected assets.
  - AC3: Technical QA и content review различены, failure/unknown/budget stop видимы.
  - AC4: Детерминированный mocked E2E и approved real E2E evidence сохранены.
- handoff/checkpoint: handoffs/Q-014.json
- blocker: -

### Q-015 Медиатека, manual publishing и optional YouTube API [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-014
- context: `docs/security/13_POLICIES_RISKS.md`, `docs/security/20_SECURITY_AND_OPERATIONS.md`
- scope: Медиатека, manual publishing и optional YouTube API
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Медиатека с правами/provenance/availability и полный manual publish package.
  - AC2: YouTube audit/quota/OAuth/disclosure состояние проверено официально; API optional.
  - AC3: Если API включён: duplicate/upload-reconcile/approval-version tests; если нет — явный documented limitation.
- handoff/checkpoint: handoffs/Q-015.json
- blocker: -

### Q-015G Гейт P2: первый usable продукт [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: Q-014, Q-015, Q-040, Q-041
- context: `docs/product/02_PRD_QWOOM_MVP.md`, `docs/quality/19_VALIDATION_PROTOCOL.md`
- scope: Гейт P2: первый usable продукт
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец как обычный пользователь прошёл цикл и просмотрел финал/цены.
  - AC2: Scope/known gaps/неподдерживаемые функции видны, P3 budget и protocol приняты.
- handoff/checkpoint: handoffs/Q-015G.json
- blocker: -

### Q-038 Responsive design system и базовая UI i18n [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-010G
- context: `docs/product/DESIGN_AND_ACCESSIBILITY.md`, `docs/localization/UI_I18N.md`, `docs/localization/LANGUAGE_COVERAGE.md`
- scope: Responsive design system и базовая UI i18n
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Responsive components/states/accessibility and locale-neutral codes with reviewed baseline catalog critical flows.
  - AC2: UI/assistant/content locale independent; lazy catalogs/plurals/placeholders/fallback/pseudo locale tests; no runtime LLM translation of static UI.
  - AC3: Language capability config blocks unsupported outputs, disclosed draft/active coverage; viewport/performance matrix ADR recorded.
- handoff/checkpoint: handoffs/Q-038.json
- blocker: -

### Q-039 Базовые image/video/text editors + renderer parity ADR [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-036, Q-038, Q-012
- context: `docs/studio/IMAGE_EDITOR.md`, `docs/studio/VIDEO_EDITOR.md`, `docs/studio/TEXT_AND_SEQUENCE_EDITOR.md`, `docs/architecture/EDITABLE_DOCUMENT_CONTRACT.md`
- scope: Базовые image/video/text editors + renderer parity ADR
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Candidate library/license/mobile-size/performance spike and chosen interactive editor/render ADR; FFmpeg not presented as frontend.
  - AC2: Canvas editable overlays/text styles; structured text manual/diff editing; video trims/order/overlay intervals/subtitle cues/basic audio.
  - AC3: Autosave/reload/undo/conflict and export parity golden fixtures with pinned fonts/renderer, keyboard/numeric alternatives.
  - AC4: Flat/baked text/import and unsupported effects limits visible; no paid API for local edit; render price visible.
- handoff/checkpoint: handoffs/Q-039.json
- blocker: -

### Q-040 Три входа, proof→editor и один bounded static recipe [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-039, Q-013, Q-011
- context: `docs/product/MANUAL_JOURNEY.md`, `docs/studio/MODES_AND_RECIPES.md`, `docs/economics/COST_VISIBILITY.md`
- scope: Три входа, proof→editor и один bounded static recipe
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Chat/guided/import entrances share brief/save/resume, all mandatory risks confirmed, no lost answers on mode switch.
  - AC2: Approved-budget real static asset/layout with editable overlays/text, result/editor/chat on same workspace; documented usable export.
  - AC3: Estimate before paid proof/revision, task cost details and approved sample→template→plan proposal; no auto publication.
  - AC4: Failed/unsupported/unknown/material shortage paths preserve accepted results; provider outputs/costs/evidence pinned.
- handoff/checkpoint: handoffs/Q-040.json
- blocker: -

### Q-041 P2 Studio novice usability и end-to-end acceptance [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-014, Q-040
- context: `docs/quality/STUDIO_ACCEPTANCE.md`, `docs/product/MANUAL_JOURNEY.md`
- scope: P2 Studio novice usability и end-to-end acceptance
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Ordinary user completes video and bounded static/text workflows: onboarding→cost→result→edit→export without owner bypass.
  - AC2: Resume/version/undo/paid call idempotency and basic mobile-web/a11y/localized cost flows verified, help/intervention minutes logged.
  - AC3: Real final exports and mechanical/live test reports distinguished; critical security/cost/quality failures resolved or block gate.
- handoff/checkpoint: handoffs/Q-041.json
- blocker: -

### Q-042 Четыре роли через единый dispatcher [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-012, Q-013
- context: `docs/production/FOUR_ROLES.md`, `docs/production/09_JEWEL_CORE.md`
- scope: Четыре роли через единый dispatcher
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Role tools/actions matrix and single-user assistant commands; no four obligatory paid LLM calls.
  - AC2: Auth/tenant/budget/policy independently enforced by code; escalation/injection/duplicate submission tests deny.
  - AC3: QA role uncertainty/needs_user and costs visible; no model oracle approval or policy mutation.
- handoff/checkpoint: handoffs/Q-042.json
- blocker: -

## P3

### Q-016 Серия реальных эпизодов: повторяемость и нагрузка человека [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-015G
- context: `docs/quality/19_VALIDATION_PROTOCOL.md`, `docs/economics/10_COST_AND_BUDGET.md`
- scope: Серия реальных эпизодов: повторяемость и нагрузка человека
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Согласованное число разных real episodes без cherry-picking, QA/acceptance/cost/human minutes.
  - AC2: Failures root causes/repair cost и evidence pinned; threshold decisions с uncertainty.
  - AC3: Критические бюджетные/privacy/publish инциденты отдельно и устранены до expansion.
- handoff/checkpoint: handoffs/Q-016.json
- blocker: -

### Q-017 5 внешних пользователей и проверка UX [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-016
- context: `docs/product/07_CREATOR_GENOME.md`, `docs/quality/19_VALIDATION_PROTOCOL.md`, `docs/product/MANUAL_JOURNEY.md`, `docs/quality/STUDIO_ACCEPTANCE.md`
- scope: 5 внешних пользователей и проверка UX
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: 5 ordinary external users проходят pilot; помощь/провалы записаны, не спрятаны.
  - AC2: Observed time-to-usable-export/drop-offs/review burden/feedback и issues зарегистрированы.
  - AC3: Недоступные языки/форматы/стоимость явно сообщены пользователю.
- handoff/checkpoint: handoffs/Q-017.json
- blocker: -

### Q-017G Гейт P3: доказанный формат и приоритет расширения [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: Q-017, Q-043
- context: `docs/product/17_MASTER_PLAN.md`, `docs/quality/19_VALIDATION_PROTOCOL.md`
- scope: Гейт P3: доказанный формат и приоритет расширения
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец принимает observed quality/economics/UX или назначает rework, не декларативный успех.
  - AC2: Выбран next investment и scope P4; full feature map остаётся актуальной.
- handoff/checkpoint: handoffs/Q-017G.json
- blocker: -

### Q-043 Founding creator и dogfooding plan [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-015G
- context: `docs/growth/CREATOR_PARTNERS_AND_DOGFOODING.md`
- scope: Founding creator и dogfooding plan
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Owner-reviewed small cohort/offer draft incl generation fees, eligibility/lifetime scope/support economics and honest negative review allowance.
  - AC2: Disclosure/consent/right-to-testimonial and privacy-safe metrics; no guarantee of viral growth or coercion.
  - AC3: Ywoom own channels and owner series plans use same permission/budget/review boundaries; no automatic public posting.
- handoff/checkpoint: handoffs/Q-043.json
- blocker: -

## P4

### Q-018 Analytics import, cohorts и корректность данных [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-017G
- context: `docs/learning/08_SELF_IMPROVEMENT.md`, `docs/security/13_POLICIES_RISKS.md`
- scope: Analytics import, cohorts и корректность данных
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: API metrics availability/windows/source traffic documented; missing=NULL.
  - AC2: Import retry/dedup/provenance и descriptive per-episode reports.
  - AC3: No fabricated cause/CTR-hook equivalence; uncertainty/confounders видны.
- handoff/checkpoint: handoffs/Q-018.json
- blocker: -

### Q-019 Golden Library и безопасное reuse [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-018
- context: `docs/learning/08_SELF_IMPROVEMENT.md`, `docs/security/20_SECURITY_AND_OPERATIONS.md`
- scope: Golden Library и безопасное reuse
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Legal+QA+human approval gate, language/market/tenant scope и version provenance.
  - AC2: Reuse не переносит чужой private content; diversity/expiry/availability safeguards.
  - AC3: Preferences/inferred insights не превращаются в confirmed автоматически.
- handoff/checkpoint: handoffs/Q-019.json
- blocker: -

### Q-020 Эксперименты и предложения улучшения [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-018, Q-019
- context: `docs/learning/08_SELF_IMPROVEMENT.md`, `docs/quality/12_QUALITY_AND_TESTING.md`
- scope: Эксперименты и предложения улучшения
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Pre-register design/sample/window/primary metric/cost/stop rules и evidence.
  - AC2: win/loss/inconclusive/invalid supported; no forced success to deadline.
  - AC3: Strategy changes proposed to owner; experiments separately tested on known datasets.
- handoff/checkpoint: handoffs/Q-020.json
- blocker: -

### Q-020G Гейт P4 и выбор Studio-ветки [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: Q-020
- context: `docs/product/17_MASTER_PLAN.md`, `docs/production/15_STUDIO_SKILLS.md`
- scope: Гейт P4 и выбор Studio-ветки
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Владелец принимает корректность observations/reuse/experiments.
  - AC2: Выбрана одна/несколько P5 веток по demand/cost; бюджет и limits подтверждены.
- handoff/checkpoint: handoffs/Q-020G.json
- blocker: -

## P5

### Q-025 Декомпозиция выбранной P5 ветки и real benchmark [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-020G
- context: `docs/product/17_MASTER_PLAN.md`, `docs/production/15_STUDIO_SKILLS.md`, `docs/quality/19_VALIDATION_PROTOCOL.md`, `docs/studio/MODES_AND_RECIPES.md`
- scope: Декомпозиция выбранной P5 ветки и real benchmark
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Созданы bounded implementation tasks/evals для принятой ветки, связи features и dependency DAG.
  - AC2: Q-030G зависит от всех выбранных implementation tasks, не только планирования.
  - AC3: Каждый claim camera/control/identity/voice/rights имеет ограничения и проверку.
- handoff/checkpoint: handoffs/Q-025.json
- blocker: -

### Q-026 Cinema/camera/Blender/multishot expansion [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-025
- context: `docs/production/15_STUDIO_SKILLS.md`
- scope: Cinema/camera/Blender/multishot expansion
- out_of_scope: Другие P5 ветки; активировать только по Q-025 decomposition/owner-approved scope.
- acceptance criteria:
  - AC1: Per-preset fidelity/control inputs/geometry constraints verified on real outputs.
  - AC2: Continuity drift/anchor references measured; no false free fallback.
- handoff/checkpoint: handoffs/Q-026.json
- blocker: -

### Q-027 Автомонтаж исходников и advanced timeline [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-025
- context: `docs/production/15_STUDIO_SKILLS.md`, `docs/product/02_PRD_QWOOM_MVP.md`
- scope: Автомонтаж исходников и advanced timeline
- out_of_scope: Другие P5 ветки; активировать только по Q-025 decomposition/owner-approved scope.
- acceptance criteria:
  - AC1: Raw ingest/ASR/reframe/candidate clips with insufficient_material path.
  - AC2: Real raw sources evaluated; actual editor export compatibility documented.
- handoff/checkpoint: handoffs/Q-027.json
- blocker: -

### Q-028 Персонажи/twin/lipsync/localization [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-025
- context: `docs/production/15_STUDIO_SKILLS.md`, `docs/localization/16_LOCALIZATION.md`
- scope: Персонажи/twin/lipsync/localization
- out_of_scope: Другие P5 ветки; активировать только по Q-025 decomposition/owner-approved scope.
- acceptance criteria:
  - AC1: Consent/license/identity QA calibration and specific provider compatibility.
  - AC2: Dub timing/text fonts/lipsync checked on real cases, budget per language.
- handoff/checkpoint: handoffs/Q-028.json
- blocker: -

### Q-029 Long/Carousel/UGC/VFX/apps expansion [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-025
- context: `docs/production/15_STUDIO_SKILLS.md`, `docs/production/05_PIPELINE.md`
- scope: Long/Carousel/UGC/VFX/apps expansion
- out_of_scope: Другие P5 ветки; активировать только по Q-025 decomposition/owner-approved scope.
- acceptance criteria:
  - AC1: Chosen format has bounded requirements/rights/real evaluation.
  - AC2: No fake testimonial, long chaining guarantee or declared superiority without comparison.
- handoff/checkpoint: handoffs/Q-029.json
- blocker: -

### Q-030G Гейт P5: выбранная ветка доказана [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: Q-025
- context: `docs/product/17_MASTER_PLAN.md`, `docs/quality/19_VALIDATION_PROTOCOL.md`
- scope: Гейт P5: выбранная ветка доказана
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Зависимости включают принятые implementation tasks выбранной ветки, есть real evidence.
  - AC2: Owner принимает quality/cost/limits выбранной ветки и scope P6.
- handoff/checkpoint: handoffs/Q-030G.json
- blocker: -

### Q-048 Декомпозиция выбранной товарной/креативной студии [DONE]
- kind: implementation; paid_calls: False; agent: opas/mirasim
- depends: Q-025
- context: `docs/studio/MODES_AND_RECIPES.md`, `docs/studio/IMAGE_EDITOR.md`, `docs/studio/TEXT_AND_SEQUENCE_EDITOR.md`
- scope: Декомпозиция выбранной товарной/креативной студии
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Chosen studio/recipe inputs/onboarding/platform profiles/protected product/claims and format-specific quality rubric scoped.
  - AC2: Bounded implementation/eval tasks created with real budgets/rights, linked features and Q-030G dependencies; not whole catalog DONE.
  - AC3: Region edit/variants/carousel/Stories functionality split by capability and actual proof; unsupported API stickers disclosed.
- handoff/checkpoint: handoffs/Q-048.json
- blocker: -

## P6

### Q-031 План безопасного SaaS-масштаба и unit economics [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-030G
- context: `docs/security/20_SECURITY_AND_OPERATIONS.md`, `docs/economics/10_COST_AND_BUDGET.md`
- scope: План безопасного SaaS-масштаба и unit economics
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Demand/capacity/billing/credits/quotas/support/abuse priorities и acceptance plan.
  - AC2: Нет декларации million-ready: load/security/restore/payment tests определены.
  - AC3: Tasks для выбранных scale features созданы; гейт Q-035G зависит от фактической реализации.
- handoff/checkpoint: handoffs/Q-031.json
- blocker: -

### Q-032 Skill Lab, Model Scout и контролируемый Ops staging [DONE]
- kind: implementation; paid_calls: True; agent: opas/mirasim
- depends: Q-031
- context: `docs/learning/08_SELF_IMPROVEMENT.md`, `docs/production/09_JEWEL_CORE.md`, `docs/security/20_SECURITY_AND_OPERATIONS.md`
- scope: Skill Lab, Model Scout и контролируемый Ops staging
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Mechanical/real eval/holdout/canary separated; approved cost и rollback.
  - AC2: Scout candidates verified; code proposals sandbox/branch/CI, no self-edit protected policy.
  - AC3: Production actions independent approval, tool/access controls and monitoring proved.
- handoff/checkpoint: handoffs/Q-032.json
- blocker: -

### Q-033 Quotas/billing/support/load/restore/security rollout [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-031
- context: `docs/security/20_SECURITY_AND_OPERATIONS.md`, `docs/clients/WEB_MOBILE_RELEASE.md`
- scope: Quotas/billing/support/load/restore/security rollout
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Реальные scale tasks/limits/load tests/billing reconciliation, support and incident runbooks.
  - AC2: Backup restore/tenant/abuse controls independently reviewed; no unsafe production permissions.
- handoff/checkpoint: handoffs/Q-033.json
- blocker: -

### Q-034 Marketplace и пользовательские навыки [DONE]
- kind: implementation; paid_calls: False; agent: opas/mirasim
- depends: Q-031
- context: `docs/production/15_STUDIO_SKILLS.md`, `docs/security/20_SECURITY_AND_OPERATIONS.md`
- scope: Marketplace и пользовательские навыки
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Skill provenance/licenses/sandbox/moderation/tenant isolation tested.
  - AC2: Demand/economics/support/security acceptance from owner before public rollout.
- handoff/checkpoint: handoffs/Q-034.json
- blocker: -

### Q-035G Гейт P6: принятый безопасный rollout [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: Q-031
- context: `docs/product/17_MASTER_PLAN.md`, `docs/security/20_SECURITY_AND_OPERATIONS.md`
- scope: Гейт P6: принятый безопасный rollout
- out_of_scope: Другие этапы/неподтверждённые расширения, production deployment без решения владельца.
- acceptance criteria:
  - AC1: Gate dependencies contain selected implemented scale tasks; independent security/load/restore evidence.
  - AC2: Owner authorizes concrete rollout scope, spending, incident response and remaining future features.
- handoff/checkpoint: handoffs/Q-035G.json
- blocker: -

### Q-045 Популярные локали: reviewed UI и media coverage [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-030G, Q-038
- context: `docs/localization/UI_I18N.md`, `docs/localization/LANGUAGE_COVERAGE.md`, `docs/localization/16_LOCALIZATION.md`
- scope: Популярные локали: reviewed UI и media coverage
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Owner-select launch locales/markets/reviewers/budget; incremental offline UI translations, native review of money/rights/onboarding/errors.
  - AC2: Enabled locale capabilities text/TTS/subs/fonts/RTL verified with approved real cases, limits/fallback/evidence/pricing timestamp recorded.
  - AC3: Independent UI/content settings, no hidden all-language claims; reused visuals/locale derivatives/delta budgets tested; partial beta labeled.
- handoff/checkpoint: handoffs/Q-045.json
- blocker: -

### Q-046 Android/iOS clients: выбранный подход и общие проекты [DONE]
- kind: implementation; paid_calls: False; agent: claude/opus-5.5
- depends: Q-030G, Q-044, Q-041
- context: `docs/clients/WEB_MOBILE_RELEASE.md`, `docs/product/DESIGN_AND_ACCESSIBILITY.md`
- scope: Android/iOS clients: выбранный подход и общие проекты
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: ADR compares PWA/wrapper/native approach with real-device canvas/timeline tests and licenses; accepted device/OS/performance scope.
  - AC2: Both platform app packages use shared project/API/document/auth with secure storage and no embedded provider secrets.
  - AC3: Camera/files/share/deep links/push behavior implemented where claimed; essential editing/workflow mobile focused, jobs continue server-side.
  - AC4: Billing/store/privacy/account deletion preflight tasks scoped and official-source checklist started; PWA not claimed as both store apps.
- handoff/checkpoint: handoffs/Q-046.json
- blocker: -

### Q-047 Mobile E2E, store/billing/privacy readiness [DONE]
- kind: implementation; paid_calls: True; agent: claude/opus-5.5
- depends: Q-046, Q-045, Q-033
- context: `docs/clients/WEB_MOBILE_RELEASE.md`, `docs/quality/STUDIO_ACCEPTANCE.md`, `docs/security/20_SECURITY_AND_OPERATIONS.md`
- scope: Mobile E2E, store/billing/privacy readiness
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Ordinary users on actual Android/iOS complete cost→generate→review→text/layer/video edit→approve/export using same project.
  - AC2: Offline/network/app kill/resume/conflict/large upload, a11y and crash/memory/preview-final tests with device evidence; no duplicate paid jobs.
  - AC3: Official current Apple/Google rules, billing model/regions/fees/AI/privacy/deletion permissions reviewed, test accounts/support and submission evidence.
  - AC4: Known limits and store availability/pending/rejected states explicit; not self-certified store acceptance.
- handoff/checkpoint: handoffs/Q-047.json
- blocker: -

### Q-049G Гейт публичного релиза: web + Android + iOS + языки [DONE]
- kind: owner_gate; paid_calls: False; agent: Oleg
- depends: Q-035G, Q-045, Q-047
- context: `docs/clients/WEB_MOBILE_RELEASE.md`, `docs/localization/LANGUAGE_COVERAGE.md`, `docs/growth/CREATOR_PARTNERS_AND_DOGFOODING.md`
- scope: Гейт публичного релиза: web + Android + iOS + языки
- out_of_scope: Другие этапы/неподтверждённые расширения; расходы только в separately approved envelope; не весь future scope.
- acceptance criteria:
  - AC1: Owner reviewed safe-scale/security/cost/mobile/language evidence and accepted actual launch profile and disclosed limits.
  - AC2: Android/iOS store availability verified, or explicit labeled staged-launch waiver with missing client/reason/risk/follow-up; no silent downgrade.
  - AC3: Pricing/support/rights/privacy/creator offer terms and release materials truthfully reflect actual shipped capabilities.
- handoff/checkpoint: handoffs/Q-049G.json
- blocker: -


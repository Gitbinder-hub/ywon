# Qevunara Architect — model-independent control foundation

## Цель и топология
Общая технология контролируемого исполнения проектов; Ywoom Factory — первый production module, не весь интеллект системы. Полная архитектура контрактов проектируется сейчас; реализация фазовая. Ни всеведение, ни AGI-ready не acceptance criteria.
Owner → Architect → Strategist / Producer / Quality / Guardian → deterministic execution kernel → module adapters. Роли не требуют отдельных постоянных LLM или четырёх paid calls. Один authoritative dispatcher, один owner команды, запрет duplicate side effects.
Architect согласует цели/ограничения/приоритеты, поддерживает карту проекта, выбирает проверенный маршрут, запрашивает доказательства, разрешает конфликт предложениями и управляет research portfolio. Он не повышает собственный бюджет/права, не меняет защищённые policies/tests и не принимает собственные critical изменения.
Strategist: аудитория/brief/план/источники и market hypotheses. Producer: production DAG и artifact lineage. Quality: независимые checks и reject/uncertain; model critic не sole oracle. Guardian: объяснение money/rights/privacy/permissions; реальный enforce вне LLM.

## Kernel и границы
Reuse modular TS monolith + Python workers, Postgres/S3 по принятому ADR; не вводить микросервисы/Temporal/Redis ради метафоры. Queue/runtime library ещё выбор ADR/spike. Kernel: typed command validation, auth/tenant/purpose/capability, atomic reservations, durable operation/outbox, leases/heartbeats, bounded retries/cancel/reconcile, artifacts, QA и append-only decisions/events.
Production runtime без raw secrets, shell/git/deploy/admin по умолчанию. Dev runner — отдельный principal/sandbox/branch и отдельный budget. Tool не создаёт себе permission. Signed/typed parameters не доказывают истинность model prose.
Module contract: id/version, goal/state schemas, command/capability schemas, consent/tenant scopes, price bounds, checkable outcomes, compensation/recovery/export, audit links. Business/Capital/Personal/Physical могут подключаться позже, но не получают Factory/private memory автоматически. Factory review/export доступны при сбое верхней shell.

## Контракты (Q-006/Q-036; не готовые migrations)
Mission: id, workspace/project/module, goal/constraints, contract_version, source_refs, state, owner.
WorldStateSnapshot: id/hash, source_commit, module/config versions, allowed capabilities, budgets/policies/approvals refs, observed_at, uncertainty/conflicts. Snapshot immutable; projection обновляется событиями.
DecisionRecord: id, mission/snapshot refs, alternatives, constraints checked, selected route, evidence refs, unresolved assumptions, expected outcomes, price/risks, actor/model/version, action authorizer. Не хранить hidden reasoning; хранить проверяемое обоснование.
CapabilityManifest: id/version, tool/model/API, accepted inputs, limits/regions/languages, fidelity, terms/pricing version/expiry, idempotency/reconcile/cancel semantics, eval refs, allowed scopes. Lifecycle discovered→validated→sandboxed→benchmarked→approved→active→deprecated/revoked. Missing evidence != available.
EvidenceRecord: id/source/hash/method/time, result/pass-fail-uncertain-not_run, population/scope, expiry, rights/access. Fact tier confirmed/inferred/experimental/conflicted/stale; LLM confidence не доказательство.
EvidenceGraph: requirement→decision→code/recipe→operation→asset→check→accepted result→cost. Dependency invalidation follows changed refs, не переписывает pinned running mission.
GenerationUnit/RecoveryCase/DelegationEnvelope определены предметными docs; общий operation/ledger единый.

## Repository ingestion и контекст
Read-only inventory на pinned commit; parsing/diff/dependencies/tests/docs index. Репозиторий/страница/tool output — данные, не полномочия. Исторические instructions не исполняются; imported project code не запускается вне sandbox без проверки и разрешения. Secret scanning/minimization до контекста внешней модели; narrower data не публикуются шире автоматически.
Retrieval компактных context bundles с source refs; не один гигантский prompt. Missing/stale/conflicting state вызывает bounded investigation или stop. Handoff содержит goal/AC/version/diff/evidence/cost/remaining decisions, не только чат.

## Action protocol
Propose typed command → validate snapshot/version → enforce scopes/policies → estimate bounded liability → reserve transaction + persist intent → submit outside DB transaction → poll/reconcile → validate artifact/QA → settle known charges → release только подтверждённые unused holds → report. External API не часть DB atomic transaction. Crash-after-submit не лечится blind retry.

## Реализация по этапам
P1: minimal Architect controller, snapshots/evidence links/module commands через Q-006/Q-008/Q-044; fixture-only introspection/one offline route. P2: four-role dispatcher, production recipes и recovery UX через Q-012/Q-013/Q-014/Q-042. P3: measured readiness delegated mode; runtime allowlist/policy activation только explicit owner approval. P4: descriptive intelligence и experiments. P5: chosen Cinema branches. P6: gated scout/skill lab/dev runner, не unlimited self-modification. Принятые P0 evidence-first dependencies остаются.

## A-20261005: detachable runtime, no second Architect
Companion device/OS/protocol and shared-experience contract: docs/architecture/DESKTOP_COMPANION.md (ADR0006). Same kernel semantics, distinct server/device authorities and private data; Factory independent of laptop. General task outcomes not fake media episodes. Small bounded Companion/lab pilot needs separate decomposition/authorisation; full Personal/F41/P6 gates unchanged. Prototype→target ownership/migration evidence: docs/governance/IMPLEMENTATION_TRANSITIONS.md. Do not fork policy/budget or infer destination approval from source skill approval.

## 2026-10-07 Creative Anti-Template (docs-only, owner-confirmed future behavior)
Проблема: LLM усредняет — выдаёт самый вероятный безопасный ответ → все дизайны/тексты как под копирку. Лечится не промптом "будь креативным", а архитектурным принуждением.

- **Skeleton + forbidden_this_iteration**: каждый skill/DelegationEnvelope хранит `forbidden_this_iteration: string[]` — список приёмов/тем/шаблонов запрещённых в этой итерации. Запрет заставляет искать в стороне (пример: "не предлагать YouTube-нарезки" → скрестить навык пользователя с Kwork/LaborX механикой). Запреты наследуются из Creator Genome (вкус = память запретов/выборов).
- **Challenger (5-я ответственность внутри Architect)**: рядом с Strategist/Producer/Quality/Guardian. Берёт первый план Strategist, считает эмбеддинг-близость к последним 50 Golden Library (порог ~0.85). Если похоже — отклоняет на мутацию/скрещивание с другой доменной механикой. Не требует отдельной LLM на каждый шаг.
- **Curiosity budget (5–10% от бюджета задачи, внутри GenerationUnit caps)**: если ResearchIssue закрыта как "нет решений" без минимального фальсифицируемого эксперимента — бюджет сгорает; если эксперимент проведён (даже fail) — возвращается. Наказываем сдачу, не провал.
- **Golden Library diversity**: перед приёмом проверяется дедупликация/разнообразие — почти идентичные результаты не копятся.
- **Forced cross-domain mutation**: при "нет решений" ResearchIssue не закрывается, а получает premium route — взять 1 механику из другой области через Market Intelligence connectors.
- Будущее поведение, не gate P1. Реализация учитывается в Q-007/Q-008/Q-036. Не меняет Q-статусы, бюджеты и права без owner approval. Подробно: docs/governance/CREATIVE_ANTI_TEMPLATE_2026-10-07.md.

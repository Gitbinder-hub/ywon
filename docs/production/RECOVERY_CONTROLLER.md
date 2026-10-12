# Recovery Controller — исправление, не лотерея

## Назначение
Минимизировать стоимость принятого результата и повторяемость дефектов. Не гарантирует, что stochastic next output обязательно лучше. Цель механизма: изменять стратегию на основании свидетельств и проверять эффект. Нельзя продавать наличие механизма как уже доказанное снижение расходов.

## RecoveryCase / RepairPlan
RecoveryCase: unit/scene/operation/input-output revision refs, defect category, expected vs observed, QA evidence/uncertainty, attempts and all cost, retained accepted assets, provider outcome. Categories: input/contract conflict; missing ref; unsupported control; identity/continuity; visual artifact; factual/semantic; temporal/audio; transient provider; technical render; safety/rights; unknown financial outcome.
RepairPlan: parent case/version/hash, root-cause hypothesis+evidence, minimal affected subgraph, changed parameters/ref/model/control/assembly strategy, protected assets/constraints, capability proof, invalidated approvals, candidate validation method, route/estimate/worst-case/delta/max attempts, alternatives, expected improvement evidence and uncertainty, rollback/stop. Не хранить скрытые chain-of-thought; достаточно проверяемых основания/изменений.
Producer предлагает, Quality independently checks defect/repair alignment, Guardian/kernel validates scopes/cost, Architect selects. Не четыре обязательных LLM calls; rule-based checks first. Model maker/judge correlation учитывается; critic disagreement → uncertain, не majority truth.

## Лестница ремонта
1. Проверь error/provider status и correctness QA.
2. Deterministic local edit/re-render if sufficient (font/caption/timing/audio/compositing).
3. Reuse retained correct refs/assets, regenerate ONLY affected shot/range.
4. Strengthen verified controls/ref/keyframes or simplify implementation without changing promised result.
5. Compatible route/model switch if authorized and proven inputs/terms/fidelity.
6. Research/needs_user при отсутствии подходящего проверенного маршрута.
Blind identical stochastic retry по умолчанию запрещён для content defect. Exception: documented recoverable transport/service error, or calibrated diversity recipe explicitly approved; unknown submit result никогда не exception. Новые seed/prompt слова сами по себе не root-cause solution. Native provider retry semantics не равны app-level paid retry.

## UX
Card: «В сцене X нарушено Y. Сохранено Z. Исправим A, потому что evidence B. Дополнительная цена/предел D; уже потрачено/pending E». Options:
- Автоматически исправить: конкретный prepared bounded RepairPlan, не blank cheque.
- Отредактировать: scene/ref/intent/duration controls, compare/protected-area warnings, re-estimate then approve.
- Выбрать предложенную compatible альтернативу, если не меняет скрыто договор.
- Остановить / сохранить доступный результат.
Без требования писать промпт; advanced input optional. Approval относится к изменению и одному bounded продолжению. Предложение «точно получится» не используется без доказуемого deterministic contract.

## Stop / in-flight matrix
Unknown paid submit/charge → RECONCILING, new affected submits denied; poll known external job/idempotency lookup/provider support. Если reconciliation невозможно — user report/support, не resubmit.
Budget/cap/stale-unbounded price → pause before new paid work; active jobs drain/cancel по adapter contract, retain liability.
Two unsuccessful content attempts → NEEDS_USER before third; each later requires fresh repair+single-use approval. Completed-but-rejected candidate counts. Verified no-submit transport failures logged separately under finite infra retry cap; charged provider failure counts. Refund не стирает quality attempt.
Safety/privacy/rights/tenant failure/permission revocation → immediate scoped/global kill switch; block publish and secret/data egress; investigate. Cancel where safe, record charged outcome; outputs quarantine pending rights review.
Unsupported required capability or critical QA uncertainty → no delivery/publish, propose compatible route/needs_user. Missing/expired consent stops without retries.
Stale manifest/changed plan → deny queued obsolete work; in-flight remains pinned, never auto-publish its unapproved revision.
User stop/revocation → no new submissions; best-effort cancel, reconcile, retained assets available per rights; no false refund.
Infrastructure crash/duplicate callback → durable resume by IDs; no duplicate external action. Poll/status retry finite backoff; terminal unknown retained, not removed.
No feasible repair/material/quality evidence → partial export labeled if permitted or failure, not forced success.
Whole-system stop if cross-tenant compromise/shared budget ledger corruption/global provider credential incident; isolated content failure need not halt unaffected missions if envelope explicitly permits and shared scopes safe.

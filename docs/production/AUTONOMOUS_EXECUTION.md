# Утверждённый план → делегированное исполнение

## Два режима
Pilot/manual: текущие script/reference/final human gates сохраняются. Delegated: пользователь один раз принимает versioned plan + bounded envelope; разрешённые промежуточные проверки/выпуск исполняются системой. Новый режим не включён amendment и требует readiness evidence + owner capability activation. Generation/export approval и publication permission независимы.

## DelegationEnvelope
id/version/hash; actor/workspace/project; exact plan_version/item refs; accepted template/reference pack/rubric; confirmed facts/source permissions; allowed topics/claims/assets/models/routes/fidelity changes; format/languages/channel; money scopes and per-unit B/R/C, repair classes; max attempts and stop_after_two_unsuccessful=true; QC policy/calibration refs; allowed publish destinations/time windows; expiry/revocation; escalation rules. Consent на голос/лицо не наследуется от plan.
Sample approval alone не разрешает бесконечную серию: variability contract задаёт что можно менять и что защищено. Signature/auth binding обязательны; local browser checkbox B-003 не production delegation.

## State machine
DRAFT → PREFLIGHT → ESTIMATED → AWAITING_APPROVAL → APPROVED → RESERVED → RUNNING → QA → DELIVERABLE → EXPORTED / PUBLISHED.
Branches: REPAIR_DIAGNOSIS → REPAIR_PROPOSED → AUTHORIZED_REPAIR → RUNNING; NEEDS_USER / RECONCILING / PAUSED / FAILED / CANCELLED. State transitions version-checked and durable. QA disagreement/uncertainty не равно pass.
Brief→claims/script→scene/timeline contracts→reference→generation→audio/edit→QA→result каждое с traceability. Required meaning/brand constraints проверяются отдельно от container validity. Timebase и actual audio/clip length authoritative.
В delegated mode recipe gates выполняются только в approved envelope; при изменении protected facts/style/fidelity/price/rights/route — pause/reapprove, не скрытый downgrade. QA-boundary canary может включать human sampling; это измеренное вмешательство.

## Approval binding
Plan/envelope/rubric/model-route policy имеют immutable versions. Edits создают candidate branch и invalidation affected downstream узлов; unaffected accepted assets сохраняются. No silent rolling baseline. Pin submitted jobs to old snapshot; новый план не меняет их inputs. Revoked publication permission блокирует queued upload даже если генерация завершилась.
Plan approval не admin/deploy/new purchase authorization. Effective admission требует всех ancestor scopes; отсутствие positive live cap блокирует side effects.

## Recovery и stop
Не blind third generation: RECOVERY_CONTROLLER.md. После двух content failures pause; каждый последующий bounded attempt требует explicit owner decision и новый repair plan. Более строгие provider/attempt/security limits имеют приоритет. Notification/acknowledgment != approval.
Independent plan items могут продолжаться ТОЛЬКО если stop локальный, общий reserve/cap не повреждён и envelope разрешает continue-unaffected. Budget/security/tenancy/rights incident на shared scope → pause scope. Poll/reconcile не прекращать из-за pause; новые платные diagnostics требуют permission.

## Выход пользователю
Few-click mode: «создать», прозрачная цена+repair reserve, прогресс, результат. Recovery: одна понятная карточка с причиной/сохранённым/изменением/дельтой цены. Manual mode открывает scenes/references/edits; prompt editing не требуется новичку. Экспорт/сохранение всегда доступно для разрешённых retained assets. Marketing может описывать workflow, не скрывать activation/limits.

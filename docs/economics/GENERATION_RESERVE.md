# Generation unit: стоимость и резерв ремонта

## Объект
GenerationUnit = один готовый пользовательский результат (например, ролик), выбранный route (Blender/без него/гибрид) и immutable initial cost contract. Это НЕ один provider call. Shots/render/TTS/LLM QA/repair attempts входят в unit. Новое operation_id, route, prompt, browser retry или localization не обнуляют cumulative spend. По умолчанию localization отдельный явно оценённый unit; dependencies имеют явную allocation, не двойное списание.

## Деньги
B: frozen baseline estimate of accepted initial route; repair_percent r: UI proposed 20%, пользователь явно принимает/изменяет/отключает; R=round_currency(B*r/100); C=B+R. Показывать B, R, C и состав. R — доступный потолок расходов, НЕ обязательная наценка/списание. Only actual billable usage settled. Tokens — честные provider units в деталях, не универсальная валютная мера; time/volume не пользовательский reserve.
Financial accounting DECIMAL/minor units; authoritative currency approved separately (USD display допустим). Rules rounding/taxes/FX/min billable duration/pricing validity + liability headroom до запуска. C ограничен min всех утверждённых ancestor caps. Project/month limits НЕ удаляются per-generation preference: нельзя сложить много легальных units в незаконный aggregate spend.
Для нового действия: projected_total = confirmed + pending_upper_bound + remaining_unsubmitted_initial + proposed_new_repair. Holds показываются отдельно, не складываются дважды. Shared asset charges explicitly allocated once. Reserve atomically all scopes; concurrent attempts не overspend. Actual unknown !=0. Unknown/unbounded price/worst-case → refresh/stop. B=0,R=0: positive action требует explicit paid approval.

## Когда использовать R
Только сохранение исходного accepted contract: technical/content defect, identity/continuity failure, camera/semantic mismatch, targeted artifact repair, verified recoverable provider failure. Diagnostic/model critique/repair compute учитывается и bounded. Complexity/preparation known before approval входит B, не спрятать её в repair. New topic/style/duration/user scope, inflation/current price change, premium creative upgrade — change request, не ремонт.
Pre-approved R разрешает новый repair без money reapproval только при всех constraints и пределах attempt rule. Strict >10% delta по operation/unit/plan остаётся visible; внутри accepted repair headroom это notification, а не повторное money gate. Generic repricing/scope changes за пределами repair classes сохраняют старое reapproval правило.

## Предел
Если proposed liability >C либо любой ancestor cap — не submit. Exactly C разрешено при прочих gates. После двух unsuccessful attempts stop before third даже при остатке R. Более высокий денежный reserve не означает больше разрешённых попыток.
Сверх C/attempt gate нужен RecoveryCase с changed strategy, bounded incremental price/worst case и конкретным attempt scope. Пользователь выбирает auto repair proposal или manual edit→re-estimate, либо stop/export partial. Single-use approval bind unit/revision/repair_plan_hash/next attempt/expiry; повтор callback/click не authorizes another call. Amendments сохраняют B/R/C initial и отдельные новые caps; final сравнивает initial и latest approved, не маскирует перерасход.

## In-flight / invoice
Перед submission проверять authorization/pricing/reservation ещё раз. Неотправленные obsolete jobs отменяются и holds освобождаются. Submitted/running job может уже стоить денег: best-effort cancel только provider-supported и safe; poll/reconcile continue. Cancel acknowledgment !=refund. Pending liability/holds не release по timeout/lease expiry без подтверждения provider settlement. Terminal financial uncertainty quarantined; no new affected paid work.
Unexpected invoice over liability bound: сохранить append-only actual/correction, financial incident, stop affected scope, alert/reconcile; не обещать математически невозможный cap на чужой unilateral charge. Strong caps require prepaid/contractual provider ceilings and verified bounded request. Нельзя скрыть already-billed расходы при cancel/stop.

## Обязательные проверки
B=0; r=0/20/user value; exactly C/C+minor unit; +10%/strictly greater; repair vs scope change; atomic parallel reserve; cumulative retries; unknown delayed invoices; operation ID changes; double-click/replayed approval; FX/rounding; plan/month cap; cancel with/without charge; denied third despite money; final original/amended/actual comparison. Это требования будущей реализации, не ledger implementation.

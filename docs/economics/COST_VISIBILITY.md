# Прозрачная стоимость и превышение >10%

## До платного действия
Manual CTA показывает estimate in USD + user credits (если billing введён), expected range/reserve/max,
line items, pricing version/checked_at/validity, retries policy, taxes/FX/rounding and uncertainty.
Provider units показываются честно: LLM input/output tokens where available; image count, seconds,
characters/minutes, compute/storage as applicable. Credits не называются model tokens; unknown != 0.
UI amounts may be approximate display currency; authoritative ledger currency explicit.
Local transform/text change uses no generation API; server render/export может иметь cost.

## Контент-план / прогресс / итог
Plan approval freezes baseline_estimate version and item breakdown. Reprice at start against current
provider/route/quantity, reserve before submit. Running task/page: spent_confirmed, pending, reserved,
remaining forecast, forecast total vs baseline, item drilldown, reason for revision, stop state.
No double-count: projected total = confirmed spent + pending operations estimate + remaining not-submitted estimate;
reserved displayed separately, not added again. Terminal unknown jobs remain pending/reserved until reconcile.
Final report: original baseline, explicitly approved amendments, latest approved baseline, actual billed,
unconfirmed invoices, per item/attempt/provider/localization, waste and cost per accepted result.
Все попытки/отклонённые outputs учтены; cancellation/undo не обещает refund.

## Threshold policy
Compare both affected operation/item and plan/project envelope with their approved baseline.
If forecast > baseline * 1.10 (strictly more than 10%), before new affected paid submissions:
show old/new amount, absolute delta and %, reason, relevant item and total; approve new estimate or stop/revise.
Manual launch blocks until explicit reapproval; automatic mode pauses new affected paid work unless the
user previously approved a bounded headroom rule. Notification alone не разрешение тратить.
Baseline cannot roll forward silently. Cumulative small rises compare with same approved baseline.
Zero baseline: any positive paid estimate requires approval, no divide-by-zero.
Exactly +10% not threshold alert, but crossing hard cap always blocks. Hard caps apply even below +10%.
Pending job already submitted may incur charge despite pause; disclose and reconcile, no retroactive promise.
Price stale/unknown/unbounded worst case → refresh or ask/deny, not silently assume cheap.

## Message placement
Cost panel at CTA, approved plan summary, task card/progress screen, notifications and final report;
notifications deep-link to relevant version and cost breakdown. Accessible, localized, no banner spam:
dedup by budget/item/approved-version/alert state, acknowledgment not approval.
Example $2.00→$2.26: +$0.26 / 13%, plus reason; never round displayed difference to hide threshold.

## Tests (Q-037/Q-009/Q-014)
+9%, exactly +10%, +10.01%; zero baseline; cumulative increases; headroom present/absent;
FX/rounding; concurrent tasks; job timeout/cancel; late invoice; new route; stale pricing;
unknown token usage; revisions and final actual-vs-original report. Use DECIMAL/minor units.

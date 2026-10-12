# 10. Экономика — резерв, факт, принятый результат

## Раздельные бюджеты
Development (модели для кода/аудита), Production (контент), Infrastructure (compute/storage),
Evaluation (живые тесты). Владелец подтверждает суммы, период, валюту, модель оплаты и резерв.
$200/мес — исторический ориентир v0.2, не принятое ограничение v0.4. Не тратить по умолчанию.

## Формула
Episode cost = все billed generation attempts + images + voice/music + Director/critic + render/compute + storage/transfer.
Cost per accepted episode учитывает rejected episodes, а human review minutes показываются отдельно.
T0/T1 дешевле при готовых шаблонах; T2 требует ассетов/подготовки/compute. Не называть их бесплатными.
Видео тарифицируется по условиям конкретного API: минимальная длительность, rounding, audio/references, tokens.

## Waste и reuse
waste_ratio = generated duration / unique used generated segments; used=0 → undefined/infinite.
Отдельно display reuse duration (одно и то же видео повторилось несколько раз). Полная цена всех попыток сохраняется.
Дорогая модель может давать меньшую цену принятой секунды, но small sample обозначается явно.

## Пример из старой спецификации — не текущий прайс
При её же оценках Short ~$2.7–5.1 и Long ~$16–28:
8 Shorts + 1 Long ~ $38–69; 12 Shorts + 1 Long ~ $48–89.
Это не гарантия работы на $50 и не включает все статьи. Официальные цены проверяются в Q-002.

## Hard budget guard
Transaction: lock scope → check(limit-spent-reserved) → reserve → persist operation/outbox → submit.
Scopes episode/project/month совместно проверяются; цена должна иметь bounded worst-case или headroom.
Reserve settled на invoice/result; неизвестный job остаётся reserved/pending до reconciliation.
Timeout/cancel не подразумевает refund. FX/налоги/rounding и возможные delayed invoices фиксируются.
Повторная правка: новая смета delta и пользовательское подтверждение, если вышла из envelope.
Деньги хранить DECIMAL/minor units, не float для ledger. Immutable correction entries и daily reconciliation.

## Кэш/превью
Prompt cache зависит от TTL и workload. Смена prefix может уменьшить выгоду.
Дешёвый proxy render для монтажа полезен. Перегенерация дешёвой моделью, затем дорогой — может удвоить расходы,
не сохраняет результат и проверяется экспериментом. Preview approval не равно final approval.

## Development
Subscription/API/hybrid — выбор владельца по реальной стоимости принятой задачи, ограничениям и terms.
Никакой «подписки в production вместо API». Token logs доступны не у всех CLI: unknown, не fabricated.
Полный перевод specs на английский — optional optimization после согласования смысла и измерения tokenizer/workload.

## Масштаб
Unit economics и liquidity нужны до внешних тарифов; user credits/hold/refund отдельная задача P6.
Open-weight self-hosting только после сравнения total cost: GPU utilization, VRAM, maintenance, rights, quality.


## Обязательный пользовательский cost contract v0.4
См. docs/economics/COST_VISIBILITY.md: до запуска USD/честные единицы, plan/item breakdown,
reprice/start/progress/final, strict >10% vs approved baseline, zero-baseline и hard-cap правила.
Цифра estimate не гарантия invoice; unconfirmed usage явно pending. Локальные правки не платная генерация.
Baseline хранится неизменным; amendments отдельные подтверждённые версии, исходный план виден в финале.

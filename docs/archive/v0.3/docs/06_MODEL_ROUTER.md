# 06. Router — честная совместимость и измеримая замена

## Адаптер
submit(request, operation_id/idempotency_key?) → job; poll/reconcile(job); cancel if supported;
validateInput; normalizeError; priceEstimate; capability manifest с version, region, limits, provenance.
Contract tests + recorded fixtures + отдельные живые evals. Моки только для механики.
Capabilities детальны: durations, aspect/resolution, reference_images/video, start/end frames,
audio, camera_control:none|prompt|native|reference_control, depth/pose inputs, seeds,
retention, webhook auth, cancellation billing, supported languages, commercial terms.

## Выбор
Сначала hard constraints (входы/согласия/регион/качество/лимиты), затем стоимость принятого результата,
latency и failure. Единицы score нормализованы и веса калиброваны; случайная формула не критерий качества.
Недостаточно данных → documented prior, не fabricated quality_estimate.
Fallback означает функционально приемлемую замену; не переносить API-параметры/промпты вслепую.
Существенное изменение fidelity/cost — спросить человека. Сначала 1 рабочий путь и резерв;
2–3 video adapters только если эксперимент показал пользу.

## Director
Сильная доступная LLM по настройке владельца: точный API ID/права/цена проверены.
Предпочтения GPT Astra/Opus 5.5 не являются техническим dependency name или гарантией качества.
Structured commands → проверка схемы/доступа/версии → orchestrator. Director не хранит ключи и не обходит budget.
Prompt caching — оптимизация при соответствующем TTL/провайдере, не обязательные 70% для каждого канала.
Динамический список навыков компактен. Worker model может быть сильной той же модели, если владелец так выберет;
дешёвые модели только по разрешённой model policy, не скрыто.

## Pricing registry
Verified official URL, verified_at, currency, min duration, rounding, tokens/images/audio fees,
region, model/API version, expiry/recheck, cancellation rules. Estimate отдельно от invoice.
Прямые API предпочтительны при подтверждённой доступности и экономике; агрегатор допустим,
если снижает integration cost/даёт нужный доступ. Direct ≠ всегда cheaper.

## Scout
Сначала отчёт кандидата и ручное approval. Adapter code только ветка/тесты, не auto-production.
Benchmark фиксирован по стилю/задаче, отчёт содержит стоимость попыток, uncertainty и лицензии.
Open-weight и LoRA — условные последующие этапы после проверки hardware/rights/economics.

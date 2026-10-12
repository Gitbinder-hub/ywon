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

## Выбор способа производства и measured effort
Router выбирает допустимый execution route (deterministic 2D / Exact3D / supported model control /
prompt guidance / hybrid), а не только LLM/model ID. Выбор ограничен Scene Compiler capability proof;
cheap route, нарушающий protected assets/fidelity, не fallback. Blender-стадия не гарантирует точный
финал после generative transformation. Учитываются reuse и invalidation footprint.

Стоимость принятого результата включает все billed attempts/repair, LLM planning/tool usage,
asset preparation, local CPU/GPU/render/storage и измеренное человеческое время. Provider money,
local compute и human time показываются раздельно; допущения об amortization/reuse явные, unknown cost
не ноль. BYOK/subscription/local model не доказывают бесплатность полного конвейера. Prices/terms/limits
проверяются отдельно; исследование Mixar не создаёт provider adapter и не подтверждает тариф.

Adaptive reasoning effort/routing — эксперимент в разрешённой model policy, не скрытая смена модели.
Сравнивать quality/critical failures/latency/total accepted-result cost на одинаковых cases и учитывать
routing overhead. Не вводить дешёвый→дорогой каскад или automatic parallelism без evidence. Mixar token
saving claims и demonstrations не заменяют наш benchmark.

## Pricing registry
Verified official URL, verified_at, currency, min duration, rounding, tokens/images/audio fees,
region, model/API version, expiry/recheck, cancellation rules. Estimate отдельно от invoice.
Прямые API предпочтительны при подтверждённой доступности и экономике; агрегатор допустим,
если снижает integration cost/даёт нужный доступ. Direct ≠ всегда cheaper.

## Scout
Сначала отчёт кандидата и ручное approval. Adapter code только ветка/тесты, не auto-production.
Benchmark фиксирован по стилю/задаче, отчёт содержит стоимость попыток, uncertainty и лицензии.
Open-weight и LoRA — условные последующие этапы после проверки hardware/rights/economics.

## Wiring и live (P6, 16:00 live PASS — основные)
- `router:routeViaSwitch` + `cost-visibility` strict `>10%` (`forecast*10 > baseline*11`, zero baseline любой positive → approval) → `keep_primary | fallback:<reason> + allow`.
- `model-switch/radar-live.ts` 6ч `healthProbeGemini("gemini-3.5-flash-lite") healthy` `RADAR_INTERVAL_MS=6h` → `apps/api/radar-cron.ts` `startRadarCron` (only `GEMINI_API_KEY` + `!Ywoom_OFFLINE`, `TG` при `degraded/down`).
- `freelancer-worker/cron.ts` `tickFreelancer(query)` `>10%` gate + `TG` → `apps/api/freelancer-cron.ts` 60с `GET /projects/active?query=video|AI` (only `FREELANCER_ACCESS_TOKEN`, `POST /bids/` только после `approveDraft`), `7000 INR OK` `40760022` (`496380786`).
- `exchange-sandbox/kwork-live.ts` `kwork.com` (`kwork.ru` паспорт/ИП) `isolatedCookies:true` `socks5://` при `403` `browser/t4`.
- `tauri-wrapper` Q-046 `1 .exe` тихий preflight без `CLEAN_API_KEY` (Rust/WebView2, `cargo tauri build` отдельно).
- `apps/api` `db.ts + s3.ts` (`pg` + `@aws-sdk/client-s3` lazy, только `env`) `server.ts /api/health live_wired/dry_run` + `/api/health/live DB 33/S3` (`isAllowedPreviewRequest` `127.0.0.1` intact) `offline.ts .Ywoom-offline/` сохранён.
- Health `16:00` `DB 33/S3/Telegram @ywon_bot/Gemini 50/Freelancer 82806433 PASS` `Gemini healthy` `39/39 PASS` `validate PASS` — только основные проверки (`health + 39 + validate`), далее по `продолжай`.

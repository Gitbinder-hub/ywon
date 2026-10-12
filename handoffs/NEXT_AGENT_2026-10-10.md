# Передача следующему агенту — строго по спеке (2026-10-10)

## 1. Где мы находимся

* **Репо:** `E:\Загрузки Браузера\Qwoom-bootstrap-spec-v04-foundation (3)\Qwoom-bootstrap-spec-v04-foundation`
* **Spec:** `0.4.0`, `AGENTS.md` + `CLAUDE.md` идентичны. `Source of truth: tasks/project.json`, дополнения в `tasks/architect_acceptance_overlay.json`. `tasks/BACKLOG.md` и `docs/STATE.md` — генерируются `scripts/project.py render`, руками не трогать.
* **Текущая фаза:** `P6` (`docs/STATE.md` генерируется, `Current phase: P6`, `DONE: 47`, `TODO: 3`). Последний `validate` — `PASS: spec/task/handoff/archive consistency. Product/media NOT tested.` — это expected для offline прототипа.
* **Что DONE как offline prototype (paid 0, моки):** `Q-001..Q-010G (P0/P1)`, `Q-011..Q-015G (P2)`, `Q-016..Q-020G (P3/P4)`, `Q-025..Q-030G (P5)`, `Q-031..Q-049G (P6)`. `Q-026..Q-029` — stub-моки c честными ограничениями (no fake orbit/testimonial).
* **Что реально оживлено (живые ключи в `.env` — не коммитить, не логировать):**
  * `CLEAN_API_KEY=cc_Z69... + BASE_URL=https://cleanapis.com/v1` (primary Opus 5.5, 100M за 5.75$)
  * `GEMINI_API_KEY=AQ.Ab8...` (P0 путь), `FAL_KEY` (пустой баланс), `Ywoom_SESSION_SECRET`, `PORT=3000`
  * `DATABASE_URL=postgresql://postgres.rql...pooler.supabase.com:6543/postgres` (Postgres 17.11, 27 tables, `001-004+006` применены; `005_editable_documents` падает на `CHECK (SELECT...)` — Postgres не любит подзапрос в CHECK, fix отложен)
  * `S3_* + S3_BUCKET=ywon-bucket + R2 endpoint 01e8...` — `put/get/delete healthcheck/live.txt OK`
  * `TELEGRAM_BOT_TOKEN=8561509666:AAH... + TELEGRAM_CHAT_ID=8363280584` — `getMe @ywon_bot OK + sendMessage id=2/3 OK` (важно: отправлять с `charset=utf-8`, иначе `?????`)
  * `FREELANCER: App 9ff8db7c... Ywon + Access Token NtXonCg3...` — `GET /users/0.1/self 200 Dartanyanpro 82806433` OK, `bids:[]`, `projects/active` OK. `Edit profile` дополнен 6 скиллами (`Video Services` etc) + `headline/summary` → `POST /bids/ 40760022 7000 INR id 496380786 success`. воркер `packages/freelancer-worker` (watch→draft→approve→place) работает через `freelancer-oauth-v1` header.
  * `KWORK: login Jekonor / pwd p6YVHiCY3_mEWnM` — акк на `kwork.com` (международный). `kwork.ru` требует паспорт/ИП (блок на `kwork.ru/seller`), поэтому песочница на `kwork.com`. `kwork-api` установлен (`npm install kwork-api`), но прямой логин виснет без прокси (нужен `socks5://` при 403). Пока `browser + ручная капча` путь, песочница `packages/exchange-sandbox` (`sess-ab6e4fff ws-personal isolatedCookies:true`, `startCoReg pending → approveCoReg → canAutonomouslyExecute`).
* **Что почистили только что:** 40+ файлов в корне `fix_*/diag_*/dump_*/probe_*/writer_*/build_007*/kwork_*/freelancer_*` + папки `Qvuna/`, `Qvuna-Companion-Pilot*/` + `outputs/companion-asr-archive-smoke (209MB)` + `companion-windows-asr-2026-10-05 (155MB)`. Оставили: `handoffs/*.json`, `reports/*.md`, `tasks/project.json`, `.env`, `docs/`, `infra/migrations/`, `tests/`, `outputs/companion-windows-webview-2026-10-06` (инсталлятор `Qvuna-Companion-Setup-0.0.8.exe`), `google-p0-002` etc. Не трогать историю/логи.

## 2. Архитектура свитча (приоритет владельца — экономика)

* **ADR 0009** `docs/adr/0009-model-switch-token-radar.md` — `packages/model-switch` (registry + radar 6ч + router cheapest healthy + fidelity guard + fallback строгий `>10%` (`forecast*10 > baseline*11`, zero baseline требует approve) + whitelist `tron-usdt/metamask` + local agent + маркетинг-дельта)
* **ADR 0010** `docs/adr/0010-exchange-sandbox.md` — `packages/exchange-sandbox` (ExchangeRegistry + isolated SandboxSession per `ws` + CoRegFlow + WalletGate + payout `crypto|card|both`)
* **Проводка:** `packages/router/src/index.ts` (`routeViaSwitch`) → `model-switch` + `cost-visibility.ts`. `packages/telegram-relay` (`вкл/выкл`, whitelist `status/pause/resume/switch_model/budget/logs`, `localFallbackExplain`).
* **Установка для чайников:** `Q-046 wrapper` → 1 `.exe` тихий preflight, доустановка по уведомлению, без Pro. Ключи **не вшивать в exe** — юзер пополняет баланс → кредиты, `CLEAN_API_KEY` живет на сервере (`apps/api → model-switch`).

## 3. Что видит владелец на Windows (и почему это еще пилот)

Установлен `Qvuna-Companion-Setup-0.0.8.exe` → трей `QvunaTray.exe` → `http://127.0.0.1:64867` → `WebView2`. Это `mode: local_audio_pilot` (`productionReady:false, modelConnected:false`), а не Studio. `{"mode":"local_audio_pilot","url":"http://127.0.0.1:64839"...}` — порт еще стартует 2 сек. Нормальное окно — это `Tauri wrapper` поверх `apps/web` + `apps/api` (Fastify/Next/pg-boss), его еще нет. Веб для регистрации/пополнения/завода требует домен (`https://ywon.ai` или `vercel.app`), пока `localhost:3000` + `Supabase pooler`.

## 4. С чего продолжать — СТРОГО ПО СПЕКЕ

Не придумывать новые фичи вне `tasks/project.json` + overlay. Единственный источник задач — `project.py`.

```bash
python -I scripts/project.py validate
python -I scripts/project.py render   # после правок project.json
node --test tests/budget-reserve.test.ts tests/workflow-durable.test.ts ... tests/model-switch.test.ts tests/router-wiring.test.ts tests/telegram-relay.test.ts tests/exchange-sandbox.test.ts tests/freelancer-worker.test.ts
```

**Ближайшие обязательные шаги по спеке (live, с approved budget):**
1. Починить `infra/migrations/005_editable_documents.sql` — убрать `CHECK (SELECT ...)` (020-021 строка) → заменить на триггер/FK, прогнать `apply_migrations2.py`.
2. `apps/api` → подключить `DATABASE_URL` + `S3` + `Ywoom_SESSION_SECRET` по-настоящему (сейчас in-memory fallback).
3. Дособрать `Tauri wrapper` для `apps/web` (окно без `127.0.0.1` в адресе, меню Архитектора/Завод/Биржи/Баланс) — `Q-046` полноценно.
4. `packages/model-switch` live: `radar cron 6ч` с живыми прайсами + `health probe` (реальный `costPer1kMinor` вместо stub `5 vs 15`).
5. `Kwork.com` браузер-песочница на постоянку: `gui_repl` сейчас нестабилен после `reset` (`no tab open`), держать сессию `browser/t4` живой, пройти капчу 1 раз, `approveCoReg('kwork.com','ws-personal')`.
6. `Freelancer worker` cron: `GET /projects/active?query=video|AI` → `prepareDraft` → `TG notify` → `approve → POST /bids/` (как в `freelancer_place_bid3.mjs` 7000 INR работал).

**Запреты:** не хардкодить `python3` (Windows `python`), не вшивать секреты в `packages/*`, не bypass `DelegationEnvelope`/`BudgetLedger`/`PLATFORM_SHELL`. Все новые инструменты — через `ALLOWED_TOOLS` whitelist + `needs_user` → 1 клик.

## 5. Контакты/идентификаторы

* Владелец: Олег, `.env` уже с `KWORK_LOGIN=Jekonor`, `FREELANCER_CLIENT_ID=9ff8db7c...`, `S3_ACCOUNT_ID=01e8093...`
* Freelancer project тестовый: `40760022`, bid `496380786` (7000 INR, уже стоит, не удалять).
* `Ywon` — каноническое имя (`docs/governance/BRAND_NAME.md`), алиасы `JEWEL/Qevunara` совместимы.

— Конец передачи —

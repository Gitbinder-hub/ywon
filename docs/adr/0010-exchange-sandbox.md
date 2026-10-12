# ADR 0010 — Песочница бирж на ПК (исполнитель на диджитал-биржах)

Дата: 2026-10-09, Owner: Oleg, Status: Decided (P6+ offline prototype)

## Контекст
Нужен тип-исполнитель, который уже зарабатывает на диджитал-биржах и за эти деньги доделывается. Требования: песочница на ПК, браузеры+ПК у владельца, подбор+рега в сервисах вместе с владельцем, дальше только автономные биржи (минимум участия). БД free (SQLite), платные подключения только мелкие/фри, облака только фри/мин. Связь ТГ вкл/выкл + управление. Бюджет архитектора: крипто-кошелек по `DelegationEnvelope` + `purpose/budgetMinor`, выплаты на кошелек где можно, где только карта — `needs_user`. Коллаборации: кошельки/вирт.карты/eSIM — только из белых списков, новые инструменты — code-enforced `needs_user` + 1-клик approve. Установка 1 .exe для чайников (тихий preflight). Движок свитча + радар — уже ADR 0009.

## Решение
Пакет `packages/exchange-sandbox` — один заменяемый модуль поверх `model-switch` + `platform-shell` + `telegram-relay` + `budget`:

* `ExchangeRegistry` — `id/url/kind: api|browser/payout: crypto|card|both/automation: full|co_reg|manual/tos/health/whitelist + officialSource/checkedAt`. Только whitelisted биржи авто; остальные — `needs_user` approve.
* `SandboxSession` — изолированный браузер-контекст на workspace: `sessionId/workspaceId/exchangeId/isolatedCookies=true/status: idle|running|paused|needs_user`, без шаринга cookies/tenant данных.
* `CoRegFlow` — `startCoReg(exchangeId, ws, owner)` → `pending` → `approveCoReg` (owner click) → `approved`; до approve автономка запрещена, только подбор/рега вместе.
* `WalletGate` — `canCreateWallet(allowedTools, delegation)` + `requestWallet(purpose, amount, delegation)` — только из `ALLOWED_TOOLS` (`tron-usdt/metamask/kwork-api/fl-api/virtual-card/esim`), требует `DelegationEnvelope(allow_wallet_create+business:write+budgetMinor+purpose)`.
* `JobExecutor` (stub) — `canAutonomouslyExecute` проверяет `automation+coReg+payout`; перед paid действием `needsFallback(>10%)` + `BudgetLedger reserve`; при `offline/429/no_tokens` — `localAgentExplain` + ТГ notify, задача доводится локально до `export parity` и фиксируется.
* БД — локальный SQLite journal (`packages/companion` стиль) + `workspaces/{ws}/...` object keys, не общий бакет. Инструкции по аккаунтам — `setupInstructions(exchangeId)` (ручная вставка API key → `approved`), позже — авто-подтверждение.

## Инварианты
* Один `BudgetLedger` + `cost-visibility` (>10% strict) — truth для денег; `PLATFORM_SHELL` `purpose/retention` и `FOUR_ROLES` dispatcher — policy/budget gates (code-enforced, не LLM).
* `CapabilityManifest` lifecycle + `DESKTOP_COMPANION` (1 core, Windows 10/11 first) — браузер адаптер на ПК, outbound polling, no inbound port.
* ТГ `allowedCommands` whitelist, `botTokenRef` не в git, `localFallbackExplain`.

## Последствия
Зависит от `model-switch` (цены/health), `platform-shell` (tenant/delegation), `telegram-relay`, `budget`. Маркетинг-дельта из радара не трогает песочницу напрямую. Live браузер/Playwright/captcha/eSIM — отдельный P6 live task с approved budget.

## Альтернативы
Готовый бот для бирж (риск бана по TOS) — отвергнут, только co_reg + whitelist.

## Статус
Offline prototype: `packages/exchange-sandbox` + `tests/exchange-sandbox.test.ts` (3/3 + 157→160 PASS, paid 0). Live адаптеры — следующий P6 task.

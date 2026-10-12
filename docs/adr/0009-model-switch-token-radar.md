# ADR 0009 — Model Switch + Token-Radar (заменяемый модуль)

Дата: 2026-10-09, Owner: Oleg, Status: Decided (P6+ offline prototype)

## Контекст
Текущий стек: Opus 5.5 через CleanAPI (5.75$ за 100M токенов) как primary — выгодно, но перепродажа с риском бана/подорожания. Автономная мастерская контента и будущий исполнитель на биржах тратят токены на каждом действии. Рынок: OpenRouter/Portkey/LiteLLM — роутер для dev, без Token-Radar -> маркетинг-акции, без whitelist/локального агента, без порога 10% + ТГ-человечности вместо 503.

## Решение
Вынести всю кухню в один быстро-заменяемый пакет `packages/model-switch` (one codebase, versioned registry, no per-user model switch):

* `provider-registry` — id/version/officialSource/checkedAt/pricing/capability/health/status, pricingVersion. Verified source = official docs URL + checkedAt, не маркетинг.
* `radar-fetcher` — крон 6ч: агрегаторы + новости + офиц прайсы -> pricing registry. До cron — ручная `radar.list` + инструкция по созданию аккаунтов/API-ключей.
* `router` — `routeSkill(fidelity, cost)` = cheapest healthy + fidelity guard (`2d != orbit`, `exact_3d` только с geometry/verified provider). Отдельные `fixture` vs `live`.
* `fallback` — порог `strict >10%` (`forecast*10 > baseline*11`, ровно +10% не триггерит, zero baseline любой positive требует approval — из `cost-visibility.ts`). Цепочка: cheapest healthy official -> резервный aggregator (CleanAPI) -> пауза + ТГ уведомление "когда наладится" + reconcile при коннекте. `ack != approval`.
* `local-agent` — лёгкая локалка (7B quant) при offline/429/0 токенов: доводит `editable-document` до `export parity` на `r1`, фиксирует `DecisionRecord`, шлёт ТГ инструкцию "1 клик: пополни CleanAPI или переключи на off".
* Whitelist инструментов/кошельков: `allowedTools` (`tron-usdt`, `metamask`, биржи с API). Самовольная рега вне whitelist запрещена, новые инструменты — code-enforced `needs_user` + ручное `approve` в 1 клик запускает бюджет+запуск автономно. Кошелек создаётся только с `DelegationEnvelope(allow_wallet_create + budgetMinor + purpose)`.
* Под капотом, не выбор юзера. UI — `посмотреть/вмешаться` в каждую деталь + `попросить другую модель на раз/на постоянку` (сохраняет `DelegationEnvelope`).

## Инварианты
* Один `BudgetLedger` + `cost-visibility` порог — источник truth для money. Бюджет/политика меняет только code, не LLM prose.
* `CapabilityManifest` lifecycle (`candidate->verified->approved->revoked`) + `evidence.expiresAt` — единый с `packages/architect/registry.ts`.
* `PLATFORM_SHELL` isolation + `FOUR_ROLES` dispatcher — whitelist/policy gates.
* PWA/.exe install — `Q-046 wrapper` (тихий preflight, доустановка по уведомлению, без Pro-режима).

## Последствия
* Зависит от `packages/budget`, `packages/platform-shell`, `packages/skill-runtime`.
* Marketing-агенты читают `radar.deltaCost -> proposal` (как `Q-020 experiments` preregistered).
* Future: `radar` cron + `ImprovementPackage` -> destination review/canary (как `EVOLUTION_AND_LAB`).

## Альтернативы
Купить готовый роутер — потеря маржи и оффера "универсальный коннектор выгоднее никто не предложит". Отвергнуто.

## Статус внедрения
Offline prototype: `packages/model-switch` + `tests/model-switch.test.ts` (109/109 -> 112/112 PASS, paid 0). Live fetch/cron/ТГ — следующий P6 task с approved budget.

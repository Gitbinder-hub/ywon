# Автономная мастерская как модуль будущей верхней оболочки

Принято продуктовое направление: Ywoom позже доступен как Автономная мастерская — раздел персонального ассистента JEWEL.
«Личный бог» — метафора владельца, не обещание всеведения/безошибочности/полной автономности.
P1 Q-044 определяет границы, не строит future Personal/Business/Physical modules.

## Контракт
Автономная мастерская (Factory) exposes typed project/brief/plan/result/cost/review commands and job/result deep links.
Shared identity design и versioned module contract; workspace membership и per-module scopes независимы.
Shell может показать статус/попросить создать контент только с delegated capability и tenant context.
Нет global admin token, общего неограниченного memory bucket или обхода budget/consent.
Cross-module personal data transfer требует явного permission/purpose/retention; approvals scoped/versioned.
Stable job IDs/links, UI route/module registry, shared design tokens, locale/user settings where authorized.

## Изоляция
Сбой оболочки не отменяет доступ к экспорту/ревью мастерской; boundary permissions tested.
Personal facts != confirmed creator facts; explicit user-confirmed import and origin.
Four production roles управляют ответственностью мастерской, не получают доступ к личной жизни из-за нового UI.
Текущий модульный монолит достаточен; микросервисы не вводить ради метафоры «департаментов».

## Future activation
F52 — explicit shell contract in v0.4; F41 future modules remains optional.
Реализация полноценной Personal shell требует отдельного owner scope/budget/security/economics gate.

## Desktop extension A-20261005
Detachable Desktop Companion is an execution adapter, not complete Personal shell and not replacement for official API publishing. Pairing/revocation, Windows10/11 then Linux/macOS, optional scoped settings/skills export, independent Factory operations: docs/architecture/DESKTOP_COMPANION.md. Single-core boundary ADR0006; transition owners in docs/governance/IMPLEMENTATION_TRANSITIONS.md. Multiaccount/social API activation and cross-module data consents stay separate.

# 11. Дорожная карта v0.3 — гейты вместо обещанных недель

Полный scope: docs/17_MASTER_PLAN.md. Задачи/зависимости/статусы: tasks/project.json.
План рассчитан на агента-разработчика и владельца, который проверяет смысл и результаты.
Календарь оценивается после P0; бюджет и SLA до доказательств не обещаются.

| Этап | Результат | Гейт |
|---|---|---|
| P0 Evidence | реальный CLI explainer + повторы + cost/quality report | владелец принимает полезность и экономику или rework/pivot |
| P1 Foundation | contracts/data/auth/isolation/workflows/reservations/storage | failure/recovery/security tests и owner review |
| P2 First Product | онбординг → Bible → script → generation → review → export | пользовательский pilot без owner bypass; export независимо от API-аудита |
| P3 Repeatability | серия реальных запусков + 5 внешних пользователей | отчёт человеческого времени/качества/стоимости; решение expand/rework |
| P4 Learning | imports/Golden Library/experiments suggestions | data correctness, uncertainty, no unsupervised strategy mutation |
| P5 Studio Expansion | выбранные ветки Studio, raw editing, Long, localization | отдельный реальный benchmark и unit economics каждой ветки |
| P6 Safe Scale | ops quotas/billing/support/marketplace readiness | нагрузочные/security/restore tests, права, runway и market demand |

## Порядок P0
Q-001 owner acceptance/budget → Q-002 verified providers/rights → Q-003 measured evaluation design →
Q-004 real spike → Q-005 repeated eval → Q-005G owner decision.
Фундамент P1 не строится до принятого P0; допустимо явно принятое изменение плана в ADR.

## Гейты P1–P6
Каждый gate — отдельная owner task. REVIEW implementation не открывает dependent task.
Гейт может принять ограниченный scope с документированными residual risks либо вернуть rework.
Новый scope получает task и feature linkage; future feature не реализуется по одному красивому README.

## Прежние M0–M6
В архиве сохранены. Не считать их выполненными или одновременно действующим календарём.
Вместо 6 недель на foundation/mock-first — ранняя проверка реальных видео до широкого scaffold.
Не гарантировать 20 эпизодов/эксперимент на малой выборке к конкретной неделе.

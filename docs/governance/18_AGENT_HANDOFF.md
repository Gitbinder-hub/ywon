# 18. Передача проекта — любой агент продолжает без угадывания

## Истина хранится в git, не в чате
`tasks/project.json` — статусы/владение/приёмка/history. `tasks/features.json` — полная цель.
`docs/STATE.md` и `tasks/BACKLOG.md` генерируются. Handoffs — предметные доказательства и продолжение.
Нельзя полагаться на память конкретной модели или hidden IDE context.

## Старт новой сессии
validate → status → next → task context → last handoff → git status/diff и реальные файлы.
Проверить branch/commit и dirty worktree; не стирать изменения. Лимиты/доступ/ключи подтверждаются отдельно.
Если DOING занят — владелец разрешает resume; сохраните reason и previous agent в истории.
Если REVIEW — новый агент может аудитировать, не начинать dependencies как будто задача DONE.

## Отчёт задачи
Копировать handoffs/TEMPLATE.json; записать task_id/agent/session/branch/base_commit/work_commit,
summary/changed_files, evidence (command, exit_code, result, artifact), ac_results,
not_done, risks, blockers, next_steps, recommended_next_tasks, required_owner_checks, costs.
Каждый AC с result pass/fail/not_run/not_applicable и evidence/reason. Not-applicable обосновать.
Отсутствующие доказательства видны; submit разрешает REVIEW с gaps, accept блокирует fail/not_run.
Метаданные commit до создания final commit могут быть 'pending'; acceptance owner проверяет реальный commit.
Не встраивать ключи, приватные raw data, огромные логи и платные output files в git.
Evidence media хранится по разрешённому asset URI/hash + report, не секретным signed URL с токеном.

## Прерывание
Перед выходом — checkpoint handoff (не submit) и список точных следующих действий.
Статус остаётся DOING/BLOCKED, progress notes отражают незавершённость. Коммит checkpoint если доступен.
Модель не должна помечать DONE ради передачи. Если abrupt interruption — следующий агент изучает diff,
владелец разрешает resume, состояние восстанавливается по evidence, не по предположению.

## Команды
start; checkpoint; block; resume --owner-confirmed; submit; reject --owner-confirmed;
accept --owner-confirmed; render; validate; status; next.
Owner flag — auditable declaration, не техническая идентификация. Команду accept выполняет владелец,
или reviewer с явной делегацией; git branch protection — реальная внешняя защита.
Скрипт не запускает модели/платные API/коммиты/deploy. Future autonomous runner отдельная задача.

## Параллелизм
Одна задача — один активный владелец. Разные worktrees с разными задачами; merge canonical state
серийно через reviewer, не blindly overwrite JSON. Start проверяет локальное состояние, не распределённый lock.
Будущая команда может добавить remote coordinator; сейчас git review предотвращает конфликт передачи.

## Приёмка
1. Чистый validate и тесты пакета. 2. Inspect code/diff. 3. Re-run существенные проверки.
4. Проверить AC/evidence/cost/security и вручную открыть media, если task требует.
5. owner accept или reject с reason. 6. Re-render/validate и commit acceptance state.
Next task появляется готовой лишь после DONE всех dependencies.

## A-20261005 prototype obligations
Read companion amendment + applicable transition anchors + task overlay. Each temporary path handoff records actual source/commit, verified limitation, target task or decomposition pending, migration/rollback, test evidence and concrete continuation. Canonical map: docs/governance/IMPLEMENTATION_TRANSITIONS.md; no duplicate status registry. OS PASS names exact build/architecture, Windows10 and11 separate. Public release, paid budget, deployment, scope/rights activation never inherited from docs-only acceptance. Latest source/runtime evidence comes from bootstrap/STATUS.md + referenced handoff + code, not stale entrypoint summary. Core contracts changed serially through review; parallel adapter branches must pin compatible versions.

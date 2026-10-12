# 22. Перенос v0.2/v0.3 → v0.4 и работа в IDE

## Если только спецификации
Сделать backup/ветку; распаковать новый пакет в корень; просмотреть diff; commit.
Историческая v0.2 находится docs/archive/v0.2. Там T-000…018 остаются историческими, не выполняются.
Активные Q-IDs новые, не смешивать статусы двух планов. Q-001 — первое решение владельца.

## Если агент уже написал код по v0.2
Не перезаписывать код. Inventory: commits/modules/tests/real outputs/costs/known bugs.
Создать migration task, связать старые T IDs с новыми Q IDs, выполнить gap audit против v0.4.
Не переносить DONE без evidence и owner acceptance. Схему/данные менять только безопасными миграциями.
Обновить branch rules/секреты/защищённые paths после audit, не слепо удалять.

## Prompt для первого агента
«Прочитай AGENTS.md. Выполни validate/status/next. Покажи готовую задачу и её AC.
Не запускай платные API и не меняй scope без разрешения. Продолжи выбранную и разрешённую задачу,
в конце обнови реестр и структурированный handoff; сдача REVIEW, приёмку делаю я».
Для остановленной сессии — prompts/resume.md, для audit — prompts/auditor.md.

## Что остаётся после каждого агента
Commit/diff; task state и history; STATE/BACKLOG; handoff с evidence и next actions;
feature links; costs/risks/not_run; отдельно decision владельца. Следующий агент читает это, не старый чат.
Приёмка: inspect/re-run/open media → accept/reject → validate/render → commit.
Без push/git доступа файлы сохраняются локально, передача удалённому агенту требует явной отправки.

## Что не автоматизировано
Запуск следующего агента, remote lock, идентификация owner, GitHub approvals, API keys, платные запросы,
продуктовый CI и deploy. Скрипт упрощает процесс, не создаёт полномочия.


## v0.3 → v0.4
Backup/branch; compare docs/CHANGE_IMPACT_v0.4.md. Product files never overwritten blindly.
Department docs are canonical; old docs/01…22 paths redirect. Read docs/INDEX.md; task context paths updated.
No DONE inferred. New Q-036…049G and F42…52 added; phase dependencies/gates expanded.
Historical v0.3 exact nonrecursive snapshot + hash manifest; v0.2 remains untouched.
Run make spec-check, inspect rendered STATE/FEATURE_STATUS/BACKLOG, read handoffs/RELEASE_v0.4.md.
Acceptance for spec upgrade separate from spending/gates; decide Q-001 actual limits/languages before paid APIs.

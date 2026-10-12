# 22. Перенос v0.2 → v0.3 и работа в IDE

## Если только спецификации
Сделать backup/ветку; распаковать новый пакет в корень; просмотреть diff; commit.
Историческая v0.2 находится docs/archive/v0.2. Там T-000…018 остаются историческими, не выполняются.
Активные Q-IDs новые, не смешивать статусы двух планов. Q-001 — первое решение владельца.

## Если агент уже написал код по v0.2
Не перезаписывать код. Inventory: commits/modules/tests/real outputs/costs/known bugs.
Создать migration task, связать старые T IDs с новыми Q IDs, выполнить gap audit против v0.3.
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

# Spec Pack v0.3 — проверка выпуска

Дата: 01.10.2026.

## Фактически выполнено
- Переработаны активные спецификации 01–16; добавлены master plan/handoff/eval/security/review/upgrade.
- Полная цель сохранена: 41 feature, 36 task entries с зависимостями/AC/owner gates.
- Все 27 исходных файлов v0.2 сохранены побайтно и проверяются SHA-256.
- Созданы локальные offline scripts/project.py, генерируемые STATE/BACKLOG/FEATURE_STATUS, шаблон handoff.
- Правила AGENTS/CLAUDE совпадают; добавлен Cursor rule и model-independent prompts.

## Проверки
1. `python3 scripts/project.py validate` — PASS.
2. `python3 -m unittest discover -s tests_spec -v` — 31 tests, OK.
3. `python3 scripts/project.py next` — только Q-001, owner decision; product tasks не запущены.
4. Исторический архив: совпадение всех source files SHA-256.
5. В доставку не включены __pycache__, временные файлы и секреты.

Полный локальный test output: reports/SPEC_TEST_OUTPUT.txt.

## Что тесты действительно проверяют
Dependencies/current phase, task statuses, owner-declaration requirement, REVIEW != DONE,
AC evidence references, missing/not_run results, blockers, checkpoint/resume/reject,
accepted-handoff hash, stale generated views, task/feature links, original archive integrity.
Отрицательный тест печатает expected ERROR про Q-002 not ready: это успешная проверка блокировки.

## НЕ проверено / НЕ реализовано
Реальное приложение, API-ключи, реальные генерации и цены, качество медиа, публикация,
изоляция будущего приложения, платёжная система, настоящая идентификация owner, remote locks,
запуск агентов друг за другом, production deployment, работа GitHub Actions на удалённом репозитории.
Флаг --owner-confirmed — заявление вызывающего, не security boundary.

## Передача
Git commit/push не выполнялись: результат подготовлен как архив для владельца.
Начальный product state: not_started; все tasks TODO, будущие ветки disabled до выбора.
Следующий шаг: owner Q-001 (scope/budgets/languages/rights), затем Q-002 verified-provider research.

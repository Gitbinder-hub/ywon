# Быстрый запуск для владельца
1. Сохрани исходный репозиторий/сделай ветку. Скопируй содержимое Ywoom-spec-v0.3 в корень.
2. Запусти `python3 scripts/project.py validate` и `python3 scripts/project.py next`.
3. Открой docs/14_OPEN_DECISIONS.md и reports/P0_APPROVAL_TEMPLATE.md. Прими scope/лимиты
   или обсуди с агентом; не выдавай ключи в чат. Заполни reports/P0_APPROVAL.md.
4. После реального решения владелец ставит APPROVED: YES и выполняет owner gate команду из шаблона.
5. Открой Cursor/Claude Code/другую среду и дай prompts/start.md с AGENTS.md.
6. Агент выбирает готовую Q-002, делает исследование, сдаёт REVIEW. Ты проверяешь и принимаешь/возвращаешь.
7. После каждого агента commit включает registry/STATE/BACKLOG/handoff/test evidence. Следующая среда
   читает эти файлы. Ты не обязан помнить весь прошлый чат.

Важно: готовность spec-tooling не означает готовность приложения. Расходы/публикация не разрешены автоматически.
Будущий scope открывается в docs/17_MASTER_PLAN.md / docs/FEATURE_STATUS.md.

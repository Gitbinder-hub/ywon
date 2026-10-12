# 09. JEWEL — управление производством и развитием

## Production
Durable orchestrator, типизированные команды, budget reserve, approval, journal и reports.
Роли Writer/Director/DOP/Sound/Editor/QA — конфиги, не обязательно отдельные агенты на каждый шот.
Сильная модель выбирается владельцем; дробление ролей должно улучшать качество, а не размножать вызовы.
Production tools строго allowlisted, без исходных ключей/системного shell/git/deploy по умолчанию.

## Dev Stack
Architect → Implementer → Test Writer → independent Auditor → owner acceptance.
Модели сменяемы, обязанности и состояние в git. Auditor получает требования/diff/evidence и читает
относящийся код, когда diff недостаточен. Формальная «другая модель» не заменяет security review.
Экономия контекста не оправдание не читать критическую интеграцию.

## Автономность по действию
L0 observe; L1 propose; L2 execute approved plan within bounds; L3 adjust/publish under approved policies;
L4 portfolio allocation under separately approved envelopes. На P0–P3 публикация только human-approved.
Любой запуск paid API — заранее разрешённый расход в лимите; внешние новые платежи/лимиты отдельно.
Face/voice clone, permissions, destructive changes, production deployment, policy expansion требуют явного решения.

## Handoff разработчиков
Файлы и project.py обеспечивают продолжение в другой среде, не запускают следующую модель автоматически.
Один task owner; resume после interruption; REVIEW не открывает зависимости; DONE после owner acceptance.
Будущий agent runner — отдельная feature JEWEL Ops с leases, sandbox, approval и расходами.

## Эволюция
P1: runtime dispatcher. P4: suggestions об улучшениях. P5/P6: staging branches + tests + owner review.
Autofix production запрещён до отдельного safety gate. Внутренний агент не может менять свой budget/policy/CI tests.
Дальние Business/Capital/Personal/Physical модули сохранены как optional exploration, не обещанный релиз.

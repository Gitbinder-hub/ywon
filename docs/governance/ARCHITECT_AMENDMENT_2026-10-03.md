# Ywoom / Qevunara — Architect Foundation amendment A-20261003

Дата: 2026-10-03, Asia/Bangkok. Основание: владелец поручил обновить спецификации после архитектурного разбора и уточнил денежный резерв, автоматический/ручной recovery и делегировал выбор стоп-правил. Это принятые требования к будущей реализации, НЕ приёмка реализации, Q-001, paid budget, deploy, публикации или main merge. Base spec_version остаётся 0.4.0: amendment не выдаётся за новый сертифицированный shipping release.

## Приоритет и точные изменения
Явные полномочия владельца и ограничения безопасности выше спецификации. Эта amendment и её предметные документы ниже заменяют только перечисленные старые положения; остальной v0.4 scope, P0→P6, client/locale/public-release gates и история сохраняются.
1. Каноническое имя управляющего ядра: Qevunara / Кевунара. JEWEL — deprecated historical alias, не второе ядро. Ywoom — имя Factory; Qvum не утверждено как rename Factory. Старые пути/IDs/исторические цитаты оставлены совместимыми, название каталога не означает старый бренд. BRAND_NAME.md фиксирует слабую предварительную проверку, не юридическую свободу.
2. Верхний runtime Architect — управляющий слой над существующими Strategist/Producer/Quality/Guardian. Future shell не блокирует его bounded Factory implementation; Personal/Business/Capital/Physical остаются будущими модулями.
3. Pilot manual review сохраняется. Делегированное исполнение после plan approval — отдельный целевой режим с явным capability/evidence/policy gate. Фразы «P0–P3 только human-approved» относятся к текущему пилоту и не запрещают проектировать/реализовать gated delegated mode; сам этот документ его НЕ включает.
4. Денежный repair reserve: предложенная UI-предустановка 20%, требуется явное подтверждение. Объект бюджета — generation unit, один пользовательский готовый результат; все шоты/операции/попытки внутри него сохраняют общий cumulative cap. Scope project/month тоже проверяется. Не время, не объём правок, не новая бесплатная попытка.
5. Strict >10% visibility сохраняется, но заранее принятый bounded repair reserve заменяет повторное approval внутри него ТОЛЬКО для разрешённого ремонта. Другие изменения сметы не маскируются repair.
6. После двух unsuccessful content attempts — пауза ПЕРЕД третьей. Нужен repair proposal и новое bounded решение; не кнопка слепого retry. Это уточняет более старую фразу AGENTS «три неудачные попытки». В нулевом бюджете и при unknown paid outcome нельзя делать даже первые попытки.
7. Остановка блокирует новые затронутые side effects, не отменяет уже начисленные расходы. Poll/reconcile сохраняется. Отмена отправленного задания — только по проверенному provider contract; подтверждение refund отдельно.
8. Pipeline error <=10%, first-delivery >=90%, first-generation и repair spend измеряются отдельно. Это инженерные цели без подтверждённого benchmark, не готовая гарантия и не критерий выхода по малой выборке.

## Предметные владельцы
- architecture/ARCHITECT_FOUNDATION.md — иерархия, границы, память/контракты.
- production/AUTONOMOUS_EXECUTION.md — plan delegation/state machine.
- production/RECOVERY_CONTROLLER.md — диагностика/repair/stop/in-flight.
- economics/GENERATION_RESERVE.md — денежные правила и cumulative caps.
- studio/SCENE_COMPILER.md и HIGGSFIELD_SUBSTITUTION.md — контроль/замены.
- quality/ARCHITECT_ACCEPTANCE.md — метрики и доказательства.
- learning/EVOLUTION_AND_LAB.md — исследования, market intelligence, контролируемое развитие.
- tasks/architect_acceptance_overlay.json — дополнительные AC существующих Q-задач, НЕ второй реестр статусов. tasks/project.json остаётся единственным источником состояния. Контекст задачи = старый context + глобальное обязательное чтение amendment + применимые overlay AC.

## Неизменные границы
Нет разрешённого live/incremental spend; Q-001 остаётся непринятым до решения оставшихся вопросов. Owner-directed documentation amendment не запускается как недоступная product task. Runtime/protected packages/tests/CI/архивы/исторические handoffs не изменены этой работой. PACKAGE_MANIFEST.json — старый shipping snapshot; не пересобирать его как будто полный release проверен. Полный spec-check/продуктовые tests/evals следующий агент выполняет на настоящем checkout; текущий handoff показывает отдельно scoped checks.

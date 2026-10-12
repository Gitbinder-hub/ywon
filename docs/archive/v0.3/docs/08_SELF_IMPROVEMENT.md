# 08. Самоулучшение — наблюдение, гипотеза, проверка

Не обучение весов на старте: память, retrieval, шаблоны и контролируемая версия навыка.
Четыре контура сохранены: техническое качество; вкус/правки; аудитория; системные улучшения.
Они имеют разные данные, доступ и критерии; хороший viewer metric не отменяет плохой QA/consent.

## Golden Library
Допуск: legal/consent OK AND technical/content QA pass AND (human accepted OR independently reviewed).
Audience evidence — дополнительное поле, не обход QA. Сохранять provenance, language/market,
context, sample, version и условия применения. Не копировать private user assets между workspace без согласия.
Разнообразие, deduplication, expiry/drift checks; reuse ограничен форматом/лицензией и шаблонностью.

## Аналитика
Первая версия описательная. CTR thumbnail не доказательство силы хука внутри ролика;
retention dip не причина сама по себе. Учитывать source traffic, возраст видео, длину, тему и cohort.
Missing data = NULL/unavailable, не ноль. 48 ч/7 дней — snapshots, не универсальное достаточное окно.
Инсайт содержит observations, confounders, uncertainty, hypothesis и suggested test.

## Эксперименты
Pre-register: primary metric, assignment, eligible cohort, minimum sample, max window, stopping rule,
guardrails/cost. Один параметр по возможности. Titles/thumbnails и разные эпизоды — разные дизайны.
Outcome: win/loss/inconclusive/invalid. Нехватка данных не превращается в успех к дедлайну.
Не обещать научное доказательство по 20 роликам. Human approval на стратегическое изменение.

## Кэш
Exact request hash → reuse только при доступном ассете и совместимых разрешениях/версии.
Hash не предотвращает двойную оплату при crash-after-submit; нужен operation reconciliation.
Semantic reuse — предложение, не автоматическая подмена действия/фактов. Кэш не переносит чужие данные.
Prompt cache экономит при подходящем TTL и повторении; hit rate измеряется, не гарантируется.

## Skill Lab
Сначала humans propose diffs. Mechanical eval и real media eval отдельны.
Canary rollout ограничен бюджетом/риском; для малого объёма фиксированный пилот лучше абстрактных 10%.
Rollback закрепляет версии для будущих запусков; не отменяет оплаченные вызовы/публикации.
Предикторы внимания/CTR сначала heuristic advisor с калибровкой, не обещание вирусности.

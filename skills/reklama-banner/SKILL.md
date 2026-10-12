# reklama-banner — баннер/оффер/CTA, набор вариаций с lineage

Fidelity `supported_control`: композиция из проверенных текстов/графики, генерация вариаций без вранья.

## Inputs / Outputs
- Input: `offer`, `audience`, `landing_url`, `proofs[]`, `cta` (≤40), `platform` `generic|yandex_direct|vk_ads|telegram`, `variants` 1–6.
- Output: `artifacts[] {artifact_id, preview_url, variant_index} + manifest_hash + qa {variants_lineage, claims_checked}`.
- Каждая вариация хранит lineage от оригинала — `variants_lineage=true` обязателен для QA.

## Platforms & limits
- Размер/лимиты/публикация проверяются по официальным источникам на момент релиза, не hardcode «под все площадки» `MODES_AND_RECIPES.md:5`. Без `proofs` для claim → `unsupported: missing_proofs_for_claim`. Ad autopilot — FUTURE, отдельный permission/spend gate.
- Нарушение рекламных ограничений → `unsupported: ad_policy_violation` с отчётом.

## Budget & Report
- `limitMinor 8000`, `curiosity_reserve 7%`. Отчёт показывает `variants lineage`, цену и `open_issues` честно.

## Provenance
Механика `MODES_AND_RECIPES.md: Реклама` — `offer/аудитория/доказательства/landing/площадка/ограничения`. Код оригинальный.

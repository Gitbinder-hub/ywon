# tovary-hero — герой-кадр товара: approved cutout + generated background

Fidelity `supported_control`: берём проверенный вырез товара, дорисовываем фон/композицию. Generative `relight/edit` может изменить protected продукт — сравнение до/после + human review обязателен.

## Inputs / Outputs
- Input: `product_cutout_id` (hash approved cutout), `sku`, `claims[]`, `required_texts[]`, `protected_region` (что не трогать), `aspect`.
- Output: `artifact_id + preview_url + manifest_hash + qa {ocr_signal, visual_signal, critical_passed} + report {assets,cost,qa,open_issues}`.
- OCR/visual QA — сигналы, не доказательство точности SKU/логов; `critical_passed=false` → блок экспорта до человека.

## Capabilities & Limits
- Requires `image-gen`, optional `background-gen/relight`. Без `product_cutout_id` → `unsupported: missing_protected_cutout`.
- Не выдумывать свойства/фото использования (`forbidden: invented_sku_property`, `synthetic_testimonial_as_product_photo`).
- Человек утверждает фактические характеристики; фото не доказательство реального использования.

## Steps & Approval
`validate_sku_claims → verify_protected_region → compose_background → qa_ocr_visual → human_claim_approval → report`.
Approval `human_claim_approval` — single-use version/hash bound, новая правка аннулирует approval `05_PIPELINE.md`.

## Budget
`limitMinor 6000 worstCase 6000`, `curiosity_reserve 6%` внутри `GenerationUnit` cap. Retries 2, repair требует bounded plan перед третьей попыткой.

## Provenance
Механика из `MODES_AND_RECIPES.md: Товары` — `protected product, не выдумывать свойства`. Код оригинальный.

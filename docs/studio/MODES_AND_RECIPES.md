# Студии под цели: режим ≠ отдельная архитектура

Все режимы — versioned recipes поверх общих brief/document/assets/jobs/budget/QA/export.
Рецепт определяет onboarding schema, required inputs/consents, format, editor kind, capabilities,
quality rules, worst-case/reserve, review points, export profile и unsupported/degraded outcomes.
Platform profiles версионируются; размер/лимиты/публикация проверяются по официальным источникам,
нет обещания «под все площадки» и вечного hardcode спецификаций.

| Студия | Цели | Специфический онбординг / QA |
|---|---|---|
| Товары | hero photo, галерея, инфографика, lifestyle, карточки/видео | точные фото/SKU/характеристики/комплектация/обязательные надписи; protected product, не выдумывать свойства |
| Реклама | баннеры, offers/CTA, статик/видео, набор вариаций | оффер, аудитория, доказательства, landing, площадка, ограничения рекламы; variants lineage |
| Эксперт | пост, карусель, Stories, narrated short | позиция автора/источники/тон; medical/financial claims требуют усиленного review |
| Фото / визуалы | фотосессия, иллюстрация, обложка, thumbnail | identity/reference/style, согласия и права; drift/artifacts |
| Видео | Shorts/Reels, интервью, raw edit, продуктовые ролики | материал, длительность, hook/голос/музыка/платформа; clips не обещаются из непригодного исходника |
| Серии / истории | эпизоды, персонажи, фантастический сериал, long | canon/characters/references, continuity/anchors; long монтаж не continuous AI generation |

Дополнительные рецепты: event promo, comparison, repurpose/archive, localization, channel packaging.
Post/Story/Carousel — delivery formats, могут содержать текст/фото/видео; не тип генеративной модели.
Story sticker/poll/link экспорт и автопубликация требуют отдельной capability platform API;
при отсутствии предложить инструкции для ручной публикации, не рисовать ложную функциональность.

## Этапы
P2: первый narrated short + один bounded static layout/text recipe для проверки editor loop.
Это не запуск всех студий. Q-040: один статический результат с редактируемыми слоями и текстом;
без широкого ecommerce/ads suite. Выбор image provider и live budget только после P0/owner gate.
P5: выбранные дополнительные режимы получают отдельные bounded tasks/eval; Q-029 не считать
реализацией всего каталога. Q-048 — decomposition/baseline выбранного product/creative recipe.
Каждая студия имеет capability card с readiness/limits; unsupported workflow нельзя оплатить.

## Товарные правила
Для верного товара предпочтителен approved source cutout + generated background/composition.
Protected asset/region обязателен при таком пути; generative relight/edit может его изменить — сравнение и review.
OCR и visual QA — сигналы, не доказательство точности SKU/логотипов; ошибки critical не проходят автоматом.
Человек утверждает фактические характеристики, фото не является доказательством реального использования.
Synthetic UGC не выдаётся за отзыв реального покупателя. Ad autopilot — FUTURE отдельные permission/spend gates.

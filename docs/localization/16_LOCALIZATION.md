# 16. Языки и локализация

UI language отдельно от языка контента. Content language выбирается явно из поддерживаемых BCP-47 tags.
Канал обязателен; серия override; episode primary_channel_id однозначен; язык фиксируется при создании.
supported_languages config разрешён, implicit content language default — нет.

## Фазы
P0 test language(s) утверждает владелец; P2 native script/TTS/subs на выбранном поддерживаемом языке.
P5 subtitle languages → dub with timing/review → mirror channel linking. Multilingual audio API поддержка проверяется,
если недоступна — отдельные экспорт-пакеты, а не обещание API функции.

## Dub
Translate/adapt с источниками и человеческим review смысла; cultural changes не искажают факт.
Разная длина TTS меняет timeline; on-screen text/fonts/RTL/line-breaking и consent отдельно.
Lipsync если лицо говорит, требует capability и real test; иначе предложить другой монтаж.
Names/brands/quotes allowlist; pronunciation dictionary; measured subtitle timing с method/cases.
Zero untranslated fragments не универсальный gate. Low-confidence language detection → human check.

## Memory/analytics
Language/market scoped Golden Library. Перенос удачного hook между языками — гипотеза.
Budget per localization/version и re-approval финала. Локализация — не бесплатный append-only шаг.


## v0.4: доступность мира без runtime-переводчика
UI: docs/localization/UI_I18N.md — catalogs prepared once, incremental updates, lazy/cache,
separate ui/assistant/content locale/market/timezone. Никакого AI translation per page open.
Coverage: docs/localization/LANGUAGE_COVERAGE.md — proposed popular locales vs real per-capability eval.
Для свободной image/text работы channel не нужен; content locale задан явно на item.
UI локализация может появиться раньше dub/mirror. Content generation на целевом языке не обязана проходить
через RU/EN intermediate. Browser translator не считается реализацией локализации продукта.

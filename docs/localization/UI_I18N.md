# Дешёвая многоязычная оболочка без browser translator

## Выбранное направление спецификации
One codebase + versioned locale catalogs + build/update translation workflow; no LLM per screen render.
Runtime loads only selected locale/chunks via CDN/cache. Intl for numbers/dates/plurals;
ICU/message formatting or supported equivalent chosen by ADR. Translation has preparation/QA/maintenance
cost, but negligible AI runtime cost for static UI; not zero overall cost.

## Separate settings
ui_locale, assistant_locale, content_locale, target_market, timezone, display_currency independent.
UI locale may be suggested from browser/OS; user override persisted. It never silently changes
channel/content locale, voice, budget or market. Notification/error/templates follow UI locale;
assistant replies in requested supported locale without mandatory RU→EN→RU calls.
Canonical typed contracts/provider error codes locale-neutral; render localized messages from codes.

## Translation pipeline
Stable keys + source text/description/screenshots/glossary; extraction on build; translate changed keys only.
Batch machine/AI translation during development, then human/native review of onboarding/money/rights/errors.
Do not send secrets/private user content to UI translation service. Version/cost of translation updates logged.
Translation memory reuses approved segments; legal/policy translations marked pending until approved.
Never display draft legal/budget wording as approved. User-generated content translated only on request
or explicitly selected workflow with price/privacy review. Assistant generation normal usage, not free localization.

## Rendering / coverage
Fallback key hierarchy locale-region→locale-base→source; no blank key/raw IDs. When material flow not reviewed,
mark beta/unavailable, not pretend full launch. Pseudo-locale and long strings tests, no concatenated sentences;
plural variables and named placeholders validated, plural categories may legitimately differ across locales.
RTL/bidi-ready CSS logical properties; actual Arabic launch requires manual/canvas/renderer QA.
Fonts lazy/subset with license/glyph checks; CJK line breaking, emoji, currency/date/timezone semantics.
Content export never uses fallback font silently if it corrupts text; show repair choice.

## Tool choice
next-intl/i18next/FormatJS-class solutions are candidates, not selected dependencies.
Q-038 selects compatible i18n setup with chosen scaffold; no new service solely for static translations.
Catalog schema permits reuse in Android/iOS, but framework-specific adapters may differ.
Dynamic paid estimates, notification templates and approval cards covered by tests, not only menu labels.

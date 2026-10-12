# Покрытие языков: UI ≠ качество медиа

## Proposed rollout, not currently shipped support
Baseline source UI English + reviewed Russian for owner/first tests. Broader candidate priority:
Spanish, Brazilian Portuguese, French, German; then Hindi, Indonesian, Japanese, Korean, Arabic,
with order decided by actual users and native QA/resources. This is not a ranked global market claim.
Chinese variants/regions require separate market/provider/compliance analysis before promising availability.
User did not approve exact list/order; Q-001/Q-045 record actual release profile.

One multilingual text model can serve many assistant/content languages, no separate model training per
language needed by default. Quality/token counts vary; measure cost and accepted results per locale.
Provider TTS/ASR/text editing/translation/video lipsync languages and voices are separate capabilities.
No «все языки поддержаны» merely because UI catalog exists.

## Capability matrix per BCP-47 locale / market
Fields: locale, UI status (planned/draft/reviewed/active), assistant/text availability, source/native reviewer,
fonts/RTL QA, TTS models/voices/consents, ASR, subtitle timing, dubbing/lipsync,
platform delivery/region/provider terms, last_eval/pricing, fallback/known limits.
Stored as validated config in product (Q-038/Q-045); table below is planning, not eval evidence.

| Group | UI rollout | Media status in this pack |
|---|---|---|
| en, ru | first reviewed candidate | unimplemented/unverified; P0 languages owner-selected |
| es, pt-BR, fr, de | next candidates | evaluate each enabled capability before launch |
| hi, id, ja, ko, ar | demand-led candidates | typography/RTL/voice/model tests needed |
| zh-Hans/zh-Hant and regions | separate candidate analysis | no implied regional availability |

## Native generation vs derivatives
Creating directly in target language avoids automatic full pipeline translation. Reuse visuals where
meaning/rights fit. Low-cost derivative ladder: translated caption/subtitles → localized overlays/layout →
new voice and timing → lipsync/re-shot only when necessary. Each step separately priced/approved.
Never re-generate all images/video just to change UI language or translate a caption.
Pinned shared source assets + locale-specific text/audio; timing/layout recomputed as required.
Glossary/names/protected quotes and semantic review; no forced literal cultural rewrite.

## Release gates
Q-038: base catalogs + matrix enforcement, no paid media guarantee.
Q-045: owner-select popular locales/markets, translate once, native review critical flows,
real-eval enabled content/voice functions in approved budget, expose partial coverage explicitly.
Small language cohort tests not proof of worldwide quality. Unsupported voice can offer text/subtitle output
or other supported language only with user confirmation, never silent language switch.
Full multilingual dubbing/mirror branches remain P5 Q-028; UI rollout need not wait for dubbing.

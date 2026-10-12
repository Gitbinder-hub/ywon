# Проверка студии, языка и устройства

Spec consistency checks only documents/DAG/history/links. Product acceptance requires actual code,
server renders, real API outputs and ordinary user review with approved spend.

| Risk | Required evidence |
|---|---|
| Editable result | source/layer separation, command→save→reload→export, undo/version/conflict |
| Image local edit | move/resize/rotate/text styles/safe areas, baked text limitation |
| Region generation | mask/target version/estimate/candidate/original retention, drift QA, fail/reconcile |
| Video | trim/order/overlay interval/sub cues, audio duration/QA, targeted shot regeneration |
| Text/sequence | semantic block diff, claims, count/overflow, every item exported in order |
| Cross-client | same project and permissions, resume/kill/offline conflict, no duplicate paid request |
| i18n | changed-key catalogs/placeholders, RU/EN flow, pseudo locale/RTL/CJK per enabled coverage |
| Language capability | real text/voice/subtitle cases per enabled locale, native critical review |
| Cost | baseline +10% boundaries, zero/FX/cumulative/pending, cap races and actual final |
| Product protection | SKU/package/text/identity evidence + human check, no unsupported factual claim |
| Agents | injection/permission escalation/duplicate submit denied; code guards independent of model |
| Accessibility | keyboard/screen reader/zoom/contrast/touch alternatives |
| Security/ops | isolation/SSRF/media sandbox/retention/restore/secret handling |

## Fixtures and live tests
Golden layout/timeline/text fixtures with pinned renderer/fonts, tolerance defined in ADR;
mechanical fixtures cannot certify provider regeneration. Live cases: ordinary expert/brand/product
where rights authorized, include failures and all billed attempts. Native reviewer for material locale flows.
QA models advisory; benchmark critical false-negative cases and never claim zero errors.
Novice usability Q-041/Q-017: no owner bypass; record prompts/help/intervention separately.
Mobile Q-047 needs real devices/OS network scenarios, not desktop viewport screenshots alone.

## Staging
P0 real narrated pipeline unchanged. P2 basic text/layers/video practical loop mandatory before Q-015G;
P5 advanced branches separately selected/benchmarked. P6 popular locales and both mobile clients before
Q-049G public release, unless explicit labeled launch waiver with owner acceptance and disclosed limits.
Future branch never DONE due to broad placeholder task; feature status is first-scope acceptance only.

## Exact3D / narrow Cinema benchmark — выбранная P5 ветка
До запуска закрепить inputs/rights, Blender/renderer/assets/fonts, output duration/resolution/fps,
hardware/resource budget, mandatory constraints, tolerances и способы наблюдения. Для камеры проверять
trajectory/framing/timebase и пересечения; для адресной правки — expected diff и сохранность protected
геометрии/product/logo/text и unrelated assets. Identity/subjective visual quality — отдельные проверки.
Stage render и generative final оцениваются отдельно; unavailable measurement → uncertain/needs_user.

Candidate первая выборка: prepared product turntable/orbit; dolly/push-in; material/light edit с
preserve constraints. Не обязательна до P5 и не принимает весь F18/F19/F23 scope. Baseline — чистый
Blender render; optional generative finish отдельный experiment. Для comparisons один brief, inputs,
output profile, constraints и сопоставимый resource envelope; no Mixar/Higgsfield installation or spend
из этого research. Competitor source review не считается comparative runtime evaluation.

Required failure cases: stale base revision; revoked/cancelled run; late callback; duplicate same ID;
same ID/different payload; crash before/after publish; UNKNOWN reconciliation; concurrent independent
workers; failed/partial artifact; unsafe external dependencies; checkpoint restore vs changed external
files. Проверить save→reload→export и native source/media separation. Report хранит все attempts,
critical failures, accepted-result costs, measured correction/user time и uncertainty. QA/advisory
модели не принимают результат за владельца; fixture PASS не доказывает Blender/real media качество.

Economy report разделяет first delivery, repair, model/provider spend, local compute, asset setup и
human intervention. Reuse сравнивается с cold start; savings/«лучше» только по сопоставимым accepted
outputs, не по token count или красивому preview. Existing reserves/stop-before-third остаются.

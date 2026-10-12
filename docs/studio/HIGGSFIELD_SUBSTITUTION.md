# Собственная замена функций Higgsfield — engineering matrix

Все строки ниже — выбранное архитектурное направление, не реализованная эквивалентность. Open MIT recipes/CLI instructions могут адаптироваться с notice; closed backend/hidden prompts/weights не становятся открытыми. No mandatory Higgsfield production dependency; optional adapter only explicit terms/access decision.

| Функция | Собственная реализация/контроль | Зависимость / предел | Доказательство / этап |
|---|---|---|---|
| Camera pan/zoom/push-in/shake | SceneSpec→2D compositor/FFmpeg motion templates | Нужны проверенные transforms/timebase; no unseen geometry | Golden renders + safe areas + actual motion; P2 bounded set |
| Orbit/dolly/FPV/optics | Blender rig and geometry OR supported native/reference control | Pure 3D exact stage; generated interpretation may drift; backend inputs verified | Final camera/geometry/content benchmark; selected P5 |
| Genre/lighting/lens style | Structured style recipe; Blender lighting/lens when geometry; model-specific conditioning otherwise | Prompt optical wording != physical lens | Style rubric + control attribution/limitations; P5 |
| Multishot/storyboard | Own SceneState/reference pack/anchor resets, DAG assembly, transition checks | Chaining drift, chain length bounded; no long uninterrupted promise | Identity/wardrobe/location/temporal tests incl transitions; P5 |
| Character identity/recast | Consented identity pack, compatible reference model, calibrated verifier | Soul server reference_id not transferable; optional own LoRA needs rights/TCO | Blind identity eval, false accept/reject; P5/F40 future |
| Exact product/logo/CTA | Retained source/3D product + deterministic layers/compositing | Geometry/tracking/masks preparation costs | Logo/text/product protected-region checks; bounded P2 then P5 |
| VFX/trend effects | Own procedural compositor/Blender templates + generated elements | Each effect separate supported implementation; rights/data checked | Per-effect real eval and repair scope; P5 |
| Talking head/voice/lipsync | Own consent/identity lifecycle + licensed TTS/compatible lipsync adapter | No hidden cloning; language/audio inputs verified | Alignment/pronunciation/consent/revoke tests; basic TTS P0, advanced P5 |
| Timeline/edit-by-intent | Own editable document, deterministic edits, separate generative video edit | FFmpeg not frontend; tracked/generative edit separate from image inpaint | Preview/final parity and preserved unaffected assets; P2/P5 |
| Marketing Apps/templates | Versioned recipes with real inputs/claims/platform profiles | No fake testimonial; not every UI preset is backend capability | Novice task completion + accepted output/cost; P2/P5 |
| Virality/attention advisors | Own audience observations and registered experiments | Predictor advisory; demo != causal growth proof | Cohort/holdout/calibration and truthful claims; P4/P6 |

Каждая implementation карточка требует: open_part/source/license, closed_dependency, substitute node/adapter refs, input/output contracts, stage/final fidelity, rights/cost/pricing refs, supported/degraded/unsupported, benchmark/holdout, attempts/critical failures, ownership/review/activation. No inherited numerical quality score from competitor marketing.
Первый milestone: compiler contract + two safe demonstrated 2D recipes + one chosen controlled cinematic experiment design. Paid cinematic experiments только separately funded gate; не мешают продвигать existing staged core. «Лучше» и экономия допускаются после comparable benchmark, не из наличия нашего UI.

## Уточнение competitor baseline — 2026-10-05
Официальная страница https://higgsfield.ai/plugins/blender описывает Blender add-on и MCP Bridge,
Scene Builder с editable scene data, rig/keyframes и image/video generation. Поэтому «у Higgsfield нет
Blender» не считается исходной предпосылкой конкурентного плана. Это проверка документации, не runtime
benchmark, проверка account access/цен/качества или разрешение подключить сервис.

Mixar даёт отдельный ориентир editable scene harness / isolated artifact commit; открытый desktop
клиент не содержит hosted AI-backend. Own substitute остаётся независимым; обязательной интеграции с
обоими сервисами нет. Цель сравнения — сохранность ограничений, удобство адресной правки и полная стоимость
принятого результата, не просто наличие Blender/MCP. Sources/limits и stage placement:
`docs/research/MIXAR_BLENDER_RESEARCH_2026-10-05.md`.

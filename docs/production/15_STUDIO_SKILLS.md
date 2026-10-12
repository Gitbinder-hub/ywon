# 15. Studio Skills — воспроизводимые рецепты с честными пределами

## Skill
Versioned graph с typed inputs/outputs, tools/capabilities, evidence, pricing/reserve, retries,
approval points, delivery report, real eval/limits. Markdown объясняет, orchestrator исполняет.
Промпт не предоставляет отсутствующее свойство модели. Никаких секретов/произвольного shell в skill payload.
Файлы навыка: SKILL.md, skill.yaml, prompts, optional blender scripts, evals, CHANGELOG, LICENSE/provenance.

## Машинные поля
id/version/status/scope; input/output schemas; required/optional capabilities with accepted inputs;
execution_fidelity: exact_3d|supported_control|prompt_guidance|2d_approximation;
supported/degraded/unsupported outcomes; budget worst-case/retry/cancellation rules;
steps/approval; model-specific templates; report (assets/cost/all attempts/limitations/QA/open_issues).
forbidden_this_iteration: string[] — список шаблонов/механик запрещённых в этой итерации (2026-10-07 anti-template, из Genome/Challenger).
curiosity_reserve: optional 5–10% budget slice внутри GenerationUnit cap — сгорает при сдаче без эксперимента.
Runtime должен валидировать ссылки, инструменты, права и бюджет. Неподдерживаемый skill не активируется.

## Камеры
Начать с нескольких доказанных 2D функций: pan/zoom/push-in/shake/transition; не называться orbit при простом slide.
Настоящие orbit/dolly zoom/FPV требуют geometry либо генерации невидимых областей.
Blender rig даёт физические параметры для 3D; prompt-only camera metadata — guidance, не физическая гарантия.
Control-videos/depth/pose работают только с API, принимающим эти inputs. Нет входа → unsupported/alternate model,
а не «Blender гарантирует любой start/end frame». 60+ presets — сохранённая будущая цель, не P2 AC.
Каждый preset имеет fidelity/requirements/limitations и испытанный benchmark.

## Multishot / characters
Длинный монтаж ≠ длинная непрерывная генерация. Last frame chaining только один приём,
может накапливать drift. Shared approved reference pack, scene state, anchor resets, transition review,
cutaways и ограничение chain length. Поддержка identity зависит от модели; face similarity калибровать.
Storyboard Lock фиксирует references/style/palette, не обещает deterministic diffusion.
Recast/wardrobe/location/inpaint/video-edit — отдельные capabilities/tasks, не один универсальный вызов.
LoRA только после data rights/GPU/economics и owner approval.

## Полный каталог сохранён
Cinema: rig/60+ movements/genre/speed ramp/emotions/previz/start-end/multishot.
Effects: transformations/portals/levitation/fragments/compositing; Trend Harvester как предложения.
Characters: identity/recast/wardrobe/location/voice. Edit: timeline UI/J-L cuts/B-roll/reframe/LUT/music sync.
Image/Video: inpaint/outpaint/edit-by-intent/relight/restyle/upscale/artifact repair.
Sound/Lipsync: TTS/voice consent/music/SFX/dub/sync.
Apps: explainer/UGC/product showcase/talking head/thumbnail/carousel/podcast clips/trailer/faceless/series.
Creative analytics: heuristic hook/retention/thumbnail advisor; learned predictor только достаточные данные и holdout.
На P2 доступны Chat/review cards и базовые image/video/text editors на странице результата.
Advanced Cinema/Effects/Characters/Lipsync и широкий каталог Apps — P5 ветки.
Рецепты студий: docs/studio/MODES_AND_RECIPES.md; editor contracts не заменяют provider capability.
EDL/FCPXML export проверяется конкретной версией редактора; не считать все эффекты переносимыми.

## Узкие 3D skills и локальный пересчёт — P5 candidate scope
После выбора соответствующей P5 ветки начать с небольшого проверяемого набора, не с полного каталога:
product turntable/orbit, camera dolly/push-in, адресная правка material/light. Подготовленная модель с
проверенными правами — допустимый input; генерация модели, rigging и photoreal characters не становятся
обязательной предпосылкой этой первой выборки. Чистый Blender render — самостоятельный baseline;
generative video finish отдельно optional и требует собственных capability/cost/final-fidelity evals.
Порядок/включение набора уточняются в bounded branch decomposition, не запускаются этой docs-only правкой.

Каждый skill объявляет target IDs/base revision, units/timebase/parameters, reference roles,
protected/preserve entities, required renderer/assets, typed publish operation и verification methods.
Output: editable artifact + preview/final + manifest + report, не только текст «готово». Неподдерживаемые
замены/patches не маскируются append operation. Параллельность допустима только для independent DAG nodes
с отдельным ownership/resource envelope и проверяемой последующей сборкой; несколько агентов само по
себе не доказательство ускорения или экономии.

Reuse key включает входные hashes, skill/adapter/renderer version, параметры и необходимые dependencies.
Правка инвалидирует только affected nodes и их dependents; принятые assets вне этой области сохраняются.
Cache hit проверяет права/tenant scope/целостность/актуальность, не переносит чужую private memory или
approval. Пропущенный пересчёт не отменяет обязательный QA. Изменение камеры может инвалидировать все
кадры шота; изменение геометрии — lighting/shadow/masks и другие зависимые passes.

Third-party skill/code provenance и per-file license проверяются до адаптации; Mixar desktop GPL не
приравнивается к MIT Higgsfield instructions. Заимствование механизма не требует копирования кода;
распространение derivative components требует отдельного license review. Closed hosted orchestration,
hidden prompts и model weights из публичного клиента не восстанавливаются как «открытые skills».

## Skill Lab
Mechanical eval в CI; real eval отдельно с approved spend. Golden cases + holdout, blind comparison,
quality/cost/critical failures; canary small scope. Переход draft→canary→active только по evidence/approval.
Rollback не отменяет billed calls. Новая версия не меняет уже принятый episode manifest.
Marketplace позже: provenance/signature/sandbox/supply-chain/tenant isolation/moderation обязательны.

## Higgsfield
Открытые MIT инструкции можно изучать/адаптировать с notice; CLI recipes не содержат все server-side engines.
Матрица: функция → open part → closed dependency → own substitute → fidelity → rights → benchmark.
Фразу «лучше» использовать после сравнения, не как исходное требование маркетинга.

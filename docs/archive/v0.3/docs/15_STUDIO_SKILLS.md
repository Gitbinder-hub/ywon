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
На P2 доступ из Chat и review cards; все экраны Cinema/Effects/Characters/Edit/Lipsync/Apps — P5 ветки.
EDL/FCPXML export проверяется конкретной версией редактора; не считать все эффекты переносимыми.

## Skill Lab
Mechanical eval в CI; real eval отдельно с approved spend. Golden cases + holdout, blind comparison,
quality/cost/critical failures; canary small scope. Переход draft→canary→active только по evidence/approval.
Rollback не отменяет billed calls. Новая версия не меняет уже принятый episode manifest.
Marketplace позже: provenance/signature/sandbox/supply-chain/tenant isolation/moderation обязательны.

## Higgsfield
Открытые MIT инструкции можно изучать/адаптировать с notice; CLI recipes не содержат все server-side engines.
Матрица: функция → open part → closed dependency → own substitute → fidelity → rights → benchmark.
Фразу «лучше» использовать после сравнения, не как исходное требование маркетинга.

# Scene Compiler — собственное производственное представление

## Вход/выход
Input: accepted brief/script/claims/scene state/reference pack, protected entities, target profile, budget/envelope, versioned capabilities. Output: typed executable DAG + route proof + estimates + planned QA. Промпт — один backend target, не весь compiler.
SceneSpec: id/version, goal/script span/claim refs, duration/timebase, entities/assets/geometry/identity refs, world/camera coordinate conventions, keyframes/trajectory, lens/lighting/style, protected elements, motion constraints, previous/next scene state, sound/subtitles, required fidelity/QA tolerances. Units/ranges declared; no arbitrary shell/HTML/remote code in payload.
ExecutionPlan: pinned input refs/hash, node inputs/outputs/dependencies/limits, adapter/version, chosen control mechanisms, actual supported precision, budget allocation, checks, unsupported requirements, renderer/environment refs. Unknown capability cannot compile as success.

## Targets
Deterministic2D: pan/zoom/push-in/overlay/transition через own compositor/FFmpeg где benchmarked; не обещает unseen geometry/orbit. Existing B-002 static renderer не объявляется уже реализовавшим эти эффекты.
Exact3D: Blender scene/rig/templates, geometry/material/light/camera parameters, sandboxed allowlisted scripts, pinned Blender/assets/fonts/renderer, depth/pose/control render where supported. Final pure 3D shot can have exact configured trajectory; subjective naturalness отдельная проверка.
SupportedModelControl: native API camera/ref/keyframe/start-end/video/depth/pose ONLY if adapter accepts those inputs. Unsupported fields denied; visual keyframes are not automatically geometry control.
PromptGuidance: explicitly approximate semantic guidance; uncertain outcome priced/tested, no physical guarantee.
HybridComposite: generated environment/motion плюс retained exact product/logo/text/layers; alpha/mask/tracking consistency checked.
`exact_3d` describes rendered stage; if generative transformation follows, final fidelity evaluated separately. Seed/multi-keyframe features не гарантия equality.

## Exact3D worker и проверяемая сборка — уточнение после Mixar research
Target contract, не текущая runtime capability. Основной маршрут — структурированные команды через
собственный Blender adapter/headless worker и allowlisted versioned templates; computer-use только
отдельный явно разрешённый fallback, не основной производственный механизм. Форк Blender и интеграция
Mixar не требуются. Общий Ywon core/policy/budget не дублируется внутри 3D worker.

Задание привязано к workspace/project/scene ID, base revision/hash, operation ID, plan/skill version,
scoped authorization и resource bounds. Reference pack задаёт роль каждого источника
(shape/material/color/composition/identity), target entity/region и preserve constraints. Выбранный объект
или отметка пользователя разрешается против конкретной версии сцены; неоднозначная/устаревшая цель →
clarify/review, не произвольная правка. UI scribble — будущий способ ввода, не обязательная P2 реализация.

Worker строит candidate в изолированном документе и возвращает native artifact, manifest/hash,
preview/verification renders и execution report. Manifest содержит pinned Blender/renderer/assets/fonts,
units/timebase, object/collection IDs, input/output hashes, resource usage, provenance/rights и QA results.
Нет произвольного model-authored кода в foreground publish; разрешённое template execution остаётся
изолированным и ограниченным. `.blend`/external dependencies тоже недоверенный input: запрет autorun,
контроль файловых/сетевых доступов и ресурсов; hash не заменяет sandbox/лицензию.

Публикация candidate — короткая typed операция с повторной проверкой authority, актуальности base revision,
run generation/epoch/fence и content hash. Append, replace и parameter patch — разные capability contracts;
append-only пример Mixar не доказывает безопасную замену существующих объектов. Точная правка сохраняет
незатронутые entities и проходит собственные проверки. Journal хранит prepared/applied/unknown и receipt;
повтор того же operation ID/payload возвращает известный outcome, иной payload отвергается. Устаревший,
отменённый или отозванный run не публикуется. Crash/timeout с неоднозначным эффектом → inspect/reconcile,
не blind rerun. Restore/checkpoint версионирован; external files, billed calls и удалённые side effects
не откатываются автоматически.

P1: схемы/границы и mechanical fixtures в рамках существующих foundation задач; P2: общие revisions,
references и targeted edits только в принятом базовом editor scope; P5: реальный Blender adapter и
выбранные cinematic skills после decomposition/owner gate. Исследование и source pointers:
`docs/research/MIXAR_BLENDER_RESEARCH_2026-10-05.md`.

## Preflight
Contract contradictions; readable timing/audio lengths; missing refs/rights; unsupported movement; quality judge coverage; resource bounds; generation liability; cross-shot state; format/safe area. Soft risk predictions require calibration, never use naked LLM confidence as quality probability.
Reference/frame approval and consistency checks before expensive motion where route benefits; diagnostic cost explicitly in unit. Не делать обязательный cheap generation→expensive generation каскад без экономического доказательства.

## QA и repair
Camera target vs final observed motion: documented method/tolerance/occlusion limits; geometry available permits trajectory/reprojection tests, video-only often proxy estimation with uncertainty. Product/logo/text/identity/temporal continuity проверяются отдельно. Pass requires all mandatory constraints; unavailable measurement→uncertain/needs_user, не fake exact.
Changed shot invalidates dependent timing/audio/transitions but not unrelated accepted assets. Controlled repairs use RecoveryCase. P1 schema/interfaces and fixture compile; P2 bounded 2D/hybrid first route; P5 selected Blender/native-control implementation and real benchmark. Full camera catalog retained, not bulk implemented.

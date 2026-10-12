# Mixar / Blender — исследование и спецификационные выводы 2026-10-05

## Статус и основание
Пользователь поручил исследовать Mixar для Ywoom, затем встроить выводы в существующие спецификации
без ускорения, перепрыгивания этапов и подключения к чужому сервису. Это docs-only supplement к v0.4,
не новый runtime, принятая Studio branch, разрешение расходов или изменение tasks/project.json.
Research evidence: website/docs/release + selected source review; competitor application не запускалось.

## Источники и границы проверки
Проверено 2026-10-05:
- https://www.mixar.app/ — позиционирование editable 3D editor и BYOK; marketing, не benchmark.
- https://www.mixar.app/docs — Zen/Engine, Agent/checkpoints, Scribble, Moodboard, mesh generation,
  assets/material layers, Cinema Mode, model settings/MCP; guide различает scene edits и generated media.
- https://github.com/Mixar-AI/mixar-app — desktop source, build/overlay, scope и license.
  Прочитанный source snapshot: edaeb32f28f7b70cd3ba59f906b0e4e1ef40cd55.
- https://github.com/Mixar-AI/mixar-app/releases/tag/v4.0.0 — опубликованный релиз описывает Director,
  camera keyframes, Beauty/Clay/Depth guides, WebSocket execution и checkpoints; release statements
  отдельно от самостоятельно проверенной runtime работы.
- https://github.com/Mixar-AI/mixar-app/blob/edaeb32f28f7b70cd3ba59f906b0e4e1ef40cd55/src/scripts/mixar/modules/common/agent_execution/staging.py
  — worker native artifact/manifest/hash.
- https://github.com/Mixar-AI/mixar-app/blob/edaeb32f28f7b70cd3ba59f906b0e4e1ef40cd55/src/scripts/mixar/modules/common/agent_execution/commit.py
  — v3 append_collection, ownership/document/fence checks, journal replay/UNKNOWN; no model Python in publish.
- https://github.com/Mixar-AI/mixar-app/blob/edaeb32f28f7b70cd3ba59f906b0e4e1ef40cd55/src/scripts/mixar/modules/mcp_bridge/README.md
  — scene tools vs optional UI input, usage separation и timed-out call status/reconciliation.
- https://higgsfield.ai/plugins/blender и https://higgsfield.ai/creator-hub/changelog
  — официальный Blender add-on/MCP Bridge; editable scenes, rig/keyframes и media generation описаны,
  но runtime/account/API/economics не тестировались.

Перед реализацией перепроверять текущие versions/terms/capabilities. Видео-транскрипт пользователя —
secondary anecdotal evidence; упомянутые model names, «быстрее/бесплатно/production-ready» не подтверждают
API IDs, качество, privacy/offline mode или действующий тариф.

## Что установлено и что нет
1. Mixar — custom Blender desktop fork/overlay с editable scene и собственными UI modules, не только
   click automation. Scene tools и direct scripting — основной программный механизм; UI control опционален.
2. Открыт desktop client; hosted AI-backend закрыт. Весь routing/orchestration/skills/hidden prompts
   не становятся доступными из этого репозитория. README и public releases имеют собственные version
   summaries; не выводить текущую функциональность только из одного README status line.
3. Source показывает isolated artifact staging и fenced/journaled append commit. Это полезный механизм,
   но source review не доказывает все сценарии безопасности, замену объектов или production reliability.
4. Реальная геометрия/камера позволяет управляемую 3D-стадию. Generated video/lookdev image — отдельные
   media, не автоматически editable material/lighting и не гарантия final geometry/camera fidelity.
5. Generation jobs, external assistant model/BYOK и local compute — отдельные статьи. Нулевая плата
   за scene tool не равна нулевой полной себестоимости. Local LLM не доказывает полный offline workflow.
6. Higgsfield тоже документирует Blender integration: отсутствие Blender не допустимое отличие Ywoom.
7. Не выполнены: competitor runtime benchmark, pricing/invoice verification, quality certification,
   полной server architecture/skill catalog review. Не заявлять доказанную экономию токенов/денег.

## Что переносится как направление Ywoom
Не интеграция/копия продукта, а требования в subject owners:
- `docs/studio/SCENE_COMPILER.md`: typed own worker, reference roles/preserve constraints, isolated
  native candidate, safe typed publication с authority/revision/fence/hash/replay/reconciliation.
- `docs/production/05_PIPELINE.md`: candidate→QA→review/publish, source/media separation и affected DAG revisions.
- `docs/production/15_STUDIO_SKILLS.md`: узкие versioned recipes, independent-task ownership, dependency-aware reuse.
- `docs/production/06_MODEL_ROUTER.md`: выбор execution mechanism/effort по допустимости и total accepted-result cost.
- `docs/quality/STUDIO_ACCEPTANCE.md`: real render/edit/reload/failure tests, stage/final distinction и comparable eval.
- `docs/studio/HIGGSFIELD_SUBSTITUTION.md`: current Blender competitor baseline; own substitutes remain independent.

Mixar native commit не переносится как универсальный patch contract. Ywoom отдельно определяет append,
replacement и parameter edits, сохранность неизменённых entities и rollback limits. Hash/idempotency
не заменяют artifact sandbox, прав и independent QA.

## Порядок внедрения — P0→P6 без изменений
Existing feature anchors F12/F16/F17/F18/F19/F23/F31/F46; canonical task/dependency registry unchanged.
P0: research как context, narrated proof и gates прежние. P1: contracts/fixtures в доступных foundation
задачах. P2: references/change/preserve/revisions только для baseline editors. P3: measurements в existing
repeatability. P4: reviewed Lab/reuse/effort proposals. P5: selected Cinema/Blender branch, bounded
implementation decomposition и real eval после owner gate. P6: applicable security/distribution/readiness.
Точная stage routing в `docs/governance/11_ROADMAP.md`, full scope в `docs/product/17_MASTER_PLAN.md`.

Candidate первая P5 выборка: prepared product turntable/orbit → dolly/push-in → material/light edit,
с правами на модель и protected entities. Pure Blender render baseline; generative finish optional и
самостоятельно оцениваемый. Набор не запускается сейчас, не переносится в P0–P2 и не принимает full Cinema,
characters/rigging/VFX. Branch task decomposition требует existing authority/dependencies; Q-048 disabled
до соответствующего решения. Blender fork не обязательный milestone.

## Лицензии и экономическая цель
Mixar desktop преимущественно GPL-3.0-or-later; Blender-derived files могут иметь GPL-2.0-or-later,
brand assets — отдельные ограничения. Per-file SPDX/provenance и distribution model требуют review
до code reuse; MIT Higgsfield instructions не распространяют MIT на Mixar или closed backend.
Можно независимо реализовать изученные механизмы без wholesale copying. Licensing analysis не считается
юридическим заключением, совместимость выбранного способа распространения проверяется отдельно.

Цель «лучше» = обязательные ограничения + editable/local correction + accepted output cost/time,
не просто UI/Blender/MCP/model count. Benchmark хранит cold vs reuse, все attempts/repair, provider/model
spend, local compute, asset setup/amortization, human time, critical failures и uncertainty. До таких
измерений преимущества и savings — гипотезы. Paid eval отдельно разрешается; reserve/stop-before-third,
unknown outcome reconciliation и no-production-self-activation сохраняются.

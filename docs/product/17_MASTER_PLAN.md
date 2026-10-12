# 17. Полный план — амбиция остаётся в проекте

## Направление
Ywoom: из знаний/замысла человека в полезный регулярный контент и управляемое развитие канала.
JEWEL: надежный Director производства и развития с модель-независимой памятью и подтверждениями.
Возможный масштаб — большая аудитория каналов и массовая SaaS-платформа; это разные проверяемые гипотезы.

## Три слоя
1. NOW: P0–P3 — доказать качество/экономику, построить пользовательский цикл и повторяемость.
2. NEXT: P4–P6 — learning, выбранные Studio-ветки, безопасное масштабирование по спросу.
3. FUTURE: own model tuning, marketplace expansion, optional JEWEL departments;
   не обязательства по срокам, но видимые направления с activation criteria.

## Все возможности
Полный machine-readable реестр — tasks/features.json. Здесь карта групп:
- F01 Accounts/workspaces/roles и team features.
- F02 Creator Genome, вкус и privacy-aware facts.
- F03 Channel Launch Interview + Strategy Engine.
- F04 Expert Amplifier/interview/knowledge/coach.
- F05 Projects/channels/series/Bible inheritance.
- F06 Director Chat/structured cards/commands.
- F07 Content plan/schedule/autonomy.
- F08 Explainer pipeline/Shorts/cost tiers.
- F09 Long narrative/documentary.
- F10 Carousel/posts/Stories.
- F11 Raw footage editing/reframe/subtitles/B-roll.
- F12 Asset library/storage/provenance/user cloud storage.
- F13 Publish YouTube/manual + other official APIs.
- F14 Analytics/retention/traffic cohorts.
- F15 Budgets/ledger/reservations/waste/pricing.
- F16 Router/multi-provider/compatibility.
- F17 Skill Runtime/reports/evals/versioning.
- F18 Cinema cameras/rig/genre/60+ presets.
- F19 Blender previz/3D/control pipeline.
- F20 Multishot/storyboard continuity.
- F21 Characters/identity/wardrobe/recast.
- F22 Voice identities/twin/consents.
- F23 VFX/trend presets.
- F24 Edit timeline + editor exports.
- F25 Image/video edits/inpaint/relight/upscale.
- F26 Music/SFX/TTS/lipsync.
- F27 One-click Apps/UGC/product/explainer/thumbnail/trailers.
- F28 Localization/subtitles/dub/mirrors.
- F29 Golden Library/reuse/human preferences.
- F30 Experiments/causal caution.
- F31 Skill Lab/canary/holdout/rollback.
- F32 Model Scout/benchmarks.
- F33 Trend Harvester.
- F34 Hook/CTR predictors/advisory.
- F35 JEWEL Dev Stack and IDE handoff.
- F36 JEWEL Ops monitored staging proposals.
- F37 Mass SaaS/billing/quotas/support/security.
- F38 Marketplace/templates/user skills.
- F39 Android/iOS clients — promoted to P6 all-client public release (Q-046/047/049G).
- F40 Open-weight hosting/LoRA/own fine-tuning.
- F41 Optional JEWEL Business/Capital/Personal/Physical extensions.

## Что означает «следующий уровень»
Каждая feature содержит first_phase, activation_gate, acceptance_intent, dependencies,
implementation_tasks, expansion_tasks, future_notes. Status вычисляется из принятых задач:
unimplemented/partial/first_scope_accepted; весь будущий scope не считается завершённым по одному pilot.
Stage task DONE ≠ вся feature реализована. Future tasks планируются после гейта, не исчезают из карты.
Новая идея — feature/task/ADR, не бесконечный list TODO в исходнике.

## Политика расширения
Владелец выбирает P5 branch по реальным нуждам: raw edit, cinematic series, localization, long,
product/UGC, либо editor. Architect декомпозирует конкретную ветку на bounded tasks/evals.
Не нужно ждать реализации всех веток для продаж. Сначала доказать повторяемый результат и готовность эксплуатации.
Новые модели могут улучшить пределы; их появление не оправдывает обещания сегодня.


## Добавленные группы v0.4
- F42 Goal Studios / versioned recipes: товары, реклама, эксперт, фото, видео, серии.
- F43 Layered Image Editor; F44 Structured Text Editor (sequence/carousel/story expansion).
- F45 Three entry modes/result-first manual→autopilot; F46 editable documents/revisions/media-neutral core.
- F47 UI i18n/popular locale rollout; F48 responsive/accessibility full workflow.
- F49 Four managing responsibilities, hard guards code-enforced.
- F50 Founding creators/dogfooding; F51 future paid targeting autopilot.
- F52 Factory contract for future JEWEL personal shell; full F41 modules still FUTURE.

## Нынешний scope и релиз
NOW P2 = short/explainer + one bounded static recipe, practical text/image/video editing on result page,
not six fully built studios. Proof→editor→accepted template→content plan reuses one durable core.
NEXT P5 expands chosen studios/AI edit/advanced timeline; P6 adds reviewed release locales and both native clients.
Internal pilot/web beta != public all-client launch. Q-049G after safe scale, language and mobile evidence;
store-pending staged distribution may require explicit owner waiver/disclosure, no silent downgrade.
No calendar/quality/virusality promise; spec-only product state remains not_started.

## Уточнение Blender/Cinema направления после Mixar research
Existing F12/F16/F17/F18/F19/F23/F31/F46 scope уточняется, не расширяется в ближайший обязательный MVP.
Ywon выбирает допустимый способ производства; own Blender worker возвращает editable candidate,
проверяемые артефакты и manifest, а общий runtime контролирует versioned publish/recovery/бюджет.
Сильная сторона цели — точные обязательные элементы, повторное использование и адресные исправления;
наличие Blender/MCP само по себе не конкурентное преимущество, а «лучше/дешевле» требует benchmark.

P0–P3 сохраняют narrated proof/baseline editor/repeatability; contracts готовятся фазово, реальный
Cinema/Blender worker и узкие skills — только выбранная P5 branch после decomposition/owner gate.
Candidate first set и этапные границы: `docs/governance/11_ROADMAP.md`; механизм:
`docs/studio/SCENE_COMPILER.md`; evidence: `docs/quality/STUDIO_ACCEPTANCE.md`.
Mixar/Higgsfield — исследовательские ориентиры, не обязательные внешние зависимости. Не требуется
собственный Blender fork или wholesale перенос GPL кода. Закрытый hosted backend Mixar не доступен
из open desktop source; commercial/distribution/license решение отдельно перед реализацией.

## Категории — не микросервисы
Full map docs/INDEX.md; subject owners govern requirements/evidence boundaries, not additional servers or
mandatory agents. Four role responsibilities reused per project; data/security/cost policy stays unified.
Growth does not bypass operational readiness; core income/demand and approved future gates activate shell/ads.

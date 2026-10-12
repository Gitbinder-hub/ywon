# Карта спецификации Ywoom / Ywon v0.4 + A-20261003

Сначала docs/governance/ARCHITECT_AMENDMENT_2026-10-03.md: exact override scope, canonical brand and accepted design direction; не приёмка продукта/расходов. User-confirmed canonical name Ywon: docs/governance/BRAND_NAME.md overrides earlier naming only. Qevunara / Кевунара and JEWEL remain historical/path compatibility aliases.

| Департамент | Активные документы |
|---|---|
| Product / UX | docs/product/01_VISION.md, 02_PRD_Ywoom_MVP.md, 07_CREATOR_GENOME.md, 17_MASTER_PLAN.md, MANUAL_JOURNEY.md, DESIGN_AND_ACCESSIBILITY.md |
| Architect / Data | docs/architecture/ARCHITECT_FOUNDATION.md, 03_ARCHITECTURE.md, 04_DATA_MODEL.md, EDITABLE_DOCUMENT_CONTRACT.md, PLATFORM_SHELL.md |
| Production / Recovery | docs/production/AUTONOMOUS_EXECUTION.md, RECOVERY_CONTROLLER.md, 05_PIPELINE.md, 06_MODEL_ROUTER.md, 09_JEWEL_CORE.md (compatibility redirect), 15_STUDIO_SKILLS.md, FOUR_ROLES.md |
| Studios / Control | docs/studio/SCENE_COMPILER.md, HIGGSFIELD_SUBSTITUTION.md, MODES_AND_RECIPES.md, IMAGE_EDITOR.md, VIDEO_EDITOR.md, TEXT_AND_SEQUENCE_EDITOR.md |
| Economics | docs/economics/GENERATION_RESERVE.md, 10_COST_AND_BUDGET.md, COST_VISIBILITY.md |
| Quality | docs/quality/ARCHITECT_ACCEPTANCE.md, 12_QUALITY_AND_TESTING.md, 19_VALIDATION_PROTOCOL.md, 21_SPEC_REVIEW.md, STUDIO_ACCEPTANCE.md |
| Learning / Research | docs/learning/EVOLUTION_AND_LAB.md, 08_SELF_IMPROVEMENT.md; docs/research/HIGGSFIELD_EXPRESS_RESEARCH.md, MIXAR_BLENDER_RESEARCH_2026-10-05.md |
| Security / Rights | docs/security/13_POLICIES_RISKS.md, 20_SECURITY_AND_OPERATIONS.md |
| Localization | docs/localization/16_LOCALIZATION.md, UI_I18N.md, LANGUAGE_COVERAGE.md |
| Clients | docs/clients/WEB_MOBILE_RELEASE.md |
| Growth | docs/growth/CREATOR_PARTNERS_AND_DOGFOODING.md |
| Governance / Brand | docs/governance/ARCHITECT_AMENDMENT_2026-10-03.md, BRAND_NAME.md, CREATIVE_ANTI_TEMPLATE_2026-10-07.md, 11_ROADMAP.md, 14_OPEN_DECISIONS.md, 18_AGENT_HANDOFF.md, 22_UPGRADE_GUIDE.md; docs/adr/ |

## Источники истины и продолжение
- tasks/project.json — только здесь task status/dependencies/acceptance; untouched by amendment.
- tasks/architect_acceptance_overlay.json — normative additional AC/context, no statuses; read with task.
- tasks/features.json — полный существующий scope F01…52; future features retained, existing legacy JEWEL/Qevunara labels mean Ywon.
- docs/requirements.json — links new requirements to existing tasks/features; not runtime evidence.
- docs/STATE.md, docs/FEATURE_STATUS.md, tasks/BACKLOG.md — generated, not manually edited.
- handoffs/ARCHITECT_SPEC_2026-10-03.md — latest architecture handoff; bootstrap/B003_HANDOFF.md actual prototype limits.
- scripts/check_architect_spec.py — scoped amendment checker, does not replace project.py/make spec-check.
- PACKAGE_MANIFEST.json — original shipping snapshot; no new full release certification.
- docs/archive/v0.2/v0.3 — immutable history, not instructions. Legacy docs/01…22 remain redirects. Subject paths in a row share that department prefix unless written fully.

## Companion supplement A-20261005 — canonical routing
Read docs/governance/COMPANION_AMENDMENT_2026-10-05.md for exact additive scope and preserved gates.
- Desktop/device/protocol/OS/security/experience package: docs/architecture/DESKTOP_COMPANION.md.
- Voice session/duplex/background-addressability/privacy/approval: docs/architecture/COMPANION_VOICE.md; actual control-plane vs local audio/real-OS evidence in bootstrap/B054_HANDOFF.md and bootstrap/B055_HANDOFF.md; launch guide bootstrap/COMPANION_AUDIO_PILOT.md.
- Eight opportunity experiments/special scopes: docs/learning/COMPANION_SCENARIOS.md.
- Prototype→target obligations, vertical slices, source-review gaps: docs/governance/IMPLEMENTATION_TRANSITIONS.md (not task state).
- ADR0006 accepted boundary; ADR0007 proposed concrete implementation choices: docs/adr/0006-desktop-companion-boundary.md, docs/adr/0007-working-prototype-stack.md.
- Latest docs handoff: handoffs/COMPANION_SPEC_2026-10-05.md. Actual bounded runtime evidence: bootstrap/STATUS.md + referenced latest handoff + code, not only historical B-003 summary.
- Existing requirements/overlay extended, canonical project/features IDs and generated views preserved. New AC names A-20261005-*; overlay schema and original amendment_id retained for checker compatibility.

- Optional local Russian ASR/reviewed shared-core intake: bootstrap/COMPANION_ASR_PILOT.md, bootstrap/B056_HANDOFF.md; COMPANION_VOICE.md/TR-10 retain full-dialogue obligations. B-055 default no-ASR privacy applies unless explicit B-056 CLI+UI consent.

## Mixar / Blender research supplement — 2026-10-05
- Sources, verified facts vs claims, license/backend limits: docs/research/MIXAR_BLENDER_RESEARCH_2026-10-05.md.
- Stage placement/candidate P5 set: docs/governance/11_ROADMAP.md; full map docs/product/17_MASTER_PLAN.md.
- Typed worker/artifact/publish: docs/studio/SCENE_COMPILER.md; recipes/reuse: docs/production/15_STUDIO_SKILLS.md.
- Accepted-result routing economics: docs/production/06_MODEL_ROUTER.md; tests: docs/quality/STUDIO_ACCEPTANCE.md.
- Change/evidence/continuation record: handoffs/MIXAR_SPEC_2026-10-05.md.
Docs-only, existing phases/gates/task state preserved; no Mixar connection, runtime/paid activation or main merge.

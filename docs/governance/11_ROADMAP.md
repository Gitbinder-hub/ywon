# 11. Дорожная карта v0.4 — гейты вместо обещанных недель

Полный scope: docs/product/17_MASTER_PLAN.md. Задачи/зависимости/статусы: tasks/project.json.
План рассчитан на агента-разработчика и владельца, который проверяет смысл и результаты.
Календарь оценивается после P0; бюджет и SLA до доказательств не обещаются.

| Этап | Результат | Гейт |
|---|---|---|
| P0 Evidence | реальный CLI explainer + повторы + cost/quality report | владелец принимает полезность и экономику или rework/pivot |
| P1 Foundation | contracts/data/auth/isolation/workflows/reservations/storage | failure/recovery/security tests и owner review |
| P2 First Product | три входа → brief/Bible → generation → базовый editor → review → export | пользовательский pilot без owner bypass; export независимо от API-аудита |
| P3 Repeatability | серия реальных запусков + 5 внешних пользователей | отчёт человеческого времени/качества/стоимости; решение expand/rework |
| P4 Learning | imports/Golden Library/experiments suggestions | data correctness, uncertainty, no unsupervised strategy mutation |
| P5 Studio Expansion | выбранные ветки Studio, raw editing, Long, localization | отдельный реальный benchmark и unit economics каждой ветки |
| P6 Safe Scale | ops/billing/support + public-release locales/Android/iOS | нагрузочные/security/restore tests, права, runway и market demand |

## Порядок P0
Q-001 owner acceptance/budget → Q-002 verified providers/rights → Q-003 measured evaluation design →
Q-004 real spike → Q-005 repeated eval → Q-005G owner decision.
Фундамент P1 не строится до принятого P0; допустимо явно принятое изменение плана в ADR.

## Гейты P1–P6
Каждый gate — отдельная owner task. REVIEW implementation не открывает dependent task.
Гейт может принять ограниченный scope с документированными residual risks либо вернуть rework.
Новый scope получает task и feature linkage; future feature не реализуется по одному красивому README.

## Прежние M0–M6
В архиве сохранены. Не считать их выполненными или одновременно действующим календарём.
Вместо 6 недель на foundation/mock-first — ранняя проверка реальных видео до широкого scaffold.
Не гарантировать 20 эпизодов/эксперимент на малой выборке к конкретной неделе.


## v0.4 amendments — staged ambition preserved
P0 remains real narrated proof before full app, no paid permission granted by archive upgrade.
P1 adds media-neutral editable contracts, cost projection and future-shell boundary (Q-036/037/044).
P2 adds practical baseline editors/three entrances/i18n/four roles (Q-038…042); Q-015G requires Q-041.
P3 checks novice usability and founding creator/dogfood plan (Q-043); no forced positive testimonials.
P5 selected studios/advanced tools only; Q-048 disabled until branch decomposition and owner scope.
P6 public-release languages Q-045, Android/iOS Q-046/047. Q-035G is safe-scale acceptance;
Q-049G is explicit public-release gate after both mobile clients/language checks/scale readiness.
Private P0–P3 pilot is not all-client public launch. Any web-first staged launch needs written owner
waiver/profile change with disclosed absent clients; cannot silently drop Android/iOS requirement.
F41 full Personal shell stays future; boundary now avoids redesign and permission leakage.

## Mixar research supplement — 2026-10-05, без ускорения этапов
Пользователь поручил встроить инженерные выводы в существующий план, не менять последовательность.
Это docs-only уточнение existing F12/F16/F17/F18/F19/F23/F31/F46 направлений, не новый этап, runtime
implementation, task acceptance или разрешение расходов/пилота/deploy/main merge.

| Место в существующем плане | Уточнение | Граница |
|---|---|---|
| P0 | competitor research — контекст provider/rights/eval отчёта | narrated spike и Q-001→Q-005G неизменны; Blender не новая предпосылка |
| P1 | typed scene/worker/artifact/publish contracts, revision/fence/idempotency и mechanical fixtures | в рамках доступных foundation tasks; не реальный Blender executor |
| P2 | reference roles, change/preserve constraints, revisions/reuse в базовом editor scope | без обязательного 3D/moodboard/scribble/full Cinema и без нового gate |
| P3 | accepted-result cost, correction time и сохранность правок в existing repeatability report | не отдельный конкурентный rollout |
| P4 | reuse/effort/route experiments и reviewed skill provenance в existing Lab | не production self-activation и не обучение весов |
| P5 | при выборе Cinema/Blender branch — bounded decomposition adapter/skills/evals | Q-048 остаётся disabled до decomposition/owner scope; существующие gates обязательны |
| P6 | безопасность/restore/license/distribution для реально выбранной реализации | client/public-release scope не сокращается |

В выбранной P5 branch candidate first set: prepared product turntable/orbit, dolly/push-in,
material/light targeted edit. Pure Blender output сначала baseline; optional generative finish —
отдельное сравнение с final fidelity. Это порядок внутри будущей выбранной ветки, не перенос на P0–P2
и не обязательство разом построить catalogue/rigging/characters/Blender fork.

Канонические требования: `docs/studio/SCENE_COMPILER.md`, `docs/production/15_STUDIO_SKILLS.md`,
`docs/production/06_MODEL_ROUTER.md`, `docs/quality/STUDIO_ACCEPTANCE.md`. Research:
`docs/research/MIXAR_BLENDER_RESEARCH_2026-10-05.md`; handoff: `handoffs/MIXAR_SPEC_2026-10-05.md`.
Task state/dependencies/acceptance остаются в tasks/project.json; эта работа их не меняет.

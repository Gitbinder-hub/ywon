# 05. Производство — durable state machine

## Первый поддерживаемый путь
Brief → Script → ScriptApproval → Storyboard/Estimate → Reference → Motion(optional) →
Audio → Edit → TechnicalQA → ContentReview → FinalApproval → Export → Publish(optional) → Observe.
P0 использует этот путь CLI; P2 — пользовательский workflow. Learn/Localize расширяются позже.

## Вход и provenance
Pinned Bible/Genome snapshot, content_language, knowledge sources, consent/license refs,
budget envelope, format, supported provider capabilities. Каждая новая правка — версия manifest,
с указанием invalidated downstream steps. Принятые ассеты переиспользуются, не заменяются молча.

## Гейты
- Script: факты с источниками или явным статусом; critical unsupported claim блокирует финал.
- Storyboard: сцены и шоты с различимыми действиями, durations, budget и execution fidelity.
- Reference: identity/style проверены доступными методами, human approval при риске.
- Motion: предоплата/резерв, submit/poll/reconcile. Timeout → unknown/check status, не новый платёж.
- Audio: лицензии, consent, словарь произношения, alignment, mix.
- Edit: используем фактическую длину аудио/ассетов, не только выдуманные таймкоды сценария.
- TechnicalQA: duration/resolution/fps/black frames/audio/subtitles; report сохранён.
- ContentReview: соответствие, факты, артефакты, стиль; модель-критик — советник.
- FinalApproval: человек принимает точную version/hash. Новая правка аннулирует approval.
- Export: MP4 + subs + metadata + provenance/cost/QA report.
- Publish: официальное API после разрешения; crash-after-upload reconciliation; manual package всегда доступен.

## Tiers и degraded modes
T0 изображение+2D движение; T1 шаблонная моушн-графика/2.5D; T2 3D и его подготовка;
T3 стандартное AI-video; T4 premium hero shots. Это тип исполнения, не универсальная лестница качества.
Доля AI-motion выбирается/подтверждается пользователем по смете. Недоступное движение не заменяется
несоответствующим эффектом без отчёта и согласия, если изменение существенно.

## Повторы и остановки
Идемпотентен наш переход, не обязательно внешний вызов. Каждая попытка с собственной evidence/cost.
Максимум повторов и совокупный бюджет определены до запуска. Unknown outcome — reconciliation.
После лимита: needs_human или degraded proposal. Insufficient_material/unsupported/budget_exhausted — нормальные outcomes.
Safety rephrase — только подтверждённое ложное срабатывание, без обхода политики; отказ сохраняется.

## Сохранённые расширения
Long: блоки с монтажными переходами, больше дешёвых сцен; не обещает длинную непрерывную генерацию.
Carousel: Script → slides → layout → export. Raw footage: ASR → candidate clips → evidence → review → export.
Localize: subtitle pass прост; dub может требовать нового timeline и lipsync. Реализуется отдельной задачей.
Schedule/autopublish включается только после action-specific policy gate и стабильных измерений.


## v0.4 branching without duplicating core
Common Brief→Inputs→Estimate/Approval→Produce→EditableCandidate→QA→Review→Export.
Video retains Script/Storyboard/Audio/Timeline gates; static path uses layout/layers;
text path uses structured blocks/claims; sequence composes versioned children.
Recipe determines steps and editor; all reuse durable operations/reservations/provenance.
Manual and batch are modes over one DAG. Targeted revisions invalidate affected dependencies only;
preview/pilot price visible; accepted template→plan is proposed, publication permissions unchanged.

## 3D candidate→publish и адресные ревизии (этапы сохранены)
При активированном Exact3D маршруте existing Produce→EditableCandidate→QA→Review использует isolated
worker artifact и typed publish из `docs/studio/SCENE_COMPILER.md`. Общий durable operation journal,
authority, cumulative generation unit и stop/reconcile правила сохраняются; нет отдельного 3D ledger.
Parallel independent builds завершаются проверяемой сборкой, не concurrent blind writes в live scene.
Статус worker complete не означает scene published, QA passed или final accepted.

Change request хранит target/base revision, change и preserve constraints; новая версия перечисляет
invalidated nodes. Геометрия/материал/камера/текст/генеративные media не сливаются в один непроверяемый
результат. Final media и editable source выдаются раздельно; save→reload→export и сохранность external
resources проверяются. P0 path, P2 baseline editors и P5 activation не меняются.

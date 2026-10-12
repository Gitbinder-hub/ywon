# Qevunara Desktop Companion — amendment A-20261005

Дата: 2026-10-05, Asia/Bangkok. Основание: пользователь явно поручил дополнить спецификации отсоединяемым Домовым, Windows 10/11 первым пилотом, последующими Linux/macOS, восемью сценариями полезности и надёжной передачей незавершённой архитектуры между агентами.
Статус: принятые требования к проектированию; docs-only изменение. Base spec 0.4.0 сохраняется. Это НЕ работающий Companion, не приёмка Q-001/P0/P1, не разрешение paid calls, purchases, deploy, публикации, нового клиента в public release или main merge.

## Предмет и приоритет
Дополняет A-20261003; не отменяет frozen B/R/C, ancestor caps, stop-before-third, права/согласия, independent QA, P0→P6 и существующий mobile/public-release scope. Разрешение текущего чата — изменение спецификаций и запись в текущую development branch. Исполнение пилота требует отдельного выбранного scope/ресурсов/разрешений и соблюдения dependencies.
1. Один Qevunara core, Factory и Desktop Companion как независимые execution adapters. Никакого fork budget/policy/mission semantics.
2. Companion снимается/отключается без остановки Factory; отсутствие ноутбука не блокирует независимые облачные задания.
3. Первый целевой пилот Windows 10/11 x64. Это два отдельных проверяемых targets, не автоматическая совместимость. Linux и macOS — сохранённый дальнейший scope после пилота, не готовые clients.
4. Публикации Factory идут через отдельно разрешённые official API adapters; manual export остаётся при отсутствии API. Companion не обязательный browser publisher. Первый publishing use case — обычный пользователь с 3–4 площадками; multiaccount добавляется отдельно после проверки одного account/channel path. Наличие 3–4 интеграций/автопубликации не заявляется до platform evidence.
5. Перенос «своего Архитектора» = device pairing + scoped skills/settings, не копия облачных секретов/модели/всей private memory. Package/config import не выдаёт полномочий.
6. Две среды дают опыт через проверенные ImprovementPackages. Это recipe/tool improvement, не автоматическое обучение весов и не self-approval production changes.
7. Рабочие vertical slices вместо ещё одного detached preview. Прототипы не выдаются за production; переходы/замены/миграции и evidence обязательны.
8. Восемь идей — catalog of bounded experiments, не восемь активированных бизнесов, не обещание скорости/доходности. Общие нужные механизмы включены в Companion contract.

## Канонические владельцы требований (не дублировать)
| Предмет | Документ |
|---|---|
| Runtime/device/protocol/OS/security/experience transfer | docs/architecture/DESKTOP_COMPANION.md |
| Сценарии, специальные scopes и проверяемые исходы | docs/learning/COMPANION_SCENARIOS.md |
| Prototype→target transitions, vertical slices, review findings | docs/governance/IMPLEMENTATION_TRANSITIONS.md |
| Граница ядра и клиента | docs/adr/0006-desktop-companion-boundary.md |
| Конкретный stack proposal и нерешённые choices | docs/adr/0007-working-prototype-stack.md |
| Дополнительные AC и traceability | tasks/architect_acceptance_overlay.json; docs/requirements.json |
| Передача этой работы | handoffs/COMPANION_SPEC_2026-10-05.md |

## Не второй план задач
Task state/dependencies/acceptance остаются только tasks/project.json. Existing overlay сохраняет schema_version/amendment_id для совместимости; новые AC именованы A-20261005-* и добавлены к тем же task entries. Task mapping задаёт обязательства к контрактам и target design, НЕ притворяется, что Q-044 уже реализует весь Companion.
Реализация пилота должна получить отдельную decomposition в canonical registry при допустимом этапе либо explicit bounded bootstrap exception, без изменения старых gates ради обхода. Эта docs-only работа такую implementation exception не выдаёт. Transition/scenario IDs — requirement anchors, не task statuses.
Полный F41/F31/F38/future scope не активирован. Ограниченный локальный lab pilot возможен только отдельным разрешением и не принимает P6. Новая публичная desktop distribution имеет свой readiness gate и не меняет Android/iOS Q-049G.

## Evidence boundary
Свежий source review выполнен на b588e3884d0f566812009763c6133286bd337d74. Найденные runtime gaps записаны как work to verify/fix, не устранены документацией. Полного checkout нет: project.py/make/full-links/full runtime/Windows/live eval NOT_RUN. Доступные changed-scope checks описаны в handoff. Архивы, historical handoffs, shipping manifest, generated views и product task state не изменяются.

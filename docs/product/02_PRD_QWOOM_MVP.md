# 02. PRD — первый продукт и последующие расширения

## Первая аудитория и позиционирование
Креатор/эксперт, которому нужна регулярная подача полезных знаний. Ближайший формат — narrated explainer.
Пользователь выбирает тему и язык; продукт не привязан к каналу владельца.
Профессиональный монтажёр и полная стратегия остаются расширениями. Новичок получает три входа
и базовую редактируемость на P2: docs/product/MANUAL_JOURNEY.md. Не все студии запускаются одновременно.

## P0: проверка до большого приложения
Реальные изображение/TTS/ограниченный motion → MP4 → технический QA + человеческая оценка.
Нет аккаунтов, UI-студии и публичного автопостинга. Скрипт/манифест достаточно.
Эксперимент и критерии: docs/quality/19_VALIDATION_PROTOCOL.md. Расходы только после Q-001.

## P1–P2: вертикальный пользовательский цикл
E1. Email-вход, workspace, owner/editor/viewer; изоляция API/worker/storage и тесты доступа.
E2. Короткий онбординг: язык из поддерживаемого списка, аудитория, цель, источник знаний,
лицо/голос, бюджет, review, согласия при необходимости. Стратегические шаги сохраняются как progressive onboarding.
AC: нет скрытого owner bypass; можно продолжить; обязательные рисковые поля подтверждены.
E3. Project → Channel → Series → Episode → Scene → Shot; Bible project/channel/series/episode.
AC: resolveBible/resolveLanguage однозначны, эпизод закреплён за основным каналом, ссылки на версии immutable.
E4. Director Chat: типизированные команды plan/script/run/revise/ask/report с карточками утверждения.
AC: side effects только через dispatcher; invalid JSON, stale version, unauthorized command отклоняются.
E5. Один pilot и небольшая серия; сценарий → кадры → motion → звук → монтаж → QA → review → export.
AC: пригодный MP4, SRT/ASS/metadata/report; повтор шага не повреждает принятые результаты.
E6. Смета, резерв, факт, потолок; paid job reconciliation; human stop; delta per revision.
AC: конкурентные задачи не превышают доступный резерв; неизвестный job не оплачивается повторно вслепую.
E7. Медиатека финала и исходников; видимые provenance/license/consent; экспорт и политика хранения.
AC: повторный монтаж возможен только из сохранённых точных ассетов и совместимой renderer version.
E8. Публикация: ручной пакет — обязательный путь. YouTube OAuth/upload — после API-проверки и reconciliation.
AC: approval привязан к версии финала; повтор и crash-after-upload покрыты интеграционным сценарием.

## P3: принятие продукта
Повторные реальные запуски и 5 внешних пользователей; матрица ошибок, человеческая нагрузка,
стоимость, качество и понятность. Цели и статистическая неопределённость публикуются, не скрываются.

## Сохранённые последующие эпики
Контент-план/расписание; Long/Carousel; автомонтаж; персонажи/twin; Cinema/Blender/VFX;
липсинк/inpaint/edit/upscale; subtitle/dub/mirror; аналитика/Golden Library/experiments;
Skill Lab/Scout/Ops; биллинг/команды/marketplace. Связи — tasks/features.json.
Автономность публикации не включается одним глобальным переключателем без оценки действия.

## Негарантируемые AC v0.2 заменены
- «Любую команду откатить» → обратимые local changes и явные compensating actions.
- «3–5 клипов из любого исходника» → предложить до N подходящих клипов или insufficient_material.
- «Все пресеты без платных вызовов» → задекларированный degraded fallback или unsupported.
- «Воспроизвести генерацию по seed» → сохранить точные результаты и provenance, без обещания одинаковой регенерации.
- «Растут CTR/удержание» → измерять сопоставимые когорты и неопределённость.


## Обязательное дополнение v0.4 к P2
E9. Три onboarding entry modes → один brief → proof → result/editor/chat workspace → export/plan proposal.
AC: save/resume/switch без потери данных, no hidden required fields, unsupported actions не оплачиваются.
E10. Basic text/image layers/video trim/overlays/subtitle editor и один bounded static recipe.
AC: manual edit→save/reload→server export; font parity; version conflict/undo; accepted assets retained.
E11. Cost panel до CTA, plan/task breakdown, strict >10% baseline alerts и блок/reapproval по policy.
E12. Responsive UI + RU/EN reviewed candidate catalogs; language capability matrix, UI/content separate.
E13. Four responsibilities through one validated dispatcher; model-free hard security/budget guards.
P2 gate now includes Q-041 editor/novice QA. Wide ecommerce, ads, photostudio, carousels and advanced AI edit
remain selected P5 branches. Public launch requires locale/mobile readiness Q-049G; private pilot does not.

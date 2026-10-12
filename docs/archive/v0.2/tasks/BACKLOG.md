# BACKLOG

Формат задачи:
```
## T-XXX <название>  [status: TODO|DOING|REVIEW|DONE] [labels]
goal: зачем
context: файлы, которые нужно прочитать (и только их)
ac: критерии приёмки
out_of_scope: что не делать
```

## T-000 Перевод спецификаций на английский [TODO] [docs]
goal: снизить стоимость контекста.
context: README.md, AGENTS.md, docs/*
ac: все docs переведены, смысл не изменён, русские оригиналы в docs/ru/; AGENTS.md ссылается на английские версии.
out_of_scope: изменения содержания.

## T-001 Скелет monorepo [TODO] [infra] (M0)
context: AGENTS.md, docs/03_ARCHITECTURE.md
ac: pnpm workspaces; apps/web, apps/api, packages/{contracts,core,orchestrator,router,memory,policy,budget}, workers/media (Python, uv); у каждого README ≤ 60 строк; `make dev`, `make check` работают; CI на GitHub Actions.

## T-002 Postgres + миграции + pgvector [TODO] [infra] (M0)
context: docs/04_DATA_MODEL.md (разделы «Люди и доступ», «Управление»)
ac: docker compose с Postgres 16+pgvector; инструмент миграций; таблицы users, workspaces, memberships, commands, budgets, policies; тест изоляции по workspace.

## T-003 Auth magic link [TODO] [security] (M0)
context: T-002 результат, docs/02 E1
ac: регистрация/вход по email (в dev — письмо в лог); сессии; роли; e2e-тест входа.

## T-004 Command Journal [TODO] [core] (M0)
context: docs/03 §Ключевые решения п.2, docs/04 commands
ac: append-only запись; команда с parent; откат через компенсирующую команду; unit-тесты.

## T-005 Contracts v1 [TODO] [core] (M1)
context: docs/04, docs/05
ac: zod-схемы Project, Series, Bible, Episode, Scene(tier), Shot, EpisodeManifest, TimelineJSON; генерация JSON Schema; тесты валидации.

## T-006 Иерархия + наследование Bible [TODO] [core] (M1)
context: packages/contracts/README.md, docs/02 E3
ac: CRUD; resolveBible(episode) сливает project→series→episode; тест «серия B не видит канон серии A»; resolveLanguage(episode) (см. T-011).

## T-007 Model Router: интерфейс + mock-адаптеры [TODO] [router] (M1)
context: docs/06
ac: интерфейс ProviderAdapter (limits v0.2: startEndFrame, maxRefs, audio, cameraControl, maxClipS); mock для text/image/video/tts/asr; price() по config/pricing.yaml (usd_per_second[resolution][audio]); fallback-цепочка; normalizeError; contract-тесты.

## T-008 Бюджет и сметы [TODO] [security] (M1)
context: docs/10, docs/09 §Автономность
ac: смета эпизода по tier-миксу; лимиты проект/месяц/эпизод; превышение → пауза + запрос; 100% unit-покрытие.

## T-009 Director Chat v1 [TODO] [web] (M1)
context: docs/02 E4, packages/contracts/README.md
ac: чат, привязанный к уровню иерархии; LLM выдаёт типизированные команды (structured output); карточки плана с кнопками принять/править/стоп; всё через журнал.

## T-010 Channel Launch Interview → Genome [TODO] [core] (M1)
context: docs/07 §Channel Launch Interview, docs/14, docs/16 §Онбординг
ac: машина состояний этапов 1–13 (`onboarding_sessions`), пауза/продолжение; факты с tier; 3 стратегии со сметой; обязательные поля нельзя пропустить и нельзя автозаполнить; friction-метрики пишутся.
out_of_scope: этап 14 (пилот) — в M3.

## T-011 Языковая модель [TODO] [core] (M1)
context: docs/16, docs/04 (channels, series, episodes, localizations)
ac: channels.content_language NOT NULL без default (BCP-47, валидация); series.language_override; resolveLanguage(episode) с unit-тестами; users.ui_language отделен от языка контента; попытка создать канал без языка → ошибка.

## T-012 No-defaults scanner [TODO] [quality] (M1)
context: docs/14, docs/12 §Тесты v0.2
ac: тест в `make check` находит захардкоженные языки/ниши/персонажей вне fixtures/; 3+ разнообразные фикстурные персоны.

## T-013 Director LLM адаптер [TODO] [router] (M1)
context: docs/06 §Director, docs/10 §Director LLM
ac: capability text.director; ID модели из config/models.yaml; сборка контекста стабильный префикс → переменная часть; prompt caching; structured output (команды plan_episode/run_skill/revise_shot/ask_user/report); tokens_cached и cache_hit_rate в agent_runs; mock для CI.

## T-014 Cost Ledger + pricing.yaml [TODO] [security] (M2)
context: docs/10, docs/04 §Расходы, docs/research §Цены
ac: таблица cost_ledger; запись на каждый платный вызов; seconds_generated/seconds_kept; waste_ratio по эпизоду/модели/навыку; pricing.yaml с датой проверки цен; 100% unit-покрытие.

## T-015 Skill Runtime [TODO] [core] (M2)
context: docs/15 §Формат навыка, docs/04 §Студия
ac: JSON Schema skill.yaml; загрузчик skills/; исполнитель шагов с журналом; retry-правила (rejoin без дублей, same_error_twice → change_params, max_attempts); delivery report; версии и статусы; evals-раннер на моках.

## T-016 Библиотека пресетов камеры v1 [TODO] [media] (M2)
context: docs/15 §A
ac: модель `presets`; 10 пресетов (dolly in/out, pan, tilt, orbit, crash zoom, dolly zoom, whip pan, push-in, reveal, parallax) с 2.5D/FFmpeg-реализацией; жанровая логика как данные (8+ жанров); превью каждого пресета рендерится бесплатно в CI.

## T-017 Research: Higgsfield skills harvest [TODO] [research] (M2)
context: docs/research/HIGGSFIELD_EXPRESS_RESEARCH.md, docs/15
ac: разбор всех SKILL.md репозитория higgsfield-ai/skills и COOKBOOK.md; полный список camera controls и VFX-пресетов; таблица «их функция → наш навык → чем лучше»; обновленный каталог docs/15; проверка цен видео-API.
out_of_scope: копирование проприетарных промптов.

## T-018 Owner Launch Run: синтетический E2E [TODO] [quality] (M2)
context: docs/12 §Owner Launch Run, docs/07 §Channel Launch Interview
ac: Playwright + LLM-«синтетический пользователь» проходит интервью на 3 персонах в mock-режиме; тест запрета owner_bypass; отчёт трения.

(Дальнейшие задачи M2+ — Storyboard Lock, мульти-шот секвенсор, Character Pack, Lipsync Studio, Localize-шаг — генерирует Architect в конце M1 по docs/11 и docs/15.)

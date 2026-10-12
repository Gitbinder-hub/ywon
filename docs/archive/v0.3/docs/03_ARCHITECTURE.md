# 03. Архитектура — минимальная надёжность, расширяемые границы

## P0
Небольшой CLI spike + JSON manifest + локальное хранение + реальные API + FFmpeg.
Это эксперимент, не production architecture. Секреты/env и лимит расходов обязательны уже здесь.
Не переносят весь spike в продукт автоматически: сохранить подтверждённые интерфейсы и результаты.

## P1 и далее
Модульный монолит TypeScript, независимые Python media-workers; Postgres (очередь и данные), S3 storage.
```
apps/web, apps/api
packages/contracts, core, orchestrator, router, memory, policy, budget
workers/media, asr_tts                 # первый продукт
workers/blender                      # P5, после проверки control pipeline
infra, config, skills, fixtures
```
Next.js + Fastify/Hono — выбрать в ADR до scaffold. Auth — поддерживаемая библиотека с аудитом;
не считать исторический список библиотек готовым выбором. pgvector добавить при нужде retrieval, не как блокер.
Postgres queue — pg-boss/graphile-worker по ADR; Redis/Temporal только при измеренной необходимости.
1 VPS и object storage — старт, не обещание масштаба. Медиа-конкуренция ограничена по CPU/RAM/IO.

## Инварианты
- Contracts-first, но чтение контрактов не заменяет чтение кода при интеграции.
- Commands append-only; projections могут изменяться, события нет. Compensating actions имеют собственный ID.
- Workflow durable: attempt/job/request IDs, leases, heartbeats, retries, cancellation, dead-letter, recovery.
- Budget reserve + outbox intent до side effect; transaction граница не включает внешний API.
- Manifest pinned: Bible/genome fact snapshot, skills/models/prompts/assets/renderer/fonts/LUT версии.
- Final render детерминирован в пределах зафиксированного окружения/ассетов; API-regeneration недетерминирована.
- Timeline минимальный на P2: клипы, trims, аудио, титры/subs, базовые transitions. Полный editor UI — P5.

## Storage / воспроизводимость
Hot TTL — политика пользователя и проекта, не безусловное удаление через 30 дней.
Used source assets + мастер сохраняются в нашем или проверяемом user storage; не удалять последний доступный
оригинал без принятой retention policy и проверки копии по checksum. Loss/removal помечает rerender unavailable.
Наши метаданные, previews, consent links и manifests тоже имеют retention/deletion policy: «всегда у нас» не правило.
Бэкапы, восстановление, удаление и перенос подробно в docs/20_SECURITY_AND_OPERATIONS.md.

## Расширяемость
Capabilities версионированы, feature downgrade явно отображается пользователю.
Внутренний tool registry может иметь MCP-adapter; не означает автоматическую совместимость любой модели.
Не используем AGI-ready как acceptance criterion: проверяем конкретные контракты, миграции и замены.

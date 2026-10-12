# ADR 0008 — Auth и tenant-isolation для Q-007

Статус: decided 2026-10-07 в Q-007 (decided+pinned, как ADR 0007). Зависит от ADR 0001/0007.

## Что выбрали — простыми словами
Раньше был прототип без входа — любой мог дернуть API на localhost. Теперь добавляем вход и заборы: каждый пользователь входит по email, получает сессию, и видит только свои рабочие пространства. Как ключи от квартир — твоим ключом чужую дверь не открыть, даже если угадаешь номер.

## Решения (чтобы не выдумывать потом)
| Вопрос | Выбор для прототипа | Почему | Что дальше |
|---|---|---|---|
| Auth провайдер | Локальный HMAC-сессия + email (прототип) + путь к OIDC | OIDC (совместимый провайдер) — финальный целевой, но для P1 достаточно проверенной сессии без самописных паролей. Библиотека HMAC + httpOnly cookie, в проде заменим на выбранный OIDC провайдер отдельным ADR update | Выбор конкретного hosted OIDC (Auth0/Keycloak/Clerk) — отдельный чек до продакшн deploy, не в этом PR |
| Хостинг | Пока localhost + будущий 1 VPS/S3 (как в ADR 0007) | Не прошло gate выбора Hosted vs VPS — фиксируем что оба варианта открыты, дефолт не изобретён | Решение Hosted vs Hetzner/Contabo — в Q-008/Q-010 с измерением |
| Хранение секретов | Env / OS store, никогда в git/лог | .env.example + .gitignore +.env | OS keychain для десктопа (см. DESKTOP_COMPANION) |
| Хранилище | Private S3-совместимое, ключи `workspaces/{workspaceId}/...` | Tenant-префикс = изоляция на уровне ключей + проверка signed URL | Сканер/карантин — по media-boundary плану |
| База | Postgres + миграция 001 (FK workspace_id, checks) | Offline контракты проверяют изоляцию, реальная БД поднимется на VPS | pg-boss очередь позже |

## Что это даёт для Q-007 AC
- AC1: email/session + роли owner/editor/viewer + проверки в API, секреты не в git/log — сделано (packages/auth + apps/api/src/auth.ts)
- AC2: тесты users/workspaces/API/worker/storage — cross-tenant запрещён (tests/auth-tenant.test.ts, tests/media-boundary.test.ts, tests/url-ssrf.test.ts)
- AC3: ingest лимиты (image 20MiB, audio 50MiB, video 500MiB, URL 5MiB/10s, zip-бомбы) + SSRF защита (блок private IP, metadata 169.254.169.254, localhost) + sandbox план — fail-closed, без внешнего вызова в P1

## Границы и риски
- Прототип-сессия не OIDC; переход на OIDC потребует миграцию токенов/кук — задокументировано.
- Real Postgres/S3 не подняты в Q-007 — изоляция проверена контрактами + тестами, не live infra (честно указано в handoff).
- Rate limiting/CSRF/OAuth PKCE — схемы описаны, реализация в Q-008.

Связи: docs/security/20_SECURITY_AND_OPERATIONS.md, docs/architecture/04_DATA_MODEL.md, infra/migrations/001_tenant_consistency.sql, packages/auth/src/index.ts

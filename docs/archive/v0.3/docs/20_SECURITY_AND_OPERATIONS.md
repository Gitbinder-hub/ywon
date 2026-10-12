# 20. Безопасность и эксплуатация — от локального эксперимента до SaaS

## Уже в P0
Env secrets вне git; sanitized logs; approved spend; права материалов; no public upload without approval;
не исполнять сторонний skill/downloaded code без review. Paid retry unknown state — stop/reconcile.

## P1–P3 минимум
Tenant-scoped FK/API/worker queries/object keys/signed download checks; global catalog отдельный.
Auth sessions/rate limiting/role checks; CSRF/OAuth state/PKCE where applicable; encrypted secret refs.
Media ingest: size/type/duration limits, decompression/zip protections, ffmpeg sandbox/resources/timeouts;
URL fetch SSRF defenses, no access to internal metadata endpoints; webhook signature/replay protection.
Agents: allowlisted tools/schemas, no secret read, no arbitrary shell, payload prompt injection is data.
Queue: lease/heartbeat/timeout/dead-letter/backpressure. Kill switch вне модели.
Budget: атомарный reserve/reconcile; payments and policy changes independent approvals.

## CI и code changes
Protected branch, review for packages/policy/packages/budget/auth/infra/secrets; actual CODEOWNERS создаёт
владелец с реальным GitHub login/team, не выдуманный username. Spec rules не заменяют access controls.
Development sandbox не получает production credentials. Builds из untrusted PR без secrets.
Third-party dependencies pinned/reviewed; license/SBOM as scale needs.

## Storage/privacy
Checksum copies; restore tests; no deletion last source copy by routine TTL.
Consent revocation and deletion across manifests/previews/vector memory/backups according policy;
legal retention documented, workspace exports, right-to-delete handling by owner.
Backup schedule/retention/restore objective выбирается и тестируется; наличие backup job ≠ restore works.
User cloud storage adapter имеет revoked OAuth/full disk/network failure behavior.

## P6 SaaS
Per-user quotas/abuse detection, concurrency fairness, reliable billing credits/holds/refunds,
monitoring/alerts/support, incident runbooks, load tests, capacity/cost bounds and recovery.
User skills sandbox/schema/signature/egress limits and moderation before marketplace.
Production self-changing agents require independent review, staged rollout/rollback; policy/budget immutable to agents.
Миллионы аудитории роликов и миллионы платящих пользователей — разные capacity plans.

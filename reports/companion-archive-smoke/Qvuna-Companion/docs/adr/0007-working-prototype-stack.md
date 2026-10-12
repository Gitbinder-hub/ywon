# ADR 0007 — concrete working-prototype stack proposal

Статус: proposed implementation selection; must be resolved in applicable P1 task before scaffold/dependencies. Date 2026-10-05. Retains ADR 0001, not a second architecture.

| Layer | Proposed choice | Evidence/decision still needed |
|---|---|---|
| API | Fastify + TypeScript using existing contracts | Maintained pinned versions, auth/schema/streaming compatibility; no raw HTTP scaffold deletion before migration tests |
| Web | Next.js, incremental authenticated workspace | Migration/reuse of working Studio, deployment/toolchain choices, E2E/a11y; not acceptance of production redesign |
| Data | PostgreSQL | Migrations/FKs/tenant rules, backups/restore, test DB, provider/hosting decision |
| Queue | pg-boss on Postgres | Transactional intent/job admission, leases/replay/cancel/worker recovery with pinned version; graphile-worker alternative only via documented ADR change |
| Artifacts | Private S3-compatible object storage | ADR0005 auth/quarantine/scanning/rights/TTL/deletion; choose hosting/data residency and cost cap |
| Local runtime | Existing Node/TS + Python + SQLite | Windows10/11 supported toolchain/Python discovery and bounded native adapters; no Docker/WSL prerequisite |
| Desktop UI | Small launcher/tray; native wrapper after packaging spike | Compare suitable wrapper e.g. Tauri against runtime footprint, permissions, signing/updater/licence; do not couple core to it |
| Auth | Maintained OIDC-compatible provider/library | Exact product/version, account/device/session/revocation/tenant binding and abuse tests; no homemade password/token scheme |
| Secrets/ops | OS store locally, scoped server secret store; redacted logs/CI | Supported service/hosting, credential access separation, retention, restore; purchase/deploy permission separate |
| Retrieval | Structured SQL/source refs first | pgvector only after measured need/quality/privacy benchmark; never permission or ledger store |

Unresolved choices have no invented defaults: hosted vs VPS, auth product, object-storage/scanner, installer signing, minimum OS builds and dependency pins. No recommended price taken as billing promise. One small server/managed services + object storage initially; introduce Redis/Temporal/GPU/microservices only by measured load and ADR.
Prototype exit: staging auth→project/job→real artifact→QA/export with observed costs if paid, plus local paired job and crash/revoke recovery. Tests using production-shaped infrastructure do not authorise production deployment. See docs/governance/IMPLEMENTATION_TRANSITIONS.md for migration/retained paths and task mappings.

# apps/api

Local-only HTTP dry-run entry point.

## Public API

- `createApp()`
- `GET /api/health`
- `POST /api/dry-run`
- `GET /api/live-results/:runId` only when `liveResultDatabase` / `Ywoom_LIVE_RESULT_DB` points to an existing B-043 receipt database

The live-result route exposes sanitized metadata only. It never serves media, raw manifests, local paths, secrets, publication state, or write operations.

## Invariants

No production auth/tenancy, paid work, provider execution, public media storage, publication, or production readiness. Server binds to `127.0.0.1`; production use is forbidden.

Scope remains bounded bootstrap work; Q-task and owner gates are unchanged.

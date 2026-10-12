# Qevunara Architect — B-004 offline preflight

Работающий детерминированный planning module, не LLM, provider client или production orchestrator.
Exports: planProduction(unknown), planRecovery(unknown), fingerprint, monetaryPreview.
Строгие typed JSON inputs; JSON schema validation rejects unknown fields/duplicates/unsafe IDs/nonfinite or fractional money. <=24 scenes, <=32 capabilities, <=128 asset refs; seconds integer 1..600, USD integer minor units. Другие валюты/длительности/сложные 3D camera parameters пока unsupported, не silent conversion.

## Что делает
По scene fidelity/controls/asset kinds/duration выбирает совместимый fixture-declared маршрут с наименьшей заявленной стоимостью и стабильным tie-break. Candidate capabilities не используются. Builds pinned produce→assemble→QA DAG; input/asset/capability/revision hashes; checks missing/unknown inputs. required exact_3d не fallback на prompt. Никакой оценки live quality через случайный score.
Unit B/R/C и ancestor allowance preview с integer half-up reserve; known initial price increase не расходует repair reserve. null provider/local processing price blocks ready status, unknown !=0. Assembly/QA nodes планируются, не исполняются; local costs должны явно входить в input. Fixture prices не официальные расходы и не measured compute.
Recovery emits deterministic proposal category/affected scenes/retained refs and hash. Unknown paid outcome→reconciling; rights→stopped; cap exceed/two failures/unchanged strategy→needs_user. Always requiresApproval; no command actually submitted.

## Trust / scope
executionAllowed=false, budgetReserved=false во ВСЕХ reports. verified_fixture означает статус тестовой декларации, не verified official provider, не runtime allowlist или permission. User input budget/attempt/asset claims не authoritative ledger/rights proof. Monetary preview helper не защищённый money guard. Recovery does not bind previous stored unit state: новый unitId не следует считать bypass prevention, поскольку здесь нет executor вообще.
For integration derive projectRemainingMinor/monthRemainingMinor as TOTAL allowance allocated to this unit before counting THIS unit's cumulative costs, excluding other workloads. Они не могут быть blindly raw ledger available balances после own reservations; future adapter resolves scopes and enforces atomically. No persisted approval/operation/leases/outbox/cancel/reconcile implementation.
CLI runs locally without network/providers/renderer/Blender. Linux no-follow/nonblocking bounded descriptor reads; exclusive output avoids overwrite. Не hardened production file service; output folder/inputs trusted local environment. Browser/UI/service integration not done.

## Запуск из genuine source branch (Node 24)
node scripts/architect_preflight.ts plan --input bootstrap/fixtures/B004-plan.json
node scripts/architect_preflight.ts recover --input bootstrap/fixtures/B004-recovery.json
Optional --output NEW_FILE writes exclusively. Exit 0 ready/proposed; 2 invalid/IO; 3 blocked/needs_user/reconciling/stopped. Recovery sample intentionally returns 3.
node --test tests/architect.test.ts
npx --no-install tsc -p bootstrap/B004.tsconfig.json
Использовать установленный pinned compiler, не скачивать packages этим примером. Full source make check remains next-agent obligation; current scoped evidence bootstrap/evidence/2026-10-03-architect/verification.json.

## B-005 persistent preview state
Typed bridge src/store.ts + workers/architect/store.py + scripts/architect_state.ts. SQLite local units/events/receipts, optimistic versions, replay, pinned budget/attempts/unknown-liability guards. No paid executor/auth/ledger; Postgres architecture unchanged. Read bootstrap/B005_STORE_DESIGN.md and B005_HANDOFF.md before integration. Latest scoped joint tests: 65 PASS; full repository regression NOT_RUN.

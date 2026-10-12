# B-005 — persisted offline Architect state / REVIEW

Base 39d639460661393414f5556d5a02ac5f18c98b18, branch bootstrap/spec-v04-foundation. Owner 2026-10-03 20:34:15 Bangkok delegated next coding block. Additive offline persistence on B-004 only; no Q claim/acceptance, dependency/phase change or spend activation. Scope/AC: B005.json. Design/known limits: B005_STORE_DESIGN.md.

## Actual code
workers/architect/store.py: SQLite preview store, schema application ID/version, BEGIN IMMEDIATE, WAL/FULL, units + events + receipts, expected-version guard, exact command replay, hash-chain integrity, unit bound/terminal stop, monotonic counters and pinned uncertainty. Trusted local worker, not service/auth.
packages/architect/src/store.ts: typed validation/bridge; B-004 planner/recovery validators invoked before persistence; fixed worker path/args, no shell, bounded child IO/timeout. scripts/architect_state.ts: actual create/revise/recover/stop/get/events command CLI. Two command fixtures and scoped config. B-004 code unchanged; existing API/UI/media workers unchanged.
25 new tests plus all 40 B-004 tests actually rerun together: 65 PASS, no failures/skips. Strict TypeScript7.0.2 and Python compile PASS. Actual CLI created/read same local DB via separate processes. Concurrent Node writers: one commit, one version conflict. Crash before SQLite commit: old snapshot retained. Append-only trigger and snapshot tamper checks pass. This is not paid external exactly-once proof or forensic audit security.
Environment Node24.14.1/Python3.13.14/@types-node18.19.130; existing types mismatch disclosed. Local reconstructed scoped sources/config, not full repo checkout. Full make check/spec-check/project.py/old full suites/CI/browser/live quality/production auth/billing NOT_RUN. Do not reuse historical 127 PASS. Records bootstrap/evidence/2026-10-03-state/verification.json; remote source hashes verified separately. Local DB/runtime journals not committed.

## Decisions / limits
SQLite chosen as stdlib offline prototype; Postgres P1 plan unchanged. No production queue/worker scheduling/lease/outbox/capability registry or paid API. Stored repair_proposed maps needs_user; no approved/running state. All executionAllowed/budgetReserved false. Costs/attempts are trusted local declarations, not verified ledger/QA facts. Protected policy/budget/auth paths not modified.
No automatic release from financialUncertainty: provider reconciliation absent; stop retains it. No supported budget amendment. Initializer crash can leave stale .init-lock/partial DB; fail closed and explicit inspection/backup required. Simulated transaction crash and established-store concurrency only; init-crash/power loss not tested. SQLite hashes/triggers not proof against DB owner.

## Next agent order
1. Pull actual branch/inspect current HEAD and foreign diff; read AGENTS, amendment, B004/B005 handoffs/design and applicable overlay/context. NEXT_CHAT_B005.txt contains copy-ready starter, not extra privileges.
2. Complete genuine checkout: project.py validate/status/next, make spec-check, make check, B005 scoped compile and joint tests. Fix regressions without weakening tests. Keep actual evidence.
3. Q-001/sequence/paid-zero gate remains. B-004/B-005 bounded code does not accept P0/P1. Owner acceptance required; no auto-gate or fake owner-confirmed.
4. Next bounded offline block: evidence-backed local capability registry (fixture vs verified/approved/revoked lifecycle, evidence expiry, pinned versions). Connect planning to stored registry rather than caller-proclaimed capabilities; still deny generation. Separate approval/actor design needed before calling it authoritative production registry.
5. Production integrations after genuine gates: Postgres transactions/migrations/auth/tenant scopes/outbox/ledger/reservations/reconcile with failure tests. Port domain contracts, not unreviewed SQLite prototype into production.
6. Then approved executor + own bounded scene rendering and targeted repairs; Blender/control claims remain measured P5 work. New model prices/terms officially verified, not assumed.
7. Preserve ambitions/features/locales/clients/research lab; don't rename Ywoom or erase JEWEL historical paths. Canonical core Qevunara, name clearance still open.

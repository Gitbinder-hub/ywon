# B-004 — offline Architect preflight / REVIEW

Owner message 2026-10-03 20:15:59 Asia/Bangkok requested one coding block and allowed assistant to choose. Narrowed to offline, additive planning/recovery code; this does NOT grant product-gate acceptance or any paid action. Base e60383479bb2c34959a23fe272ffff1f6bb56a52, branch bootstrap/spec-v04-foundation. Scope/AC in B004.json. No Q task claimed/started/accepted; no dependency/status/phase changes. User acceptance remains null.

## Implemented
packages/architect/src/index.ts: real strict validation, scene/capability matching, deterministic route selection on declared fixture prices, pinned produce/assembly/QA DAG, asset/input fingerprints, integer money previews, unknown-price/unsupported handling. planRecovery produces targeted action suggestions, retained refs, repair hash and stop escalation. Not AI reasoning, not autonomous execution.
scripts/architect_preflight.ts: actual offline CLI plan/recover, descriptor-based <=256KiB input with no symlink following, exclusive new output, differentiated exit statuses. tests/architect.test.ts, two sample fixtures, scoped tsconfig and package README.
No existing API/UI/media workers changed. No raw keys/HTTP calls/deps/install/protected budget/policy changes. Existing /studio and /journey unaffected by source edits; full regression NOT_RUN, so compatibility not claimed tested.

## Actually checked
Node 24.14.1, TypeScript 7.0.2, @types/node 18.19.130 (provisional mismatch to Node24 remains existing project risk). Scoped strict compile with original compiler options and bootstrap/B004.tsconfig.json PASS. node --test tests/architect.test.ts PASS: 40 tests, zero skips/failures. Actual plan and recovery CLI samples run: plan ready_for_review with supplied estimates; recovery stops before third and exits 3. All reports executionAllowed=false/budgetReserved=false.
During review corrected missing assembly/QA costs: explicit localCost now required, null blocked and total unknown rather than fictitious zero. Replaced path stat/read with bounded no-follow descriptor read to reduce path-swap/oversized-read risk. Final scope tests repeated after corrections. Evidence/logs/sample outputs in bootstrap/evidence/2026-10-03-architect/.
Local working directory is reconstructed scoped sources/config, not full original checkout or Git ancestry. Full make check/spec-check/project.py validate/status/next, old suites/CI/browser/media/live quality NOT_RUN. No old 127-test PASS recycled. Remote blobs verified separately after commit; if no verification record, do not infer.

## Limitations / next agent
1. Read AGENTS + architect amendment + this handoff + B004.json and actual diff. Pull genuine branch, do not replace ancestry with patch ZIP.
2. Full project.py validate/status/next + make spec-check + make check + scoped CLI compile. New tests auto-match existing tests/*.test.ts; CLI compile has own config since root excludes scripts. Read full source before integrating.
3. Q-001 gate/sequence and zero live spend remain. No positive spend by this block. Once accepted gates allow P1, integrate these validated domain types with Q-006/Q-008/Q-009/Q-044, no pretend full P1 completion.
4. Next meaningful engineering block: persisted Mission/GenerationUnit/RecoveryCase state + evidence-backed authoritative capability registry + durable transitions. Use actual auth/tenant/state/budget dependencies; do not wire preflight reports directly to provider calls. Atomic reserve/outbox/reconcile remain unimplemented.
5. Planner is fixture-only; cheapest declared compatible route != cheapest accepted output. Verify official terms/live evidence later, measure quality/cost with all attempts. Geometry/camera/compiler payload expansion and actual 2D/Blender/render execution later tasks.
6. Recovery always requires review; future preapproved repair execution must authenticate envelope, reference actual state/ledger/consents and single-use approval. Fake caller cost/attempt values cannot authorize execution here.
7. Current ancestor allowance inputs refer to total allowance for this unit before own charges; production adapter must not double-count own ledger reservations. Unknown/local cost is null, not zero. Pure arithmetic preview not race-proof production ledger.
8. Review Linux file semantics on other OS before claiming cross-platform CLI. No UI usability/accessibility proof. Scoped prototype is useful executable planning code, not finished mega-brain.

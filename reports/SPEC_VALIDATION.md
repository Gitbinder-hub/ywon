# Spec Pack v0.4 — проверка выпуска

Date: 2026-10-01. Product state: not_started; all 50 tasks TODO; 52 features.

## Actually run
- `python3 scripts/project.py render` — generated STATE/BACKLOG/FEATURE_STATUS.
- `make spec-check` — PASS; 44 offline tests (31 continuity + 13 v0.4 checks), full log SPEC_TEST_OUTPUT.txt.
- Source snapshot comparison — all 86 original v0.3 ZIP files retained byte-for-byte:
  existing v0.2 subarchive untouched; remaining original files in nonrecursive v0.3 snapshot.
- Existing task statuses/assignee/session/handoff/checkpoint/acceptance/history compared — unchanged.
- New requirements/doc/task/feature refs, DAG/gate ancestry, generated views and AGENTS=CLAUDE checked.
- Release manifest + output ZIP round-trip/integrity checked during final packaging.

The `ERROR: Q-002 is not ready` line is an expected negative test, followed by `ok`.

## Not run
Product/UI/real provider/render quality/native language/native device/store submission/security-load
integration tests. No paid generation/API calls/deployment/publication. Spec tests cannot prove them.

## Open decisions
P0 budget/providers/languages/rights; editor/i18n/mobile tools; language rollout/native reviewers;
store billing/markets; creator program lifetime terms; future personal shell/ads activation.
Q-001 remains ready first owner task; spec update authorization is not budget/owner-gate evidence.

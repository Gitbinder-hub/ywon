# Current follow-up: B-002 offline block

See bootstrap/B002_HANDOFF.md for the substantial tested offline workflow.
B-002 source/tests are published and runtime hashes verified at 4502eb2a3b836384cf732731c75478263f3711e1.
Pull bootstrap/spec-v04-foundation for /studio. Main and Q gates unchanged.

---

# B-001 — REVIEW / client reliability follow-up 2026-10-02

## Source and scope
Full v0.4 remote import verified at owner commit 6fbb5d8c6de6566773a541ecb51a221e9803fb14.
Remote base for this small authorized client follow-up: 020ed0e709dabd49d8037c9d8166fc35d995a2fa,
branch bootstrap/spec-v04-foundation, PR https://github.com/Ywoom-space/Ywoom/pull/1 (draft).
No main merge, Q acceptance, provider/generation/auth/policy/budget/runtime-dependency changes.

## Changed / proved
Existing validation/pending status translates when UI locale changes; user text/contentLanguage remain unchanged.
Stale locale failures do not overwrite newer selections/results. Latest failure restores selector and displays
a separate localized warning; invalid catalogs never partially switch UI. Server/invalid/non-JSON/network
errors are distinct/recoverable; pending duplicate submit is ignored; button always re-enabled after completion.
Changes: app.js, index.html warning, two static catalogs, tests/client.test.ts.

11 new tests execute actual client JS in node:vm with minimal DOM/fetch fixtures (NOT real-browser evidence).
Red baseline: 2 pass / 9 fail; fixed: 11/11 PASS. Full make check PASS: strict typecheck + JS syntax +
30 Node + 3 media + 44 spec + 10 transfer tests, no skips. Actual CLI/HTTP smoke served updated HTML/JS/catalogs,
health still dry_run/productReady=false; server terminated. No paid API calls or deployment.
Current summary: bootstrap/evidence/2026-10-02-client/verification.json. Full latest raw logs retained locally;
earlier committed raw same-framework evidence remains in bootstrap/evidence/2026-10-01-transfer-kit/.

## Owner confirmation and remaining gates
Owner confirmed Russian 30–60s narrated-explainer scenario, synthetic/no-cloning voice, permitted materials,
human review and no paid calls until separate budget. reports/P0_SCENARIO_2026-10-02.md records only that confirmation.
Owner also reported the previous client launched/visible; do not infer acceptance of new fixes or product stages.
Q-001 full owner gate still TODO: full staged scope and detailed financial/period/stop-rule choices incomplete.
No Q start/submit/gate/accept performed. B-001 remains REVIEW.

## Limits and continuation
Node18 typings on Node24 provisional; dependency-security/signature/other-platform review not completed.
GitHub CI remains unknown (prior HTTP403); no new remote CI success claim. No real-browser/visual/a11y/load
or real generative media acceptance. No provider/auth/database/queue/billing/editor/native/publishing implementation.
Assistant/compute costs unknown, not zero; original shipping manifest intentionally drifts after development.
Local Git has synthetic ZIP ancestry; never push that history over GitHub. Small reviewed diffs use GitHub MCP.
After pull, owner can manually check RU/EN while keeping brief fields unchanged and retry dry-run errors.
Before dependent Q work, finish Q-001 owner decisions; no budget or future-scope waiver inferred.

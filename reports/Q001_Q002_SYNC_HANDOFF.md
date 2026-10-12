# Q-001/Q-002 — safe registry synchronization handoff

Owner continuation: 2026-10-03 13:30 Asia/Bangkok. Prior explicit Q-001 confirmation: 2026-10-03 12:24. No provider route acceptance, purchases, generation, stage acceptance or main merge inferred.

## What changed

Added scripts/sync_q001_q002.py, an owner-local four-file synchronizer; the exact 7913-byte patch and expected before/after/evidence hashes live in reports/patches/. Added ten unit tests in tests_spec/test_registry_sync.py. No runtime, provider, auth, queue, deployment, archive, budget/gate rule, dependency or lockfile changes. No other task criterion/dependency/status is rewritten.

The synchronizer requires a genuine clean Git clone on bootstrap/spec-v04-foundation, evidence-commit ancestry, exact approval/review blobs, exact original four-file hashes, no target symlinks, patch integrity and an isolated validated candidate. Default mode changes nothing. --apply backs up the four originals in Git metadata, applies the exact patch and validates final hashes/workflow. Failure rolls back only matching newly-written target bytes, never unrelated concurrent edits. Repeated application is a no-op after validation. No network, install, provider requests, automatic staging/commit/push or main writes. Do not treat this as production/real-media acceptance or a universal migration tool.

The exact target remains Q001 DONE / Q002 REVIEW / Q003 TODO, P0; Q002 AC3 NOT_RUN and owner route/cost/limitations agreement pending. The patch does not accept Q002 or waive real evidence/paid execution gates.

## Verification

Ten synchronization tests PASS: read-only preflight, exact four-file application and review gate preservation, idempotent repeat, main rejection, dirty unrelated source rejection, patch/evidence integrity rejection, mixed-state rejection, preservation of an unrelated committed file and rollback on post-write validation failure. Synthetic Git ancestry exists only in disposable test fixtures, never pushed as project history.

Full make check PASS separately on both exact before-sync and after-sync source states: strict typecheck/client syntax +56 Node +7 media Python +56 spec +10 transfer =129 tests, zero fails/skips in each run. Separate real Chromium suite10 PASS, zero fails/skips. 139 distinct tests; do not double-count the two state runs. Tests did not reset or weaken the real progressed local registry. Existing runtime/media/UI unchanged. Real speech/provider output, production/WCAG/client/stage acceptance not tested. Remote CI UNKNOWN; historical403 not retried. No new packages, live calls or purchases; actual compute/assistant cost remains unknown/not allocated.

## Local application in the owner's genuine clone

Check branch/worktree first; preserve all owner changes. Fetch/switch/pull must be normal non-forced operations, never main merge. Once this helper commit is present:

```sh
python3 scripts/sync_q001_q002.py
python3 scripts/sync_q001_q002.py --apply
python3 scripts/project.py validate
make check
git diff --check
git diff --stat
git add tasks/project.json tasks/BACKLOG.md docs/STATE.md docs/FEATURE_STATUS.md
git commit -m "Record owner-approved Q-001 and Q-002 review"
git push origin bootstrap/spec-v04-foundation
```

Stop on any failed preflight/check, missing local prerequisite, dirty/changed graph, unexpected diff or push conflict; do not force, delete owner work, regenerate a fake approval, silently install/buy tools or apply to main. Full checks require existing pinned development tools/FFmpeg; the synchronization itself uses standard Python and Git only.

## Publication boundary

This helper is an executable local path around the unfinished large raw registry transfer, NOT proof that the four remote files were synchronized. After publishing these small helper artifacts, GitHub registry/views remain pending until the explicit local application/commit/push above or another exact verified four-file publication succeeds. Parent run must verify actual current branch hashes and keep draft/unmerged/main unchanged before claiming remote Q001 DONE/Q002 REVIEW. The agent computer has a source snapshot without genuine Git ancestry and must not push fabricated history.

Do not advance to Q003 implementation before Q002 route agreement and owner acceptance. Recommended media candidates remain in reports/Q002_PROVIDER_RESEARCH_2026-10-03.md; no voice/account/paid cap/retention policy implicitly selected by this synchronization.

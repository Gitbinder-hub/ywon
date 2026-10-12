# Ywoom pre-P0 foundation
This is an actual local prototype, not a functioning content factory.

## Run (Node 24)
`node apps/api/src/server.ts` then open http://127.0.0.1:3000.
No install/API key needed for runtime or Node tests.
`node --test tests/*.test.ts` checks contracts + real local HTTP routes + catalogs.
`python3 -m unittest discover -s workers/media -v` checks local media probe.
Typecheck needs the dev tools listed in package.json (offline testing uses preinstalled tools).
`make bootstrap-check` runs typecheck + Node tests + Python media tests.
`make dev` runs a watched local server; `make check` also checks specs if imported.

## Included
Brief contract → deterministic dry-run; local HTTP API and responsive RU/EN shell;
explicit content language; no hidden niche/provider/channel defaults; static catalogs;
body limits/static allowlist/CSP/error statuses/generation denial; real ffprobe adapter.

## Not included
Real generation/queues/payments/auth/tenancy/database/editor/timeline/native apps/publishing.
Local guardrails are not production security acceptance. No P0 evidence generated.

## Spec import / handoff
See bootstrap/STATUS.md and bootstrap/HANDOFF.md for actual local vs remote state.
`scripts/import_spec.py /path/to/Ywoom-Spec-v0.4.zip` imports exact source files without erasing code.
It verifies ZIP SHA, manifest, path safety and conflicts; default refuses conflicting spec files.
`--replace-old-spec` is allowed only for the already authorized v0.2→v0.4 migration on a branch.
Keep original v0.2 commit in git history, do not rewrite history or mark new Q tasks accepted.

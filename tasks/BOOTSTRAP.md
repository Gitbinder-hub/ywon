# B-001 owner-authorized pre-P0 exception [REVIEW]
Goal: bounded runnable prototype before P0, no paid APIs/deploy.
AC: typed dry-run contract+API/web; explicit content locale; no generation/payment; local probe+tests;
honest handoff/full-spec import status. Local evidence passed; complete remote spec import not done.
Product stage gates and Q-001/P0/Q-006/P1 are NOT accepted. Read bootstrap/HANDOFF.md.

2026-10-01 local regression follow-up: 16 Node/3 media/44 spec checks pass, but current
make check is blocked by missing Node typings (TS2688). Historical full-check PASS
is not current environment evidence. Status stays REVIEW; see current bootstrap/HANDOFF.md.

Later 2026-10-01 toolchain follow-up resolves TS2688 for approved pins: lockfile added,
project-local offline install and isolated offline npm ci + make check PASS
(19 Node/3 media/44 spec + strict typecheck/JS syntax). REVIEW unchanged. Node18/24 mismatch
and independent dependency-security review remain open; see latest bootstrap/HANDOFF.md.

# Offline project tooling
Python 3.10+, no packages/network/API calls. Run from repository root.

```
python3 scripts/project.py validate
python3 scripts/project.py status
python3 scripts/project.py next
python3 scripts/project.py start Q-002 --agent "Opus 5.5 / Cursor / session-1"
python3 scripts/project.py checkpoint Q-002 --handoff handoffs/Q-002.json
python3 scripts/project.py block Q-002 --reason "waiting for owner API access"
python3 scripts/project.py resume Q-002 --agent "new agent" --by Oleg --note "resume allowed" --owner-confirmed
python3 scripts/project.py submit Q-002 --handoff handoffs/Q-002.json
python3 scripts/project.py accept Q-002 --by Oleg --note "reviewed AC and evidence" --owner-confirmed
python3 scripts/project.py reject Q-002 --by Oleg --note "fix missing test" --owner-confirmed
python3 scripts/project.py render
```
Commands after next are examples, not instructions to run in initial state. Q-002 requires accepted Q-001.

## Owner gates
Fill a report with `APPROVED: YES`, owner/date/actual choices and evidence, not a blank template.
Owner only:
```
python3 scripts/project.py gate Q-001 --by Oleg --evidence reports/P0_APPROVAL.md --note "scope and limits accepted" --owner-confirmed
```
This records all gate AC as manually confirmed. Flag is NOT authentication; owner must actually review.
For implementation tasks use REVIEW + accept, not gate. Paid API access/budget is NOT granted by tool.

## New tasks / future branch activation
Architect edits project.json and features.json on a branch, keeps required fields (copy existing TODO entry).
New IDs unique; explicit dependencies/context/AC/paid_calls. No manual DONE/acceptance.
After accepted P4, Q-025 decomposes selected P5 branch: enable/create bounded tasks,
add IDs to selected_expansion_tasks and Q-030G.depends_on. Same for P6 in selected_scale_tasks/Q-035G.
Do not select broad placeholders unchanged if too large; split them before implementation.
`render` then `validate`, test and owner review. Empty selected branch cannot pass its gate.

## Limitations
Local registry, no distributed lock/auth/agent runner. File writes atomic individually, not transactional as a bundle:
if process exits between registry write and view render, run render then validate. No concurrent registry mutations.
AC evidence references and hash checks validate consistency, not truthfulness or quality. Owner re-runs/inspects.
Accepted handoff is hashed; modifying it invalidates validation, new re-review required.
Report artifacts referenced by handoff are NOT all immutable cryptographic attestations; git commit/review anchors them.

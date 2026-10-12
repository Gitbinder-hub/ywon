# B-034 — reservation inspection CLI / REVIEW

Extends `scripts/architect_reservation.ts` with `unknown`, signed `reconcile` and read-only `status`. The status report exposes only bound IDs, outcome, known amount/liability upper bound and lookup/poll method; it never accepts private keys and never claims production verification, execution permission or a real budget reserve. Separate-process unknown→status and unknown→signed poll→released flows are covered.

Scoped verification: strict TypeScript 7.0.2 PASS, three Python workers compile, and combined B-004 through B-034 tests are 160 PASS with zero failures/skips. Full checkout/project.py/make/CI/browser/live generation remain NOT_RUN. No paid call, real reservation, generation, deployment, publication, main merge or Q-state change occurred.

Next boundary: stop extending the local fixture as if it were production. Transition through Q-001 owner budget/paid-call decisions, Q-002 provider verification and Q-003 live-eval design before a real Q-004 provider spike; production database/auth/ledger belongs to accepted P1 tasks.

# B-032 — reservation outcome lifecycle / REVIEW

Adds persisted `pending`, `confirmed`, `unknown` and `released` reservation outcomes. A new intent starts pending with the initial amount as liability upper bound; signed local evidence records only a non-production confirmed fixture. An ambiguous result becomes unknown without reducing liability, and caller-supplied outcome/zero assertions are rejected. Readiness remains denied.

Scoped verification: strict TypeScript 7.0.2 PASS, three Python workers compile, and combined B-004 through B-032 tests are 154 PASS with zero failures/skips. Full checkout/project.py/make/CI/browser/live generation remain NOT_RUN. No paid call, real reservation, generation, deployment, publication, main merge or Q-state change occurred.

Next exact continuation: B-033 adds signed lookup/poll reconciliation evidence; unknown cannot be resolved by blind resubmission or caller assertion.

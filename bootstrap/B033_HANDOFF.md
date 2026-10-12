# B-033 — signed reservation reconciliation / REVIEW

Adds a time-bound Ed25519 reconciliation receipt from the persisted `budget_reservation_attestor`. It is bound to the reservation evidence receipt, intent hash/ID, unit, attempt, lookup/poll method and exact outcome amount. Unknown may remain unknown/pending with the full initial liability upper bound, become confirmed for the exact initial amount, or become released only with signed zero evidence. Caller assertions, blind state commands, wrong amounts, changed methods, signatures and receipt bindings fail closed. Reconciliation receipts are append-only and single-use.

Scoped verification: strict TypeScript 7.0.2 PASS, three Python workers compile, and combined B-004 through B-033 tests are 157 PASS with zero failures/skips. Full checkout/project.py/make/CI/browser/live generation remain NOT_RUN. No paid call, real reservation, generation, deployment, publication, main merge or Q-state change occurred. Readiness is still denied; all reconciliation evidence is explicitly local fixture evidence.

Next continuation: add an inspection CLI for unknown/reconciliation records and then a provider adapter only after explicit production authority, identity and real ledger contracts exist.

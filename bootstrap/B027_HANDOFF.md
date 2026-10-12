# B-027 — attempt preparation/readiness CLI / REVIEW

Adds `scripts/architect_execution_readiness.ts` with `prepare` and `check`. Prepare consumes only an already persisted current approval. Check prints the denied readiness report and missing production dependencies. Actual separate-process prepare/check is covered; no key, provider or payment handling exists.

Final scoped verification: strict TypeScript 7.0.2 PASS, three Python workers compile and combined B-004 through B-027 tests are 143 PASS with zero failures/skips. Full checkout/project.py/make/CI/browser/live generation remain NOT_RUN. No paid call, generation, deployment, publication, main merge or Q-state change occurred.

Next exact continuation: B-028 should define a protected reservation-adapter contract and persist reservation intent while still refusing caller-declared success. B-029 should reconcile only signed/verified reservation receipts and keep execution denied until production identity, tenant authorization and a separately approved executor are wired.

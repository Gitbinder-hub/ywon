# B-023 — plan approval CLI / REVIEW

Adds `scripts/architect_plan_approval.ts` with `approve` and `check`. Approve consumes a pre-signed JSON envelope and never handles a private key. Check reports only `approval_current` or `blocked`; neither mode executes providers or reserves money. Actual separate-process approve/check is covered.

Final scoped verification: strict TypeScript 7.0.2 PASS, three Python workers compile and combined B-004 through B-023 tests are 135 PASS with zero failures/skips. Full checkout/project.py/make/CI/browser/live generation remain NOT_RUN. No paid call, generation, deployment, publication, main merge or Q-state change occurred.

Next exact continuation: B-024 should consume a current plan approval once into a durable future-attempt authorization without calling a provider. B-025 should produce an execution-readiness report that remains denied until real atomic budget reservation, production identity/tenant enforcement and an approved executor exist.

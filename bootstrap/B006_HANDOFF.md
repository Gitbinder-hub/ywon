# B-006 — evidence-backed local capability registry / REVIEW

Base cabdcc4ae09d4a54a7c303b8b212e83d5039d61b. First of two owner-requested bounded blocks. Adds a separate local SQLite registry with exact `id@version` records, evidence source/hash/observed/expiry fields and candidate → verified → approved → revoked transitions. It does not change tasks/project.json or accept a Q task.

A local `capability_verifier` may move a candidate to verified only when at least one official-document or benchmark item exists. A different claimed local `capability_approver` must approve while evidence is unexpired. An approver or security reviewer may revoke with a reason. Fixture evidence cannot support verified status. These actors are trusted input claims in an offline prototype, not authenticated production principals; therefore neither verified nor approved is described as production proof.

Code: `packages/architect/src/registry.ts`, `workers/architect/registry.py`, `tests/architect-registry.test.ts`. The registry has optimistic record versions, exact command replay and conflicting-command rejection. No provider, generator, payment, deployment or publication call exists.

Actual scoped verification after both blocks: Python compile PASS; strict TypeScript 7.0.2 PASS; combined B-004/B-005/B-006/B-007 tests 80 PASS, zero skips/failures. Full checkout and project-wide commands were not available because HTTPS clone of the private repository had no noninteractive Git credential; no full PASS is claimed.

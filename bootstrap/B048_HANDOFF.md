# B-048 — read-only linked-project evidence export / REVIEW

`GET /api/offline/projects/:id/evidence` requires a B-046 immutable project reference. Every read validates fixed denial flags, reopens the B-043 receipt store, checks the current artifact SHA-256 and verification hash against the project reference, and fails closed if either side is missing, unavailable, corrupted or mismatched.

The response contains project ID, current revision/update timestamp, run ID, artifact/verification hashes, attachment timestamp/source, fixed false media/production/execution/publication flags, and a canonical SHA-256 `evidenceHash`. It deliberately excludes project title, script, scenes, asset IDs, media bytes/URLs/paths, provider invoice, rights approval and publication readiness. `?download=1` adds a safe fixed Content-Disposition filename; it does not change content. Non-GET methods are not implemented.

The expanded real HTTP test covers missing reference, successful binding, deterministic evidence hash, absence of content/path leakage, download header, method denial, plan-edit preservation and tampered project-reference rejection. Focused test, scoped strict TypeScript 5.9.3, changed API syntax and Python receipt worker compile PASS. The broader prior 185-test suite was not rerun in this partial checkout and remains historical.

Next boundary: surface the evidence download link in Studio and then stop extending the local preview before designing authenticated object storage/media delivery.
